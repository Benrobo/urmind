export type ContextType =
  | "text"
  | "url"
  | "artifact:web-page"
  | "artifact:document"
  | "artifact:image";

export type Context = {
  id: string;
  fingerprint: string;
  contentFingerprint: string; // prevent processing the same content multiple times
  category: string;
  type: ContextType;
  title: string;
  description: string;
  highlightText: string; // Legacy field for backwards compatibility
  highlightElements: Array<{
    xpath: string;
    position: { x: number; y: number; width: number; height: number };
  }>; // New field: Array of DOM elements with XPath and position for precise highlighting
  summary: string;
  url: string | null;
  fullUrl: string | null;
  image: string | null;
  favicon: string | null;
};

export type UrmindTools = "tool-searchContexts" | "tool-addToContexts";
