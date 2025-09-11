import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";

export default defineBackground(() => {
  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  // Handle messages from content scripts to open sidepanel
  browser.runtime.onMessage.addListener(async (message, sender) => {
    console.log("Received message:", message);
    if (message.action === "openSidePanel" && sender.tab?.id) {
      try {
        await browser.sidePanel.open({ tabId: sender.tab.id });
      } catch (error) {
        console.log("Failed to open sidepanel:", error);
      }
    }
  });

  browser.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    if (!tab.url) return;

    await browser.sidePanel.setOptions({
      tabId,
      path: "/sidepanel.html",
      enabled: true,
    });
  });
});
