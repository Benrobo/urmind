import {
  sendMessageToBackgroundScript,
  sendMessageToBackgroundScriptWithResponse,
} from "@/helpers/messaging";
import saveToUrMindJob from "@/triggers/save-to-urmind";

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
    chrome.contextMenus.create({
      id: "save-to-urmind",
      title: "Add to your mind.",
      contexts: ["selection", "image", "link"],
      documentUrlPatterns: ["<all_urls>"],
    });
  }

  public async handleContextMenuClick(
    info: chrome.contextMenus.OnClickData,
    tab: chrome.tabs.Tab
  ): Promise<void> {
    switch (info.menuItemId) {
      case "save-to-urmind":
        if (info.selectionText && !info.srcUrl) {
          await this.handleSaveToUrMind({
            selectedText: info.selectionText,
            tab,
            type: "text",
          });
        } else if (info.mediaType === "image") {
          await this.handleSaveToUrMind({
            srcUrl: info.srcUrl,
            tab,
            type: "image",
          });
        } else if (info.linkUrl) {
          await this.handleSaveToUrMind({
            linkUrl: info.linkUrl,
            tab,
            type: "link",
          });
        }
        break;
      default:
        break;
    }
  }

  private async handleSaveToUrMind(props: {
    selectedText?: string;
    srcUrl?: string;
    linkUrl?: string;
    tab: chrome.tabs.Tab;
    type?: "image" | "text" | "link";
  }): Promise<void> {
    try {
      await saveToUrMindJob.trigger({
        type: props.type || "text",
        url: props.tab.url!,
        selectedText: props.selectedText,
        tabId: props.tab.id || 0,
        srcUrl: props.srcUrl,
        linkUrl: props.linkUrl,
        source: "web-page", // Images from context menu are web-sourced
      });

      // Show success notification
      // this.showNotification(
      //   "Saved to UrMind",
      //   "Text has been saved to your memory"
      // );
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
