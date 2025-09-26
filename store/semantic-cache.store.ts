import { StorageStore } from "@/helpers/storage-store";

type CacheEntry = {
  signature: string;
  score: number;
  timestamp: number;
};

export class SemanticCacheStore extends StorageStore<CacheEntry[]> {
  constructor() {
    super("local:semantic_cache_signatures", []);
  }

  async addSignature(signature: string, score: number): Promise<void> {
    const currentEntries = await this.get();
    const newEntry: CacheEntry = {
      signature,
      score,
      timestamp: Date.now(),
    };

    const existingIndex = currentEntries.findIndex(
      (entry) => entry.signature === signature
    );
    if (existingIndex >= 0) {
      currentEntries[existingIndex] = newEntry;
    } else {
      currentEntries.push(newEntry);
    }

    await this.set(currentEntries);
  }

  async hasSignature(signature: string): Promise<boolean> {
    const currentEntries = await this.get();
    return currentEntries.some((entry) => entry.signature === signature);
  }

  async getSignatureScore(signature: string): Promise<number | null> {
    const currentEntries = await this.get();
    const entry = currentEntries.find((entry) => entry.signature === signature);
    return entry ? entry.score : null;
  }

  async getSignatures(): Promise<string[]> {
    const currentEntries = await this.get();
    return currentEntries.map((entry) => entry.signature);
  }

  async clearCache(): Promise<void> {
    await this.set([]);
  }

  async getCacheStats(): Promise<{ size: number; signatures: string[] }> {
    const entries = await this.get();
    return {
      size: entries.length,
      signatures: entries.map((entry) => entry.signature),
    };
  }
}

export const semanticCacheStore = new SemanticCacheStore();
