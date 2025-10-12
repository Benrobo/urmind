import DeepResearchResult from "@/components/spotlight/deep-research";
import { GeneralSemanticSearchThreshold } from "@/constant/internal";
import { DeepResearchSystemPrompt } from "@/data/prompt/system/deep-research.system";
import { chromeAi, geminiAi } from "@/helpers/agent/utils";
import { sendMessageToBackgroundScriptWithResponse } from "@/helpers/messaging";
import logger from "@/lib/logger";
import { md5Hash, sleep } from "@/lib/utils";
import { Context } from "@/types/context";
import { preferencesStore } from "@/store/preferences.store";
import { ai_models } from "@/constant/internal";
import React, { useEffect, useState } from "react";
import {
  generateSearchQuery,
  getAllContextCategories,
} from "@/helpers/search-query-generator";
import { AIService } from "@/services/ai.service";

type StreamingState =
  | "pending"
  | "thinking"
  | "streaming"
  | "completed"
  | "error";

type Props = {
  userQuery: string;
  conversationHistory: Array<{
    user: string;
    assistant: string;
  }>;
  isStreaming: boolean;
  onComplete: () => void;
  onError: (error: Error) => void;
};

export default function useAiMessageStream({
  userQuery,
  conversationHistory,
  isStreaming,
  onComplete,
  onError,
}: Props) {
  const [streamingState, setStreamingState] =
    useState<StreamingState>("pending");
  const [messageStream, setMessageStream] = useState<Record<string, string>>(
    {}
  );
  const [relatedContexts, setRelatedContexts] = useState<
    Array<Context & { score: number }>
  >([]);

  useEffect(() => {
    if (userQuery.trim().length > 0) {
      setMessageStream((prev) => ({
        ...prev,
        [md5Hash(userQuery)]: "",
      }));
    }
  }, [userQuery]);

  useEffect(() => {
    if (userQuery.trim().length > 0 && isStreaming) {
      (async () => {
        try {
          setStreamingState("thinking");

          // Generate an optimized search query using context categories and conversation history
          const availableCategories = await getAllContextCategories();

          const optimizedSearchQuery = await generateSearchQuery(
            userQuery,
            conversationHistory,
            availableCategories
          );

          logger.log(
            `Using optimized search query: "${optimizedSearchQuery}" for user query: "${userQuery}"`
          );

          const relatedContexts = await findRelatedContexts(
            optimizedSearchQuery
          );

          logger.log("Related contexts:", relatedContexts);

          const prompt = DeepResearchSystemPrompt({
            userQuery,
            conversationHistory,
            relatedContexts: relatedContexts ?? [],
          });

          // console.log("Prompt:", prompt);

          setStreamingState("streaming");

          // Use the centralized AI service for streaming
          const msgHash = md5Hash(userQuery);
          await AIService.streamText({
            prompt,
            onChunk: (chunk: string) => {
              // console.log("message stream >>>", chunk);
              setMessageStream((prev) => ({
                ...prev,
                [msgHash]: (prev[msgHash] || "") + chunk,
              }));
            },
          });

          setStreamingState("completed");
          onComplete();
        } catch (err: any) {
          setStreamingState("error");
          onError(err);
        }
      })();
    }
  }, [userQuery, isStreaming]);

  const findRelatedContexts = async (userQuery: string) => {
    try {
      const contextSearch = await sendMessageToBackgroundScriptWithResponse({
        action: "db-operation",
        payload: {
          operation: "semanticSearch",
          data: {
            query: userQuery,
            limit: 10,
          },
        },
      });

      // Get user preferences for threshold
      const preferences = await preferencesStore.get();
      const hasApiKey = preferences?.geminiApiKey?.trim();
      const threshold = hasApiKey
        ? GeneralSemanticSearchThreshold.online
        : GeneralSemanticSearchThreshold.offline;

      const matchedContexts = (
        contextSearch?.result as Array<Context & { score: number }>
      )?.filter((context) => context.score >= threshold);

      setRelatedContexts(matchedContexts);

      return matchedContexts;
    } catch (err: any) {
      console.error("Error finding related contexts:", err);
      return [];
    }
  };

  return {
    streamingState,
    messageStream,
    content: messageStream[md5Hash(userQuery)] ?? "",
    setStreamingState,
    setMessageStream,
    relatedContexts,
  };
}
