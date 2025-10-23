import { IDBPDatabase } from "idb";
import { UrmindDB } from "@/types/database";

export class AssetsService {
  constructor(private db: IDBPDatabase<UrmindDB>) {}

  async createAsset(
    asset: Omit<UrmindDB["assets"]["value"], "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      // Check if assets store exists, if not, we need to recreate the database
      if (!this.db.objectStoreNames.contains("assets")) {
        console.error(
          "Assets store not found. Available stores:",
          Array.from(this.db.objectStoreNames)
        );
        throw new Error(
          "Assets store not found. Database may need to be recreated."
        );
      }

      const now = Date.now();
      const assetData: UrmindDB["assets"]["value"] = {
        ...asset,
        createdAt: now,
        updatedAt: now,
      };

      await this.db.add("assets", assetData);
      return asset.id;
    } catch (error) {
      console.error("Error creating asset:", error);
      console.error(
        "Available object stores:",
        Array.from(this.db.objectStoreNames)
      );
      throw error;
    }
  }

  async getAssetById(
    id: string
  ): Promise<UrmindDB["assets"]["value"] | undefined> {
    return await this.db.get("assets", id);
  }

  async deleteAsset(id: string): Promise<void> {
    await this.db.delete("assets", id);
  }

  async getAllAssets(): Promise<UrmindDB["assets"]["value"][]> {
    return await this.db.getAll("assets");
  }

  async getAssetsByType(
    type: UrmindDB["assets"]["value"]["type"]
  ): Promise<UrmindDB["assets"]["value"][]> {
    return await this.db.getAllFromIndex("assets", "by-type", type);
  }

  async getAssetsBySource(
    source: UrmindDB["assets"]["value"]["source"]
  ): Promise<UrmindDB["assets"]["value"][]> {
    return await this.db.getAllFromIndex("assets", "by-source", source);
  }

  async updateAsset(
    id: string,
    updates: Partial<Omit<UrmindDB["assets"]["value"], "id" | "createdAt">>
  ): Promise<void> {
    const existing = await this.getAssetById(id);
    if (!existing) {
      throw new Error(`Asset with id ${id} not found`);
    }

    const updatedAsset: UrmindDB["assets"]["value"] = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    await this.db.put("assets", updatedAsset);
  }
}
