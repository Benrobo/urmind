import { sendDBOperationMessageToContentScript } from "@/helpers/messaging";
import logger from "@/lib/logger";
import { UrmindDB } from "@/types/database";

/**
 * Database proxy service that forwards database operations from background script
 * to content script where IndexedDB operations work properly.
 */
export class DatabaseProxy {
  private tabId?: number;

  /**
   * Set the tab ID for subsequent operations
   */
  withTabId(tabId: number): DatabaseProxy {
    const proxy = new DatabaseProxy();
    proxy.tabId = tabId;
    return proxy;
  }

  /**
   * Private method to get tab ID with validation
   */
  private getTabId(): number {
    if (this.tabId === undefined) {
      throw new Error("Tab ID not set. Call withTabId() first.");
    }
    return this.tabId;
  }

  /**
   * Get all context categories via content script
   */
  async getAllContextCategories(): Promise<string[]> {
    try {
      const result = await sendDBOperationMessageToContentScript(
        this.getTabId(),
        "getAllContextCategories"
      );
      return result || [];
    } catch (error) {
      logger.error("❌ Proxy getAllContextCategories failed:", error);
      throw error;
    }
  }

  /**
   * Get contexts by type via content script
   */
  async getContextsByType(
    type: string
  ): Promise<UrmindDB["contexts"]["value"][]> {
    try {
      const result = await sendDBOperationMessageToContentScript(
        this.getTabId(),
        "getContextsByType",
        { type }
      );
      return result || [];
    } catch (error) {
      logger.error("❌ Proxy getContextsByType failed:", error);
      throw error;
    }
  }

  /**
   * Get context by fingerprint via content script
   */
  async getContextByFingerprint(
    fingerprint: string
  ): Promise<UrmindDB["contexts"]["value"] | undefined> {
    try {
      const result = await sendDBOperationMessageToContentScript(
        this.getTabId(),
        "getContextByFingerprint",
        { fingerprint }
      );
      return result;
    } catch (error) {
      logger.error("❌ Proxy getContextByFingerprint failed:", error);
      throw error;
    }
  }

  /**
   * Get context by content fingerprint via content script
   */
  async getContextByContentFingerprint(
    contentFingerprint: string
  ): Promise<UrmindDB["contexts"]["value"] | undefined> {
    try {
      const result = await sendDBOperationMessageToContentScript(
        this.getTabId(),
        "getContextByContentFingerprint",
        { contentFingerprint }
      );
      return result;
    } catch (error) {
      logger.error("❌ Proxy getContextByContentFingerprint failed:", error);
      throw error;
    }
  }

  /**
   * Create a new context via content script
   */
  async createContext(
    context: Omit<UrmindDB["contexts"]["value"], "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const result = await sendDBOperationMessageToContentScript(
        this.getTabId(),
        "createContext",
        context
      );
      return result;
    } catch (error) {
      logger.error("❌ Proxy createContext failed:", error);
      throw error;
    }
  }

  /**
   * Get context by ID via content script
   */
  async getContext(
    id: string
  ): Promise<UrmindDB["contexts"]["value"] | undefined> {
    try {
      const result = await sendDBOperationMessageToContentScript(
        this.getTabId(),
        "getContext",
        undefined,
        id
      );
      return result;
    } catch (error) {
      logger.error("❌ Proxy getContext failed:", error);
      throw error;
    }
  }

  /**
   * Get all contexts via content script
   */
  async getAllContexts(): Promise<UrmindDB["contexts"]["value"][]> {
    try {
      const result = await sendDBOperationMessageToContentScript(
        this.getTabId(),
        "getAllContexts"
      );
      return result || [];
    } catch (error) {
      logger.error("❌ Proxy getAllContexts failed:", error);
      throw error;
    }
  }

  /**
   * Update context via content script
   */
  async updateContext(
    id: string,
    updates: Partial<UrmindDB["contexts"]["value"]>
  ): Promise<void> {
    try {
      await sendDBOperationMessageToContentScript(
        this.getTabId(),
        "updateContext",
        updates,
        id
      );
    } catch (error) {
      logger.error("❌ Proxy updateContext failed:", error);
      throw error;
    }
  }

  /**
   * Delete context via content script
   */
  async deleteContext(id: string): Promise<void> {
    try {
      await sendDBOperationMessageToContentScript(
        this.getTabId(),
        "deleteContext",
        undefined,
        id
      );
    } catch (error) {
      logger.error("❌ Proxy deleteContext failed:", error);
      throw error;
    }
  }

  // ==================== EMBEDDING OPERATIONS ====================

  /**
   * Generate embedding from text via content script
   */
  async generateEmbeddingFromText(text: string): Promise<number[]> {
    try {
      const result = await sendDBOperationMessageToContentScript(
        this.getTabId(),
        "generateEmbeddingFromText",
        { text }
      );
      return result;
    } catch (error) {
      logger.error("❌ Proxy generateEmbeddingFromText failed:", error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity via content script
   */
  async cosineSimilarity(
    text: string,
    options: {
      limit?: number;
    }
  ) {
    try {
      const result = await sendDBOperationMessageToContentScript(
        this.getTabId(),
        "cosineSimilarity",
        { text, options }
      );
      return result as {
        id: string;
        score: number;
        metadata: Record<string, any>;
      }[];
    } catch (error) {
      logger.error("❌ Proxy cosineSimilarity failed:", error);
      throw error;
    }
  }

  /**
   * Create embedding via content script
   */
  async createEmbedding(data: any): Promise<string> {
    try {
      const result = await sendDBOperationMessageToContentScript(
        this.getTabId(),
        "createEmbedding",
        data
      );
      return result;
    } catch (error) {
      logger.error("❌ Proxy createEmbedding failed:", error);
      throw error;
    }
  }

  /**
   * Get embedding by ID via content script
   */
  async getEmbedding(id: string): Promise<any> {
    try {
      const result = await sendDBOperationMessageToContentScript(
        this.getTabId(),
        "getEmbedding",
        { id }
      );
      return result;
    } catch (error) {
      logger.error("❌ Proxy getEmbedding failed:", error);
      throw error;
    }
  }

  /**
   * Get embeddings by metadata via content script
   */
  async getEmbeddingsByMetadata(
    metadataKey: string,
    metadataValue: any
  ): Promise<any[]> {
    try {
      const result = await sendDBOperationMessageToContentScript(
        this.getTabId(),
        "getEmbeddingsByMetadata",
        { metadataKey, metadataValue }
      );
      return result || [];
    } catch (error) {
      logger.error("❌ Proxy getEmbeddingsByMetadata failed:", error);
      throw error;
    }
  }

  /**
   * Update embedding via content script
   */
  async updateEmbedding(id: string, updates: any): Promise<void> {
    try {
      await sendDBOperationMessageToContentScript(
        this.getTabId(),
        "updateEmbedding",
        { id, updates }
      );
    } catch (error) {
      logger.error("❌ Proxy updateEmbedding failed:", error);
      throw error;
    }
  }
}

export const dbProxy = new DatabaseProxy();
