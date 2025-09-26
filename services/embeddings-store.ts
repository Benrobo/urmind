import { IDBPDatabase } from "idb";
import { UrmindDB } from "@/types/database";
import { sendMessageToContentScriptWithResponse } from "@/helpers/messaging";
import urmindDb from "./db";
import { Context } from "@/types/context";

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

  /**
   * Generate embedding for text using content script
   * Background -> Content: Generate embedding
   * Content -> Background: Return embedding vector
   */
  async generateEmbedding(text: string, tabId: number): Promise<number[]> {
    const response = await sendMessageToContentScriptWithResponse(
      tabId,
      "generateEmbedding",
      { text }
    );

    return response;
  }

  /**
   * Perform semantic search using content script
   * Background -> Content: Send query + all embeddings
   * Content -> Background: Return similarity results
   */
  async semanticSearch(
    query: string,
    tabId: number,
    options: { limit?: number } = {}
  ) {
    // Get all stored embeddings
    const allEmbeddings = await this.getAll();

    // Send to content script for similarity calculation
    const response = (await sendMessageToContentScriptWithResponse(
      tabId,
      "semanticSearch",
      {
        query,
        embeddings: allEmbeddings,
        limit: options.limit || 10,
      }
    )) as Array<{ id: string; score: number; metadata?: any }>;

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
    tabId: number,
    metadata: { contextId: string; type: string; category: string; url: string }
  ): Promise<string> {
    // Generate embedding in content script
    const embeddingVector = await this.generateEmbedding(text, tabId);

    // Store in background script
    const embedding: UrmindDB["embeddings"]["value"] = {
      id: metadata.contextId,
      vector: embeddingVector,
      metadata,
    };

    return await this.add(embedding);
  }
}
