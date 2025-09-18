import { PageMetadata } from "@/services/page-extraction/extraction";

interface BaseProps {
  action:
    | "navigation-detected"
    | "openOptionsPage"
    | "db-operation"
    | "content-script-ready";
  payload?: Record<string, any>;
}

interface NavigationDetectedMessage extends BaseProps {
  action: "navigation-detected";
  payload: {
    url: string;
    pageMetadata: PageMetadata;
  };
}

interface OpenOptionsPageMessage extends BaseProps {
  action: "openOptionsPage";
}

type DatabaseOperation =
  | "createContext"
  | "getContext"
  | "getAllContexts"
  | "updateContext"
  | "deleteContext"
  | "getAllContextCategories"
  | "getContextsByType"
  | "getContextByFingerprint";

interface ContentScriptReadyMessage extends BaseProps {
  action: "content-script-ready";
  payload: {
    tabId: number;
    url: string;
  };
}

interface DBOperationMessage extends BaseProps {
  action: "db-operation";
  payload: {
    operation: DatabaseOperation;
    data?: any;
    contextId?: string;
  };
}

export function sendMessageToBackgroundScript(
  message:
    | NavigationDetectedMessage
    | OpenOptionsPageMessage
    | DBOperationMessage
    | ContentScriptReadyMessage
) {
  chrome.runtime.sendMessage(message);
}

export function sendDBOperationMessage(
  operation: DatabaseOperation,
  data?: any,
  contextId?: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const message: DBOperationMessage = {
      action: "db-operation",
      payload: { operation, data, contextId },
    };

    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (response?.error) {
        reject(new Error(response.error));
      } else {
        resolve(response?.result);
      }
    });
  });
}

/**
 * Send database operation message to a specific tab's content script
 * This is used by the background script to communicate with content scripts
 */
export function sendDBOperationMessageToTab(
  tabId: number,
  operation: DatabaseOperation,
  data?: any,
  contextId?: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const message: DBOperationMessage = {
      action: "db-operation",
      payload: { operation, data, contextId },
    };

    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (response?.error) {
        reject(new Error(response.error));
      } else {
        resolve(response?.result);
      }
    });
  });
}
