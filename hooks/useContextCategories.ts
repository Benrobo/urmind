import { useQuery } from "@tanstack/react-query";
import { sendMessageToBackgroundScriptWithResponse } from "@/helpers/messaging";
import { ContextCategory } from "@/types/context";

type UseContextCategoriesProps = {
  mounted?: boolean;
  query?: string;
};

function generateColorFromHash(categoryName: string): string {
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use the hash to generate a hue (0-360)
  const hue = Math.abs(hash) % 360;

  // Generate a vibrant color with good contrast
  const saturation = 70 + (Math.abs(hash) % 10); // 70-100%
  const lightness = 55 + (Math.abs(hash) % 20); // 50-70%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export default function useContextCategories({
  mounted = true,
  query,
}: UseContextCategoriesProps = {}) {
  const {
    data: categories = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["context-categories", query],
    queryFn: async () => {
      const response = await sendMessageToBackgroundScriptWithResponse({
        action: "db-operation",
        payload: {
          operation: "getAllContextCategories",
        },
      });

      const dbCategories = (response?.result as ContextCategory[]) || [];

      const processCategory = (category: ContextCategory) => ({
        id: category.slug,
        name: category.label,
        color: generateColorFromHash(category.label),
        count: 0, // TODO: Add count from database
      });

      let categoriesToReturn = dbCategories;

      if (query) {
        const lowerQuery = query.toLowerCase();
        categoriesToReturn = dbCategories.filter((category) =>
          category.label.toLowerCase().includes(lowerQuery)
        );
      }

      return categoriesToReturn.map(processCategory);
    },
    enabled: mounted,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 2000,
    gcTime: 10000,
  });

  return {
    categories,
    loading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}
