import pageExtractionService, {
  PageMetadata,
} from "@/services/page-extraction/extraction";
import { Task, task } from "./task";
import { chromeAi } from "@/helpers/agent/utils";
import { md5Hash, cleanUrlForFingerprint } from "@/lib/utils";
import { DatabaseProxy, dbProxy } from "@/services/db-proxy";
import {
  InitialContextCreatorPrompt,
  DOMContextCreatorPrompt,
} from "@/data/prompt/system/page-indexer.system";
import retry from "async-retry";
import cleanLLMResponse from "@/helpers/clean-llm-response";
import {
  DOMPageIndexerResponse,
  PageIndexerResponse,
} from "@/types/page-indexing";
import shortId from "short-uuid";
import logger from "@/lib/logger";
import { UrmindDB } from "@/types/database";
import { InvalidContextualTextElementText } from "@/constant/page-extraction";
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

    const tabProxy = dbProxy.withTabId(tabId);
    const cleanUrl = cleanUrlForFingerprint(url);
    const fingerprint = md5Hash(cleanUrl);

    logger.log("🔗 Clean URL for fingerprint:", cleanUrl);
    logger.log("🔑 Fingerprint:", fingerprint);

    const existingContext = await getExistingContext(tabProxy, fingerprint);

    // Process text content batches using text-based approach
    for (let i = 0; i < pageMetadata.pageContentBatches.length; i++) {
      const batch = pageMetadata.pageContentBatches[i];
      if (!batch) {
        logger.warn(`⚠️ Skipping empty batch ${i + 1}`);
        continue;
      }

      await processTextBatch(
        batch,
        i,
        pageMetadata.pageContentBatches.length,
        pageMetadata,
        fingerprint,
        cleanUrl,
        tabProxy,
        existingContext
      );
    }
  },
  onFailure: (error: Error) => {
    logger.error("Page indexing failed:", error);
  },
});

export default pageIndexerJob;

async function processTextBatch(
  batch: string,
  batchIndex: number,
  totalBatches: number,
  pageMetadata: PageMetadata,
  fingerprint: string,
  cleanUrl: string,
  tabProxy: DatabaseProxy,
  existingContext?: ExistingContext
): Promise<void> {
  logger.info(`📄 Processing text batch ${batchIndex + 1}/${totalBatches}`);

  const contentFingerprint = md5Hash(batch);
  logger.log("🔍 Content fingerprint:", contentFingerprint);

  // Check if this specific content has already been processed
  const existingContentContext = await tabProxy.getContextByContentFingerprint(
    contentFingerprint
  );
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

  const semanticSearchResults = await tabProxy.cosineSimilarity(
    `${contextResponse.context?.title} ${contextResponse.context?.description} ${contextResponse.context?.summary}`,
    {
      limit: 5,
    }
  );

  const similarContexts = semanticSearchResults?.filter(
    (c) => c.score >= SemanticSearchThreshold
  );

  logger.info(`🔍 Semantic search results:`, semanticSearchResults);
  logger.info(`🔍 Closely similar contexts:`, similarContexts);

  let matchedCategory: string | null = null;
  if (similarContexts?.length > 0) {
    if (similarContexts?.length > 0) {
      matchedCategory = similarContexts?.[0]?.metadata.category;
      logger.info(
        `🔍 Matched context: ${similarContexts?.[0]?.metadata.category} with score: ${similarContexts?.[0]?.score}`
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
      image: pageMetadata.og.image || null,
      favicon: pageMetadata.og.favicon || null,
      highlightText: "", // Legacy field
      highlightElements: [], // Empty for text-based approach
    };

    try {
      logger.info("💾 Creating new text context:", contextData);
      await createContextWithEmbedding(contextData, tabProxy, cleanUrl);
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

async function processElementBatch(
  elementBatch: any[],
  batchIndex: number,
  totalBatches: number,
  pageMetadata: PageMetadata,
  fingerprint: string,
  cleanUrl: string,
  tabProxy: any,
  existingContext?: ExistingContext
): Promise<void> {
  logger.info(
    `🔍 Processing element batch ${batchIndex + 1}/${totalBatches} with ${
      elementBatch.length
    } elements`
  );

  // Create content fingerprint from all elements in the batch
  const batchContent = elementBatch.map((el) => el.text).join("\n\n");
  const contentFingerprint = md5Hash(batchContent);
  logger.log("🔍 Content fingerprint:", contentFingerprint);

  // Check if this specific content has already been processed
  const existingContentContext = await tabProxy.getContextByContentFingerprint(
    contentFingerprint
  );
  if (existingContentContext) {
    logger.info(
      `⏭️ Skipping element batch ${
        batchIndex + 1
      } - content already processed as context:`,
      existingContentContext.id
    );
    return;
  }

  const contextResponse = await generateContext(
    elementBatch,
    pageMetadata,
    existingContext
  );

  if (contextResponse.retentionDecision.keep && contextResponse.context) {
    const contextId = shortId.generate();

    // Count occurrences of invalid text across all elements
    const invalidTextCounts = countInvalidTextOccurrences(elementBatch);

    // Select elements for highlighting
    const highlightElements = selectHighlightElements(
      elementBatch,
      invalidTextCounts
    );
    logger.info(
      `🎯 Selected ${highlightElements.length} elements for highlighting`
    );

    const contextData: Omit<
      UrmindDB["contexts"]["value"],
      "createdAt" | "updatedAt"
    > = {
      id: contextId,
      fingerprint,
      contentFingerprint,
      category: contextResponse.context.category.toLowerCase(),
      type: "artifact:web-page",
      title: contextResponse.context.title,
      description: contextResponse.context.description,
      summary: contextResponse.context.summary,
      url: cleanUrl,
      image: pageMetadata.og.image || null,
      favicon: pageMetadata.og.favicon || null,
      highlightText: "", // Legacy field
      highlightElements, // New field with XPath and position data
    };

    try {
      logger.info("💾 Creating new DOM context:", contextData);
      await createContextWithEmbedding(contextData, tabProxy, cleanUrl);
    } catch (error) {
      logger.error("❌ Failed to create DOM context:", error);
    }
  } else {
    logger.info(
      "⏭️ Skipping DOM context creation:",
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
  tabProxy: DatabaseProxy,
  fingerprint: string
): Promise<ExistingContext | undefined> {
  const existingUrlContext = await tabProxy.getContextByFingerprint(
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

function countInvalidTextOccurrences(elementBatch: any[]): Map<string, number> {
  const invalidTextCounts = new Map<string, number>();

  elementBatch.forEach((element) => {
    const text = element.text || "";
    const normalizedText = text.toLowerCase().trim();

    InvalidContextualTextElementText.forEach((invalidText) => {
      if (normalizedText.includes(invalidText.toLowerCase())) {
        invalidTextCounts.set(
          invalidText,
          (invalidTextCounts.get(invalidText) || 0) + 1
        );
      }
    });
  });

  return invalidTextCounts;
}

type HighlightElement = {
  xpath: string;
  position: { x: number; y: number; width: number; height: number };
};

function selectHighlightElements(
  elementBatch: any[],
  invalidTextCounts: Map<string, number>
): HighlightElement[] {
  return elementBatch
    .filter((element) => {
      const text = element.text || "";
      const textLength = text.trim().length;
      const normalizedText = text.toLowerCase().trim();

      logger.log("🔍 Highlight element:", text);

      // Check if text contains any invalid contextual text that appears >= 2 times
      const containsFrequentInvalidText = InvalidContextualTextElementText.some(
        (invalidText) => {
          const count = invalidTextCounts.get(invalidText) || 0;
          return (
            count >= 2 && normalizedText.includes(invalidText.toLowerCase())
          );
        }
      );

      if (containsFrequentInvalidText) {
        logger.log("❌ Skipping element with frequent invalid text:", text);
        return false;
      }

      // Only highlight elements with substantial text content
      return textLength >= 10 && textLength <= 500;
    })
    .map((element) => {
      const xpathSelector = element.selectors.find(
        (selector: any) => selector.type === "xpath"
      );
      if (!xpathSelector) {
        logger.warn(`⚠️ No XPath selector found for element ID ${element.id}`);
        return null;
      }

      return {
        xpath: xpathSelector.value,
        position: element.position,
      };
    })
    .filter(Boolean) as HighlightElement[];
}

async function createContextWithEmbedding(
  contextData: Omit<UrmindDB["contexts"]["value"], "createdAt" | "updatedAt">,
  tabProxy: DatabaseProxy,
  cleanUrl: string
): Promise<string> {
  const newContextId = await tabProxy.createContext(contextData);
  logger.info("✅ Context created with ID:", newContextId);

  try {
    const embeddingText = `${contextData.title} ${contextData.description} ${contextData.summary}`;
    const embeddingVector = await tabProxy.generateEmbeddingFromText(
      embeddingText
    );

    await tabProxy.createEmbedding({
      id: newContextId,
      vector: embeddingVector,
      metadata: {
        contextId: newContextId,
        type: "context",
        category: contextData.category,
        url: cleanUrl,
      },
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

/**
 * Generate context from element batch using LLM (kept for DOM-based approach)
 */
async function generateContext(
  elementBatch: any[],
  pageMetadata: PageMetadata,
  existingContext?: ExistingContext
): Promise<DOMPageIndexerResponse> {
  return retry(
    async () => {
      const llmResponse = await chromeAi.invoke(
        DOMContextCreatorPrompt({
          contextualElements: elementBatch
            .filter((el) => el.text && el.text.trim().length > 0)
            .map((el) => ({
              id: el.id,
              type: el.type,
              text: el.text!,
              position: el.position,
            })),
          metadata: pageMetadata,
          // @ts-ignore
          existingContext,
        })
      );

      const sanitizedResponse = cleanLLMResponse({
        response: llmResponse,
        requiredFields: ["context", "retentionDecision"],
        preserveFormatting: false,
      }) as unknown as DOMPageIndexerResponse;

      logger.info("Context creator response:", sanitizedResponse);
      return sanitizedResponse;
    },
    {
      retries: 3,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 10000,
      onRetry: (e, attempt) => {
        logger.error("Context creator failed:", e);
        logger.log("Attempt:", attempt);
      },
    }
  );
}
