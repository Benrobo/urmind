/**
 * Handles Chrome omnibox integration for the extension
 */
export class OmniboxHandler {
  /**
   * Initialize omnibox listeners
   */
  init(): void {
    this.setupInputEntered();
    this.setupInputChanged();
  }

  /**
   * Handle when user presses Enter in omnibox
   */
  private setupInputEntered(): void {
    chrome.omnibox.onInputEntered.addListener((text) => {
      console.log("🔍 Omnibox entered with text:", text);
      this.openOptionsPage();
    });
  }

  /**
   * Handle input changes in omnibox (for suggestions)
   */
  private setupInputChanged(): void {
    chrome.omnibox.onInputChanged.addListener((text, suggest) => {
      suggest([
        {
          content: "options",
          description: "Open Urmind - Press Enter",
        },
      ]);
    });
  }

  /**
   * Open the options page with fallback handling
   */
  private openOptionsPage(): void {
    try {
      chrome.runtime.openOptionsPage(() => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error opening options page:",
            chrome.runtime.lastError
          );
          // Fallback: open options page manually
          this.createOptionsTab();
        }
      });
    } catch (error) {
      console.error("Error in omnibox handler:", error);
      this.createOptionsTab();
    }
  }

  /**
   * Create options tab as fallback
   */
  private createOptionsTab(): void {
    chrome.tabs.create({
      url: chrome.runtime.getURL("options.html"),
    });
  }
}
