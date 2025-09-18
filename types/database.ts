import { DBSchema } from "idb";
import { ContextType } from "./context";

// Define the database schema
export interface UrmindDB extends DBSchema {
  contexts: {
    key: string;
    value: {
      id: string;
      fingerprint: string;
      category: string;
      type: ContextType;
      title: string;
      description: string;
      content: string | null;
      summary: string;
      url: string | null;
      image: string | null;
      favicon: string | null;
      createdAt: number;
      updatedAt: number;
    };
    indexes: {
      "by-type": string;
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
        parts: Array<{
          type: string;
          text?: string;
          output?: Record<string, any>;
          toolId?: string;
          content?: string;
          state?: string;
          input?: Record<string, any>;
        }>;
      }>;
      createdAt: number;
      updatedAt: number;
    };
    indexes: {
      "by-created": number;
    };
  };
}
