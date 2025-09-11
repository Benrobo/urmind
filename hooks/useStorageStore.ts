import { useState, useEffect, useCallback } from "react";
import type { StorageStore } from "@/helpers/storage-store";

/**
 *
 * @description Custom hook to manage a StorageStore instance.
 * Provides methods to get, set, update, and toggle values, along with loading state.
 */
export default function useStorageStore<T>(store: StorageStore<T>) {
  const [value, setValue] = useState<T>(store["defaultValue"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    store.get().then((initialValue) => {
      setValue(initialValue);
      setLoading(false);
    });

    // Subscribe to changes
    const unsubscribe = store.subscribe((newValue) => {
      setValue(newValue);
      setLoading(false);
    });

    return unsubscribe;
  }, [store]);

  const updateValue = useCallback(
    async (newValue: T) => {
      await store.set(newValue);
    },
    [store]
  );

  const updateWithFunction = useCallback(
    async (updater: (current: T) => T) => {
      await store.update(updater);
    },
    [store]
  );

  const toggleValue = useCallback(async () => {
    return await store.toggle();
  }, [store]);

  return {
    value,
    loading,
    setValue: updateValue,
    updateValue: updateWithFunction,
    toggle: toggleValue,
  };
}
