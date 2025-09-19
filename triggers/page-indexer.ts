import pageExtractionService, {
  PageMetadata,
} from "@/services/page-extraction/extraction";
import { Task, task } from "./task";
import { chromeAi } from "@/helpers/agent/utils";
import { md5Hash, cleanUrlForFingerprint } from "@/lib/utils";
import { dbProxy } from "@/services/db-proxy";
import {
  InitialContextCreatorPrompt,
  SummaryUpdaterPrompt,
} from "@/data/prompt/system/page-indexer.system";
import retry from "async-retry";
import cleanLLMResponse from "@/helpers/clean-llm-response";
import { PageIndexerResponse } from "@/types/page-indexing";
import shortId from "short-uuid";
import logger from "@/lib/logger";
import { UrmindDB } from "@/types/database";

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

    let existingContext = await tabProxy.getContextByFingerprint(fingerprint);
    for (let i = 0; i < pageMetadata.pageContentBatches.length; i++) {
      const batch = pageMetadata.pageContentBatches[i];
      if (!batch) {
        logger.warn(`⚠️ Skipping empty batch ${i + 1}`);
        continue;
      }
      logger.info(
        `📄 Processing batch ${i + 1}/${pageMetadata.pageContentBatches.length}`
      );

      let response: PageIndexerResponse;

      if (existingContext && i === 0) {
        logger.info("📝 Updating existing context:", existingContext.title);

        response = await retry(
          async () => {
            const llmResponse = await chromeAi.invoke(
              SummaryUpdaterPrompt({
                newContent: batch,
                existingContext: {
                  title: existingContext!.title || "",
                  description: existingContext!.description || "",
                  summary: existingContext!.summary || "",
                  category: existingContext!.category || "",
                },
                metadata: pageMetadata,
              })
            );

            const sanitizedResponse = cleanLLMResponse({
              response: llmResponse,
              requiredFields: ["context", "retentionDecision"],
              preserveFormatting: false,
            }) as unknown as PageIndexerResponse;

            logger.info("Summary updater response:", sanitizedResponse);
            return sanitizedResponse;
          },
          {
            retries: 3,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 10000,
            onRetry: (e, attempt) => {
              logger.error("Summary updater failed:", e);
              logger.log("Attempt:", attempt);
            },
          }
        );

        if (response.retentionDecision.keep && response.context) {
          try {
            await tabProxy.updateContext(existingContext.id, {
              title: response.context.title,
              description: response.context.description,
              summary: response.context.summary,
              category: response.context.category,
            });

            try {
              const embeddingText = `${response.context.title} ${response.context.description} ${response.context.summary}`;
              const embeddingVector = await tabProxy.generateEmbeddingFromText(
                embeddingText
              );

              await tabProxy.updateEmbedding(existingContext.id, {
                vector: embeddingVector,
                metadata: {
                  contextId: existingContext.id,
                  type: "context",
                  category: response.context.category,
                  url: cleanUrl,
                },
              });
              logger.info(
                "🔮 Embedding updated for context:",
                existingContext.id
              );
            } catch (embeddingError) {
              logger.error("⚠️ Failed to update embedding:", embeddingError);
            }

            existingContext.title = response.context.title;
            existingContext.description = response.context.description;
            existingContext.summary = response.context.summary;
            existingContext.category = response.context.category;

            logger.info("✅ Context updated successfully");
          } catch (error) {
            logger.error("❌ Failed to update context:", error);
          }
        } else {
          logger.info(
            "⏭️ Skipping context update:",
            response.retentionDecision.reason
          );
        }
      } else if (!existingContext && i === 0) {
        logger.info("🆕 Creating new context for:", url);

        response = await retry(
          async () => {
            const llmResponse = await chromeAi.invoke(
              InitialContextCreatorPrompt({
                pageContent: batch,
                metadata: pageMetadata,
              })
            );

            const sanitizedResponse = cleanLLMResponse({
              response: llmResponse,
              requiredFields: ["context", "retentionDecision"],
              preserveFormatting: false,
            }) as unknown as PageIndexerResponse;

            logger.info("Initial context creator response:", sanitizedResponse);
            return sanitizedResponse;
          },
          {
            retries: 3,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 10000,
            onRetry: (e, attempt) => {
              logger.error("Initial context creator failed:", e);
              logger.log("Attempt:", attempt);
            },
          }
        );

        if (response.retentionDecision.keep && response.context) {
          const contextId = shortId.generate();

          const contextData: Omit<
            UrmindDB["contexts"]["value"],
            "createdAt" | "updatedAt"
          > = {
            id: contextId,
            fingerprint,
            contentFingerprint: md5Hash(batch || ""),
            category: response.context.category,
            type: "artifact:web-page",
            title: response.context.title,
            description: response.context.description,
            summary: response.context.summary,
            url: cleanUrl,
            image: pageMetadata.og.image || null,
            favicon: pageMetadata.og.favicon || null,
            highlightText: "",
          };

          try {
            logger.info("💾 Creating new context:", contextData);
            const newContextId = await tabProxy.createContext(contextData);
            logger.info("✅ Context created with ID:", newContextId);

            try {
              const embeddingText = `${response.context.title} ${response.context.description} ${response.context.summary}`;
              const embeddingVector = await tabProxy.generateEmbeddingFromText(
                embeddingText
              );

              await tabProxy.createEmbedding({
                id: newContextId,
                vector: embeddingVector,
                metadata: {
                  contextId: newContextId,
                  type: "context",
                  category: response.context.category,
                  url: cleanUrl,
                },
              });
              logger.info("🔮 Embedding created for context:", newContextId);
            } catch (embeddingError) {
              logger.error("⚠️ Failed to create embedding:", embeddingError);
            }

            existingContext = await tabProxy.getContext(newContextId);
          } catch (error) {
            logger.error("❌ Failed to create context:", error);
            break;
          }
        } else {
          logger.info(
            "⏭️ Skipping context creation:",
            response.retentionDecision.reason
          );
          break;
        }
      } else if (existingContext && i > 0) {
        logger.info(`📝 Updating context with batch ${i + 1}`);

        response = await retry(
          async () => {
            const llmResponse = await chromeAi.invoke(
              SummaryUpdaterPrompt({
                newContent: batch,
                existingContext: {
                  title: existingContext!.title || "",
                  description: existingContext!.description || "",
                  summary: existingContext!.summary || "",
                  category: existingContext!.category || "",
                },
                metadata: pageMetadata,
              })
            );

            const sanitizedResponse = cleanLLMResponse({
              response: llmResponse,
              requiredFields: ["context", "retentionDecision"],
              preserveFormatting: false,
            }) as unknown as PageIndexerResponse;

            return sanitizedResponse;
          },
          {
            retries: 3,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 10000,
            onRetry: (e, attempt) => {
              logger.error("Summary updater failed:", e);
              logger.log("Attempt:", attempt);
            },
          }
        );

        if (response.retentionDecision.keep && response.context) {
          try {
            await tabProxy.updateContext(existingContext.id, {
              summary: response.context.summary,
              ...(response.context.title !== existingContext.title && {
                title: response.context.title,
              }),
              ...(response.context.description !==
                existingContext.description && {
                description: response.context.description,
              }),
              ...(response.context.category !== existingContext.category && {
                category: response.context.category,
              }),
            });

            try {
              const embeddingText = `${response.context.title} ${response.context.description} ${response.context.summary}`;
              const embeddingVector = await tabProxy.generateEmbeddingFromText(
                embeddingText
              );

              await tabProxy.updateEmbedding(existingContext.id, {
                vector: embeddingVector,
                metadata: {
                  contextId: existingContext.id,
                  type: "context",
                  category: response.context.category,
                  url: cleanUrl,
                },
              });
              logger.info(
                "🔮 Embedding updated for context:",
                existingContext.id
              );
            } catch (embeddingError) {
              logger.error("⚠️ Failed to update embedding:", embeddingError);
            }

            existingContext.summary = response.context.summary;
            if (response.context.title !== existingContext.title)
              existingContext.title = response.context.title;
            if (response.context.description !== existingContext.description)
              existingContext.description = response.context.description;
            if (response.context.category !== existingContext.category)
              existingContext.category = response.context.category;

            logger.info(`✅ Context updated with batch ${i + 1}`);
          } catch (error) {
            logger.error("❌ Failed to update context:", error);
          }
        } else {
          logger.info(
            `⏭️ Skipping batch ${i + 1} update:`,
            response.retentionDecision.reason
          );
        }
      }
    }
  },
  onFailure: (error: Error) => {
    logger.error("Page indexing failed:", error);
  },
});

export default pageIndexerJob;
