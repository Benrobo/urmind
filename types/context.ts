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
  highlightText: string;
  summary: string;
  url: string | null;
  image: string | null;
  favicon: string | null;
};

export type UrmindTools = "tool-searchContexts" | "tool-addToContexts";
