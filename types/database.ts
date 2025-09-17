import { DBSchema } from "idb";

// Define the database schema
export interface UrmindDB extends DBSchema {
  contexts: {
    key: string;
    value: {
      id: string;
      type: "text" | "url" | "artifact:document" | "artifact:image";
      title: string;
      description: string;
      summary: string;
      url?: string;
      image?: string;
      content?: string;
      createdAt: number;
      updatedAt: number;
    };
    indexes: {
      "by-type": string;
      "by-created": number;
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
  test: {
    key: number;
    value: {
      id: number;
      name: string;
    };
  };
}
