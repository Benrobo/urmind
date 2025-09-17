class AIService {
  private async builtInModelAvailable() {
    if (typeof LanguageModel !== "undefined") {
      return await LanguageModel.availability();
    }
    return false;
  }

  async init() {
    console.log("Starting AI capabilities initialization...");
    try {
      const builtInModelAvailable = await this.builtInModelAvailable();
      console.log("Built-in model available:", builtInModelAvailable);

      if (!builtInModelAvailable) {
        console.warn("Built-in language model is not available");
        return { summarizer: null, promptSession: null };
      }

      return { summarizer: "available", promptSession: "available" };
    } catch (err: any) {
      console.error("AI initialization failed:", err);
      return { summarizer: null, promptSession: null };
    }
  }
}

const aiService = new AIService();

export default aiService;
