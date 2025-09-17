import pageIndexerJob from "@/triggers/page-indexer";
import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";

function handleOmniboxInput() {
  chrome.omnibox.onInputEntered.addListener((text) => {
    console.log("Omnibox entered with text:", text);

    try {
      chrome.runtime.openOptionsPage(() => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error opening options page:",
            chrome.runtime.lastError
          );
          // Fallback: open options page manually
          chrome.tabs.create({
            url: chrome.runtime.getURL("options.html"),
          });
        }
      });
    } catch (error) {
      console.error("Error in omnibox handler:", error);
      chrome.tabs.create({
        url: chrome.runtime.getURL("options.html"),
      });
    }
  });

  chrome.omnibox.onInputChanged.addListener((text, suggest) => {
    suggest([
      {
        content: "options",
        description: "Open Urmind - Press Enter",
      },
    ]);
  });
}

export default defineBackground(async () => {
  console.log("Background script loaded");

  chrome.runtime.onMessage.addListener(
    async (request, sender, sendResponse) => {
      if (request.action === "openOptionsPage") {
        chrome.runtime.openOptionsPage(() => {
          if (chrome.runtime.lastError) {
            chrome.tabs.create({
              url: chrome.runtime.getURL("options.html"),
            });
          }
          sendResponse({ success: true });
        });
        return true; // Keep message channel open for async response
      }

      if (request.action === "navigation-detected") {
        await pageIndexerJob.trigger({
          url: request.payload.url,
          pageMetadata: request.payload.pageMetadata,
        });
      }
    }
  );

  handleOmniboxInput();
});
