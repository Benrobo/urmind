export type ContextType =
  | "text"
  | "url"
  | "artifact:web-page"
  | "artifact:document"
  | "artifact:image";

export type Context = {
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
};

export type UrmindTools = "tool-searchContexts" | "tool-addToContexts";
