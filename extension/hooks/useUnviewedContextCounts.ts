import { useState, useEffect, useRef, useCallback } from "react";
import { contextViewsStore } from "@/store/context-views.store";
import useStorageStore from "./useStorageStore";
import { md5Hash } from "@/lib/utils";

export default function useUnviewedContextCounts(
  categories: Array<{ id: string; name: string }>,
  allContexts: Array<{ id: string; categorySlug: string }>
) {
  const { value: viewState } = useStorageStore(contextViewsStore);
  const [unviewedCounts, setUnviewedCounts] = useState<Record<string, number>>(
    {}
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastComputedRef = useRef<string>("");

  const computeCounts = useCallback(async () => {
    const counts: Record<string, number> = {};

    for (const category of categories) {
      const count = await contextViewsStore.getUnviewedCountForCategory(
        category.id,
        allContexts
      );
      counts[category.id] = count;
    }

    const countsHash = md5Hash(JSON.stringify(counts));

    setUnviewedCounts(counts);
    if (countsHash !== lastComputedRef.current) {
      lastComputedRef.current = countsHash;
    }
  }, [categories, allContexts]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    computeCounts();

    intervalRef.current = setInterval(computeCounts, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [computeCounts]);

  useEffect(() => {
    computeCounts();
  }, [categories, allContexts, viewState]);

  return unviewedCounts;
}
