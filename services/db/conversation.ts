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

  async appendMessageToConversation(
    id: string,
    message: UrmindDB["conversations"]["value"]["messages"][number]
  ): Promise<void> {
    const conversation = await this.getConversation(id);
    if (!conversation)
      throw new Error("[appending-message] Conversation not found");

    await this.db.put("conversations", {
      ...conversation,
      messages: [...conversation.messages, message],
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    });
  }

  async updateMessageInConversation(
    id: string,
    message: UrmindDB["conversations"]["value"]["messages"][number]
  ): Promise<void> {
    const conversation = await this.getConversation(id);
    if (!conversation)
      throw new Error("[updating-message] Conversation not found");

    await this.db.put("conversations", {
      ...conversation,
      messages: conversation.messages.map((m) =>
        m.id === message.id ? message : m
      ),
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    });
  }

  async getConversation(
    id: string
  ): Promise<UrmindDB["conversations"]["value"] | undefined> {
    if (!id) {
      throw new Error("Conversation ID is required");
    }
    const tx = this.db.transaction("conversations", "readonly");
    const store = tx.objectStore("conversations");
    const index = store.index("by-id");
    return await index.get(id);
  }

  async getAllConversations(): Promise<UrmindDB["conversations"]["value"][]> {
    // return await this.db.getAll("conversations");
    const tx = this.db.transaction("conversations", "readonly");
    const store = tx.objectStore("conversations");
    return await store.getAll();
  }

  async updateConversation(
    id: string,
    updates: Partial<UrmindDB["conversations"]["value"]>
  ): Promise<UrmindDB["conversations"]["value"]> {
    const existing = await this.getConversation(id);
    if (!existing)
      throw new Error("[updating-conversation] Conversation not found");

    const updated = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    await this.db.put("conversations", updated);
    return updated;
  }

  async deleteConversation(id: string): Promise<void> {
    // await this.db.delete("conversations", id);
    const tx = this.db.transaction("conversations", "readwrite");
    const store = tx.objectStore("conversations");
    await store.delete(id);
  }
}
