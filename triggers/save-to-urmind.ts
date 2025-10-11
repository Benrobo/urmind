import { Task, task } from "./task";
import { chromeAi, geminiAi } from "@/helpers/agent/utils";
import { preferencesStore } from "@/store/preferences.store";
import { generateText } from "ai";
import {
  ai_models,
  SaveToUrmindSemanticSearchThreshold,
} from "@/constant/internal";
import { md5Hash, cleanUrlForFingerprint, sleep } from "@/lib/utils";
import urmindDb from "@/services/db";
import retry from "async-retry";
import cleanLLMResponse from "@/helpers/clean-llm-response";
import shortId from "short-uuid";
import logger from "@/lib/logger";
import { UrmindDB } from "@/types/database";
import { semanticCache } from "@/services/semantic-cache.service";
import { semanticCacheStore } from "@/store/semantic-cache.store";
import { activityManagerStore } from "@/store/activity-manager.store";
import {
  GenerateCategoryPrompt,
  TextContextCreatorPrompt,
} from "@/data/prompt/system/save-to-urmind.system";

export type SaveToUrMindPayload = {
  categorySlug?: string; // this would be available if the user tries save context directly via mindboard
  type: "image" | "link" | "text";
  url: string;
  selectedText?: string;
  srcUrl?: string;
  linkUrl?: string;
  tabId: number;
};

const saveToUrMindJob: Task<SaveToUrMindPayload> = task<SaveToUrMindPayload>({
  id: "save-to-urmind",
  run: async (payload: SaveToUrMindPayload) => {
    const { type, url, selectedText, srcUrl, linkUrl, tabId, categorySlug } =
      payload;

    console.log("Saving to UrMind:", payload);

    // Track the save activity
    const activityId = await activityManagerStore.track({
      title: "Saving to Urmind...",
      description: `Saving "${selectedText || url}" to Urmind`,
      status: "in-progress",
    });

    if (type === "text") {
      try {
        await processSaveToUrMind(payload);

        await activityManagerStore.updateActivity(activityId, {
          status: "completed",
          description: `Successfully saved "${selectedText || url}" to Urmind`,
        });
      } catch (error) {
        await activityManagerStore.updateActivity(activityId, {
          status: "failed",
          description: `Failed to save "${selectedText || url}" to Urmind: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
        throw error;
      }
    }
  },
});

export default saveToUrMindJob;

async function processSaveToUrMind(payload: SaveToUrMindPayload) {
  const { type, url, selectedText, srcUrl, linkUrl, tabId, categorySlug } =
    payload;
  const cleanUrl = cleanUrlForFingerprint(url);
  const fingerprint = md5Hash(cleanUrl);

  if (type === "text" && selectedText) {
    const contentFingerprint = md5Hash(selectedText);

    if (!urmindDb.contexts || !urmindDb.embeddings) {
      logger.error("❌ Contexts or embeddings service not available");
      return;
    }

    // Generate contextId early so we can use it for cache operations
    const contextId = shortId.generate();

    const shouldProcess = await semanticCache.shouldProcessContent(
      selectedText,
      tabId,
      cleanUrl,
      contextId
    );
    if (!shouldProcess) {
      logger.warn(
        `⏭️ Skipping text ${
          selectedText.slice(0, 20) + "..."
        } - content is too similar to existing contexts or already processed`
      );
      return;
    }

    // Perform semantic search using messaging
    const searchText = `${selectedText}`;

    if (!urmindDb.embeddings) {
      logger.error("❌ Embeddings service not available");
      return;
    }

    // Generate context metadata using LLM
    const contextResponse = await generateTextContext(selectedText);

    const genericContextData: Omit<
      UrmindDB["contexts"]["value"],
      "createdAt" | "updatedAt" | "categorySlug"
    > = {
      id: contextId,
      fingerprint,
      contentFingerprint,
      type: "text",
      title: contextResponse.context.title,
      description: contextResponse.context.description,
      summary: contextResponse.context.summary,
      rawContent: selectedText,
      og: null,
      url: cleanUrl,
      fullUrl: url,
      image: null,
      highlightText: selectedText, // Legacy field
      highlightElements: [], // Empty for text-based approach
    };

    let matchedCategorySlug: string | null = null;

    // If category slug is provided,
    // It means the user tries saving context within mindboard
    if (categorySlug) {
      matchedCategorySlug = categorySlug;
      const contextData: Omit<
        UrmindDB["contexts"]["value"],
        "createdAt" | "updatedAt"
      > = {
        ...genericContextData,
        categorySlug: matchedCategorySlug,
      };

      await urmindDb.contexts?.createContext(contextData);

      await urmindDb.embeddings?.generateAndStore(selectedText, tabId, {
        contextId,
        type: "context",
        category: matchedCategorySlug,
        url: cleanUrl,
      });

      logger.info("✅ Context created with ID:", contextId);
    } else {
      const semanticSearchResults = await urmindDb.embeddings.semanticSearch(
        searchText,
        tabId,
        { limit: 5 }
      );

      // Get user preferences for threshold
      const preferences = await preferencesStore.get();
      const hasApiKey = preferences?.geminiApiKey?.trim();
      const threshold = hasApiKey
        ? SaveToUrmindSemanticSearchThreshold.online
        : SaveToUrmindSemanticSearchThreshold.offline;

      const similarContexts = semanticSearchResults?.filter(
        (c) => c.score >= threshold
      );

      logger.info(
        `🔍 Semantic search results [save-to-urmind]:`,
        semanticSearchResults
      );
      logger.info(
        `🔍 Closely similar contexts [save-to-urmind]:`,
        similarContexts
      );

      if (similarContexts?.length > 0) {
        matchedCategorySlug = similarContexts?.[0]?.categorySlug || null;
        logger.info(
          `🔍 Matched context [save-to-urmind]: ${similarContexts?.[0]?.categorySlug} with score: ${similarContexts?.[0]?.score}`
        );
      }

      if (matchedCategorySlug) {
        logger.info(
          `🔍 Matched category [save-to-urmind]: ${matchedCategorySlug}`
        );

        const contextData: Omit<
          UrmindDB["contexts"]["value"],
          "createdAt" | "updatedAt"
        > = {
          ...genericContextData,
          categorySlug: matchedCategorySlug,
        };

        await urmindDb.contexts?.createContext(contextData);

        await urmindDb.embeddings?.generateAndStore(selectedText, tabId, {
          contextId,
          type: "context",
          category: matchedCategorySlug,
          url: cleanUrl,
        });

        logger.info("✅ Context created with ID:", contextId);

        logger.warn(
          "🔍 Caching content so that it doesn't get processed again"
        );

        // cache this content so that it doesn't get processed again
        await cacheContent({
          score: similarContexts?.[0]?.score ?? 0,
          cleanUrl,
          content: selectedText,
          contextId,
        });
      } else {
        const { category } = await generateCategory(selectedText);

        if (!urmindDb.contextCategories) {
          logger.error("❌ Context categories service not available");
          return;
        }

        await urmindDb.contextCategories?.getOrCreateCategory(
          category.label,
          category.slug
        );

        const contextData: Omit<
          UrmindDB["contexts"]["value"],
          "createdAt" | "updatedAt"
        > = {
          ...genericContextData,
          categorySlug: category.slug,
        };

        await urmindDb.contexts?.createContext(contextData);

        await urmindDb.embeddings?.generateAndStore(selectedText, tabId, {
          contextId,
          type: "context",
          category: category.slug,
          url: cleanUrl,
        });

        logger.info("✅ Context created with ID:", contextId);

        logger.warn(
          "🔍 Caching content so that it doesn't get processed again"
        );

        // cache this content so that it doesn't get processed again
        await cacheContent({
          score: similarContexts?.[0]?.score ?? 0,
          cleanUrl,
          content: selectedText,
          contextId,
        });
      }
    }
  }
}

async function cacheContent(props: {
  content: string;
  cleanUrl: string;
  score: number;
  contextId: string;
}) {
  const { content, cleanUrl, score, contextId } = props;
  const semanticSignature = await semanticCache.generateSemanticSignature(
    content
  );
  const urlFingerprint = md5Hash(cleanUrl);
  const signatureKey = `${urlFingerprint}:${semanticSignature}`;
  await semanticCacheStore.addSignature(signatureKey, contextId, score ?? 0);
}

async function generateCategory(text: string) {
  return await retry(
    async () => {
      const preferences = await preferencesStore.get();

      let llmResponse: string;

      // Try online model first if API key is available
      if (preferences.geminiApiKey?.trim()) {
        try {
          llmResponse = await generateWithOnlineModel(text, preferences);
        } catch (onlineError) {
          console.warn(
            "Online model failed, falling back to local model:",
            onlineError
          );
          llmResponse = await generateWithLocalModel(text);
        }
      } else {
        llmResponse = await generateWithLocalModel(text);
      }

      const sanitizedResponse = cleanLLMResponse({
        response: llmResponse,
        requiredFields: ["category"],
        preserveFormatting: false,
      }) as unknown as { category: { label: string; slug: string } };

      logger.info("Category generation response:", sanitizedResponse);
      return sanitizedResponse;
    },
    {
      retries: 3,
      factor: 1,
      minTimeout: 1000,
      maxTimeout: 5000,
      onRetry: (error, attempt) => {
        logger.error(`🔄 Category generation retry ${attempt}:`, error);
      },
    }
  );
}

async function generateWithOnlineModel(
  text: string,
  preferences: any
): Promise<string> {
  const genAI = geminiAi(preferences.geminiApiKey);
  const modelName = ai_models.generation.gemini_flash; // Always use Flash for online generation

  logger.log(`🤖 Using online model for category generation: ${modelName}`);

  const result = await generateText({
    model: genAI(modelName),
    prompt: GenerateCategoryPrompt(text),
  });

  logger.log("✅ Online category generation completed");
  return result.text;
}

async function generateWithLocalModel(text: string): Promise<string> {
  logger.log("🏠 Using local ChromeAI for category generation");

  const result = await chromeAi.invoke(GenerateCategoryPrompt(text));

  logger.log("✅ Local category generation completed");
  return result;
}

async function generateTextContext(text: string) {
  return await retry(
    async () => {
      const preferences = await preferencesStore.get();

      let llmResponse: string;

      // Try online model first if API key is available
      if (preferences.geminiApiKey?.trim()) {
        try {
          llmResponse = await generateTextContextWithOnlineModel(
            text,
            preferences
          );
        } catch (onlineError) {
          console.warn(
            "Online model failed, falling back to local model:",
            onlineError
          );
          llmResponse = await generateTextContextWithLocalModel(text);
        }
      } else {
        llmResponse = await generateTextContextWithLocalModel(text);
      }

      const sanitizedResponse = cleanLLMResponse({
        response: llmResponse,
        requiredFields: ["context"],
        preserveFormatting: false,
      }) as unknown as {
        context: { title: string; description: string; summary: string };
      };

      logger.info("Text context generation response:", sanitizedResponse);
      return sanitizedResponse;
    },
    {
      retries: 3,
      factor: 1,
      minTimeout: 1000,
      maxTimeout: 5000,
      onRetry: (error, attempt) => {
        logger.error(`🔄 Text context generation retry ${attempt}:`, error);
      },
    }
  );
}

async function generateTextContextWithOnlineModel(
  text: string,
  preferences: any
): Promise<string> {
  const genAI = geminiAi(preferences.geminiApiKey);
  const modelName = ai_models.generation.gemini_flash; // Always use Flash for online generation

  logger.log(`🤖 Using online model for text context generation: ${modelName}`);

  const result = await generateText({
    model: genAI(modelName),
    prompt: TextContextCreatorPrompt(text),
  });

  logger.log("✅ Online text context generation completed");
  return result.text;
}

async function generateTextContextWithLocalModel(
  text: string
): Promise<string> {
  logger.log("🏠 Using local ChromeAI for text context generation");

  const result = await chromeAi.invoke(TextContextCreatorPrompt(text));

  logger.log("✅ Local text context generation completed");
  return result;
}
