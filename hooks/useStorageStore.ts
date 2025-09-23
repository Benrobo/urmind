import { useState, useEffect, useCallback, useRef } from "react";
import type { StorageStore } from "@/helpers/storage-store";

/**
 *
 * @description Custom hook to manage a StorageStore instance.
 * Provides methods to get, set, update, and toggle values, along with loading state.
 */
export default function useStorageStore<T>(store: StorageStore<T>) {
  const [value, setValue] = useState<T>(store["defaultValue"]);
  const [loading, setLoading] = useState(true);
  const storeRef = useRef(store);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Force initial load with immediate sync
    const loadInitialValue = async () => {
      try {
        const initialValue = await store.get();
        if (isMountedRef.current) {
          setValue(initialValue);
          setLoading(false);
        }
      } catch (error) {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    // Try immediate load first
    loadInitialValue();

    // Also try again after a short delay to catch any race conditions
    const timeoutId = setTimeout(() => {
      loadInitialValue();
    }, 100);

    // Subscribe to changes
    const unsubscribe = store.subscribe((newValue, oldValue) => {
      if (isMountedRef.current) {
        setValue(newValue);
        setLoading(false);
      }
    });

    return () => {
      isMountedRef.current = false;
      clearTimeout(timeoutId);
      unsubscribe();
    };
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

  const refreshValue = useCallback(async () => {
    try {
      const newValue = await store.get();
      if (isMountedRef.current) {
        setValue(newValue);
      }
      return newValue;
    } catch (error) {
      throw error;
    }
  }, [store]);

  return {
    value,
    loading,
    setValue: updateValue,
    updateValue: updateWithFunction,
    toggle: toggleValue,
    refresh: refreshValue,
  };
}
