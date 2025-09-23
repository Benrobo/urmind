import queryClient from "@/config/tanstack-query";
import logger from "@/lib/logger";
import { SpotlightConversations } from "@/types/spotlight";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { sendMessageToBackgroundScriptWithResponse } from "@/helpers/messaging";

type UseConversationsProps = {
  isStreaming?: boolean;
  limit?: number;
  mounted?: boolean;
};

export default function useConversations({
  isStreaming = false,
  limit = 10,
  mounted = true,
}: UseConversationsProps) {
  const {
    data: conversations = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["conversations", limit],
    queryFn: async () => {
      const response = await sendMessageToBackgroundScriptWithResponse({
        action: "db-operation",
        payload: { operation: "getAllConversations" },
      });

      console.log("🔍 Conversations response:", response);
      return (response?.result as SpotlightConversations[]) || [];
    },
    enabled: !isStreaming && mounted,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // refetchInterval: isStreaming ? false : 5000,
    refetchIntervalInBackground: !isStreaming,
    refetchOnMount: !isStreaming,
    refetchOnWindowFocus: !isStreaming,
    refetchOnReconnect: !isStreaming,
    staleTime: isStreaming ? 0 : 2000,
    gcTime: 5000,
  });

  const logStreaming = useCallback(() => {
    logger.log("isStreaming", isStreaming);
  }, [isStreaming]);

  useEffect(() => {
    logStreaming();
  }, [logStreaming]);

  return {
    conversations,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch: queryClient.refetchQueries({ queryKey: ["conversations", limit] }),
  };
}
