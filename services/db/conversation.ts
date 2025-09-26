import { IDBPDatabase } from "idb";
import { UrmindDB } from "@/types/database";
import { Context } from "@/types/context";

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
    conversationId: string,
    message: UrmindDB["conversations"]["value"]["messages"][number]
  ): Promise<void> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation)
      throw new Error("[appending-message] Conversation not found");

    await this.db.put("conversations", {
      ...conversation,
      messages: [...conversation.messages, message],
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    });
  }

  async appendMessagesToConversation(
    conversationId: string,
    messages: UrmindDB["conversations"]["value"]["messages"][number][]
  ): Promise<void> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation)
      throw new Error("[appending-messages] Conversation not found");

    await this.db.put("conversations", {
      ...conversation,
      messages: [...conversation.messages, ...messages],
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    });
  }

  async updateMessageContent(
    conversationId: string,
    messageId: string,
    content: string
  ): Promise<void> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation)
      throw new Error("[updating-message] Conversation not found");

    const updatedMessages = conversation.messages.map((msg) =>
      msg.id === messageId ? { ...msg, content } : msg
    );

    await this.db.put("conversations", {
      ...conversation,
      messages: updatedMessages,
      createdAt: conversation.createdAt,
      updatedAt: Date.now(),
    });
  }

  async updateMessageInConversation(
    conversationId: string,
    message: UrmindDB["conversations"]["value"]["messages"][number]
  ): Promise<void> {
    const conversation = await this.getConversation(conversationId);
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

  async updateMessageContextIds(
    conversationId: string,
    messageId: string,
    contextIds: string[]
  ): Promise<void> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation)
      throw new Error("[updating-message-context-ids] Conversation not found");

    await this.db.put("conversations", {
      ...conversation,
      messages: conversation.messages.map((message) =>
        message.id === messageId ? { ...message, contextIds } : message
      ),
      updatedAt: Date.now(),
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

  private async getMatchedContexts(contextIds: string[]): Promise<Context[]> {
    const tx = this.db.transaction("contexts", "readonly");
    const store = tx.objectStore("contexts");
    const index = store.index("by-id");
    const contexts = await Promise.all(
      (contextIds ?? []).map((contextId) => index.get(contextId))
    );
    return contexts.filter((context) => context !== undefined);
  }

  async getAllConversations() {
    const tx = this.db.transaction("conversations", "readonly");
    const store = tx.objectStore("conversations");
    const conversations = await store.getAll();

    let updatedConversations: UrmindDB["conversations"]["value"][] = [];

    for (const conversation of conversations) {
      const updatedMessages = await Promise.all(
        conversation.messages.map(async (message) => {
          if (message.role === "assistant") {
            const matchedContexts = await this.getMatchedContexts(
              message.contextIds ?? []
            );
            return {
              ...message,
              contextIds: message.contextIds ?? [],
              matchedContexts: matchedContexts.map((ctx) => ({
                id: ctx.id,
                category: ctx.category,
                title: ctx.title,
                description: ctx.description,
                type: ctx.type,
                url: ctx.url,
                fullUrl: ctx.fullUrl,
                og: ctx.og,
                summary: ctx.summary,
              })),
            };
          }
          return message;
        })
      );

      updatedConversations.push({
        ...conversation,
        messages: updatedMessages,
      });
    }

    return updatedConversations;
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
