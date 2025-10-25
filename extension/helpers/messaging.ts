import { BgScriptMessageHandlerActions } from "@/services/bgs-services/bg-message-handler";
import {
  ClientScriptOperations,
  BgScriptMessageHandlerOperations,
} from "@/services/cs-message-handler";
import { PageMetadata } from "@/services/page-extraction/extraction";
import { SaveToUrMindPayload } from "@/triggers/save-to-urmind";
import { MessageResponse } from "@/types/background-messages";

interface BaseProps {
  action: BgScriptMessageHandlerActions;
  payload?: Record<string, any>;
  responseRequired?: boolean;
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

interface OpenPopupMessage extends BaseProps {
  action: "openPopup";
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
    operation: BgScriptMessageHandlerOperations;
    data?: any;
    contextId?: string;
  };
}

interface PageMetadataExtractionMessage extends BaseProps {
  action: "page-metadata-extraction";
  payload: {
    pageMetadata: PageMetadata;
  };
}

interface SaveToUrMindMessage extends BaseProps {
  action: "save-to-urmind";
  payload: SaveToUrMindPayload;
}

interface ManualIndexPageMessage extends BaseProps {
  action: "manual-index-page";
  payload: {
    pageMetadata: PageMetadata;
  };
}

interface ClientScriptMessageOperation extends BaseProps {
  action: "client-operation";
  payload: {
    operation: ClientScriptOperations;
    data?: any;
  };
}

export function sendMessageToBackgroundScript(
  message:
    | NavigationDetectedMessage
    | OpenOptionsPageMessage
    | OpenPopupMessage
    | DBOperationMessage
    | ContentScriptReadyMessage
    | SaveToUrMindMessage
    | ManualIndexPageMessage
) {
  chrome.runtime.sendMessage({
    action: message.action,
    payload: message.payload,
    responseRequired: message.responseRequired ?? true,
  });
}

/**
 * Send message to content script
 */
export function sendMessageToContentScript(
  tabId: number,
  message: ClientScriptMessageOperation
) {
  chrome.tabs.sendMessage(tabId, message);
}

/**
 * Send message to background script and wait for response
 */
export function sendMessageToBackgroundScriptWithResponse(
  message: DBOperationMessage | SaveToUrMindMessage
): Promise<MessageResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        ...message,
        responseRequired: message.responseRequired ?? true,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      }
    );
  });
}

/**
 * Send database operation message to a specific tab's content script
 * This is used by the background script to communicate with content scripts
 */
export function sendMessageToContentScriptWithResponse(
  tabId: number,
  operation: ClientScriptOperations,
  data?: any
): Promise<any> {
  return new Promise((resolve, reject) => {
    const message: ClientScriptMessageOperation = {
      action: "client-operation",
      payload: { operation, data },
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
