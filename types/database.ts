import { DBSchema } from "idb";
import { ContextType } from "./context";

// Define the database schema
export interface UrmindDB extends DBSchema {
  contexts: {
    key: string;
    value: {
      id: string;
      fingerprint: string;
      contentFingerprint: string;
      category: string;
      type: ContextType;
      title: string;
      description: string;
      summary: string;
      highlightText: string; // Legacy field for backwards compatibility
      highlightElements: Array<{
        xpath: string;
        position: { x: number; y: number; width: number; height: number };
      }>; // New field: Array of DOM elements with XPath and position for precise highlighting
      url: string | null;
      fullUrl: string | null;
      image: string | null;
      favicon: string | null;
      createdAt: number;
      updatedAt: number;
    };
    indexes: {
      "by-id": string;
      "by-type": string;
      "by-content-fingerprint": string;
      "by-created": number;
      "by-fingerprint": string;
      "by-category": string;
    };
  };
  embeddings: {
    key: string;
    value: {
      id: string;
      vector: number[];
      metadata: Record<string, any>;
    };
    indexes: {
      "by-id": string;
      "by-metadata": string;
    };
  };
  conversations: {
    key: string;
    value: {
      id: string;
      messages: Array<{
        id: string;
        role: "assistant" | "user";

        // V1.0
        // parts: Array<{
        //   type: string;
        //   text?: string;
        //   output?: Record<string, any>;
        //   toolId?: string;
        //   content?: string;
        //   state?: string;
        //   input?: Record<string, any>;
        // }>;

        // V2.0
        content: string;
      }>;
      createdAt: number;
      updatedAt: number;
    };
    indexes: {
      "by-id": string;
      "by-created": number;
    };
  };
}
