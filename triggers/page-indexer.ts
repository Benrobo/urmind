import pageExtractionService, {
  PageMetadata,
} from "@/services/page-extraction/extraction";
import { Task, task } from "./task";

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
  },
  onFailure: (error: Error) => {
    console.error("Page indexing failed:", error);
  },
});

export default pageIndexerJob;
