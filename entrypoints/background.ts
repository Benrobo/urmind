import { defineBackground } from "wxt/utils/define-background";
import { BackgroundMessageHandler } from "@/services/bgs-services/bg-message-handler";
import { OmniboxHandler } from "@/services/bgs-services/omnibox-handler";
import { ContextMenuService } from "@/services/context-menu.service";
import { initDb } from "@/services/db";

export default defineBackground(async () => {
  console.log("🚀 Background script loaded");

  // * Leaving this here for future reference when we need to track how long users spent on a tab to further decide if that page is worth indexing or not.
  // chrome.tabs.onActivated.addListener((activeInfo) => {
  //   console.log("Tab activated:", activeInfo.tabId);
  //   // You can get tab details if needed:
  //   chrome.tabs.get(activeInfo.tabId, (tab) => {
  //     console.log("Active tab info:", tab);
  //   });
  // });

  // chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  //   if (changeInfo.status === "complete") {
  //     console.log("Tab updated:", tabId, tab.url);
  //   }
  // });

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
