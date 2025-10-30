import urmindDb, { initDb } from "./db";
import { preferencesStore } from "@/store/preferences.store";
import { domainBlacklistStore } from "@/store/domain-blacklist.store";
import { UrmindDB } from "@/types/database";
import logger from "@/lib/logger";
import retry from "async-retry";

export interface UMFileFormat {
  version: string;
  exportDate: string;
  data: {
    contexts: UrmindDB["contexts"]["value"][];
    chunks: ChunkData[];
    categories: UrmindDB["context_categories"]["value"][];
    assets: UrmindDB["assets"]["value"][];
    preferences: any;
    blacklistedDomains: string[];
  };
}

export interface ChunkData {
  id: string;
  parentContextId: string;
  rawContent: string;
  metadata: {
    contextId: string;
    type: "chunk";
    category: string;
    url: string;
  };
}

export interface ImportProgress {
  phase: string;
  current: number;
  total: number;
}

(async () => {
  await initDb();
})();

export class BackupService {
  async exportData(): Promise<Blob> {
    logger.log.setConfig({ global: true })("📦 Starting data export...");

    const contexts = await this.getAllContexts();
    const chunks = await this.getAllChunks();
    const categories = await this.getAllCategories();
    const assets = await this.getAllAssets();
    const preferences = await this.getPreferences();
    const blacklistedDomains = await this.getBlacklistedDomains();

    const umData: UMFileFormat = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      data: {
        contexts,
        chunks,
        categories,
        assets,
        preferences,
        blacklistedDomains,
      },
    };

    logger.log.setConfig({ global: true })(
      `✅ Export complete: ${contexts.length} contexts, ${chunks.length} chunks, ${categories.length} categories, ${assets.length} assets`
    );

    return this.generateUMFile(umData);
  }

  private async getAllContexts(): Promise<UrmindDB["contexts"]["value"][]> {
    if (!urmindDb.contexts) throw new Error("Contexts service not initialized");
    const db = urmindDb.getDb();
    return await db.getAll("contexts");
  }

  private async getAllChunks(): Promise<ChunkData[]> {
    if (!urmindDb.embeddings)
      throw new Error("Embeddings service not initialized");
    const db = urmindDb.getDb();
    const allEmbeddings = await db.getAll("embeddings");

    return allEmbeddings
      .filter((emb) => emb.type === "chunk")
      .map((emb) => ({
        id: emb.id,
        parentContextId: emb.metadata.contextId,
        rawContent: emb.rawContent,
        metadata: {
          contextId: emb.metadata.contextId,
          type: "chunk" as const,
          category: emb.metadata.category,
          url: emb.metadata.url,
        },
      }));
  }

  private async getAllCategories(): Promise<
    UrmindDB["context_categories"]["value"][]
  > {
    if (!urmindDb.contextCategories)
      throw new Error("Context categories service not initialized");
    const db = urmindDb.getDb();
    return await db.getAll("context_categories");
  }

  private async getAllAssets(): Promise<UrmindDB["assets"]["value"][]> {
    if (!urmindDb.assets) throw new Error("Assets service not initialized");
    const db = urmindDb.getDb();
    return await db.getAll("assets");
  }

  private async getPreferences(): Promise<any> {
    return await preferencesStore.get();
  }

  private async getBlacklistedDomains(): Promise<string[]> {
    return await domainBlacklistStore.getAllBlacklistedDomains();
  }

  private generateUMFile(data: UMFileFormat): Blob {
    const jsonString = JSON.stringify(data, null, 2);
    return new Blob([jsonString], { type: "application/json" });
  }

  async importData(
    file: File,
    onProgress: (progress: ImportProgress) => void
  ): Promise<{
    categories: number;
    contexts: number;
    chunks: number;
    assets: number;
  }> {
    logger.log.setConfig({ global: true })("📥 Starting data import...");

    const umData = await this.parseUMFile(file);

    onProgress({
      phase: "Preparing your data...",
      current: 0,
      total: 1,
    });

    await this.mergeCategories(umData.data.categories, onProgress);
    await this.mergeAssets(umData.data.assets, onProgress);
    await this.mergeContexts(umData.data.contexts, onProgress);
    await this.regenerateEmbeddings(
      umData.data.contexts,
      umData.data.chunks,
      onProgress
    );
    await this.mergePreferences(umData.data.preferences);
    await this.mergeBlacklistedDomains(umData.data.blacklistedDomains);

    onProgress({
      phase: "All done!",
      current: 1,
      total: 1,
    });

    logger.log.setConfig({ global: true })("✅ Import complete!");

    return {
      categories: umData.data.categories.length,
      contexts: umData.data.contexts.length,
      chunks: umData.data.chunks.length,
      assets: umData.data.assets.length,
    };
  }

  private async parseUMFile(file: File): Promise<UMFileFormat> {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as UMFileFormat;

      if (!data.version || !data.data) {
        throw new Error("Invalid .um file format");
      }

      return data;
    } catch (error) {
      logger.error.setConfig({ global: true })(
        "Failed to parse UM file:",
        error
      );
      throw new Error("Failed to parse .um file: " + (error as Error).message);
    }
  }

  private async mergeCategories(
    categories: UrmindDB["context_categories"]["value"][],
    onProgress: (progress: ImportProgress) => void
  ): Promise<void> {
    if (!urmindDb.contextCategories)
      throw new Error("Context categories service not initialized");

    let completed = 0;

    onProgress({
      phase: "Setting up your categories...",
      current: 0,
      total: categories.length,
    });

    for (const category of categories) {
      const existing = await urmindDb.contextCategories.getCategoryBySlug(
        category.slug
      );
      if (!existing) {
        await urmindDb.contextCategories.createCategory(category);
      }
      completed++;

      onProgress({
        phase: "Setting up your categories...",
        current: completed,
        total: categories.length,
      });
    }

    logger.log.setConfig({ global: true })(
      `✅ Imported ${categories.length} categories`
    );
  }

  private async mergeContexts(
    contexts: UrmindDB["contexts"]["value"][],
    onProgress: (progress: ImportProgress) => void
  ): Promise<void> {
    if (!urmindDb.contexts) throw new Error("Contexts service not initialized");

    let completed = 0;

    onProgress({
      phase: "Restoring your saved content...",
      current: 0,
      total: contexts.length,
    });

    for (const context of contexts) {
      const existing = await urmindDb.contexts.getContextByFingerprint(
        context.fingerprint
      );
      if (!existing) {
        await urmindDb.contexts.createContext(context);
      }
      completed++;

      onProgress({
        phase: "Restoring your saved content...",
        current: completed,
        total: contexts.length,
      });
    }

    logger.log.setConfig({ global: true })(
      `✅ Imported ${contexts.length} contexts`
    );
  }

  private async regenerateEmbeddings(
    contexts: UrmindDB["contexts"]["value"][],
    chunks: ChunkData[],
    onProgress: (progress: ImportProgress) => void
  ): Promise<void> {
    if (!urmindDb.embeddings)
      throw new Error("Embeddings service not initialized");

    const totalSteps = contexts.length + chunks.length;
    let completed = 0;

    const RETRY = 10;
    const FACTOR = 10;

    onProgress({
      phase: "Making your content searchable...",
      current: completed,
      total: totalSteps,
    });

    for (const context of contexts) {
      const hasEmbeddings = await urmindDb.embeddings!.hasEmbeddingsForContext(
        context.id
      );

      if (!hasEmbeddings) {
        const embeddingText = `${context.title} ${context.description} ${context.summary} ${context.rawContent}`;
        if (embeddingText) {
          await retry(
            async () => {
              await urmindDb.embeddings!.generateAndStore(embeddingText, {
                contextId: context.id,
                type: "parent",
                category: context.categorySlug,
                url: context.url || "",
              });
            },
            {
              retries: RETRY,
              factor: FACTOR,
              minTimeout: 1000,
              maxTimeout: 30000,
              onRetry: (error, attempt) => {
                logger.warn.setConfig({ global: true })(
                  `Retry ${attempt} for parent embedding ${context.id}:`,
                  error
                );
              },
            }
          );
        }
      }

      completed++;
      onProgress({
        phase: "Making your content searchable...",
        current: completed,
        total: totalSteps,
      });
    }

    logger.log.setConfig({ global: true })(
      `✅ Processed ${contexts.length} parent embeddings`
    );

    onProgress({
      phase: "Making your content searchable...",
      current: completed,
      total: totalSteps,
    });

    for (const chunk of chunks) {
      const exists = await urmindDb.embeddings!.embeddingExists(chunk.id);

      if (!exists) {
        await retry(
          async () => {
            await urmindDb.embeddings!.generateAndStore(chunk.rawContent, {
              contextId: chunk.parentContextId,
              type: "chunk",
              category: chunk.metadata.category,
              url: chunk.metadata.url,
            });
          },
          {
            retries: RETRY,
            factor: FACTOR,
            minTimeout: 1000,
            maxTimeout: 30000,
            onRetry: (error, attempt) => {
              logger.warn.setConfig({ global: true })(
                `Retry ${attempt} for chunk embedding ${chunk.id}:`,
                error
              );
            },
          }
        );
      }

      completed++;
      onProgress({
        phase: "Making your content searchable...",
        current: completed,
        total: totalSteps,
      });
    }

    logger.log.setConfig({ global: true })(
      `✅ Processed ${chunks.length} chunk embeddings`
    );
  }

  private async mergeAssets(
    assets: UrmindDB["assets"]["value"][],
    onProgress: (progress: ImportProgress) => void
  ): Promise<void> {
    if (!urmindDb.assets) throw new Error("Assets service not initialized");

    let completed = 0;

    onProgress({
      phase: "Restoring images and files...",
      current: 0,
      total: assets.length,
    });

    for (const asset of assets) {
      const existing = await urmindDb.assets.getAssetById(asset.id);
      if (!existing) {
        await urmindDb.assets.createAsset(asset);
      }
      completed++;

      onProgress({
        phase: "Restoring images and files...",
        current: completed,
        total: assets.length,
      });
    }

    logger.log.setConfig({ global: true })(
      `✅ Imported ${assets.length} assets`
    );
  }

  private async mergePreferences(preferences: any): Promise<void> {
    const current = await preferencesStore.get();
    await preferencesStore.set({ ...current, ...preferences });
    logger.log.setConfig({ global: true })("✅ Merged preferences");
  }

  private async mergeBlacklistedDomains(domains: string[]): Promise<void> {
    for (const domain of domains) {
      await domainBlacklistStore.addDomain(domain);
    }
    logger.log.setConfig({ global: true })(
      `✅ Merged ${domains.length} blacklisted domains`
    );
  }

  downloadUMFile(blob: Blob, filename?: string): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const finalFilename = filename || `urmind-backup-${timestamp}.um`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const backupService = new BackupService();
