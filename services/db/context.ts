import { IDBPDatabase } from "idb";
import { UrmindDB } from "@/types/database";

export class ContextService {
  constructor(private db: IDBPDatabase<UrmindDB>) {}

  async createContext(
    context: Omit<UrmindDB["contexts"]["value"], "createdAt" | "updatedAt">
  ): Promise<string> {
    const now = Date.now();
    const contextData = {
      ...context,
      createdAt: now,
      updatedAt: now,
    };

    console.log("Creating context:", contextData);
    console.log("Database instance:", this.db);

    try {
      const result = await this.db.put("contexts", contextData);
      console.log("Context creation result:", result);

      // Verify the context was created
      const verification = await this.db.get("contexts", context.id);
      console.log("Context verification:", verification);

      return context.id;
    } catch (error) {
      console.error("Failed to create context:", error);
      throw error;
    }
  }

  async getContext(
    id: string
  ): Promise<UrmindDB["contexts"]["value"] | undefined> {
    return await this.db.get("contexts", id);
  }

  async getContextByFingerprint(
    fingerprint: string
  ): Promise<UrmindDB["contexts"]["value"] | undefined> {
    return await this.db.get("contexts", fingerprint);
  }

  async getAllContextCategories(): Promise<string[]> {
    const contexts = await this.db.getAll("contexts");
    const categories = contexts.map((context) => context.category);
    return [...new Set(categories)];
  }

  async getAllContexts(): Promise<UrmindDB["contexts"]["value"][]> {
    return await this.db.getAll("contexts");
  }

  async getContextsByType(
    type: string
  ): Promise<UrmindDB["contexts"]["value"][]> {
    return await this.db.getAllFromIndex("contexts", "by-type", type);
  }

  async updateContext(
    id: string,
    updates: Partial<UrmindDB["contexts"]["value"]>
  ): Promise<void> {
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
    await this.db.delete("contexts", id);
  }
}
