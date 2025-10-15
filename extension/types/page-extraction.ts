import { ContextualTextElementTypes } from "@/constant/page-extraction";

// Elements that are not interactive/clickable and are suitable for use as context (e.g., excludes img, input, button, etc.)
export interface ContextualTextElement {
  id: string;
  type: (typeof ContextualTextElementTypes)[number];
  text: string | null;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  selectors: Array<{
    type: "id" | "xpath" | "tag";
    value: string;
  }>;
}
