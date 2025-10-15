import { useState, useEffect } from "react";
import { contextViewsStore } from "@/store/context-views.store";
import useStorageStore from "./useStorageStore";

export default function useUnviewedContextCounts(
  categories: Array<{ id: string; name: string }>,
  allContexts: Array<{ id: string; categorySlug: string }>
) {
  const { value: viewState } = useStorageStore(contextViewsStore);
  const [unviewedCounts, setUnviewedCounts] = useState<Record<string, number>>(
    {}
  );

  useEffect(() => {
    const computeCounts = async () => {
      const counts: Record<string, number> = {};

      for (const category of categories) {
        const count = await contextViewsStore.getUnviewedCountForCategory(
          category.id,
          allContexts
        );
        counts[category.id] = count;
      }

      setUnviewedCounts(counts);
    };

    computeCounts();
  }, [categories, allContexts, viewState]);

  return unviewedCounts;
}
