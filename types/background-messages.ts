/**
 * Type definitions for background script message handling
 */

import { PageMetadata } from "@/services/page-extraction/extraction";

export interface ContentScriptReadyPayload {
  url: string;
}

export interface NavigationDetectedPayload {
  url: string;
  pageMetadata: PageMetadata;
}

export interface MessageResponse {
  success: boolean;
  error?: string;
  result?: unknown;
}

export interface PendingPageIndexingJob {
  url: string;
  pageMetadata: any;
}
