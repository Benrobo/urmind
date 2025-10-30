import { PageMetadata } from "@/services/page-extraction/extraction";
import { Task, task } from "./task";
import { chromeAI, geminiAi } from "@/helpers/agent/utils";
import { preferencesStore } from "@/store/preferences.store";
import { generateText, streamText } from "ai";
import { ai_models } from "@/constant/internal";
import { md5Hash, cleanUrlForFingerprint } from "@/lib/utils";
import urmindDb from "@/services/db";
import { InitialContextCreatorPrompt } from "@/data/prompt/system/page-indexer.system";
import retry from "async-retry";
import cleanLLMResponse from "@/helpers/clean-llm-response";
import { PageIndexerResponse } from "@/types/page-indexing";
import shortId from "short-uuid";
import logger from "@/lib/logger";
import { UrmindDB } from "@/types/database";
import { activityManagerStore } from "@/store/activity-manager.store";
import { QueueStore } from "@/store/queue.store";
import { manualIndexingStore } from "@/store/manual-indexing.store";
import { domainBlacklistStore } from "@/store/domain-blacklist.store";

export type PageIndexerPayload = {
  url: string;
  pageMetadata: PageMetadata;
  tabId: number;
  internalTrigger?: boolean;
  manualTrigger?: boolean;
};

export const pageIndexerQueue = new QueueStore<PageIndexerPayload>(
  "local:page_indexer_queue"
);

const pageIndexerJob: Task<PageIndexerPayload> = task<PageIndexerPayload>({
  id: "page-indexer",
  run: async (payload: PageIndexerPayload) => {
    const { url, pageMetadata, tabId, manualTrigger } = payload;

    // Early validation checks
    if (!(await validateIndexingRequirements(url, manualTrigger))) {
      return;
    }

    logger.log.setConfig({ global: true })("🔍 Indexing page:", url);
    logger.log.setConfig({ global: true })("📄 Page metadata:", pageMetadata);

    const cleanUrl = cleanUrlForFingerprint(url);
    const fingerprint = md5Hash(cleanUrl);

    // Handle queue logic
    const shouldProcess = await handleQueueLogic(fingerprint, payload);
    if (!shouldProcess) {
      return;
    }

    // Track the indexing activity
    const activityId = await activityManagerStore.track({
      title: "Page Indexing",
      description: `Indexing ${url}`,
      status: "in-progress",
    });

    // Update manual indexing store if this is a manual trigger
    if (payload.manualTrigger) {
      await manualIndexingStore.setStatus(cleanUrl, "processing");
    }

    try {
      await processPageIndexing({
        activityId,
        fingerprint,
        cleanUrl,
        url,
        pageMetadata,
      });

      // Mark activity as completed
      await activityManagerStore.updateActivity(activityId, {
        status: "completed",
        description: `Successfully indexed ${url}`,
      });

      // Update queue item status to completed
      await pageIndexerQueue.updateStatus(fingerprint, "completed");

      // Update manual indexing store if this is a manual trigger
      if (payload.manualTrigger) {
        await manualIndexingStore.setStatus(cleanUrl, "completed");
      }

      // Log queue state and process next item
      await logQueueStateAndProcessNext();
    } catch (error) {
      // Mark activity as failed
      await activityManagerStore.updateActivity(activityId, {
        status: "failed",
        description: `Failed to index ${url}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });

      // Update queue item status to failed
      await pageIndexerQueue.updateStatus(fingerprint, "failed");

      // Update manual indexing store if this is a manual trigger
      if (payload.manualTrigger) {
        await manualIndexingStore.setStatus(cleanUrl, "failed");
      }

      throw error;
    }
  },
  onFailure: (error: Error) => {
    logger.error.setConfig({ global: true })("Page indexing failed:", error);
  },
});

export default pageIndexerJob;

async function processPageIndexing(props: {
  activityId: string;
  fingerprint: string;
  cleanUrl: string;
  url: string;
  pageMetadata: PageMetadata;
}): Promise<void> {
  const { activityId, fingerprint, cleanUrl, url, pageMetadata } = props;

  if (!urmindDb.contexts) {
    logger.error.setConfig({ global: true })(
      "❌ Contexts service not available"
    );
    throw new Error("Contexts service not available");
  }

  const existingContext = await urmindDb.contexts.getContextByFingerprint(
    fingerprint
  );
  if (existingContext) {
    logger.warn.setConfig({ global: true })(
      "✅ Context already exists for clean url:",
      cleanUrl
    );
    return;
  }

  // NEW VALIDATION: Check if pageContentBatches has content
  if (
    !pageMetadata?.pageContentBatches ||
    pageMetadata.pageContentBatches.length === 0
  ) {
    logger.error.setConfig({ global: true })(
      "❌ Page content batches is empty - cannot create context"
    );

    // Update activity status to failed
    await activityManagerStore.updateActivity(activityId, {
      status: "failed",
      description: `Failed to index ${url}: No page content extracted`,
    });

    // Update queue status to failed
    await pageIndexerQueue.updateStatus(fingerprint, "failed");

    throw new Error("Page content batches is empty");
  }

  const firstContext = pageMetadata.pageContentBatches[0];
  if (!firstContext) {
    logger.error.setConfig({ global: true })(
      "❌ First context batch is undefined"
    );
    await activityManagerStore.updateActivity(activityId, {
      status: "failed",
      description: `Failed to index ${url}: First context batch is undefined`,
    });
    await pageIndexerQueue.updateStatus(fingerprint, "failed");
    throw new Error("First context batch is undefined");
  }

  const parentContext = await generateParentContext({
    batch: firstContext,
    pageMetadata,
    fingerprint,
    cleanUrl,
    fullUrl: url,
    contentFingerprint: md5Hash(firstContext),
  });

  if (parentContext?.continue == false || parentContext?.context?.id == null) {
    logger.error.setConfig({ global: true })("Failed to create parent context");
    // Update queue item status to failed
    await pageIndexerQueue.updateStatus(fingerprint, "failed");

    // add to activity manager
    await activityManagerStore.updateActivity(activityId, {
      status: "failed",
      description: `Failed to create parent context`,
    });

    await manualIndexingStore.setStatus(cleanUrl, "failed");

    // Process next queue item after failure
    await processNextQueueItem();
    return;
  }

  // Process remaining batches
  const remainingBatches = pageMetadata?.pageContentBatches?.slice(1);
  if (remainingBatches.length > 0) {
    for (const batch of remainingBatches) {
      const chunkContext = await generateChunkContext({
        batch,
        fingerprint,
        cleanUrl,
        fullUrl: url,
        parentContext: parentContext.context,
      });
      if (chunkContext == false) {
        logger.error.setConfig({ global: true })(
          "Failed to create chunk context"
        );
        continue;
      } else {
        logger.info.setConfig({ global: true })(
          "✅ Chunk context created successfully"
        );
      }
    }
  }

  logger.info.setConfig({ global: true })(
    `✅ All contexts created successfully: "${cleanUrl}"`
  );
}

export async function validateIndexingRequirements(
  urlOrManualTrigger: string | boolean,
  manualTrigger?: boolean
): Promise<boolean> {
  const preferences = await preferencesStore.get();
  const indexingMode = await preferencesStore.getIndexingMode();
  const hasApiKey = preferences?.geminiApiKey?.trim();

  let url: string | undefined;
  let isManual: boolean;

  if (typeof urlOrManualTrigger === "string") {
    url = urlOrManualTrigger;
    isManual = manualTrigger ?? false;
  } else {
    isManual = urlOrManualTrigger;
  }

  if (!hasApiKey) {
    logger.warn.setConfig({ global: true })(
      "🚫 No API key found, skipping page indexing"
    );
    return false;
  }

  if (url) {
    const isBlacklisted = await domainBlacklistStore.isDomainBlacklisted(url);
    if (isBlacklisted) {
      logger.warn.setConfig({ global: true })(
        "🚫 Domain is blacklisted, skipping indexing"
      );
      return false;
    }
  }

  if (indexingMode === "disabled") {
    logger.warn("🚫 Indexing is disabled, skipping page indexing");
    return false;
  }

  if (indexingMode === "manual" && !isManual) {
    logger.warn("🚫 Manual indexing mode - skipping automatic indexing");
    return false;
  }

  if (indexingMode === "automatic" || isManual) {
    return true;
  }

  return false;
}

async function handleQueueLogic(
  fingerprint: string,
  payload: PageIndexerPayload
): Promise<boolean> {
  // Skip queue duplicate check for internal triggers
  if (payload.internalTrigger === true) {
    logger.log.setConfig({ global: true })(
      "🔄 Internal trigger - skipping queue duplicate check:",
      fingerprint
    );
    return true; // Allow processing immediately
  }

  const existingItem = await pageIndexerQueue.find(fingerprint);

  if (existingItem) {
    return handleExistingQueueItem(fingerprint, existingItem);
  } else {
    return handleNewQueueItem(fingerprint, payload);
  }
}

async function handleExistingQueueItem(
  fingerprint: string,
  existingItem: { status: string }
): Promise<boolean> {
  if (existingItem.status === "failed") {
    // Retry failed item
    logger.log.setConfig({ global: true })(
      "🔄 Retrying failed queue item:",
      fingerprint
    );
    await pageIndexerQueue.updateStatus(fingerprint, "processing");
    return true;
  } else {
    // Item is pending, processing, or completed - skip execution
    logger.log.setConfig({ global: true })(
      "⏭️ Skipping duplicate queue item:",
      fingerprint,
      "Status:",
      existingItem.status
    );
    return false;
  }
}

async function handleNewQueueItem(
  fingerprint: string,
  payload: PageIndexerPayload
): Promise<boolean> {
  // Add new item to queue
  await pageIndexerQueue.add(fingerprint, payload);

  // Check if there are other items currently being processed
  const allItems = await pageIndexerQueue.findAll();
  const processingItems = allItems.filter(
    (item) => item.status === "processing"
  );

  if (processingItems.length > 0) {
    // There's already an item being processed, keep this one as "pending"
    logger.log.setConfig({ global: true })(
      "📋 Added to queue (pending):",
      fingerprint,
      "- Other items processing"
    );
    return false; // Don't process immediately
  } else {
    // No items currently processing, start this one immediately
    await pageIndexerQueue.updateStatus(fingerprint, "processing");
    logger.log.setConfig({ global: true })(
      "🚀 Starting processing immediately:",
      fingerprint
    );
    return true; // Process immediately
  }
}

async function processNextQueueItem(): Promise<void> {
  const nextItem = await pageIndexerQueue.getNext();
  if (nextItem) {
    logger.log.setConfig({ global: true })(
      "🔄 Processing next queue item:",
      nextItem.id
    );
    await pageIndexerQueue.updateStatus(nextItem.id, "processing");
    // Recursively trigger the job with the next item's payload and internalTrigger flag
    await pageIndexerJob.trigger({
      ...nextItem.content,
      internalTrigger: true,
    });
  } else {
    logger.log.setConfig({ global: true })("📭 No more items in queue");
  }
}

async function logQueueStateAndProcessNext(): Promise<void> {
  const allItems = await pageIndexerQueue.findAll();
  logger.log.setConfig({ global: true })(
    "📊 Queue state after completion:",
    allItems.map((item) => `${item.id}:${item.status}`)
  );
  await processNextQueueItem();
}

async function generateParentContext(props: {
  batch: string;
  pageMetadata: PageMetadata;
  fingerprint: string;
  cleanUrl: string;
  fullUrl: string;
  contentFingerprint: string;
}) {
  logger.log.setConfig({ global: true })("🔍 Generating parent context");

  const {
    batch,
    pageMetadata,
    fingerprint,
    cleanUrl,
    fullUrl,
    contentFingerprint,
  } = props;

  let response: {
    continue: boolean;
    context: {
      id: string;
      categorySlug: string;
    } | null;
  } = {
    continue: true,
    context: null,
  };
  const contextResponse = await generateTextContext(batch, pageMetadata);

  if (contextResponse.retentionDecision.keep && contextResponse.context) {
    const categoryLabel = contextResponse.context.category.label;
    const llmGeneratedSlug = contextResponse.context.category.slug;

    const categorySlug = categoryLabel
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

    logger.info.setConfig({ global: true })(
      `Category generation - Label: "${categoryLabel}", LLM Slug: "${llmGeneratedSlug}", Auto Slug: "${categorySlug}"`
    );

    if (!urmindDb.contextCategories) {
      throw new Error("Context categories service not available");
    }

    const existingCategory = await urmindDb.contextCategories.getCategoryBySlug(
      categorySlug
    );
    if (existingCategory) {
      logger.info.setConfig({ global: true })(
        `Category already exists with slug "${categorySlug}": "${existingCategory.label}"`
      );
    } else {
      await urmindDb.contextCategories.getOrCreateCategory(
        categoryLabel,
        categorySlug
      );
      logger.info.setConfig({ global: true })(
        `Created new category: "${categoryLabel}" with slug "${categorySlug}"`
      );
    }

    const contextId = shortId.generate();
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
      const parentContextId = await createParentContextWithEmbedding(
        contextData,
        cleanUrl,
        batch,
        "parent"
      );
      response.context = { id: parentContextId, categorySlug: categorySlug };
      response.continue = true;
      return response;
    } catch (err: any) {
      logger.error.setConfig({ global: true })(
        "Failed to create parent context:",
        err
      );
      response.continue = false;
      return response;
    }
  } else {
    response.continue = false;
    return response;
  }
}

async function generateChunkContext(props: {
  batch: string;
  fingerprint: string;
  cleanUrl: string;
  fullUrl: string;
  parentContext: {
    id: string;
    categorySlug: string;
  };
}) {
  logger.log.setConfig({ global: true })("🔍 Generating chunk context");

  const { batch, cleanUrl, parentContext } = props;

  if (!urmindDb.embeddings) {
    logger.error.setConfig({ global: true })(
      "❌ Embeddings service not available"
    );
    return;
  }

  try {
    // generate and store embedding
    const rawContent = `${batch}`;
    await urmindDb.embeddings.generateAndStore(rawContent, {
      contextId: parentContext.id,
      type: "chunk",
      category: parentContext.categorySlug,
      url: cleanUrl,
    });
    return true;
  } catch (err: any) {
    logger.error.setConfig({ global: true })(
      "Failed to create chunk context:",
      err
    );
    return false;
  }
}

/**
 * Generate context from text batch using LLM
 */
async function generateTextContext(
  batch: string,
  pageMetadata: PageMetadata
): Promise<PageIndexerResponse> {
  return retry(
    async () => {
      const preferences = await preferencesStore.get();

      // Fetch existing categories
      const existingCategories =
        (await urmindDb.contextCategories?.getAllCategories()) || [];
      const categoriesList = existingCategories.map((cat) => ({
        label: cat.label,
        slug: cat.slug,
      }));

      let llmResponse: string;

      if (
        preferences.geminiApiKey?.trim() &&
        preferences?.generationStyle === "online"
      ) {
        try {
          llmResponse = await generateWithOnlineModel(
            batch,
            pageMetadata,
            categoriesList,
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
            categoriesList
          );
        }
      } else {
        llmResponse = await generateWithLocalModel(
          batch,
          pageMetadata,
          categoriesList
        );
      }

      const sanitizedResponse = cleanLLMResponse({
        response: llmResponse,
        requiredFields: ["context", "retentionDecision"],
        preserveFormatting: false,
      }) as unknown as PageIndexerResponse;

      logger.info.setConfig({ global: true })(
        "Text context creator response:",
        sanitizedResponse
      );
      return sanitizedResponse;
    },
    {
      retries: 3,
      factor: 5,
      minTimeout: 1000,
      maxTimeout: 10000,
      onRetry: (e, attempt) => {
        logger.error.setConfig({ global: true })(
          "Text context creator failed:",
          e
        );
        logger.log.setConfig({ global: true })("Attempt:", attempt);
      },
    }
  );
}

async function generateWithOnlineModel(
  batch: string,
  pageMetadata: PageMetadata,
  existingCategories: Array<{ label: string; slug: string }>,
  preferences: any
): Promise<string> {
  const genAI = geminiAi(preferences.geminiApiKey);
  const modelName = ai_models.generation.gemini_flash; // Always use Flash for online generation

  logger.log.setConfig({ global: true })(
    `🤖 Using online model for context generation: ${modelName}`
  );

  const result = await generateText({
    model: genAI(modelName),
    prompt: InitialContextCreatorPrompt({
      pageContent: batch,
      metadata: pageMetadata,
      existingCategories: existingCategories,
    }),
  });

  logger.log.setConfig({ global: true })(
    "✅ Online context generation completed"
  );
  return result.text;
}

async function generateWithLocalModel(
  batch: string,
  pageMetadata: PageMetadata,
  existingCategories: Array<{ label: string; slug: string }>
): Promise<string> {
  logger.log.setConfig({ global: true })(
    "🏠 Using local ChromeAI for context generation"
  );

  const result = await chromeAI.generateText([
    {
      role: "user",
      content: InitialContextCreatorPrompt({
        pageContent: batch,
        metadata: pageMetadata,
        existingCategories: existingCategories,
      }),
    },
  ]);

  logger.log("✅ Local context generation completed");
  return result.text;
}

async function createParentContextWithEmbedding(
  contextData: Omit<UrmindDB["contexts"]["value"], "createdAt" | "updatedAt">,
  cleanUrl: string,
  rawContent: string,
  type: "parent" | "chunk"
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

    const embeddingText = `${contextData.title} ${contextData.description} ${rawContent}`;
    await urmindDb.embeddings.generateAndStore(embeddingText, {
      contextId: newContextId,
      type: type,
      category: contextData.categorySlug,
      url: cleanUrl,
    });
    logger.info("🔮 Embedding created for context:", newContextId);
  } catch (embeddingError) {
    logger.error.setConfig({ global: true })(
      "⚠️ Failed to create embedding:",
      embeddingError
    );

    // Check if it's a WASM-related error
    if (
      embeddingError instanceof Error &&
      embeddingError.message.includes("WebAssembly")
    ) {
      logger.error.setConfig({ global: true })(
        "🚨 WebAssembly error detected. This might be due to CSP restrictions or missing WASM files."
      );
      logger.error.setConfig({ global: true })(
        "💡 Try rebuilding the extension or check browser console for more details."
      );
    }
  }

  return newContextId;
}
