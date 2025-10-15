import { useState, useEffect } from "react";
import { sendMessageToBackgroundScriptWithResponse } from "@/helpers/messaging";
import { SavedContext } from "@/types/context";

export default function useAllContexts() {
  const [contexts, setContexts] = useState<SavedContext[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllContexts = async () => {
      try {
        const response = await sendMessageToBackgroundScriptWithResponse({
          action: "db-operation",
          payload: {
            operation: "getAllContexts",
          },
        });

        setContexts(response?.result || []);
      } catch (error) {
        console.error("Failed to fetch all contexts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllContexts();
  }, []);

  return { contexts, loading };
}
