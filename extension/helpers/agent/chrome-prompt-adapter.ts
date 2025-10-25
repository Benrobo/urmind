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

export type SupportedLanguage =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "it"
  | "pt"
  | "ru"
  | "ja"
  | "ko"
  | "zh"
  | "ar"
  | "hi"
  | "th"
  | "vi"
  | "tr"
  | "pl"
  | "nl"
  | "sv"
  | "da"
  | "no"
  | "fi"
  | "cs"
  | "hu"
  | "ro"
  | "bg"
  | "hr"
  | "sk"
  | "sl"
  | "et"
  | "lv"
  | "lt"
  | "el"
  | "he"
  | "uk"
  | "be"
  | "ka"
  | "hy"
  | "az"
  | "kk"
  | "ky"
  | "uz"
  | "tg"
  | "mn"
  | "ne"
  | "si"
  | "ta"
  | "te"
  | "ml"
  | "kn"
  | "gu"
  | "pa"
  | "bn"
  | "or"
  | "as"
  | "mr"
  | "sa"
  | "sd"
  | "ur"
  | "fa"
  | "ps"
  | "sw"
  | "am"
  | "ti"
  | "om"
  | "so"
  | "ha"
  | "yo"
  | "ig"
  | "zu"
  | "xh"
  | "af"
  | "sq"
  | "eu"
  | "ca"
  | "cy"
  | "ga"
  | "is"
  | "mt"
  | "mk"
  | "sr"
  | "bs"
  | "me"
  | "sq"
  | "sq";

export interface GenerateOptions {
  temperature?: number;
  topK?: number;
  signal?: AbortSignal;
  responseSchema?: any;
  language?: SupportedLanguage;
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

  async isLanguageModelAvailable(): Promise<boolean> {
    const availability =
      (await LanguageModel.availability()) as unknown as string;
    return availability === "available";
  }

  private async getOrCreateSession(options?: GenerateOptions): Promise<any> {
    if (!this.isLanguageModelAvailable()) {
      throw new Error(
        "Chrome LanguageModel API is not available. Make sure you are running in Chrome with the Prompt API enabled."
      );
    }

    const availability =
      (await LanguageModel.availability()) as unknown as string;
    if (availability === "unavailable") {
      throw new Error(
        "LanguageModel is unavailable. Check hardware requirements and ensure the model is downloaded."
      );
    }

    if (availability === "downloading") {
      throw new Error(
        "LanguageModel is still downloading. Please wait for the download to complete."
      );
    }

    // Only create a new session if not created or if options changed
    const needsNewSession =
      !this.session ||
      (options?.temperature !== undefined &&
        options.temperature !== this.sessionOptions.temperature) ||
      (options?.topK !== undefined &&
        options.topK !== this.sessionOptions.topK);

    if (needsNewSession) {
      if (this.session) {
        try {
          this.session.destroy();
        } catch (e) {}
      }

      const params = await LanguageModel.params();
      const temperature = options?.temperature ?? params.defaultTemperature;
      const topK = options?.topK ?? params.defaultTopK;

      const sessionOptions: any = {
        temperature,
        topK,
        signal: options?.signal,
      };

      if (options?.language) {
        sessionOptions.expectedInputs = [
          {
            type: "text",
            languages: [options.language],
          },
        ];
        sessionOptions.expectedOutputs = [
          {
            type: "text",
            languages: [options.language],
          },
        ];
      } else {
        sessionOptions.expectedInputs = [
          {
            type: "text",
            languages: ["en"],
          },
        ];
        sessionOptions.expectedOutputs = [
          {
            type: "text",
            languages: ["en"],
          },
        ];
      }

      this.session = await LanguageModel.create(sessionOptions);

      this.sessionOptions = {
        temperature,
        topK,
      };
    }

    return this.session;
  }

  // Converts AI SDK messages into the Chrome Prompt API message format
  private transformMessages(messages: Message[]): any[] {
    return messages.map((msg) => {
      if (typeof msg.content === "string") {
        return {
          role: msg.role,
          content: msg.content,
        };
      }

      // For multimodal, ensure content is an array and convert each item
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

  async generateText(
    messages: Message[],
    options?: GenerateOptions
  ): Promise<GenerateResult> {
    const session = await this.getOrCreateSession(options);

    if (messages.length === 0) {
      throw new Error("At least one message is required");
    }

    const transformedMessages = this.transformMessages(messages);

    // Take all but the last as conversation history
    const initialPrompts = transformedMessages.slice(0, -1);
    const lastMessage = transformedMessages[transformedMessages.length - 1];

    if (initialPrompts.length > 0) {
      await session.append(initialPrompts);
    }

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

  async *streamText(
    messages: Message[],
    options?: GenerateOptions
  ): StreamResult {
    const session = await this.getOrCreateSession(options);

    if (messages.length === 0) {
      throw new Error("At least one message is required");
    }

    const transformedMessages = this.transformMessages(messages);
    const initialPrompts = transformedMessages.slice(0, -1);
    const lastMessage = transformedMessages[transformedMessages.length - 1];

    if (initialPrompts.length > 0) {
      await session.append(initialPrompts);
    }

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

  destroy(): void {
    if (this.session) {
      try {
        this.session.destroy();
      } catch (e) {
        // Session might already be destroyed, ignore
      }
      this.session = null;
      this.sessionOptions = {};
    }
  }

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

export const chromeAI = new ChromePromptAdapter();
