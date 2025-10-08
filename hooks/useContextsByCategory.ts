import { useQuery } from "@tanstack/react-query";
import { sendMessageToBackgroundScriptWithResponse } from "@/helpers/messaging";
import { SavedContext } from "@/types/context";

type UseContextsByCategoryProps = {
  categorySlug: string | null;
  mounted?: boolean;
};

export default function useContextsByCategory({
  categorySlug,
  mounted = true,
}: UseContextsByCategoryProps) {
  const {
    data: contexts = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["contexts-by-category", categorySlug],
    queryFn: async () => {
      if (!categorySlug) {
        return [];
      }

      const response = await sendMessageToBackgroundScriptWithResponse({
        action: "db-operation",
        payload: {
          operation: "getContextsByCategory",
          data: { categorySlug },
        },
      });

      return (response?.result as SavedContext[]) || [];
    },
    enabled: mounted && !!categorySlug,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchIntervalInBackground: true,
    refetchInterval: 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 2000,
    gcTime: 10000,
  });

  return {
    contexts,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}
