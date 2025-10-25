import { StorageStore } from "@/helpers/storage-store";

export type ManualIndexingStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface ManualIndexingEntry {
  status: ManualIndexingStatus;
  timestamp: number;
}

export interface ManualIndexingState {
  [cleanUrl: string]: ManualIndexingEntry;
}

export class ManualIndexingStore extends StorageStore<ManualIndexingState> {
  constructor() {
    super("local:manual_indexing", {});
  }

  async getStatus(cleanUrl: string): Promise<ManualIndexingStatus | null> {
    const state = await this.get();
    return state[cleanUrl]?.status || null;
  }

  async setStatus(
    cleanUrl: string,
    status: ManualIndexingStatus
  ): Promise<void> {
    const currentState = await this.get();
    await this.set({
      ...currentState,
      [cleanUrl]: {
        status,
        timestamp: Date.now(),
      },
    });
  }

  async removeUrl(cleanUrl: string): Promise<void> {
    const currentState = await this.get();
    const newState = { ...currentState };
    delete newState[cleanUrl];
    await this.set(newState);
  }

  async cleanupOldEntries(
    maxAge: number = 7 * 24 * 60 * 60 * 1000
  ): Promise<void> {
    const currentState = await this.get();
    const now = Date.now();
    const newState: ManualIndexingState = {};

    for (const [url, entry] of Object.entries(currentState)) {
      if (now - entry.timestamp < maxAge) {
        newState[url] = entry;
      }
    }

    await this.set(newState);
  }

  async getAllUrls(): Promise<string[]> {
    const state = await this.get();
    return Object.keys(state);
  }
}

export const manualIndexingStore = new ManualIndexingStore();
