import { openDB, IDBPDatabase } from "idb";
import { UrmindDB } from "@/types/database";
import { ContextService } from "./context";
import { ConversationService } from "./conversation";
import { EmbeddingsStore } from "@/services/embeddings-store";

class UrmindDatabase {
  private db: IDBPDatabase<UrmindDB> | null = null;
  private dbName = "urmind-db";
  private version = 3.5;
  private initPromise: Promise<void> | null = null;

  // Service instances
  public contexts: ContextService | null = null;
  public conversations: ConversationService | null = null;
  public embeddings: EmbeddingsStore | null = null;

  getDb(): IDBPDatabase<UrmindDB> {
    if (!this.db) throw new Error("Database not initialized");
    return this.db;
  }

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInit();
    return this.initPromise;
  }

  private async _doInit(): Promise<void> {
    if (this.db) {
      console.log("Database already initialized");
      return;
    }

    console.log("Initializing database...");
    this.db = await openDB<UrmindDB>(this.dbName, this.version, {
      upgrade(db, oldVersion) {
        console.log(
          `Upgrading database from version ${oldVersion} to ${db.version}`
        );

        // Create contexts store
        if (!db.objectStoreNames.contains("contexts")) {
          console.log("Creating contexts store");
          const contextStore = db.createObjectStore("contexts", {
            keyPath: "id",
          });
          contextStore.createIndex("by-id", "id");
          contextStore.createIndex("by-type", "type");
          contextStore.createIndex(
            "by-content-fingerprint",
            "contentFingerprint"
          );
          contextStore.createIndex("by-created", "createdAt");
          contextStore.createIndex("by-fingerprint", "fingerprint");
          contextStore.createIndex("by-category", "category.slug");
        }

        // Create embeddings store
        if (!db.objectStoreNames.contains("embeddings")) {
          console.log("Creating embeddings store");
          const embeddingStore = db.createObjectStore("embeddings", {
            keyPath: "id",
          });
          embeddingStore.createIndex("by-id", "id");
          embeddingStore.createIndex("by-metadata", "metadata");
        }

        // Create conversations store
        if (!db.objectStoreNames.contains("conversations")) {
          console.log("Creating conversations store");
          const conversationStore = db.createObjectStore("conversations", {
            keyPath: "id",
          });
          conversationStore.createIndex("by-id", "id");
          conversationStore.createIndex("by-created", "createdAt");
        }
      },
    });

    console.log("Database opened successfully");

    // Initialize service instances
    this.contexts = new ContextService(this.db);
    this.conversations = new ConversationService(this.db);
    this.embeddings = new EmbeddingsStore(this.db);

    console.log("Database services initialized");
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const tx = this.db.transaction(
      ["contexts", "embeddings", "conversations"],
      "readwrite"
    );
    await Promise.all([
      tx.objectStore("contexts").clear(),
      tx.objectStore("embeddings").clear(),
      tx.objectStore("conversations").clear(),
      tx.done,
    ]);
  }

  async clearContexts(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    const tx = this.db.transaction("contexts", "readwrite");
    await tx.objectStore("contexts").clear();
    await tx.done;
  }

  async clearEmbeddings(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    const tx = this.db.transaction("embeddings", "readwrite");
    await tx.objectStore("embeddings").clear();
    await tx.done;
  }

  async clearConversations(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    const tx = this.db.transaction("conversations", "readwrite");
    await tx.objectStore("conversations").clear();
    await tx.done;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

const urmindDb = new UrmindDatabase();

const initDb = async (): Promise<void> => {
  await urmindDb.init();
};

export default urmindDb;
export { initDb };
