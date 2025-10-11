import { useQuery } from "@tanstack/react-query";
import { activityManagerStore } from "@/store/activity-manager.store";

export function useActivities() {
  const {
    data: activities = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["activities"],
    queryFn: () => activityManagerStore.getActivities(),
    refetchInterval: 500, // Poll every 2 seconds
  });

  return {
    activities,
    loading,
    error: error?.message || null,
  };
}
