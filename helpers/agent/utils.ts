import { ChromeAI } from "@langchain/community/experimental/llms/chrome_ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const chromeAi = new ChromeAI({
  temperature: 0.2, // Lower temperature for more deterministic responses
  topK: 40, // Optional, defaults to 40
  onFailedAttempt: (error) => {
    console.error("Failed to create ChromeAI instance:", error);
  },
});

export const geminiAi = (apiKey: string) => {
  return createGoogleGenerativeAI({
    apiKey,
  });
};
