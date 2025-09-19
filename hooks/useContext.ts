import urmindDb from "@/services/db";
import { Context } from "@/types/context";
import { useQuery } from "@tanstack/react-query";

type SavedContext = Context & { createdAt: number };

type SavedContextProps = {
  query?: string;
  limit?: number;
};

export default function useSavedContext({ query, limit }: SavedContextProps) {
  const {
    data: contexts = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["saved-contexts", query, limit],
    queryFn: async () => {
      if (query && query?.length > 0) {
        const semanticSearchResult =
          await urmindDb.embeddings?.cosineSimilarity(query, {
            limit: limit ?? 5,
          });

        const contexts = await Promise.all(
          semanticSearchResult?.map((result) =>
            urmindDb.contexts?.getContext(result.id)
          ) ?? []
        );

        const filteredContexts = contexts?.filter(
          (context) => context !== undefined
        );

        return filteredContexts ?? [];
      } else {
        const contexts = await urmindDb.contexts?.getAllContexts();
        const filteredContexts = contexts
          ?.filter((context) => context !== undefined)
          .slice(0, limit ?? 5);
        return filteredContexts ?? [];
      }
    },
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchIntervalInBackground: true, // Keep refetching even when tab is not active
    staleTime: 2000, // Consider data stale after 2 seconds
    gcTime: 10000, // Keep in cache for 10 seconds
  });

  return {
    contexts,
    loading,
    error: error?.message || null,
    refetch,
  };
}
