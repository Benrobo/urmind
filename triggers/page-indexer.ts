import pageExtractionService, {
  PageMetadata,
} from "@/services/page-extraction/extraction";
import { Task, task } from "./task";
import { chromeAi } from "@/helpers/agent/utils";
import { md5Hash } from "@/lib/utils";
import { Context } from "@/types/context";
import urmindDb from "@/services/db";
import { dbProxy } from "@/services/db-proxy";
import { PageIndexerSystemPrompt } from "@/data/prompt/system/page-indexer.system";
import retry from "async-retry";
import cleanLLMResponse from "@/helpers/clean-llm-response";
import { PageIndexerResponse } from "@/types/page-indexing";
import shortId from "short-uuid";
import { sendDBOperationMessageToContentScript } from "@/helpers/messaging";
import logger from "@/lib/logger";
import { UrmindDB } from "@/types/database";
import { SemanticSearchThreshold } from "@/constant/internal";

type PageIndexerPayload = {
  url: string;
  pageMetadata: PageMetadata;
  tabId: number; // tab ID for database proxy communication
};

const pageIndexerJob: Task<PageIndexerPayload> = task<PageIndexerPayload>({
  id: "page-indexer",
  run: async (payload: PageIndexerPayload) => {
    const { url, pageMetadata, tabId } = payload;
    logger.log("🔍 Indexing page:", url);
    logger.log("📄 Page metadata:", pageMetadata);

    const tabProxy = dbProxy.withTabId(tabId);
    const fingerprint = md5Hash(url);
    const queue = new Map<string, boolean>();

    if (queue.has(fingerprint)) {
      logger.warn("⚠️  Page already in queue:", url);
      return;
    }

    queue.set(fingerprint, true);

    for (const batch of pageMetadata.pageContentBatches) {
      const contentFingerprint = md5Hash(batch);
      const semanticSearchResult = await tabProxy.cosineSimilarity(batch, {
        limit: 5,
      });
      const closelyRelatedContexts = semanticSearchResult.filter(
        (result) => result.score >= SemanticSearchThreshold
      );
      let matchedContext: Context | null = null;
      let matchedContextCategory: string | null = null;

      logger.info("🟠 Full semantic search result:", semanticSearchResult);
      logger.info(
        "🟠 Closely related semantic search result:",
        closelyRelatedContexts
      );

      if (closelyRelatedContexts.length > 0) {
        const matchedContextId = closelyRelatedContexts[0]?.id!;
        matchedContext = (await tabProxy.getContext(matchedContextId)) ?? null;
        matchedContextCategory = matchedContext?.category ?? null;

        logger.info("🟠 Matched context found: ", matchedContext?.title);
      }

      const existingContext = await tabProxy.getContextByFingerprint(
        fingerprint
      );
      const existingContextByContentFingerprint =
        await tabProxy.getContextByContentFingerprint(contentFingerprint);

      if (existingContext?.id && existingContextByContentFingerprint?.id) {
        logger.warn("Context already exists: " + existingContext?.title);
        queue.delete(fingerprint);
        return;
      }

      const response = await retry(
        async () => {
          const response = await chromeAi.invoke(
            PageIndexerSystemPrompt({
              slicedPageContent: batch,
              metadata: pageMetadata,
              ...(matchedContext ? { matchedContext } : {}),
            })
          );

          const sanitizedResponse = cleanLLMResponse({
            response,
            requiredFields: ["context", "retentionDecision"],
            preserveFormatting: false,
          }) as unknown as PageIndexerResponse;

          console.log("Page indexer response:", sanitizedResponse);

          return sanitizedResponse;
        },
        {
          retries: 3,
          factor: 2,
          minTimeout: 1000,
          maxTimeout: 10000,
          onRetry: (e, attempt) => {
            console.error("Page indexer failed:", e);
            console.log("Attempt:", attempt);
          },
        }
      );

      logger.info("🟠 Page indexer response:", response);

      if (response.retentionDecision.keep) {
        const contextId = shortId.generate();
        const context: Context = {
          id: contextId,
          fingerprint,
          contentFingerprint: contentFingerprint,
          category:
            matchedContextCategory ?? response.context?.category ?? "web-page",
          type: "artifact:web-page",
          title: response.context?.title ?? "",
          description: response.context?.description ?? "",
          summary: response.context?.summary ?? "",
          url: url,
          image: pageMetadata.og.image ?? null,
          favicon: pageMetadata.og.favicon ?? null,
        };

        // * Direct IndexedDB operations from the background script do not work; must use content script context
        await tabProxy.createContext(context);

        // create embedding
        const embeddingId = contextId;
        const embeddingContent = [
          context.title,
          context.description,
          context.summary,
          context.url,
          context.category,
        ].join("\n");
        const embeddingMetadata = {
          contextId: contextId,
        };

        const existingEmbedding = await tabProxy.getEmbedding(embeddingId);

        if (existingEmbedding) {
          logger.warn("Embedding already exists: " + embeddingId);
          queue.delete(fingerprint);
          return;
        }

        const embeddingVector = await tabProxy.generateEmbeddingFromText(
          embeddingContent
        );

        const embedding: UrmindDB["embeddings"]["value"] = {
          id: embeddingId,
          metadata: embeddingMetadata,
          vector: embeddingVector,
        };

        await tabProxy.createEmbedding(embedding);

        logger.log("✅ Page indexed:", context);
        logger.log("✅ Embedding created:", embedding);
        queue.delete(fingerprint);
      } else {
        logger.warn("🚨 Page not indexed:", response.retentionDecision.reason);
      }
    }
  },
  onFailure: (error: Error) => {
    logger.error("Page indexing failed:", error);
  },
});

export default pageIndexerJob;
