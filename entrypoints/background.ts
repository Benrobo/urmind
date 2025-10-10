import { defineBackground } from "wxt/utils/define-background";
import { BackgroundMessageHandler } from "@/services/bgs-services/bg-message-handler";
import { OmniboxHandler } from "@/services/bgs-services/omnibox-handler";
import { ContextMenuService } from "@/services/context-menu.service";
import { initDb } from "@/services/db";
import { INVALID_TAB_URLS } from "@/constant/internal";
import { tabTimingService } from "@/services/tab-timing.service";

export default defineBackground(async () => {
  console.log("🚀 Background script loaded");

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

  await initDb();

  // Initialize services
  const messageHandler = new BackgroundMessageHandler();
  const omniboxHandler = new OmniboxHandler();
  const contextMenuService = ContextMenuService.getInstance();

  // Set up message handling
  chrome.runtime.onMessage.addListener(messageHandler.createMessageListener());

  chrome.tabs.onRemoved.addListener((tabId) => {
    messageHandler.cleanupTab(tabId);
  });

  // Start tab timing service for delayed indexing
  await tabTimingService.start();

  // Initialize omnibox handling
  omniboxHandler.init();

  // Initialize context menu
  await contextMenuService.createContextMenus();

  // Set up context menu click handling
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (tab) {
      contextMenuService.handleContextMenuClick(info, tab);
    }
  });

  console.log("✅ Background script initialization complete");
});
