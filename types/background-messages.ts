/**
 * Type definitions for background script message handling
 */

export interface ContentScriptReadyPayload {
  url: string;
}

export interface NavigationDetectedPayload {
  url: string;
  pageMetadata: any;
}

export interface MessageResponse {
  success: boolean;
  error?: string;
}

export interface PendingPageIndexingJob {
  url: string;
  pageMetadata: any;
}
