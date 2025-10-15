import { Context, SavedContext } from "@/types/context";
import { useQuery } from "@tanstack/react-query";
import { sendMessageToBackgroundScriptWithResponse } from "@/helpers/messaging";

type SavedContextProps = {
  query?: string;
  limit?: number;
  mounted?: boolean;
};

export default function useSavedContext({
  query,
  limit,
  mounted,
}: SavedContextProps) {
  const {
    data: contexts = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["saved-contexts", query, limit],
    queryFn: async () => {
      if (query && query?.length > 0) {
        const response = await sendMessageToBackgroundScriptWithResponse({
          action: "db-operation",
          payload: {
            operation: "semanticSearch",
            data: { query, limit: limit ?? 5 },
          },
          responseRequired: true,
        });
        return (response?.result as SavedContext[]) || [];
      } else {
        const response = await sendMessageToBackgroundScriptWithResponse({
          action: "db-operation",
          payload: {
            operation: "getAllContexts",
            data: { limit: limit ?? 5 },
          },
        });
        return (response?.result as SavedContext[]) || [];
      }
    },
    enabled: mounted,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // refetchInterval: 5000,
    refetchIntervalInBackground: true,
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
