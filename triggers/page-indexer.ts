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

type PageIndexerPayload = {
  url: string;
  pageMetadata: PageMetadata;
  tabId?: number; // Optional tab ID for database proxy communication
};

const pageIndexerJob: Task<PageIndexerPayload> = task<PageIndexerPayload>({
  id: "page-indexer",
  run: async (payload: PageIndexerPayload) => {
    const { url, pageMetadata, tabId } = payload;
    console.log("🔍 Indexing page:", url);
    console.log("📄 Page metadata:", pageMetadata);

    const fingerprint = md5Hash(url);
    const queue = new Map<string, boolean>();

    if (queue.has(fingerprint)) {
      console.log("⚠️  Page already in queue:", url);
      return;
    }

    queue.set(fingerprint, true);

    try {
      const contextData = {
        id: fingerprint,
        fingerprint,
        category: "web-page",
        type: "artifact:web-page" as const,
        title: pageMetadata.title,
        description: pageMetadata.description || "Web page content",
        content: pageMetadata.pageContent || null,
        summary: `Web page: ${pageMetadata.title}`,
        url: url,
        image: pageMetadata.og.image || null,
        favicon: pageMetadata.og.favicon || null,
      };

      const contextId = await dbProxy.createContext(contextData, tabId);
      console.log("✅ Context created successfully with ID:", contextId);

      // Verify the context was actually saved
      const verification = await dbProxy.getContext(fingerprint, tabId);
      console.log("🔍 Context verification:", verification);

      // Get updated contexts list
      const allContextsAfter = await dbProxy.getAllContexts(tabId);
      console.log(
        "📊 Total contexts after creation:",
        allContextsAfter?.length || 0
      );
    } catch (error) {
      console.error("❌ Failed to create context:", error);
    }

    // for (const batch of pageMetadata.pageContentBatches) {
    //   const semanticSearchResult = await urmindDb.embeddings?.cosineSimilarity(
    //     batch,
    //     {
    //       limit: 5,
    //     }
    //   );
    //   const response = await retry(
    //     async () => {
    //       const response = await chromeAi.invoke(
    //         PageIndexerSystemPrompt({
    //           slicedPageContent: batch,
    //           metadata: pageMetadata,
    //         })
    //       );

    //       const sanitizedResponse = cleanLLMResponse({
    //         response,
    //         requiredFields: ["context", "retentionDecision"],
    //         preserveFormatting: false,
    //       }) as unknown as PageIndexerResponse;

    //       console.log("Page indexer response:", sanitizedResponse);

    //       return sanitizedResponse;
    //     },
    //     {
    //       retries: 3,
    //       factor: 2,
    //       minTimeout: 1000,
    //       maxTimeout: 10000,
    //       onRetry: (e, attempt) => {
    //         console.error("Page indexer failed:", e);
    //         console.log("Attempt:", attempt);
    //       },
    //     }
    //   );

    //   console.log("Semantic search result:", semanticSearchResult);
    //   console.log("Page indexer response:", response);
    //   if (response.retentionDecision.keep) {
    //     const context: Context = {
    //       id: shortId.generate(),
    //       fingerprint,
    //       category: response.context?.category ?? "web-page",
    //       type: "artifact:web-page",
    //       title: response.context?.title ?? "",
    //       description: response.context?.description ?? "",
    //       summary: response.context?.summary ?? "",
    //       url: url,
    //       image: pageMetadata.og.image ?? null,
    //       favicon: pageMetadata.og.favicon ?? null,
    //       content: batch,
    //     };

    //     await urmindDb.contexts?.createContext(context);
    //     console.log("✅ Page indexed:", context);
    //     queue.delete(fingerprint);
    //   } else {
    //     console.warn("🚨 Page not indexed:", response.retentionDecision.reason);
    //   }
    // }

    // const summarizedPage = await chromeAi.invoke(`
    //     You are a helpful assistant that summarizes a page.
    //     The page metadata is:
    //     ${JSON.stringify(pageMetadata)}
    //     Please summarize the page and return the summary in detail.
    // `);

    // const context: Context = {
    //   id: fingerprint,
    //   fingerprint,
    //   category: "web-page", //  this would be generated by LLM
    //   type: "artifact:web-page",
    //   title: pageMetadata.title,
    //   description: summarizedPage,
    //   summary: summarizedPage,
    //   url: url,
    //   image: pageMetadata.og.image ?? null,
    //   favicon: pageMetadata.og.favicon ?? null,
    //   content: pageMetadata.pageContent ?? null,
    // };

    // // check if context already exists
    // const existingContext = await urmindDb.contexts?.getContextByFingerprint(
    //   fingerprint
    // );
    // if (existingContext) {
    //   console.log("Context already exists:", existingContext);
    //   return;
    // }

    // // create context
    // await urmindDb.contexts?.createContext(context);

    // console.log("Context created:", context);
  },
  onFailure: (error: Error) => {
    console.error("Page indexing failed:", error);
  },
});

export default pageIndexerJob;
