import urmindDb from "@/services/db";
import { Context } from "@/types/context";
import { useEffect, useState } from "react";

type SavedContext = Context & { createdAt: number };

type SavedContextProps = {
  query?: string;
  limit?: number;
};

export default function useSavedContext({ query, limit }: SavedContextProps) {
  const [contexts, setContexts] = useState<SavedContext[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getContexts(query, limit);
  }, [query]);

  const getContexts = async (query?: string, limit?: number) => {
    try {
      setLoading(true);

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

        setContexts(filteredContexts ?? []);
      } else {
        const contexts = await urmindDb.contexts?.getAllContexts();
        const filteredContexts = contexts
          ?.filter((context) => context !== undefined)
          .slice(0, limit ?? 5);
        setContexts(filteredContexts ?? []);
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    contexts,
    loading,
    error,
  };
}
