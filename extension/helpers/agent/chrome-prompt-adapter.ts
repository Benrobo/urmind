// Chrome Prompt API Adapter

export type MessageContent =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image";
      image: File;
    };

export interface Message {
  role: "system" | "user" | "assistant";
  content: string | MessageContent[];
}

export interface GenerateOptions {
  temperature?: number;
  topK?: number;
  signal?: AbortSignal;
  responseSchema?: any;
  expectedInputs?: Array<{
    type: "text" | "image" | "audio";
    languages: string[];
  }>;
  expectedOutputs?: Array<{
    type: "text";
    languages: string[];
  }>;
}

export interface GenerateResult {
  text: string;
  usage: {
    input: number;
    quota: number;
  };
}

export type StreamResult = AsyncGenerator<string, void, unknown>;

export class ChromePromptAdapter {
  private session: any = null;
  private sessionOptions: {
    temperature?: number;
    topK?: number;
  } = {};

  constructor() {}

  private isLanguageModelAvailable(): boolean {
    return typeof window !== "undefined" && "LanguageModel" in window;
  }

  private async getOrCreateSession(options?: GenerateOptions): Promise<any> {
    if (!this.isLanguageModelAvailable()) {
      throw new Error(
        "Chrome LanguageModel API is not available. Make sure you are running in Chrome with the Prompt API enabled."
      );
    }

    const { LanguageModel } = window as any;

    const availability = await LanguageModel.availability();
    if (availability === "unavailable") {
      throw new Error(
        "LanguageModel is unavailable. Check hardware requirements and ensure the model is downloaded."
      );
    }

    // If downloading, wait for it to complete
    if (availability === "downloading") {
      throw new Error(
        "LanguageModel is still downloading. Please wait for the download to complete."
      );
    }

    // Check if we need to create a new session or if options changed
    const needsNewSession =
      !this.session ||
      (options?.temperature !== undefined &&
        options.temperature !== this.sessionOptions.temperature) ||
      (options?.topK !== undefined &&
        options.topK !== this.sessionOptions.topK);

    if (needsNewSession) {
      // Destroy existing session if it exists
      if (this.session) {
        try {
          this.session.destroy();
        } catch (e) {
          // Session might already be destroyed
        }
      }

      // Get model parameters
      const params = await LanguageModel.params();
      const temperature = options?.temperature ?? params.defaultTemperature;
      const topK = options?.topK ?? params.defaultTopK;

      // Prepare session creation options
      const sessionOptions: any = {
        temperature,
        topK,
        signal: options?.signal,
      };

      // Add language options if provided
      if (options?.expectedInputs) {
        sessionOptions.expectedInputs = options.expectedInputs;
      }
      if (options?.expectedOutputs) {
        sessionOptions.expectedOutputs = options.expectedOutputs;
      }

      // Create new session
      this.session = await LanguageModel.create(sessionOptions);

      this.sessionOptions = {
        temperature,
        topK,
      };
    }

    return this.session;
  }

  // Transform AI SDK messages to Chrome API format
  private transformMessages(messages: Message[]): any[] {
    return messages.map((msg) => {
      if (typeof msg.content === "string") {
        return {
          role: msg.role,
          content: msg.content,
        };
      }

      // Handle multimodal content
      const content = Array.isArray(msg.content) ? msg.content : [msg.content];
      return {
        role: msg.role,
        content: content.map((item) => {
          if (item.type === "text") {
            return {
              type: "text",
              value: item.text,
            };
          } else if (item.type === "image") {
            return {
              type: "image",
              value: item.image,
            };
          }
          throw new Error(`Unsupported content type: ${(item as any).type}`);
        }),
      };
    });
  }

  // Generate text using Chrome Prompt API
  async generateText(
    messages: Message[],
    options?: GenerateOptions
  ): Promise<GenerateResult> {
    const session = await this.getOrCreateSession(options);

    if (messages.length === 0) {
      throw new Error("At least one message is required");
    }

    // Transform messages to Chrome API format
    const transformedMessages = this.transformMessages(messages);

    // Separate initial prompts from the last message
    const initialPrompts = transformedMessages.slice(0, -1);
    const lastMessage = transformedMessages[transformedMessages.length - 1];

    // If we have initial prompts, append them to the session
    if (initialPrompts.length > 0) {
      await session.append(initialPrompts);
    }

    // Generate response
    const promptOptions: any = {};
    if (options?.responseSchema) {
      promptOptions.responseConstraint = options.responseSchema;
    }
    if (options?.signal) {
      promptOptions.signal = options.signal;
    }

    const result = await session.prompt(lastMessage.content, promptOptions);

    return {
      text: result,
      usage: {
        input: session.inputUsage,
        quota: session.inputQuota,
      },
    };
  }

  // Stream text using Chrome Prompt API
  async *streamText(
    messages: Message[],
    options?: GenerateOptions
  ): StreamResult {
    const session = await this.getOrCreateSession(options);

    if (messages.length === 0) {
      throw new Error("At least one message is required");
    }

    // Transform messages to Chrome API format
    const transformedMessages = this.transformMessages(messages);

    // Separate initial prompts from the last message
    const initialPrompts = transformedMessages.slice(0, -1);
    const lastMessage = transformedMessages[transformedMessages.length - 1];

    // If we have initial prompts, append them to the session
    if (initialPrompts.length > 0) {
      await session.append(initialPrompts);
    }

    // Stream response
    const promptOptions: any = {};
    if (options?.responseSchema) {
      promptOptions.responseConstraint = options.responseSchema;
    }
    if (options?.signal) {
      promptOptions.signal = options.signal;
    }

    const stream = session.promptStreaming(lastMessage.content, promptOptions);

    for await (const chunk of stream) {
      yield chunk;
    }
  }

  // Destroy the session
  destroy(): void {
    if (this.session) {
      try {
        this.session.destroy();
      } catch (e) {
        // Session might already be destroyed
      }
      this.session = null;
      this.sessionOptions = {};
    }
  }

  // Get current session info
  getSessionInfo(): {
    hasSession: boolean;
    options: {
      temperature?: number;
      topK?: number;
    };
  } {
    return {
      hasSession: !!this.session,
      options: { ...this.sessionOptions },
    };
  }
}

// Create and export a default instance
export const chromeAI = new ChromePromptAdapter();
