import { StorageStore } from "@/helpers/storage-store";
import logger from "@/lib/logger";

export class ContextViewsStore extends StorageStore<{
  viewedContextIds: string[];
}> {
  constructor() {
    super("local:context_views", {
      viewedContextIds: [],
    });
  }

  async markAsViewed(contextId: string): Promise<void> {
    const currentState = await this.get();

    if (currentState.viewedContextIds.includes(contextId)) {
      return;
    }

    const updated = {
      viewedContextIds: [...currentState.viewedContextIds, contextId],
    };

    await this.set(updated);
    logger.info(`✅ Context marked as viewed: ${contextId}`);
  }

  async isViewed(contextId: string): Promise<boolean> {
    const currentState = await this.get();
    return currentState.viewedContextIds.includes(contextId);
  }

  async getUnviewedCountForCategory(
    categorySlug: string,
    contexts: Array<{ id: string; categorySlug: string }>
  ): Promise<number> {
    const currentState = await this.get();
    const categoryContexts = contexts.filter(
      (c) => c.categorySlug === categorySlug
    );

    return categoryContexts.filter(
      (c) => !currentState.viewedContextIds.includes(c.id)
    ).length;
  }

  async clearAll(): Promise<void> {
    await this.set({ viewedContextIds: [] });
    logger.info("🧹 Cleared all viewed context IDs");
  }
}

export const contextViewsStore = new ContextViewsStore();
