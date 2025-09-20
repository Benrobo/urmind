export type PageIndexerResponse = {
  context: {
    category: string;
    title: string;
    description: string;
    summary: string;
  } | null;
  retentionDecision: {
    keep: boolean;
    reason: string;
  };
};

export type DOMPageIndexerResponse = {
  context: {
    category: string;
    title: string;
    description: string;
    summary: string;
    highlights: string[]; // Array of element IDs that LLM selects for highlighting
  } | null;
  retentionDecision: {
    keep: boolean;
    reason: string;
  };
};
