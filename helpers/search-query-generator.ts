import { Context } from "@/types/context";
import { SearchQueryGenerationPrompt } from "@/data/prompt/system/deep-research.system";
import { AIService } from "@/services/ai.service";

/**
 * Extracts and deduplicates categories from all saved contexts
 */
export async function getAllContextCategories(): Promise<string[]> {
  try {
    // Get all contexts from the database
    const response = await chrome.runtime.sendMessage({
      action: "db-operation",
      payload: { operation: "getAllContexts" },
    });

    if (!response?.result) {
      console.log("No contexts found for category extraction");
      return [];
    }

    const contexts = response.result as Context[];

    // Extract categories from all contexts
    const allCategories = contexts
      .map((context) => context.category.label)
      .filter((category) => category && category.trim().length > 0)
      .map((category) => category.trim());

    // Deduplicate categories (case-insensitive)
    const uniqueCategories = Array.from(
      new Set(allCategories.map((cat) => cat.toLowerCase()))
    ).map(
      (category) =>
        // Find the original case from the first occurrence
        allCategories.find((orig) => orig.toLowerCase() === category) ||
        category
    );

    console.log(
      `Extracted ${uniqueCategories.length} unique categories from ${contexts.length} contexts`
    );
    return uniqueCategories;
  } catch (error) {
    console.error("Error extracting context categories:", error);
    return [];
  }
}

/**
 * Builds conversation history for search query generation
 */
export function buildConversationHistory(
  messages: Array<{ user: string; assistant: string }>
): string {
  if (messages.length === 0) {
    return "No previous conversation context.";
  }

  return messages
    .map((message, index) => {
      const conversationNumber = index + 1;
      return `**Conversation ${conversationNumber}:**
User: ${message.user}
Assistant: ${message.assistant}`;
    })
    .join("\n\n");
}

/**
 * Generates a search query using the LLM
 */
export async function generateSearchQuery(
  userQuery: string,
  conversationHistory: Array<{ user: string; assistant: string }>,
  availableCategories: string[]
): Promise<string> {
  try {
    const historyText = buildConversationHistory(conversationHistory);
    const prompt = SearchQueryGenerationPrompt(
      userQuery,
      historyText,
      availableCategories
    );

    const searchQuery = await AIService.generateSearchQuery(prompt);
    console.log(
      `Generated search query: "${searchQuery}" for user query: "${userQuery}"`
    );
    return searchQuery;
  } catch (error) {
    console.error("Error generating search query:", error);
    return userQuery; // Fallback to original query
  }
}
