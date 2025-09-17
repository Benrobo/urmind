import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";

// background.ts
export default defineBackground(() => {
  console.log("Background script loaded");

  // Handle omnibox input
  chrome.omnibox.onInputEntered.addListener((text) => {
    console.log("Omnibox entered with text:", text);

    try {
      // Try to open options page
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
      // Fallback if openOptionsPage fails
      chrome.tabs.create({
        url: chrome.runtime.getURL("options.html"),
      });
    }
  });

  // Optional: Add input changed handler for suggestions
  chrome.omnibox.onInputChanged.addListener((text, suggest) => {
    suggest([
      {
        content: "options",
        description: "Open Urmind - Press Enter",
      },
    ]);
  });
});
