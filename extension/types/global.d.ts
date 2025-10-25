export interface ChromeAIAssistantCapabilities {
  available: ChromeAICapabilityAvailability;
  defaultTemperature: number;
  defaultTopK: number;
  maxTopK: number;
}

export interface ChromeAIAssistantCreateOptions extends Record<string, any> {
  temperature?: number;
  topK?: number;
}

export interface ChromeAIAssistant {
  destroy: () => Promise<void>;
  prompt: (prompt: string) => Promise<string>;
  promptStreaming: (prompt: string) => ReadableStream<string>;
}

export interface ChromeAIAssistantFactory {
  capabilities: () => Promise<ChromeAIAssistantCapabilities>;
  create: (
    options?: ChromeAIAssistantCreateOptions
  ) => Promise<ChromeAIAssistant>;
}

export interface ChromeLanguageModel {
  availability: () => Promise<"available" | "unavailable" | "downloading">;
  params: () => Promise<any>;
  create: (options: any) => Promise<any>;
  destroy: () => Promise<void>;
}

export interface ChromePromptAPI extends Record<string, any> {
  assistant: ChromeAIAssistantFactory;
  languageModel: ChromeLanguageModel;
}

export interface PolyfillChromeAIOptions {
  modelAssetPath: string;
  wasmLoaderPath: string;
  wasmBinaryPath: string;
}

declare global {
  var ai: ChromePromptAPI;
  var model = ai;
  var LanguageModel: ChromeLanguageModel;
  var __polyfill_ai_options__: Partial<PolyfillChromeAIOptions> | undefined;
}
