import logger from "@/lib/logger";
import pageIndexerJob from "@/triggers/page-indexer";
import urmindDb from "@/services/db";
import type {
  ContentScriptReadyPayload,
  NavigationDetectedPayload,
  MessageResponse,
  PendingPageIndexingJob,
} from "@/types/background-messages";

/**
 * Manages content script readiness and page indexing job queuing
 */
export class BackgroundMessageHandler {
  private readyContentScripts = new Set<number>();
  private pendingPageIndexingJobs = new Map<
    number,
    Array<PendingPageIndexingJob>
  >();

  /**
   * Handle content script ready signal
   */
  async handleContentScriptReady(
    payload: ContentScriptReadyPayload,
    sender: chrome.runtime.MessageSender
  ): Promise<MessageResponse> {
    const tabId = sender.tab?.id;
    if (!tabId) {
      logger.warn("⚠️ Content script ready signal without tab ID");
      return { success: false };
    }

    logger.log("📡 Content script ready for tab:", tabId, payload.url);
    this.readyContentScripts.add(tabId);

    // Process any pending page indexing jobs for this tab
    const pendingJobs = this.pendingPageIndexingJobs.get(tabId) || [];
    for (const job of pendingJobs) {
      logger.log("🔄 Processing pending page indexing job for tab:", tabId);
      try {
        await pageIndexerJob.trigger({
          url: job.url,
          pageMetadata: job.pageMetadata,
          tabId: tabId,
        });
      } catch (error) {
        logger.error("Failed to process pending page indexing job:", error);
      }
    }
    this.pendingPageIndexingJobs.delete(tabId);

    return { success: true };
  }

  /**
   * Handle navigation detection
   */
  async handleNavigationDetected(
    payload: NavigationDetectedPayload,
    sender: chrome.runtime.MessageSender
  ): Promise<MessageResponse> {
    const tabId = sender.tab?.id;

    if (tabId && this.readyContentScripts.has(tabId)) {
      // Content script is ready, process immediately
      logger.log(
        "✅ Content script ready, processing navigation immediately for tab:",
        tabId
      );
      try {
        await pageIndexerJob.trigger({
          url: payload.url,
          pageMetadata: payload.pageMetadata,
          tabId: tabId,
        });
      } catch (error) {
        logger.error("Failed to process navigation-detected:", error);
      }
    } else {
      // Content script not ready yet, queue the job
      logger.log(
        "⏳ Content script not ready, queuing navigation job for tab:",
        tabId
      );

      // sometimes the page extraction metadata event get sent before
      // the content script is ready, so we need to check if the tabId is valid
      if (tabId) {
        if (!this.pendingPageIndexingJobs.has(tabId)) {
          this.pendingPageIndexingJobs.set(tabId, []);
        }
        this.pendingPageIndexingJobs.get(tabId)!.push({
          url: payload.url,
          pageMetadata: payload.pageMetadata,
        });
      }
    }

    return { success: true };
  }

  /**
   * Handle options page opening
   */
  async handleOpenOptionsPage(): Promise<MessageResponse> {
    return new Promise((resolve) => {
      chrome.runtime.openOptionsPage(() => {
        if (chrome.runtime.lastError) {
          chrome.tabs.create({
            url: chrome.runtime.getURL("options.html"),
          });
        }
        resolve({ success: true });
      });
    });
  }

  /**
   * Handle database operations
   */
  async handleDatabaseOperation(
    payload: any,
    tabId: number
  ): Promise<MessageResponse> {
    try {
      const { operation, data } = payload;
      logger.log("🔍 Handling database operation:", { operation, data });

      let result;

      switch (operation) {
        case "getAllConversations":
          if (!urmindDb.conversations) {
            throw new Error("Conversations service not available");
          }
          result = await urmindDb.conversations.getAllConversations();
          break;

        case "getAllContexts":
          if (!urmindDb.contexts) {
            throw new Error("Contexts service not available");
          }
          const contexts = await urmindDb.contexts.getAllContexts();
          result = data?.limit ? contexts.slice(0, data.limit) : contexts;
          break;

        case "semanticSearch":
          if (!urmindDb.embeddings) {
            throw new Error("Embeddings service not available");
          }
          result = await urmindDb.embeddings.semanticSearch(
            data.query,
            tabId,
            data.limit
          );
          break;

        case "createConversation":
          if (!urmindDb.conversations) {
            throw new Error("Conversations service not available");
          }
          result = await urmindDb.conversations.createConversation(data);
          break;

        case "appendMessageToConversation":
          if (!urmindDb.conversations) {
            throw new Error("Conversations service not available");
          }
          result = await urmindDb.conversations.appendMessageToConversation(
            data.conversationId,
            data.message
          );
          break;

        case "clearContexts":
          result = await urmindDb.clearContexts();
          break;

        case "clearEmbeddings":
          result = await urmindDb.clearEmbeddings();
          break;

        case "clearConversations":
          logger.log("🧹 Clearing conversations...");
          result = await urmindDb.clearConversations();
          logger.log("✅ Conversations cleared successfully");
          break;

        case "clearAllData":
          result = await urmindDb.clearAllData();
          break;

        default:
          throw new Error(`Unknown database operation: ${operation}`);
      }

      return { success: true, result };
    } catch (error) {
      logger.error("Database operation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Clean up when a tab is closed
   */
  cleanupTab(tabId: number): void {
    logger.log("🧹 Cleaning up for closed tab:", tabId);
    this.readyContentScripts.delete(tabId);
    this.pendingPageIndexingJobs.delete(tabId);
  }

  /**
   * Create the main message listener
   */
  createMessageListener() {
    return (
      request: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      (async () => {
        try {
          logger.log("📨 Received message:", request.action, request.payload);
          const tabId = sender.tab?.id!;
          let result: MessageResponse = { success: false };

          switch (request.action) {
            case "content-script-ready":
              result = await this.handleContentScriptReady(
                request.payload,
                sender
              );
              break;

            case "navigation-detected":
              result = await this.handleNavigationDetected(
                request.payload,
                sender
              );
              break;

            case "openOptionsPage":
              result = await this.handleOpenOptionsPage();
              break;

            case "db-operation":
              logger.log("📊 Processing db-operation:", request.payload);
              result = await this.handleDatabaseOperation(
                request.payload,
                tabId!
              );
              break;

            default:
              logger.warn("🤷‍♂️ Unknown action:", request.action);
              break;
          }
          sendResponse(result);
        } catch (error) {
          logger.error("❌ Background message handler error:", error);
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
