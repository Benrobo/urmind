import { sendMessageToBackgroundScriptWithResponse } from "@/helpers/messaging";

export class ContextMenuService {
  private static instance: ContextMenuService;

  private constructor() {}

  public static getInstance(): ContextMenuService {
    if (!ContextMenuService.instance) {
      ContextMenuService.instance = new ContextMenuService();
    }
    return ContextMenuService.instance;
  }

  public async createContextMenus(): Promise<void> {
    // Clear existing menus
    await chrome.contextMenus.removeAll();

    // Create simple "Save to UrMind" menu item
    await chrome.contextMenus.create({
      id: "save-to-urmind",
      title: "Add me to your mind daddy 😉",
      contexts: ["selection", "image", "link"],
      documentUrlPatterns: ["<all_urls>"],
    });
  }

  public async handleContextMenuClick(
    info: chrome.contextMenus.OnClickData,
    tab: chrome.tabs.Tab
  ): Promise<void> {
    if (info.menuItemId === "save-to-urmind" && info.selectionText) {
      await this.handleSaveToUrMind(info.selectionText, tab);
    }
  }

  private async handleSaveToUrMind(
    selectedText: string,
    tab: chrome.tabs.Tab
  ): Promise<void> {
    try {
      // For now, just log the action - you can expand this later
      console.log("Saving to UrMind:", {
        text: selectedText,
        url: tab.url,
        title: tab.title,
      });

      // TODO: Implement actual saving to database
      // await sendMessageToBackgroundScriptWithResponse({
      //   action: "db-operation",
      //   payload: {
      //     operation: "createContext",
      //     data: {
      //       content: selectedText,
      //       url: tab.url,
      //       title: tab.title,
      //       type: "highlight",
      //       summary: this.generateSummary(selectedText),
      //       createdAt: Date.now()
      //     }
      //   }
      // });

      // Show success notification
      this.showNotification(
        "Saved to UrMind",
        "Text has been saved to your memory"
      );
    } catch (error) {
      console.error("Failed to save to UrMind:", error);
      this.showNotification("Error", "Failed to save to UrMind");
    }
  }

  private showNotification(title: string, message: string): void {
    // You can implement a toast notification system here
    console.log(`${title}: ${message}`);
  }
}
