import { IDBPDatabase } from "idb";
import { UrmindDB } from "@/types/database";

export class ConversationService {
  constructor(private db: IDBPDatabase<UrmindDB>) {}

  async createConversation(
    conversation: Omit<
      UrmindDB["conversations"]["value"],
      "createdAt" | "updatedAt"
    >
  ): Promise<string> {
    const now = Date.now();
    const conversationData = {
      ...conversation,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.add("conversations", conversationData);
    return conversation.id;
  }

  async getConversation(
    id: string
  ): Promise<UrmindDB["conversations"]["value"] | undefined> {
    return await this.db.get("conversations", id);
  }

  async getAllConversations(): Promise<UrmindDB["conversations"]["value"][]> {
    return await this.db.getAll("conversations");
  }

  async updateConversation(
    id: string,
    updates: Partial<UrmindDB["conversations"]["value"]>
  ): Promise<void> {
    const existing = await this.getConversation(id);
    if (!existing) throw new Error("Conversation not found");

    const updated = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    await this.db.put("conversations", updated);
  }

  async deleteConversation(id: string): Promise<void> {
    await this.db.delete("conversations", id);
  }
}
