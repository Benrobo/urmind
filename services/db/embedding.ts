import { IDBPDatabase } from "idb";
import { UrmindDB } from "@/types/database";
import { pipeline, cos_sim } from "@xenova/transformers";

export class EmbeddingService {
  private embeddingFactory: EmbeddingFactory;
  constructor(private db: IDBPDatabase<UrmindDB>) {
    this.embeddingFactory = new EmbeddingFactory();
  }

  async init(): Promise<void> {
    console.log("Initializing embedding service");
    try {
      await this.embeddingFactory.init();
      console.log("Embedding service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize embedding service:", error);
      throw new Error(`Embedding service initialization failed: ${error}`);
    }
  }

  async cosineSimilarity(
    query: string,
    options: {
      limit?: number;
    }
  ) {
    const { limit = 10 } = options;
    const queryEmbedding = await this.embeddingFactory.getEmbeddingFromText(
      query
    );
    const embeddings = await this.getAllEmbeddings();
    const similarities = embeddings
      .map((embedding, idx) => {
        return {
          id: embedding?.id,
          score: cos_sim(queryEmbedding, embedding.vector),
          metadata: embedding?.metadata,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return similarities;
  }

  async createEmbedding(
    embedding: UrmindDB["embeddings"]["value"]
  ): Promise<string> {
    await this.db.add("embeddings", embedding);
    return embedding.id;
  }

  async getEmbedding(
    id: string
  ): Promise<UrmindDB["embeddings"]["value"] | undefined> {
    return await this.db.get("embeddings", id);
  }

  async getEmbeddingsByMetadata(
    metadataKey: string,
    metadataValue: any
  ): Promise<UrmindDB["embeddings"]["value"][]> {
    return await this.db.getAllFromIndex(
      "embeddings",
      "by-metadata",
      metadataKey
    );
  }

  async getAllEmbeddings(): Promise<UrmindDB["embeddings"]["value"][]> {
    return await this.db.getAll("embeddings");
  }

  async updateEmbedding(
    id: string,
    updates: Partial<UrmindDB["embeddings"]["value"]>
  ): Promise<void> {
    const existing = await this.getEmbedding(id);
    if (!existing) throw new Error("Embedding not found");

    const updated = {
      ...existing,
      ...updates,
    };

    await this.db.put("embeddings", updated);
  }

  async deleteEmbedding(id: string): Promise<void> {
    await this.db.delete("embeddings", id);
  }
}

export class EmbeddingFactory {
  constructor() {}

  private pipePromise = pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2",
    {
      progress_callback: (progress: any) => {
        // console.log({ progress });
        // TODO! Add a store to keep track when this model is ready to be used, the loading state would be use to know when to show the spotlight ui or not.
        if (progress.status === "progress") {
          // console.log(`Loading model files: ${progress.loaded}/${progress.total}`);
        } else if (progress.status === "ready") {
          console.log("Model loaded and ready");
        }
      },
    }
  );

  async init(): Promise<void> {
    try {
      await this.pipePromise;
    } catch (error) {
      console.error("Failed to initialize embedding model:", error);
      throw new Error(
        `WebAssembly embedding model failed to load. This may be due to Content Security Policy restrictions. Error: ${error}`
      );
    }
  }

  async getEmbeddingFromText(text: string) {
    const pipe = await this.pipePromise;
    const output = await pipe(text, {
      pooling: "mean",
      normalize: true,
    });
    return Array.from(output.data);
  }
}
