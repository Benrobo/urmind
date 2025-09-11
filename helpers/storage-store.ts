import { storage } from "@wxt-dev/storage";

export type StorageKey =
  | `local:${string}`
  | `session:${string}`
  | `sync:${string}`
  | `managed:${string}`;

export class StorageStore<T = any> {
  private key: StorageKey;
  private defaultValue: T;
  private watchers: Set<(value: T, oldValue: T | null) => void> = new Set();
  private unwatchFn: (() => void) | null = null;

  constructor(key: StorageKey, defaultValue: T) {
    this.key = key;
    this.defaultValue = defaultValue;
    this.setupWatcher();
  }

  private setupWatcher() {
    this.unwatchFn = storage.watch<T>(this.key, (newValue, oldValue) => {
      this.watchers.forEach((callback) =>
        callback(newValue ?? this.defaultValue, oldValue)
      );
    });
  }

  // Get current value
  async get(): Promise<T> {
    const value = await storage.getItem<T>(this.key);
    return value ?? this.defaultValue;
  }

  // Set value
  async set(value: T): Promise<void> {
    await storage.setItem(this.key, value);
  }

  // Delete value
  async del(key: StorageKey): Promise<void> {
    await storage.removeItem(key);
  }

  // Update value with a function
  async update(updater: (currentValue: T) => T): Promise<void> {
    const currentValue = await this.get();
    const newValue = updater(currentValue);
    await this.set(newValue);
  }

  // Toggle boolean values
  async toggle(): Promise<T> {
    if (typeof this.defaultValue === "boolean") {
      const currentValue = await this.get();
      const newValue = !currentValue as T;
      await this.set(newValue);
      return newValue;
    }
    throw new Error("Toggle can only be used with boolean values");
  }

  // Subscribe to changes
  subscribe(callback: (value: T, oldValue: T | null) => void): () => void {
    this.watchers.add(callback);

    // Immediately call with current value
    this.get().then((value) => callback(value, null));

    // Return unsubscribe function
    return () => {
      this.watchers.delete(callback);
    };
  }

  // Clean up watchers
  destroy() {
    if (this.unwatchFn) {
      this.unwatchFn();
      this.unwatchFn = null;
    }
    this.watchers.clear();
  }
}
