import urmindDb from "@/services/db";

type DatabaseOperation =
  | "createContext"
  | "getContext"
  | "getAllContexts"
  | "updateContext"
  | "deleteContext"
  | "getAllContextCategories"
  | "getContextsByType"
  | "getContextByFingerprint";

/**
 * Database operation handler for content script message listeners
 * Handles all database operations requested by background script via messaging
 */
export class DatabaseMessageHandler {
  /**
   * Handle a database operation message from background script
   */
  async handleOperation(
    operation: DatabaseOperation,
    data?: any,
    contextId?: string
  ): Promise<any> {
    console.log("🎯 Content script handling DB operation:", operation, {
      data,
      contextId,
    });

    if (!urmindDb.contexts) {
      throw new Error("Database contexts service not available");
    }

    let result;

    switch (operation) {
      // Context CRUD operations
      case "createContext":
        result = await urmindDb.contexts.createContext(data);
        break;

      case "getContext":
        if (!contextId) throw new Error("contextId required for getContext");
        result = await urmindDb.contexts.getContext(contextId);
        break;

      case "getAllContexts":
        result = await urmindDb.contexts.getAllContexts();
        break;

      case "updateContext":
        if (!contextId) throw new Error("contextId required for updateContext");
        await urmindDb.contexts.updateContext(contextId, data);
        result = "success";
        break;

      case "deleteContext":
        if (!contextId) throw new Error("contextId required for deleteContext");
        await urmindDb.contexts.deleteContext(contextId);
        result = "success";
        break;

      // Additional context queries
      case "getAllContextCategories":
        result = await urmindDb.contexts.getAllContextCategories();
        break;

      case "getContextsByType":
        if (!data?.type) throw new Error("type required for getContextsByType");
        result = await urmindDb.contexts.getContextsByType(data.type);
        break;

      case "getContextByFingerprint":
        if (!data?.fingerprint)
          throw new Error("fingerprint required for getContextByFingerprint");
        result = await urmindDb.contexts.getContextByFingerprint(
          data.fingerprint
        );
        break;

      default:
        throw new Error(`Unknown DB operation: ${operation}`);
    }

    console.log("✅ DB operation completed:", operation, result);
    return result;
  }

  /**
   * Create a Chrome runtime message listener for database operations
   */
  createMessageListener() {
    return (
      request: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      if (request.action === "db-operation") {
        // Handle async operation properly
        (async () => {
          try {
            const { operation, data, contextId } = request.payload;
            const result = await this.handleOperation(
              operation,
              data,
              contextId
            );
            sendResponse({ result });
          } catch (error) {
            console.error("❌ DB operation failed:", error);
            sendResponse({
              error: error instanceof Error ? error.message : String(error),
            });
          }
        })();

        return true; // Keep message channel open for async response
      }
      return false; // Let other listeners handle non-db messages
    };
  }
}

/**
 * Hook to set up database message handling in content script
 */
export function useDatabaseMessageHandler() {
  const handler = new DatabaseMessageHandler();

  // Set up the message listener
  const setupListener = () => {
    const listener = handler.createMessageListener();
    chrome.runtime.onMessage.addListener(listener);

    console.log("📡 Database message handler initialized");

    // Return cleanup function
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
      console.log("📡 Database message handler cleaned up");
    };
  };

  return {
    handler,
    setupListener,
  };
}
