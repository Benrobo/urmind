//============== CONTENT SCRIPT ONLY =============//
/**To be used in content script only */

import logger from "@/lib/logger";
import pageExtractionService from "./page-extraction/extraction";

// Define operations that are meant to be handled by the content script (client side)
export type ClientScriptOperations = "page-metadata-extraction";

// Define operations that are meant to be handled by the background script (database operations)
export type BgScriptOperations =
  | "semanticSearch"
  | "semanticSearchDeepResearch"
  | "getAllConversations"
  | "getAllContexts"
  | "getAllContextCategories"
  | "getContextsByCategory"
  | "deleteContext"
  | "deleteContextsByCategory"
  | "deleteCategory"
  | "updateCategory"
  | "createCategory"
  | "createConversation"
  | "updateMessageInConversation"
  | "updateMessageContent"
  | "appendMessageToConversation"
  | "appendMessagesToConversation"
  | "updateMessageContextIds"
  | "deleteMessage"
  | "deleteConversation";

// Union of all operations
export type BgScriptMessageHandlerOperations =
  | ClientScriptOperations
  | BgScriptOperations;

type HandleOperationPayload = { operation: ClientScriptOperations; data?: any };

/**
 *  operation handler for content script message listeners
 * Handles embedding model operations that require content script access
 */
export class MessageHandler {
  /**
   * Handle a database operation message from background script
   */
  async handleOperation(payload: HandleOperationPayload): Promise<any> {
    console.log("🔍 Content script handling operation:", payload.operation);
    let result;
    switch (payload.operation) {
      case "page-metadata-extraction":
        result = await pageExtractionService.extractPageMetadata();
        console.log("📄 Content script extracted page metadata:", result);
        break;

      default:
        throw new Error(`Unknown client operation: ${payload.operation}`);
    }

    return result;
  }

  createMessageListener() {
    return (
      request: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      console.log("🔍 Content script message listener:", request);
      (async () => {
        try {
          const { action, payload, responseRequired } = request as {
            action: "client-operation";
            payload: HandleOperationPayload;
            responseRequired: boolean;
          };

          const result = await this.handleOperation(payload);
          sendResponse({ result });
        } catch (error) {
          logger.error("❌ Client message handler error:", error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })();
      return true;
    };
  }
}

/**
 * Hook to set up client message handling in content script
 */
export function useMessageHandler() {
  const handler = new MessageHandler();

  // Set up the message listener
  const setupListener = () => {
    const listener = handler.createMessageListener();
    chrome.runtime.onMessage.addListener(listener);

    // Return cleanup function
    // return () => {
    //   chrome.runtime.onMessage.removeListener(listener);
    // };
  };

  return {
    handler,
    setupListener,
  };
}
