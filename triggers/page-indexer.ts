import { Task, task } from "./task";

type PageIndexerPayload = {
  url: string;
};

const pageIndexerJob: Task<PageIndexerPayload> = task<PageIndexerPayload>({
  id: "page-indexer",
  run: async (payload: PageIndexerPayload) => {
    const { url } = payload;
    console.log("Indexing page:", url);
  },
  onFailure: (error: Error) => {
    console.error("Page indexing failed:", error);
  },
});

export default pageIndexerJob;
