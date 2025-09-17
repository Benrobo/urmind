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

    await this.db.add("contexts", contextData);
    return context.id;
  }

  async getContext(
    id: string
  ): Promise<UrmindDB["contexts"]["value"] | undefined> {
    return await this.db.get("contexts", id);
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
