import pageExtractionService, {
  PageMetadata,
} from "@/services/page-extraction/extraction";
import { Task, task } from "./task";
import { chromeAi } from "@/helpers/agent/utils";

type PageIndexerPayload = {
  url: string;
  pageMetadata: PageMetadata;
};

const pageIndexerJob: Task<PageIndexerPayload> = task<PageIndexerPayload>({
  id: "page-indexer",
  run: async (payload: PageIndexerPayload) => {
    const { url, pageMetadata } = payload;
    console.log("Indexing page:", url);
    console.log("Page metadata:", pageMetadata);

    const summarizedPage = await chromeAi.invoke(`
        You are a helpful assistant that summarizes a page.
        The page metadata is:
        ${JSON.stringify(pageMetadata)}
        Please summarize the page and return the summary in detail.
    `);

    console.log("Summarized page:", summarizedPage);
  },
  onFailure: (error: Error) => {
    console.error("Page indexing failed:", error);
  },
});

export default pageIndexerJob;
