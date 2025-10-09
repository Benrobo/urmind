import { tabTimingStore, TabTimingData } from "@/store/tab-timing.store";
import { INVALID_TAB_URLS } from "@/constant/internal";
import {
  sendMessageToContentScript,
  sendMessageToContentScriptWithResponse,
} from "@/helpers/messaging";
import { PageMetadata } from "@/services/page-extraction/extraction";
import { preferencesStore } from "@/store/preferences.store";
import dayjs from "dayjs";
import logger from "@/lib/logger";
import pageIndexerJob from "@/triggers/page-indexer";

export class TabTimingService {
  private checkInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn("Tab timing service is already running");
      return;
    }

    this.isRunning = true;
    logger.warn("🕐 Starting tab timing service");

    // Check immediately
    await this.checkTabsForIndexing();

    this.checkInterval = setInterval(() => {
      this.checkTabsForIndexing();
    }, 30 * 1000); // 30 seconds
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    logger.warn("🛑 Tab timing service stopped");
  }

  async handleTabUpdated(tabId: number, url: string): Promise<void> {
    try {
      // Only track valid URLs
      if (url && !INVALID_TAB_URLS.includes(url)) {
        // Extract page metadata first, then add tab with metadata
        const pageMetadata = await this.extractPageMetadata(tabId);
        if (pageMetadata) {
          await tabTimingStore.addTab(tabId, url, pageMetadata);
          logger.warn(`📄 Tab ${tabId} updated with URL: ${url}`);
        } else {
          logger.warn(
            `⚠️ Failed to extract page metadata for tab ${tabId}, skipping tracking`
          );
        }
      }
    } catch (error) {
      logger.error("❌ Error handling tab update:", error);
    }
  }

  async handleTabRemoved(tabId: number): Promise<void> {
    try {
      await tabTimingStore.removeTab(tabId);
      logger.log(`🗑️ Tab ${tabId} removed`);
    } catch (error) {
      logger.error("❌ Error handling tab removal:", error);
    }
  }

  private async checkTabsForIndexing(): Promise<void> {
    try {
      const readyTabs = await tabTimingStore.getTabsReadyForIndexing();

      if (readyTabs.length > 0) {
        logger.info(`🔍 Found ${readyTabs.length} tabs ready for indexing`);

        for (const tab of readyTabs) {
          await this.triggerPageIndexing(tab);
        }
      } else {
        logger.log("🔍 No tabs ready for indexing");
      }
    } catch (error) {
      logger.error("❌ Error checking tabs for indexing:", error);
    }
  }

  private async extractPageMetadata(
    tabId: number
  ): Promise<PageMetadata | null> {
    try {
      const response = (await sendMessageToContentScriptWithResponse(
        tabId,
        "page-metadata-extraction"
      )) as PageMetadata;

      if (response) return response;
      else {
        logger.warn(`⚠️ No page metadata received for tab ${tabId}`);
        return null;
      }
    } catch (error) {
      logger.error(
        `❌ Failed to extract page metadata for tab ${tabId}:`,
        error
      );
      return null;
    }
  }

  private async triggerPageIndexing(tab: TabTimingData): Promise<void> {
    try {
      logger.warn(
        `🚀 Triggering page indexing for tab ${tab.tabId}: ${tab.url}`
      );

      // Use stored page metadata to trigger page indexer directly
      await this.triggerPageIndexerWithMetadata(tab);

      // Remove the tab from tracking since we've triggered indexing
      await tabTimingStore.removeTab(tab.tabId);

      logger.warn(`✅ Page indexing triggered for tab ${tab.tabId}`);
    } catch (error) {
      logger.error(
        `❌ Failed to trigger page indexing for tab ${tab.tabId}:`,
        error
      );
    }
  }

  private async triggerPageIndexerWithMetadata(
    tab: TabTimingData
  ): Promise<void> {
    try {
      await pageIndexerJob.trigger({
        url: tab.url,
        pageMetadata: tab.pageMetadata,
        tabId: tab.tabId,
      });
    } catch (error) {
      logger.error(
        `❌ Failed to trigger page indexer for tab ${tab.tabId}:`,
        error
      );
    }
  }

  async getTabStats(): Promise<{
    totalTabs: number;
    readyForIndexing: number;
  }> {
    try {
      const allTabs = await tabTimingStore.get();
      const readyTabs = await tabTimingStore.getTabsReadyForIndexing();

      return {
        totalTabs: allTabs.length,
        readyForIndexing: readyTabs.length,
      };
    } catch (error) {
      logger.error("❌ Error getting tab stats:", error);
      return { totalTabs: 0, readyForIndexing: 0 };
    }
  }
}

export const tabTimingService = new TabTimingService();
