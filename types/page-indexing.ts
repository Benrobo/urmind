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
