export type ContextMenuAction = 
  | "save-to-urmind"
  | "ask-urmind"
  | "summarize-text"
  | "add-to-collection"
  | "highlight-important";

export interface ContextMenuData {
  text: string;
  url: string;
  title: string;
  selectionStart?: number;
  selectionEnd?: number;
}

export interface ContextMenuMessage {
  action: ContextMenuAction;
  data: ContextMenuData;
}

export interface ContextMenuHandler {
  action: ContextMenuAction;
  title: string;
  handler: (data: ContextMenuData, tab: chrome.tabs.Tab) => Promise<void>;
}
