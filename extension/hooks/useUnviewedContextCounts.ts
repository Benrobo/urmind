import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { contextViewsStore } from "@/store/context-views.store";
import useStorageStore from "./useStorageStore";

export default function useUnviewedContextCounts(
  categories: Array<{ id: string; name: string }>,
  allContexts: Array<{ id: string; categorySlug: string }>
) {
  const { value: viewState } = useStorageStore(contextViewsStore);
  const queryClient = useQueryClient();

  const queryKey = [
    "unviewedContextCounts",
    categories.map((c) => c.id).sort(),
    allContexts.map((c) => c.id).sort(),
    viewState,
  ];

  const { data: unviewedCounts = {} } = useQuery({
    queryKey,
    queryFn: async () => {
      const counts: Record<string, number> = {};

      for (const category of categories) {
        const count = await contextViewsStore.getUnviewedCountForCategory(
          category.id,
          allContexts
        );
        counts[category.id] = count;
      }

      return counts;
    },
    staleTime: 0,
    refetchInterval: 500,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    enabled: categories.length > 0 && allContexts.length > 0,
  });

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["unviewedContextCounts"] });
  }, [viewState, queryClient]);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["unviewedContextCounts"] });
  }, [allContexts.length, queryClient]);

  const invalidateUnviewedCounts = () => {
    queryClient.invalidateQueries({ queryKey: ["unviewedContextCounts"] });
  };

  return {
    unviewedCounts,
    invalidateUnviewedCounts,
    isLoading: !unviewedCounts,
  };
}
