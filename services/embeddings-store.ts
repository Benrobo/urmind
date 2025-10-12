import { IDBPDatabase } from "idb";
import { UrmindDB } from "@/types/database";
import { sendMessageToContentScriptWithResponse } from "@/helpers/messaging";
import urmindDb from "./db";
import { Context } from "@/types/context";
import { cos_sim } from "@xenova/transformers";
import { AIService } from "./ai.service";

/**
 * EmbeddingsStore - Background script only
 * Lightweight storage-only CRUD for embeddings
 */
export class EmbeddingsStore {
  constructor(private db: IDBPDatabase<UrmindDB>) {}

  async add(embedding: UrmindDB["embeddings"]["value"]): Promise<string> {
    await this.db.add("embeddings", embedding);
    return embedding.id;
  }

  async getAll(): Promise<UrmindDB["embeddings"]["value"][]> {
    return await this.db.getAll("embeddings");
  }

  async get(id: string): Promise<UrmindDB["embeddings"]["value"] | undefined> {
    return await this.db.get("embeddings", id);
  }

  async update(
    id: string,
    updates: Partial<UrmindDB["embeddings"]["value"]>
  ): Promise<void> {
    const existing = await this.get(id);
    if (!existing) throw new Error("Embedding not found");
    const updated = { ...existing, ...updates };
    await this.db.put("embeddings", updated);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete("embeddings", id);
  }

  async deleteEmbeddingsByContextId(contextId: string): Promise<void> {
    const embeddings = await this.getAll();
    const contextEmbeddings = embeddings.filter(
      (embedding) => embedding.metadata?.contextId === contextId
    );

    for (const embedding of contextEmbeddings) {
      await this.delete(embedding.id);
    }
  }

  /**
   * Generate embedding for text using content script
   * Background -> Content: Generate embedding
   * Content -> Background: Return embedding vector
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await AIService.generateEmbedding(text);
    return response;
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

  /**
   * Perform semantic search using content script
   * Background -> Content: Send query + all embeddings
   * Content -> Background: Return similarity results
   */
  async semanticSearch(query: string, options: { limit?: number } = {}) {
    const allEmbeddings = await this.getAll();
    const queryEmbedding = await this.generateEmbedding(query);

    const response = this.cosineSimilarity(
      queryEmbedding,
      allEmbeddings,
      options.limit || 10
    );

    const finalResponse: (Context & {
      score: number;
      createdAt: number;
      updatedAt: number;
    })[] = [];

    for (const result of response) {
      const context = await urmindDb.contexts?.getContext(result.id);
      if (context) {
        finalResponse.push({
          ...context,
          score: result.score,
        });
      }
    }

    return finalResponse;
  }

  /**
   * Generate embedding and store it
   * Combines generateEmbedding + add operations
   */
  async generateAndStore(
    text: string,
    metadata: { contextId: string; type: string; category: string; url: string }
  ): Promise<string> {
    const embeddingVector = await this.generateEmbedding(text);

    // Store in background script
    const embedding: UrmindDB["embeddings"]["value"] = {
      id: metadata.contextId,
      vector: embeddingVector,
      metadata,
    };

    return await this.add(embedding);
  }
}
