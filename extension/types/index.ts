export type AILanguageModelPromptInput =
  | string
  | AILanguageModelPrompt
  | AILanguageModelPrompt[];

export interface AILanguageModelPrompt {
  role: AILanguageModelPromptRole;
  content: string;
}

export type AILanguageModelPromptRole = "system" | "user" | "assistant";
