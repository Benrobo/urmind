import { ChromeAI } from "@langchain/community/experimental/llms/chrome_ai";

export const chromeAi = new ChromeAI({
  temperature: 0.1, // Lower temperature for more deterministic responses
  topK: 40, // Optional, defaults to 40
  onFailedAttempt: (error) => {
    console.error("Failed to create ChromeAI instance:", error);
  },
});
