import { openDB, IDBPDatabase } from "idb";
import { UrmindDB } from "@/types/database";
import { ContextService } from "./context";
import { EmbeddingService } from "./embedding";
import { ConversationService } from "./conversation";

class UrmindDatabase {
  private db: IDBPDatabase<UrmindDB> | null = null;
  private dbName = "urmind-db";
  private version = 1;

  // Service instances
  public contexts: ContextService | null = null;
  public embeddings: EmbeddingService | null = null;
  public conversations: ConversationService | null = null;

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

    // Initialize service instances
    this.contexts = new ContextService(this.db);
    this.embeddings = new EmbeddingService(this.db);
    this.conversations = new ConversationService(this.db);

    // Insert test data
    await this.insertTestData();

    // Initialize embedding service
    await this.embeddings.init();
  }

  private async insertTestData(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    try {
      await this.db.add("test", { id: 1, name: "test" });
    } catch (error) {
      // Test data might already exist, ignore error
    }
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
