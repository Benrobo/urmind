import urmindDb from "@/services/db";
import { SpotlightConversations } from "@/types/spotlight";
import { useQuery } from "@tanstack/react-query";

type UseConversationsProps = {
  isStreaming?: boolean;
  limit?: number;
};

export default function useConversations({
  isStreaming = false,
  limit = 10,
}: UseConversationsProps) {
  const {
    data: conversations = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["conversations", limit],
    queryFn: async () => {
      // TODO: Replace with actual conversation fetching logic
      // For now, return empty array as placeholder
      return [] as SpotlightConversations[];
    },
    enabled: !isStreaming, // Prevent fetching when streaming
    refetchInterval: isStreaming ? false : 5000, // No refetch during streaming
    refetchIntervalInBackground: !isStreaming, // No background refetch during streaming
    staleTime: isStreaming ? 0 : 2000, // Always fresh during streaming
    gcTime: 10000, // Keep in cache for 10 seconds
  });

  return {
    conversations,
    loading,
    error: error?.message || null,
    refetch,
  };
}
