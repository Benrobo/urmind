import { IDBPDatabase } from "idb";
import { UrmindDB } from "@/types/database";
import urmindDb from "@/services/db";
import { semanticCache } from "@/services/semantic-cache.service";

export class ContextService {
  constructor(private db: IDBPDatabase<UrmindDB>) {}

  async createContext(
    context: Omit<UrmindDB["contexts"]["value"], "createdAt" | "updatedAt">
  ): Promise<string> {
    const now = Date.now();
    const contextData = {
      ...context,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await this.db.put("contexts", contextData);
      return context.id;
    } catch (error) {
      console.error("Failed to create context:", error);
      throw error;
    }
  }

  /**
   * Get a context by ID
   * @param id - The ID of the context
   * @returns The context
   */
  async getContext(
    id: string
  ): Promise<UrmindDB["contexts"]["value"] | undefined> {
    const tx = this.db.transaction("contexts", "readonly");
    const store = tx.objectStore("contexts");
    const index = store.index("by-id");
    return await index.get(id);
  }

  async getContextByFingerprint(
    fingerprint: string
  ): Promise<UrmindDB["contexts"]["value"] | undefined> {
    const tx = this.db.transaction("contexts", "readonly");
    const store = tx.objectStore("contexts");
    const index = store.index("by-fingerprint");
    return await index.get(fingerprint);
  }

  async getContextByContentFingerprint(
    contentFingerprint: string
  ): Promise<UrmindDB["contexts"]["value"] | undefined> {
    const tx = this.db.transaction("contexts", "readonly");
    const store = tx.objectStore("contexts");
    const index = store.index("by-content-fingerprint");
    return await index.get(contentFingerprint);
  }

  async getAllContextCategories(): Promise<
    UrmindDB["context_categories"]["value"][]
  > {
    const transaction = this.db.transaction(["context_categories"], "readonly");
    const store = transaction.objectStore("context_categories");
    const index = store.index("by-created");
    return await index.getAll();
  }

  async getAllContexts(): Promise<UrmindDB["contexts"]["value"][]> {
    return await this.db.getAll("contexts");
  }

  async getContextsByCategory(
    categorySlug: string
  ): Promise<UrmindDB["contexts"]["value"][]> {
    const contexts = await this.db.getAll("contexts");
    return contexts.filter((context) => context.categorySlug === categorySlug);
  }

  async getContextsByType(
    type: string
  ): Promise<UrmindDB["contexts"]["value"][]> {
    return await this.db.getAllFromIndex("contexts", "by-type", type);
  }

  async updateContext(
    id: string,
    updates: Partial<UrmindDB["contexts"]["value"]>
  ): Promise<void> {
    const existing = await this.getContext(id);
    if (!existing) throw new Error("Context not found");

    const updated = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    await this.db.put("contexts", updated);
  }

  async deleteContext(id: string): Promise<void> {
    await this.db.delete("contexts", id);

    if (urmindDb.embeddings) {
      await urmindDb.embeddings.deleteEmbeddingsByContextId(id);
    }

    await semanticCache.deleteCacheEntriesByContextId(id);
  }

  async deleteContextsByCategory(categorySlug: string): Promise<void> {
    // Get all contexts in this category
    const contexts = await this.getContextsByCategory(categorySlug);

    // Delete each context (which will also delete embeddings and cache entries)
    for (const context of contexts) {
      await this.deleteContext(context.id);
    }
  }
}
