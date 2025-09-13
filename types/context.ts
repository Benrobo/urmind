export type ContextType =
  | "text"
  | "url"
  | "artifact:document"
  | "artifact:image";

export type Context = {
  id: string;
  type: ContextType;
  title: string;
  description: string;
  content?: string;
  summary: string;
  url?: string;
  image?: string;
};

export type UrmindTools = "tool-searchContexts" | "tool-addToContexts";
