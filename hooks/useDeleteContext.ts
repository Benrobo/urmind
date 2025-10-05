import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessageToBackgroundScriptWithResponse } from "@/helpers/messaging";

type UseDeleteContextProps = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

export default function useDeleteContext({
  onSuccess,
  onError,
}: UseDeleteContextProps = {}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (contextId: string) => {
      const response = await sendMessageToBackgroundScriptWithResponse({
        action: "db-operation",
        payload: {
          operation: "deleteContext",
          data: { id: contextId },
        },
      });

      if (response?.error) {
        throw new Error(response.error);
      }

      return response?.result;
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ["contexts-by-category"] });
      queryClient.invalidateQueries({ queryKey: ["saved-contexts"] });
      queryClient.invalidateQueries({ queryKey: ["context-categories"] });

      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error("Failed to delete context:", error);
      onError?.(error);
    },
  });

  return {
    deleteContext: mutation.mutate,
    deleteContextAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}
