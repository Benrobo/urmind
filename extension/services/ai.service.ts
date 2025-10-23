import { preferencesStore } from "@/store/preferences.store";
import { ai_models } from "@/constant/internal";
import logger from "@/lib/logger";
import { embed, generateText, streamText } from "ai";
import { geminiAi } from "@/helpers/agent/utils";
import { chromeAI } from "@/helpers/agent/utils";
import retry from "async-retry";

type AIMode = "online" | "local" | "auto";

interface AIServiceOptions {
  mode?: AIMode;
  maxRetries?: number;
}

interface GenerateTextOptions extends AIServiceOptions {
  prompt: string;
}

interface StreamTextOptions extends AIServiceOptions {
  prompt: string;
  onChunk: (chunk: string) => void;
}

/**
 * Centralized AI service that handles both generation and streaming
 * based on user preferences and optional mode override
 */
export class AIService {
  private static async getEffectiveMode(
    mode?: AIMode
  ): Promise<"online" | "local"> {
    if (mode === "online" || mode === "local") {
      return mode;
    }

    if (mode === "auto") {
      const preferences = await preferencesStore.get();
      return preferences.generationStyle === "online" ? "online" : "local";
    }

    // Default to user preference
    const preferences = await preferencesStore.get();
    return preferences.generationStyle === "online" ? "online" : "local";
  }

  private static async generateWithOnlineModel(
    prompt: string,
    options: AIServiceOptions
  ): Promise<string> {
    const preferences = await preferencesStore.get();

    if (!preferences.geminiApiKey) {
      throw new Error("Gemini API key not available for online generation");
    }

    const genAI = geminiAi(preferences.geminiApiKey);
    const modelName = ai_models.generation.gemini_flash;

    logger.log(`🤖 Generating with online model: ${modelName}`);

    const result = await generateText({
      model: genAI(modelName),
      prompt,
    });

    return result.text;
  }

  private static async generateWithLocalModel(
    prompt: string,
    options: AIServiceOptions
  ): Promise<string> {
    logger.log("🤖 Generating with local model: ChromeAI v2");

    const result = await chromeAI.generateText([
      { role: "user", content: prompt },
    ]);
    return result.text;
  }

  private static async streamWithOnlineModel(
    prompt: string,
    options: StreamTextOptions
  ): Promise<void> {
    const preferences = await preferencesStore.get();

    if (!preferences.geminiApiKey) {
      throw new Error("Gemini API key not available for online streaming");
    }

    const genAI = geminiAi(preferences.geminiApiKey);
    const modelName = ai_models.generation.gemini_flash;

    logger.log(`🤖 Streaming with online model: ${modelName}`);

    const result = streamText({
      model: genAI(modelName),
      prompt,
    });

    for await (const chunk of result.textStream) {
      options.onChunk(chunk);
    }
  }

  private static async streamWithLocalModel(
    prompt: string,
    options: StreamTextOptions
  ): Promise<void> {
    logger.log("🤖 Streaming with local model: ChromeAI v2");

    const stream = chromeAI.streamText([{ role: "user", content: prompt }]);

    for await (const chunk of stream) {
      options.onChunk(chunk);
    }
  }

  /**
   * Generate text using AI with automatic fallback
   */
  static async generateText(options: GenerateTextOptions): Promise<string> {
    const effectiveMode = await this.getEffectiveMode(options.mode);
    const maxRetries = options.maxRetries || 2;

    return retry(
      async () => {
        try {
          if (effectiveMode === "online") {
            return await this.generateWithOnlineModel(options.prompt, options);
          } else {
            return await this.generateWithLocalModel(options.prompt, options);
          }
        } catch (error) {
          logger.error(`Generation failed with ${effectiveMode} mode:`, error);

          // If online failed and we have retries, try local
          if (effectiveMode === "online" && options.mode !== "online") {
            logger.log("🔄 Falling back to local model for generation");
            return await this.generateWithLocalModel(options.prompt, options);
          }

          throw error;
        }
      },
      {
        retries: maxRetries,
        onRetry: (error, attempt) => {
          logger.log(
            `🔄 Generation retry ${attempt}/${maxRetries}:`,
            (error as Error).message
          );
        },
      }
    );
  }

  /**
   * Stream text using AI with automatic fallback
   */
  static async streamText(options: StreamTextOptions): Promise<void> {
    const effectiveMode = await this.getEffectiveMode(options.mode);
    const maxRetries = options.maxRetries || 2;

    return retry(
      async () => {
        try {
          if (effectiveMode === "online") {
            await this.streamWithOnlineModel(options.prompt, options);
          } else {
            await this.streamWithLocalModel(options.prompt, options);
          }
        } catch (error) {
          logger.error(`Streaming failed with ${effectiveMode} mode:`, error);

          // Handle specific error cases
          const errorMessage = (error as Error).message.toLowerCase();

          if (
            errorMessage.includes("input is too large") ||
            errorMessage.includes("quotaexceedederror")
          ) {
            logger.warn(
              "⚠️ Input too large for local model - context filtering should prevent this"
            );
            throw error;
          }

          // Standard fallback logic for other errors
          if (effectiveMode === "online" && options.mode !== "online") {
            logger.log("🔄 Falling back to local model for streaming");
            await this.streamWithLocalModel(options.prompt, options);
          } else {
            throw error;
          }
        }
      },
      {
        retries: maxRetries,
        onRetry: (error, attempt) => {
          logger.log(
            `🔄 Streaming retry ${attempt}/${maxRetries}:`,
            (error as Error).message
          );
        },
      }
    );
  }

  /**
   * Generate search query using optimized settings
   */
  static async generateSearchQuery(
    prompt: string,
    mode?: AIMode
  ): Promise<string> {
    return this.generateText({
      prompt,
      mode,
      maxRetries: 1, // Don't retry too much for search queries
    });
  }

  /**
   * Generate context using optimized settings
   */
  static async generateContext(prompt: string, mode?: AIMode): Promise<string> {
    return this.generateText({
      prompt,
      mode,
      maxRetries: 2,
    });
  }

  static async generateEmbedding(text: string) {
    const preferences = await preferencesStore.get();

    if (!preferences.geminiApiKey) {
      throw new Error("Gemini API key not available for online generation");
    }

    const { embedding } = await embed({
      model: geminiAi(preferences.geminiApiKey).textEmbeddingModel(
        "gemini-embedding-001"
      ),
      value: text,
    });
    return embedding;
  }
}
