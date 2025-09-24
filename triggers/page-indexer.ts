import pageExtractionService, {
  PageMetadata,
} from "@/services/page-extraction/extraction";
import { Task, task } from "./task";
import { chromeAi } from "@/helpers/agent/utils";
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
import { SemanticSearchThreshold } from "@/constant/internal";

// Types
type PageIndexerPayload = {
  url: string;
  pageMetadata: PageMetadata;
  tabId: number;
};

const pageIndexerJob: Task<PageIndexerPayload> = task<PageIndexerPayload>({
  id: "page-indexer",
  run: async (payload: PageIndexerPayload) => {
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

  // Check if this specific content has already been processed
  if (!urmindDb.contexts) {
    logger.error("❌ Contexts service not available");
    return;
  }
  const existingContentContext =
    await urmindDb.contexts.getContextByContentFingerprint(contentFingerprint);
  if (existingContentContext) {
    logger.warn(
      `⏭️ Skipping text batch ${
        batchIndex + 1
      } - content already processed as context:`,
      existingContentContext.id
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

  const similarContexts = semanticSearchResults?.filter(
    (c) => c.score >= SemanticSearchThreshold
  );

  logger.info(`🔍 Semantic search results:`, semanticSearchResults);
  logger.info(`🔍 Closely similar contexts:`, similarContexts);

  let matchedCategory: string | null = null;
  if (similarContexts?.length > 0) {
    if (similarContexts?.length > 0) {
      matchedCategory = similarContexts?.[0]?.category || null;
      logger.info(
        `🔍 Matched context: ${similarContexts?.[0]?.category} with score: ${similarContexts?.[0]?.score}`
      );
    }
  }

  if (contextResponse.retentionDecision.keep && contextResponse.context) {
    const contextId = shortId.generate();

    const contextData: Omit<
      UrmindDB["contexts"]["value"],
      "createdAt" | "updatedAt"
    > = {
      id: contextId,
      fingerprint,
      contentFingerprint,
      category: (
        matchedCategory || contextResponse.context.category.toLowerCase()
      ).replace(/\s/g, "-"),
      type: "artifact:web-page",
      title: contextResponse.context.title,
      description: contextResponse.context.description,
      summary: contextResponse.context.summary,
      url: cleanUrl,
      fullUrl: fullUrl,
      image: pageMetadata.og.image || null,
      favicon: pageMetadata.og.favicon || null,
      highlightText: "", // Legacy field
      highlightElements: [], // Empty for text-based approach
    };

    try {
      logger.info("💾 Creating new text context:", contextData);
      await createContextWithEmbedding(contextData, cleanUrl, tabId);
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
      category: existingUrlContext.category,
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
      category: contextData.category,
      url: cleanUrl,
    });
    logger.info("🔮 Embedding created for context:", newContextId);
  } catch (embeddingError) {
    logger.error("⚠️ Failed to create embedding:", embeddingError);
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
      const llmResponse = await chromeAi.invoke(
        InitialContextCreatorPrompt({
          pageContent: batch,
          metadata: pageMetadata,
          existingContext,
        })
      );

      const sanitizedResponse = cleanLLMResponse({
        response: llmResponse,
        requiredFields: ["context", "retentionDecision"],
        preserveFormatting: false,
      }) as unknown as PageIndexerResponse;

      logger.info("Text context creator response:", sanitizedResponse);
      return sanitizedResponse;
    },
    {
      retries: 3,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 10000,
      onRetry: (e, attempt) => {
        logger.error("Text context creator failed:", e);
        logger.log("Attempt:", attempt);
      },
    }
  );
}
