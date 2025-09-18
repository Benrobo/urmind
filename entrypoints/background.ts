import { defineBackground } from "wxt/utils/define-background";
import { BackgroundMessageHandler } from "@/services/bgs-services/bg-message-handler";
import { OmniboxHandler } from "@/services/bgs-services/omnibox-handler";

export default defineBackground(() => {
  console.log("🚀 Background script loaded");

  // Initialize services
  const messageHandler = new BackgroundMessageHandler();
  const omniboxHandler = new OmniboxHandler();

  // Set up message handling
  chrome.runtime.onMessage.addListener(messageHandler.createMessageListener());

  chrome.tabs.onRemoved.addListener((tabId) => {
    messageHandler.cleanupTab(tabId);
  });

  // Initialize omnibox handling
  omniboxHandler.init();

  console.log("✅ Background script initialization complete");
});
