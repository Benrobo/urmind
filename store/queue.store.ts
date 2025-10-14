import { StorageStore } from "@/helpers/storage-store";
import { PageIndexerPayload } from "@/triggers/page-indexer";

export type QueueItemStatus = "pending" | "processing" | "completed" | "failed";

export type QueueItem<T = any> = {
  id: string;
  status: QueueItemStatus;
  content: T;
  createdAt: number;
};

export class QueueStore<T = any> extends StorageStore<QueueItem<T>[]> {
  constructor(storageKey: string) {
    super(storageKey as any, []);
  }

  async add(id: string, content: T): Promise<void> {
    const currentItems = await this.get();
    const newItem: QueueItem<T> = {
      id,
      status: "pending",
      content,
      createdAt: Date.now(),
    };

    const existingIndex = currentItems.findIndex((item) => item.id === id);
    if (existingIndex >= 0) {
      // Update existing item
      currentItems[existingIndex] = newItem;
    } else {
      // Add new item
      currentItems.push(newItem);
    }

    await this.set(currentItems);
  }

  async delete(id: string): Promise<void> {
    const currentItems = await this.get();
    const filteredItems = currentItems.filter((item) => item.id !== id);
    await this.set(filteredItems);
  }

  async findAll(): Promise<QueueItem<T>[]> {
    return await this.get();
  }

  async find(id: string): Promise<QueueItem<T> | null> {
    const items = await this.get();
    return items.find((item) => item.id === id) || null;
  }

  async getNext(): Promise<QueueItem<T> | null> {
    const items = await this.get();
    const pendingItem = items.find((item) => item.status === "pending");
    return pendingItem || null;
  }

  async updateStatus(id: string, status: QueueItemStatus): Promise<void> {
    const currentItems = await this.get();
    const itemIndex = currentItems.findIndex((item) => item.id === id);

    if (itemIndex >= 0) {
      currentItems[itemIndex]!.status = status;
      await this.set(currentItems);
    }
  }

  async hasItem(id: string): Promise<boolean> {
    const items = await this.get();
    return items.some((item) => item.id === id);
  }

  async getItemStatus(id: string): Promise<QueueItemStatus | null> {
    const item = await this.find(id);
    return item ? item.status : null;
  }

  async getQueueStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const items = await this.get();
    return {
      total: items.length,
      pending: items.filter((item) => item.status === "pending").length,
      processing: items.filter((item) => item.status === "processing").length,
      completed: items.filter((item) => item.status === "completed").length,
      failed: items.filter((item) => item.status === "failed").length,
    };
  }
}
