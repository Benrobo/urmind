import {
  pipeline,
  cos_sim,
  Pipeline,
  FeatureExtractionPipeline,
} from "@xenova/transformers";
import { preferencesStore } from "@/store/preferences.store";
import { geminiAi } from "@/helpers/agent/utils";
import { embed } from "ai";
import retry from "async-retry";
import logger from "@/lib/logger";

/**
 * EmbeddingHelper - Content script only
 * No DB, just model + math operations
 */
export class EmbeddingHelper {
  private model: Promise<FeatureExtractionPipeline> = pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2",
    {
      progress_callback: (progress: any) => {
        if (progress.status === "ready") {
          console.log("Embedding model loaded and ready");
        }
      },
    }
  );

  async generate(text: string): Promise<number[]> {
    const preferences = await preferencesStore.get();

    return retry(
      async () => {
        if (
          preferences.embeddingStyle === "online" &&
          preferences.geminiApiKey
        ) {
          try {
            return await this.generateWithOnlineModel(
              text,
              preferences.geminiApiKey
            );
          } catch (onlineError) {
            throw onlineError;
          }
        }

        return await this.generateWithLocalModel(text);
      },
      {
        retries: 2,
        factor: 1,
        minTimeout: 1000,
        maxTimeout: 5000,
        onRetry: (error, attempt) => {
          logger.warn(`🔄 Embedding retry attempt ${attempt}:`, error);
          if (attempt === 1) {
            logger.log("🔄 Switching to local model for retry");
          }
        },
      }
    ).catch(async (finalError) => {
      logger.error(
        "❌ All embedding attempts failed, using local model as final fallback:",
        finalError
      );
      return await this.generateWithLocalModel(text);
    });
  }

  private async generateWithOnlineModel(
    text: string,
    apiKey: string
  ): Promise<number[]> {
    try {
      const genAI = geminiAi(apiKey);

      const { embedding } = await embed({
        model: genAI.textEmbeddingModel("gemini-embedding-001"),
        value: text,
      });

      return embedding;
    } catch (error) {
      logger.error("❌ Online embedding generation failed:", error);
      throw error;
    }
  }

  private async generateWithLocalModel(text: string): Promise<number[]> {
    try {
      if (!this.model) {
        logger.warn(
          "🏠 Local embedding model not available on this page due to CSP restrictions"
        );
        throw new Error("Embedding model not available on this page");
      }

      const model = await this.model;
      const output = await model(text, {
        pooling: "mean",
        normalize: true,
      });

      return Array.from(output.data);
    } catch (err: any) {
      logger.error("❌ Local embedding generation failed:", err);
      throw err;
    }
  }

  cosineSimilarity(
    queryEmbedding: number[],
    vectors: { id: string; vector: number[]; metadata?: any }[],
    limit = 10
  ) {
    return vectors
      .map((e) => ({
        id: e.id,
        score: cos_sim(queryEmbedding, e.vector),
        metadata: e.metadata,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

export const embeddingHelper = new EmbeddingHelper();
