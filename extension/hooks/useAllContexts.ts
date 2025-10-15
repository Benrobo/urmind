import { useQuery } from "@tanstack/react-query";
import { sendMessageToBackgroundScriptWithResponse } from "@/helpers/messaging";
import { SavedContext } from "@/types/context";

export default function useAllContexts() {
  const { data: contexts = [], isLoading: loading } = useQuery({
    queryKey: ["allContexts"],
    queryFn: async () => {
      const response = await sendMessageToBackgroundScriptWithResponse({
        action: "db-operation",
        payload: {
          operation: "getAllContexts",
        },
      });

      return response?.result || [];
    },
    staleTime: 0, // Always consider data stale for real-time updates
    refetchInterval: 1000, // Refetch every second to catch new contexts
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  return { contexts, loading };
}
