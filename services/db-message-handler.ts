//============== CONTENT SCRIPT ONLY =============//
/**To be used in content script only */

import logger from "@/lib/logger";
import { embeddingHelper } from "@/services/embedding-helper";

export type DatabaseOperations =
  // embedding model operations (content script only)
  | "generateEmbedding"
  | "semanticSearch"
  // database operations (background script only)
  | "getAllConversations"
  | "getAllContexts"
  | "createConversation"
  | "updateMessageInConversation"
  | "updateMessageContent"
  | "appendMessageToConversation"
  | "appendMessagesToConversation";

/**
 * Database operation handler for content script message listeners
 * Handles embedding model operations that require content script access
 */
export class DatabaseMessageHandler {
  /**
   * Handle a database operation message from background script
   */
  async handleOperation(
    operation: DatabaseOperations,
    data?: any,
    contextId?: string
  ): Promise<any> {
    let result;
    switch (operation) {
      case "generateEmbedding":
        if (!data?.text) throw new Error("text required for generateEmbedding");
        result = await embeddingHelper.generate(data.text);
        break;

      case "semanticSearch":
        if (!data?.query) throw new Error("query required for semanticSearch");
        if (!data?.embeddings)
          throw new Error("embeddings required for semanticSearch");

        const queryEmbedding = await embeddingHelper.generate(data.query);
        result = embeddingHelper.cosineSimilarity(
          queryEmbedding,
          data.embeddings,
          data.limit || 10
        );
        break;

      default:
        throw new Error(`Unknown embedding operation: ${operation}`);
    }

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
        const { operation } = request.payload;
        const embeddingOperations = ["generateEmbedding", "semanticSearch"];

        if (embeddingOperations.includes(operation)) {
          (async () => {
            try {
              const { operation, data, contextId } = request.payload;

              // console.log("🔍 DB operation:", operation, { data, contextId });

              const result = await this.handleOperation(
                operation,
                data,
                contextId
              );
              sendResponse({ result });
            } catch (error) {
              logger.error("❌ DB operation failed:", error);
              sendResponse({
                error: error instanceof Error ? error.message : String(error),
              });
            }
          })();

          return true; // Keep message channel open for async response
        } else {
          // Let other db operations pass through to background script
          console.log(
            "🔄 Content script passing through to background script:",
            operation
          );
          return false;
        }
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

    // logger.log("📡 Database message handler initialized");

    // Return cleanup function
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  };

  return {
    handler,
    setupListener,
  };
}
