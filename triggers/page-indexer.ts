import pageExtractionService, {
  PageMetadata,
} from "@/services/page-extraction/extraction";
import { Task, task } from "./task";
import { chromeAi, geminiAi } from "@/helpers/agent/utils";
import { preferencesStore } from "@/store/preferences.store";
import { generateText, streamText } from "ai";
import { ai_models } from "@/constant/internal";
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

type PageIndexerPayload = {
  url: string;
  pageMetadata: PageMetadata;
  tabId: number;
};

const pageIndexerJob: Task<PageIndexerPayload> = task<PageIndexerPayload>({
  id: "page-indexer",
  run: async (payload: PageIndexerPayload) => {
    return console.log("🛑 STOPPED FOR NOW");

    const { url, pageMetadata, tabId } = payload;
    logger.log("🔍 Indexing page:", url);
    logger.log("📄 Page metadata:", pageMetadata);

    const cleanUrl = cleanUrlForFingerprint(url);
    const fingerprint = md5Hash(cleanUrl);

    logger.log("🔗 Clean URL for fingerprint:", cleanUrl);
    logger.log("🔑 Fingerprint:", fingerprint);

    const existingContext = await getExistingContext(fingerprint);

    // Process text content batches using text-based approach
    for (let i = 0; i < pageMetadata.pageContentBatches.length; i++) {
      const batch = pageMetadata.pageContentBatches[i];
      if (!batch) {
        logger.warn(`⚠️ Skipping empty batch ${i + 1}`);
        continue;
      }

      await processTextBatch({
        batch,
        batchIndex: i,
        totalBatches: pageMetadata.pageContentBatches.length,
        pageMetadata,
        fingerprint,
        cleanUrl,
        tabId,
        existingContext,
        fullUrl: url,
      });
    }
  },
  onFailure: (error: Error) => {
    logger.error("Page indexing failed:", error);
  },
});

export default pageIndexerJob;

async function processTextBatch(props: {
  batch: string;
  batchIndex: number;
  totalBatches: number;
  pageMetadata: PageMetadata;
  fingerprint: string;
  cleanUrl: string;
  tabId: number;
  existingContext?: ExistingContext;
  fullUrl: string;
}): Promise<void> {
  const {
    batch,
    batchIndex,
    totalBatches,
    pageMetadata,
    fingerprint,
    cleanUrl,
    tabId,
    existingContext,
    fullUrl,
  } = props;
  logger.info(`📄 Processing text batch ${batchIndex + 1}/${totalBatches}`);

  const contentFingerprint = md5Hash(batch);
  logger.log("🔍 Content fingerprint:", contentFingerprint);

  if (!urmindDb.contexts || !urmindDb.embeddings) {
    logger.error("❌ Contexts or embeddings service not available");
    return;
  }

  const shouldProcess = await semanticCache.shouldProcessContent(
    batch,
    tabId,
    cleanUrl
  );
  if (!shouldProcess) {
    logger.warn(
      `⏭️ Skipping text batch ${
        batchIndex + 1
      } - content is too similar to existing contexts or already processed`
    );
    return;
  }

  const contextResponse = await generateTextContext(
    batch,
    pageMetadata,
    existingContext
  );

  // Perform semantic search using messaging
  const searchText = `${contextResponse.context?.title} ${contextResponse.context?.description} ${contextResponse.context?.summary}`;

  if (!urmindDb.embeddings) {
    logger.error("❌ Embeddings service not available");
    return;
  }

  const semanticSearchResults = await urmindDb.embeddings.semanticSearch(
    searchText,
    tabId,
    { limit: 5 }
  );

  // Get user preferences for threshold
  const preferences = await preferencesStore.get();
  const hasApiKey = preferences?.geminiApiKey?.trim();
  const threshold = hasApiKey
    ? PageIndexingSemanticSearchThreshold.online
    : PageIndexingSemanticSearchThreshold.offline;

  const similarContexts = semanticSearchResults?.filter(
    (c) => c.score >= threshold
  );

  logger.info(`🔍 Semantic search results:`, semanticSearchResults);
  logger.info(`🔍 Closely similar contexts:`, similarContexts);

  let matchedCategorySlug: string | null = null;
  if (similarContexts?.length > 0) {
    if (similarContexts?.length > 0) {
      matchedCategorySlug = similarContexts?.[0]?.categorySlug || null;
      logger.info(
        `🔍 Matched context: ${similarContexts?.[0]?.categorySlug} with score: ${similarContexts?.[0]?.score}`
      );
    }
  }

  if (contextResponse.retentionDecision.keep && contextResponse.context) {
    const contextId = shortId.generate();

    // Get or create category
    const categoryLabel = matchedCategorySlug
      ? await getCategoryLabelBySlug(matchedCategorySlug)
      : contextResponse.context.category.label;

    const categorySlug =
      matchedCategorySlug ||
      contextResponse.context.category.slug.toLowerCase().replace(/\s/g, "-");

    // Ensure category exists in context_categories table
    if (!urmindDb.contextCategories) {
      throw new Error("Context categories service not available");
    }

    await urmindDb.contextCategories.getOrCreateCategory(
      categoryLabel,
      categorySlug
    );

    const contextData: Omit<
      UrmindDB["contexts"]["value"],
      "createdAt" | "updatedAt"
    > = {
      id: contextId,
      fingerprint,
      contentFingerprint,
      categorySlug,
      type: "artifact:web-page",
      title: contextResponse.context.title,
      description: contextResponse.context.description,
      summary: contextResponse.context.summary,
      og: {
        title: pageMetadata.og.title,
        description: pageMetadata.og.description,
        image: pageMetadata.og.image,
        favicon: pageMetadata.og.favicon,
      },
      url: cleanUrl,
      fullUrl: fullUrl,
      image: pageMetadata.og.image || null,
      highlightText: "", // Legacy field
      highlightElements: [], // Empty for text-based approach
    };

    try {
      logger.info("💾 Creating new text context:", contextData);
      await createContextWithEmbedding(contextData, cleanUrl, tabId);

      if (matchedCategorySlug) {
        logger.warn(
          "🔍 Caching content so that it doesn't get processed again"
        );
        // cache this content so that it doesn't get processed again
        const semanticSignature = await semanticCache.generateSemanticSignature(
          batch
        );
        const urlFingerprint = md5Hash(cleanUrl);
        const signatureKey = `${urlFingerprint}:${semanticSignature}`;
        await semanticCacheStore.addSignature(
          signatureKey,
          similarContexts?.[0]?.score ?? 0
        );
      }
    } catch (error) {
      logger.error("❌ Failed to create text context:", error);
    }
  } else {
    logger.info(
      "⏭️ Skipping text context creation:",
      contextResponse.retentionDecision.reason
    );
  }
}

type ExistingContext = {
  title: string;
  description: string;
  category: string;
};

async function getCategoryLabelBySlug(slug: string): Promise<string> {
  if (!urmindDb.contextCategories) {
    throw new Error("Context categories service not available");
  }

  const category = await urmindDb.contextCategories.getCategoryBySlug(slug);
  return category?.label || slug;
}

type ContextWithEmbedding = {
  id: string;
  title: string;
  description: string;
  summary: string;
  embedding?: number[];
};

async function getExistingContext(
  fingerprint: string
): Promise<ExistingContext | undefined> {
  if (!urmindDb.contexts) {
    logger.error("❌ Contexts service not available");
    return undefined;
  }
  const existingUrlContext = await urmindDb.contexts.getContextByFingerprint(
    fingerprint
  );
  if (existingUrlContext) {
    return {
      title: existingUrlContext.title,
      description: existingUrlContext.description,
      category: existingUrlContext.categorySlug,
    };
  }

  return undefined;
}

async function createContextWithEmbedding(
  contextData: Omit<UrmindDB["contexts"]["value"], "createdAt" | "updatedAt">,
  cleanUrl: string,
  tabId: number
): Promise<string> {
  if (!urmindDb.contexts) {
    logger.error("❌ Contexts service not available");
    throw new Error("Contexts service not available");
  }

  // Create context directly in background script
  const newContextId = await urmindDb.contexts.createContext(contextData);
  logger.info("✅ Context created with ID:", newContextId);

  try {
    // Generate and store embedding using messaging
    if (!urmindDb.embeddings) {
      logger.error("❌ Embeddings service not available");
      return newContextId;
    }

    const embeddingText = `${contextData.title} ${contextData.description} ${contextData.summary}`;
    await urmindDb.embeddings.generateAndStore(embeddingText, tabId, {
      contextId: newContextId,
      type: "context",
      category: contextData.categorySlug,
      url: cleanUrl,
    });
    logger.info("🔮 Embedding created for context:", newContextId);
  } catch (embeddingError) {
    logger.error("⚠️ Failed to create embedding:", embeddingError);

    // Check if it's a WASM-related error
    if (
      embeddingError instanceof Error &&
      embeddingError.message.includes("WebAssembly")
    ) {
      logger.error(
        "🚨 WebAssembly error detected. This might be due to CSP restrictions or missing WASM files."
      );
      logger.error(
        "💡 Try rebuilding the extension or check browser console for more details."
      );
    }
  }

  return newContextId;
}

/**
 * Generate context from text batch using LLM
 */
async function generateTextContext(
  batch: string,
  pageMetadata: PageMetadata,
  existingContext?: ExistingContext
): Promise<PageIndexerResponse> {
  return retry(
    async () => {
      const preferences = await preferencesStore.get();

      let llmResponse: string;

      // Try online model first if API key is available
      if (preferences.geminiApiKey?.trim()) {
        try {
          llmResponse = await generateWithOnlineModel(
            batch,
            pageMetadata,
            existingContext,
            preferences
          );
        } catch (onlineError) {
          console.warn(
            "Online model failed, falling back to local model:",
            onlineError
          );
          llmResponse = await generateWithLocalModel(
            batch,
            pageMetadata,
            existingContext
          );
        }
      } else {
        llmResponse = await generateWithLocalModel(
          batch,
          pageMetadata,
          existingContext
        );
      }

      const sanitizedResponse = cleanLLMResponse({
        response: llmResponse,
        requiredFields: ["context", "retentionDecision"],
        preserveFormatting: false,
      }) as unknown as PageIndexerResponse;

      logger.info("Text context creator response:", sanitizedResponse);
      return sanitizedResponse;
    },
    {
      retries: 5,
      factor: 5,
      minTimeout: 1000,
      maxTimeout: 10000,
      onRetry: (e, attempt) => {
        logger.error("Text context creator failed:", e);
        logger.log("Attempt:", attempt);
      },
    }
  );
}

async function generateWithOnlineModel(
  batch: string,
  pageMetadata: PageMetadata,
  existingContext: ExistingContext | undefined,
  preferences: any
): Promise<string> {
  const genAI = geminiAi(preferences.geminiApiKey);
  const modelName = ai_models.generation.gemini_flash; // Always use Flash for online generation

  logger.log(`🤖 Using online model for context generation: ${modelName}`);

  const result = await generateText({
    model: genAI(modelName),
    prompt: InitialContextCreatorPrompt({
      pageContent: batch,
      metadata: pageMetadata,
      existingContext: existingContext
        ? {
            title: existingContext.title,
            description: existingContext.description,
            category: existingContext.category,
          }
        : undefined,
    }),
  });

  logger.log("✅ Online context generation completed");
  return result.text;
}

async function generateWithLocalModel(
  batch: string,
  pageMetadata: PageMetadata,
  existingContext: ExistingContext | undefined
): Promise<string> {
  logger.log("🏠 Using local ChromeAI for context generation");

  const result = await chromeAi.invoke(
    InitialContextCreatorPrompt({
      pageContent: batch,
      metadata: pageMetadata,
      existingContext: existingContext
        ? {
            title: existingContext.title,
            description: existingContext.description,
            category: existingContext.category,
          }
        : undefined,
    })
  );

  logger.log("✅ Local context generation completed");
  return result;
}
