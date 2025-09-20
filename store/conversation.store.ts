import { StorageStore } from "@/helpers/storage-store";

export class ActiveConversationStore extends StorageStore<string | null> {
  constructor() {
    super("local:active_conversation_id", null);
  }

  async setActiveConversation(id: string): Promise<void> {
    await this.set(id);
  }

  async clearActiveConversation(): Promise<void> {
    await this.set(null);
  }

  async getActiveConversation(): Promise<string | null> {
    return await this.get();
  }
}

export const activeConversationStore = new ActiveConversationStore();
