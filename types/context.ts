export type ContextType =
  | "text"
  | "raw-text" // text pasted directly into the board.
  | "url"
  | "artifact:web-page"
  | "artifact:document"
  | "artifact:image";

export type ContextCategory = {
  slug: string;
  label: string;
  createdAt: number;
  updatedAt: number;
};

export type Context = {
  id: string;
  fingerprint: string;
  contentFingerprint: string; // prevent processing the same content multiple times
  categorySlug: string; // reference to context_categories.slug
  type: ContextType;
  title: string;
  description: string;
  summary: string;
  og: {
    title: string | null;
    description: string | null;
    image: string | null;
    favicon: string | null;
  };
  highlightText: string; // Legacy field for backwards compatibility
  highlightElements: Array<{
    xpath: string;
    position: { x: number; y: number; width: number; height: number };
  }>; // New field: Array of DOM elements with XPath and position for precise highlighting
  url: string | null;
  fullUrl: string | null;
  image: string | null;
};

export type UrmindTools = "tool-searchContexts" | "tool-addToContexts";

export type SavedContext = Context & { createdAt: number; updatedAt: number };
