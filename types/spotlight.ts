export type AssistantResponseType =
  | "step-start"
  | "text"
  | "tool-searchContexts"
  | "tool-addToContexts"
  | "step-end";

export type AssistantResponseState =
  | "done"
  | "input-available"
  | "output-streaming"
  | "output-error"
  | "output-available";

type ResponseMessage = {
  type: AssistantResponseType;
  text?: string;
  output?: Record<string, any>;
  toolId?: string;
  content?: string;
  state?: AssistantResponseState;
  input?: Record<string, any>;
};

export type SpotlightConversations = {
  id: string;
  messages: Array<{
    id: string;
    role: "assistant" | "user";
    parts: ResponseMessage[];
  }>;
};
