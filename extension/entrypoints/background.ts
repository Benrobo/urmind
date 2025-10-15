import { defineBackground } from "wxt/utils/define-background";
import { BackgroundMessageHandler } from "@/services/bgs-services/bg-message-handler";
import { OmniboxHandler } from "@/services/bgs-services/omnibox-handler";
import { ContextMenuService } from "@/services/context-menu.service";
import { initDb } from "@/services/db";
import { INVALID_TAB_URLS } from "@/constant/internal";
import { tabTimingService } from "@/services/tab-timing.service";
import { activityManagerStore } from "@/store/activity-manager.store";
import { pageIndexerQueue } from "@/triggers/page-indexer";
import { saveToUrmindQueue } from "@/triggers/save-to-urmind";

export default defineBackground(async () => {
  console.log("🚀 Background script loaded");

  // Initialize services
  const messageHandler = new BackgroundMessageHandler();
  const omniboxHandler = new OmniboxHandler();
  const contextMenuService = ContextMenuService.getInstance();

  // Start tab timing service for delayed indexing
  await tabTimingService.start();

  // Initialize omnibox handling
  omniboxHandler.init();

  // Initialize context menu
  await contextMenuService.createContextMenus();

  await initDb();

  // Set up message handling
  chrome.runtime.onMessage.addListener(messageHandler.createMessageListener());

  chrome.tabs.onRemoved.addListener((tabId) => {
    messageHandler.cleanupTab(tabId);
  });

  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (
      changeInfo.status === "complete" &&
      tab.url &&
      !INVALID_TAB_URLS.includes(tab.url)
    ) {
      await tabTimingService.handleTabUpdated(tabId, tab.url);
      // logger.warn(`Tab updated: ${tabId}, ${tab.url}`);
    }
  });

  chrome.tabs.onRemoved.addListener(async (tabId) => {
    await tabTimingService.handleTabRemoved(tabId);
  });

  await activityManagerStore.cleanupOldActivities();

  // Clean up old queue items
  await pageIndexerQueue.cleanupOldItems();
  await saveToUrmindQueue.cleanupOldItems();

  // Set up context menu click handling
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (tab) {
      contextMenuService.handleContextMenuClick(info, tab);
    }
  });
});
