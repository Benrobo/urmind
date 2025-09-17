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

export default defineBackground(() => {
  console.log("Background script loaded");

  handleOmniboxInput();
});
