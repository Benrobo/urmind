import {
  sendDBOperationMessage,
  sendDBOperationMessageToTab,
} from "@/helpers/messaging";
import { UrmindDB } from "@/types/database";

/**
 * Database proxy service that forwards database operations from background script
 * to content script where IndexedDB operations work properly.
 */
export class DatabaseProxy {
  /**
   * Get all context categories via content script
   */
  async getAllContextCategories(tabId?: number): Promise<string[]> {
    console.log(
      "🔄 Proxying getAllContextCategories to content script",
      tabId ? `on tab: ${tabId}` : ""
    );

    try {
      const result = tabId
        ? await sendDBOperationMessageToTab(tabId, "getAllContextCategories")
        : await sendDBOperationMessage("getAllContextCategories");
      console.log(
        "✅ Categories retrieved via proxy:",
        result?.length || 0,
        "items"
      );
      return result || [];
    } catch (error) {
      console.error("❌ Proxy getAllContextCategories failed:", error);
      throw error;
    }
  }

  /**
   * Get contexts by type via content script
   */
  async getContextsByType(
    type: string,
    tabId?: number
  ): Promise<UrmindDB["contexts"]["value"][]> {
    console.log(
      "🔄 Proxying getContextsByType to content script:",
      type,
      tabId ? `on tab: ${tabId}` : ""
    );

    try {
      const result = tabId
        ? await sendDBOperationMessageToTab(tabId, "getContextsByType", {
            type,
          })
        : await sendDBOperationMessage("getContextsByType", { type });
      console.log(
        "✅ Contexts by type retrieved via proxy:",
        result?.length || 0,
        "items"
      );
      return result || [];
    } catch (error) {
      console.error("❌ Proxy getContextsByType failed:", error);
      throw error;
    }
  }

  /**
   * Get context by fingerprint via content script
   */
  async getContextByFingerprint(
    fingerprint: string,
    tabId?: number
  ): Promise<UrmindDB["contexts"]["value"] | undefined> {
    console.log(
      "🔄 Proxying getContextByFingerprint to content script:",
      fingerprint,
      tabId ? `on tab: ${tabId}` : ""
    );

    try {
      const result = tabId
        ? await sendDBOperationMessageToTab(tabId, "getContextByFingerprint", {
            fingerprint,
          })
        : await sendDBOperationMessage("getContextByFingerprint", {
            fingerprint,
          });
      console.log("✅ Context by fingerprint retrieved via proxy:", result);
      return result;
    } catch (error) {
      console.error("❌ Proxy getContextByFingerprint failed:", error);
      throw error;
    }
  }
  /**
   * Create a new context via content script
   */
  async createContext(
    context: Omit<UrmindDB["contexts"]["value"], "createdAt" | "updatedAt">,
    tabId?: number
  ): Promise<string> {
    console.log(
      "🔄 Proxying createContext to content script:",
      context,
      tabId ? `on tab: ${tabId}` : ""
    );

    try {
      const result = tabId
        ? await sendDBOperationMessageToTab(tabId, "createContext", context)
        : await sendDBOperationMessage("createContext", context);
      console.log("✅ Context created via proxy:", result);
      return result;
    } catch (error) {
      console.error("❌ Proxy createContext failed:", error);
      throw error;
    }
  }

  /**
   * Get context by ID via content script
   */
  async getContext(
    id: string,
    tabId?: number
  ): Promise<UrmindDB["contexts"]["value"] | undefined> {
    console.log(
      "🔄 Proxying getContext to content script:",
      id,
      tabId ? `on tab: ${tabId}` : ""
    );

    try {
      const result = tabId
        ? await sendDBOperationMessageToTab(tabId, "getContext", undefined, id)
        : await sendDBOperationMessage("getContext", undefined, id);
      console.log("✅ Context retrieved via proxy:", result);
      return result;
    } catch (error) {
      console.error("❌ Proxy getContext failed:", error);
      throw error;
    }
  }

  /**
   * Get all contexts via content script
   */
  async getAllContexts(
    tabId?: number
  ): Promise<UrmindDB["contexts"]["value"][]> {
    console.log(
      "🔄 Proxying getAllContexts to content script",
      tabId ? `on tab: ${tabId}` : ""
    );

    try {
      const result = tabId
        ? await sendDBOperationMessageToTab(tabId, "getAllContexts")
        : await sendDBOperationMessage("getAllContexts");
      console.log(
        "✅ All contexts retrieved via proxy:",
        result?.length || 0,
        "items"
      );
      return result || [];
    } catch (error) {
      console.error("❌ Proxy getAllContexts failed:", error);
      throw error;
    }
  }

  /**
   * Update context via content script
   */
  async updateContext(
    id: string,
    updates: Partial<UrmindDB["contexts"]["value"]>,
    tabId?: number
  ): Promise<void> {
    console.log(
      "🔄 Proxying updateContext to content script:",
      id,
      updates,
      tabId ? `on tab: ${tabId}` : ""
    );

    try {
      if (tabId) {
        await sendDBOperationMessageToTab(tabId, "updateContext", updates, id);
      } else {
        await sendDBOperationMessage("updateContext", updates, id);
      }
      console.log("✅ Context updated via proxy");
    } catch (error) {
      console.error("❌ Proxy updateContext failed:", error);
      throw error;
    }
  }

  /**
   * Delete context via content script
   */
  async deleteContext(id: string, tabId?: number): Promise<void> {
    console.log(
      "🔄 Proxying deleteContext to content script:",
      id,
      tabId ? `on tab: ${tabId}` : ""
    );

    try {
      if (tabId) {
        await sendDBOperationMessageToTab(
          tabId,
          "deleteContext",
          undefined,
          id
        );
      } else {
        await sendDBOperationMessage("deleteContext", undefined, id);
      }
      console.log("✅ Context deleted via proxy");
    } catch (error) {
      console.error("❌ Proxy deleteContext failed:", error);
      throw error;
    }
  }
}

export const dbProxy = new DatabaseProxy();
