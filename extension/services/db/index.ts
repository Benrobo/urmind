import { openDB, IDBPDatabase } from "idb";
import { UrmindDB } from "@/types/database";
import { ContextService } from "./context";
import { ConversationService } from "./conversation";
import { EmbeddingsStore } from "@/services/embeddings-store";
import { ContextCategoriesService } from "./context-categories";
import { AssetsService } from "./assets.service";
import { saveToUrmindQueue } from "@/triggers/save-to-urmind";

class UrmindDatabase {
  private db: IDBPDatabase<UrmindDB> | null = null;
  private dbName = "urmind-db";
  private version = 7.0;
  private initPromise: Promise<void> | null = null;

  // Service instances
  public contexts: ContextService | null = null;
  public conversations: ConversationService | null = null;
  public embeddings: EmbeddingsStore | null = null;
  public contextCategories: ContextCategoriesService | null = null;
  public assets: AssetsService | null = null;

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

    this.db = await openDB<UrmindDB>(this.dbName, this.version, {
      upgrade(db, oldVersion) {
        console.log(
          `Upgrading database from version ${oldVersion} to ${db.version}`
        );

        // Create context_categories store
        if (!db.objectStoreNames.contains("context_categories")) {
          console.log("Creating context_categories store");
          const categoryStore = db.createObjectStore("context_categories", {
            keyPath: "slug",
          });
          categoryStore.createIndex("by-slug", "slug");
          categoryStore.createIndex("by-label", "label");
          categoryStore.createIndex("by-created", "createdAt");
        }

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
          contextStore.createIndex("by-category-slug", "categorySlug");
        } else if (oldVersion < 4.0) {
          // Update existing contexts store for new schema
          console.log("Updating contexts store for new category structure");
          const contextStore = db
            .transaction(["contexts"], "versionchange")
            .objectStore("contexts");

          // Remove old category index if it exists
          try {
            contextStore.deleteIndex("by-category");
          } catch (e) {
            // Index might not exist, that's ok
          }

          // Add new category slug index
          contextStore.createIndex("by-category-slug", "categorySlug");
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

        // Create assets store
        if (!db.objectStoreNames.contains("assets")) {
          console.log("Creating assets store");
          const assetStore = db.createObjectStore("assets", {
            keyPath: "id",
          });
          assetStore.createIndex("by-id", "id");
          assetStore.createIndex("by-type", "type");
          assetStore.createIndex("by-source", "source");
          assetStore.createIndex("by-created", "createdAt");
        } else if (oldVersion < 7.0) {
          // Ensure assets store exists for existing databases
          console.log("Ensuring assets store exists for version upgrade");
        }
      },
    });

    // Initialize service instances
    this.contexts = new ContextService(this.db);
    this.conversations = new ConversationService(this.db);
    this.embeddings = new EmbeddingsStore(this.db);
    this.contextCategories = new ContextCategoriesService(this.db);
    this.assets = new AssetsService(this.db);

    console.log("Database services initialized");
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const tx = this.db.transaction(
      [
        "contexts",
        "embeddings",
        "conversations",
        "context_categories",
        "assets",
      ],
      "readwrite"
    );
    await Promise.all([
      tx.objectStore("contexts").clear(),
      tx.objectStore("embeddings").clear(),
      tx.objectStore("conversations").clear(),
      tx.objectStore("context_categories").clear(),
      tx.objectStore("assets").clear(),
      tx.done,
    ]);

    // Clear all queue data as well
    await this.clearAllQueues();
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

  /**
   * Clear all queue data
   */
  async clearAllQueues(): Promise<void> {
    try {
      // Get all queue items and delete them
      const queueItems = await saveToUrmindQueue.findAll();
      for (const item of queueItems) {
        await saveToUrmindQueue.delete(item.id);
      }
      console.log(`🧹 Cleared ${queueItems.length} queue items`);
    } catch (error) {
      console.error("Failed to clear queues:", error);
    }
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
