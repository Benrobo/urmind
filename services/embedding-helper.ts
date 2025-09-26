import { pipeline, cos_sim } from "@xenova/transformers";

/**
 * EmbeddingHelper - Content script only
 * No DB, just model + math operations
 */
export class EmbeddingHelper {
  private pipePromise = pipeline(
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
    const pipe = await this.pipePromise;
    const output = await pipe(text, {
      pooling: "mean",
      normalize: true,
    });
    return Array.from(output.data);
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

// Export singleton instance
export const embeddingHelper = new EmbeddingHelper();
