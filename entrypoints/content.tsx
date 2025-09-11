import { browser } from "wxt/browser";
import { defineContentScript } from "wxt/utils/define-content-script";

export default defineContentScript({
  matches: ["https://en.wikipedia.org/*"],
  main() {
    console.log("Hello content.");

    // Example: Open sidepanel when user clicks a specific element
    document.addEventListener("click", async (event) => {
      try {
        await browser.runtime.sendMessage({ action: "openSidePanel" });
      } catch (error) {
        console.log("Could not open sidepanel:", error);
      }
    });
  },
});
