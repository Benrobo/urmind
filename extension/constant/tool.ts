export const UrmindTools = [
  {
    id: "search-contexts",
    type: "tool-searchContexts",
    description: "Search for relevant contexts in your memory",
    input: {
      queries: ["string"],
    },
    output: {
      results: [
        {
          contextId: "string",
          relevance: "number",
        },
      ],
      count: "number",
    },
  },
  {
    id: "addToContexts",
    type: "tool-addToContexts",
    description: "Add a new context to your memory",
    input: {
      context: {
        id: "string",
        type: "string",
        title: "string",
        description: "string",
        summary: "string",
      },
    },
    output: {
      success: "boolean",
    },
  },
];
