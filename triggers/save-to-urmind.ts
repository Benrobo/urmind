import pageExtractionService, {
  PageMetadata,
} from "@/services/page-extraction/extraction";
import { Task, task } from "./task";
import { chromeAi, geminiAi } from "@/helpers/agent/utils";
import { preferencesStore } from "@/store/preferences.store";
import { generateText, streamText } from "ai";
import {
  ai_models,
  SaveToUrmindSemanticSearchThreshold,
} from "@/constant/internal";
import { md5Hash, cleanUrlForFingerprint } from "@/lib/utils";
import urmindDb from "@/services/db";
import { embeddingHelper } from "@/services/embedding-helper";
import { InitialContextCreatorPrompt } from "@/data/prompt/system/page-indexer.system";
import retry from "async-retry";
import cleanLLMResponse from "@/helpers/clean-llm-response";
import { PageIndexerResponse } from "@/types/page-indexing";
import shortId from "short-uuid";
import logger from "@/lib/logger";
import { UrmindDB } from "@/types/database";
import { PageIndexingSemanticSearchThreshold } from "@/constant/internal";
import { semanticCache } from "@/services/semantic-cache.service";
import { semanticCacheStore } from "@/store/semantic-cache.store";
import { GenerateCategoryPrompt } from "@/data/prompt/system/save-to-urmind.system";

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

    if (type === "text") {
      // save the text directly to the database while embedding the content
      await processSaveToUrMind(payload);
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

    const shouldProcess = await semanticCache.shouldProcessContent(
      selectedText,
      tabId,
      cleanUrl
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

    let matchedCategorySlug: string | null = null;
    if (categorySlug) {
      logger.warn("🔍 Category slug provided [save-to-urmind]:", categorySlug);
      matchedCategorySlug = categorySlug;
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

      const contextId = shortId.generate();
      const genericContextData: Omit<
        UrmindDB["contexts"]["value"],
        "createdAt" | "updatedAt" | "categorySlug"
      > = {
        id: contextId,
        fingerprint,
        contentFingerprint,
        type: "text",
        title: "",
        description: "",
        summary: selectedText,
        og: {
          title: null,
          description: null,
          image: null,
          favicon: null,
        },
        url: cleanUrl,
        fullUrl: url,
        image: null,
        highlightText: selectedText, // Legacy field
        highlightElements: [], // Empty for text-based approach
      };

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
        });
      } else {
        const contextId = shortId.generate();
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
        });
      }
    }
  }
}

async function cacheContent(props: {
  content: string;
  cleanUrl: string;
  score: number;
}) {
  const { content, cleanUrl, score } = props;
  const semanticSignature = await semanticCache.generateSemanticSignature(
    content
  );
  const urlFingerprint = md5Hash(cleanUrl);
  const signatureKey = `${urlFingerprint}:${semanticSignature}`;
  await semanticCacheStore.addSignature(signatureKey, score ?? 0);
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
