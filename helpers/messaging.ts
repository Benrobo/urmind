import { BgScriptMessageHandlerActions } from "@/services/bgs-services/bg-message-handler";
import { MessageHandlerOperations } from "@/services/message-handler";
import { PageMetadata } from "@/services/page-extraction/extraction";
import { MessageResponse } from "@/types/background-messages";

interface BaseProps {
  action: BgScriptMessageHandlerActions;
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
    operation: MessageHandlerOperations;
    data?: any;
    contextId?: string;
  };
}

interface ContentScriptMessageOperation extends BaseProps {
  payload: {
    operation: MessageHandlerOperations;
    data?: any;
  };
}

interface PageMetadataExtractionMessage extends BaseProps {
  action: "page-metadata-extraction";
  payload: {
    pageMetadata: PageMetadata;
  };
}

export function sendMessageToBackgroundScript(
  message:
    | NavigationDetectedMessage
    | OpenOptionsPageMessage
    | DBOperationMessage
    | ContentScriptReadyMessage
    | PageMetadataExtractionMessage
) {
  chrome.runtime.sendMessage(message);
}

/**
 * Send message to content script
 */
export function sendMessageToContentScript(
  tabId: number,
  message: ContentScriptMessageOperation
) {
  chrome.tabs.sendMessage(tabId, message);
}

/**
 * Send message to background script and wait for response
 */
export function sendMessageToBackgroundScriptWithResponse(
  message: DBOperationMessage
): Promise<MessageResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Send database operation message to a specific tab's content script
 * This is used by the background script to communicate with content scripts
 */
export function sendMessageToContentScriptWithResponse(
  tabId: number,
  operation: MessageHandlerOperations,
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
