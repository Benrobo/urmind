export type PageIndexerResponse = {
  context: {
    category: {
      label: string;
      slug: string;
    };
    title: string;
    description: string;
    summary: string;
    rawContent: string;
  } | null;
  retentionDecision: {
    keep: boolean;
    reason: string;
  };
};

export type DOMPageIndexerResponse = {
  context: {
    category: {
      label: string;
      slug: string;
    };
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
