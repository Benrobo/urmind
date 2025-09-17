import { openDB, IDBPDatabase } from "idb";
import { UrmindDB } from "@/types/database";

class UrmindDatabase {
  private db: IDBPDatabase<UrmindDB> | null = null;
  private dbName = "urmind-db";
  private version = 1;

  async init(): Promise<void> {
    this.db = await openDB<UrmindDB>(this.dbName, this.version, {
      upgrade(db, oldVersion) {
        // Create contexts store
        if (!db.objectStoreNames.contains("contexts")) {
          const contextStore = db.createObjectStore("contexts", {
            keyPath: "id",
          });
          contextStore.createIndex("by-type", "type");
          contextStore.createIndex("by-created", "createdAt");
        }

        // Create embeddings store
        if (!db.objectStoreNames.contains("embeddings")) {
          const embeddingStore = db.createObjectStore("embeddings", {
            keyPath: "id",
          });
          embeddingStore.createIndex("by-metadata", "metadata");
        }

        // Create conversations store
        if (!db.objectStoreNames.contains("conversations")) {
          const conversationStore = db.createObjectStore("conversations", {
            keyPath: "id",
          });
          conversationStore.createIndex("by-created", "createdAt");
        }

        // Create test store
        if (!db.objectStoreNames.contains("test")) {
          db.createObjectStore("test", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      },
    });

    // Insert test data
    await this.insertTestData();
  }

  private async insertTestData(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    try {
      await this.db.add("test", { id: 1, name: "test" });
    } catch (error) {
      // Test data might already exist, ignore error
    }
  }

  // Context methods
  async createContext(
    context: Omit<UrmindDB["contexts"]["value"], "createdAt" | "updatedAt">
  ): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");

    const now = Date.now();
    const contextData = {
      ...context,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.add("contexts", contextData);
    return context.id;
  }

  async getContext(
    id: string
  ): Promise<UrmindDB["contexts"]["value"] | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.get("contexts", id);
  }

  async getAllContexts(): Promise<UrmindDB["contexts"]["value"][]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.getAll("contexts");
  }

  async getContextsByType(
    type: string
  ): Promise<UrmindDB["contexts"]["value"][]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.getAllFromIndex("contexts", "by-type", type);
  }

  async updateContext(
    id: string,
    updates: Partial<UrmindDB["contexts"]["value"]>
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

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
    if (!this.db) throw new Error("Database not initialized");
    await this.db.delete("contexts", id);
  }

  // Embedding methods
  async createEmbedding(
    embedding: UrmindDB["embeddings"]["value"]
  ): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.add("embeddings", embedding);
    return embedding.id;
  }

  async getEmbedding(
    id: string
  ): Promise<UrmindDB["embeddings"]["value"] | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.get("embeddings", id);
  }

  async getEmbeddingsByMetadata(
    metadataKey: string,
    metadataValue: any
  ): Promise<UrmindDB["embeddings"]["value"][]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.getAllFromIndex(
      "embeddings",
      "by-metadata",
      metadataKey
    );
  }

  async getAllEmbeddings(): Promise<UrmindDB["embeddings"]["value"][]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.getAll("embeddings");
  }

  async updateEmbedding(
    id: string,
    updates: Partial<UrmindDB["embeddings"]["value"]>
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const existing = await this.getEmbedding(id);
    if (!existing) throw new Error("Embedding not found");

    const updated = {
      ...existing,
      ...updates,
    };

    await this.db.put("embeddings", updated);
  }

  async deleteEmbedding(id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    await this.db.delete("embeddings", id);
  }

  // Conversation methods
  async createConversation(
    conversation: Omit<
      UrmindDB["conversations"]["value"],
      "createdAt" | "updatedAt"
    >
  ): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");

    const now = Date.now();
    const conversationData = {
      ...conversation,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.add("conversations", conversationData);
    return conversation.id;
  }

  async getConversation(
    id: string
  ): Promise<UrmindDB["conversations"]["value"] | undefined> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.get("conversations", id);
  }

  async getAllConversations(): Promise<UrmindDB["conversations"]["value"][]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.getAll("conversations");
  }

  async updateConversation(
    id: string,
    updates: Partial<UrmindDB["conversations"]["value"]>
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const existing = await this.getConversation(id);
    if (!existing) throw new Error("Conversation not found");

    const updated = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    await this.db.put("conversations", updated);
  }

  async deleteConversation(id: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    await this.db.delete("conversations", id);
  }

  // Test methods
  async getTestData(): Promise<UrmindDB["test"]["value"][]> {
    if (!this.db) throw new Error("Database not initialized");
    return await this.db.getAll("test");
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const tx = this.db.transaction(
      ["contexts", "embeddings", "conversations", "test"],
      "readwrite"
    );
    await Promise.all([
      tx.objectStore("contexts").clear(),
      tx.objectStore("embeddings").clear(),
      tx.objectStore("conversations").clear(),
      tx.objectStore("test").clear(),
      tx.done,
    ]);
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Create singleton instance
const urmindDb = new UrmindDatabase();

const initDb = async (): Promise<void> => {
  await urmindDb.init();
};

export default urmindDb;
export { initDb };
