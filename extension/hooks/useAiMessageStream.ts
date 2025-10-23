import {
  GeneralSemanticSearchThreshold,
  GEMINI_NANO_MAX_TOKENS_PER_PROMPT,
} from "@/constant/internal";
import { DeepResearchSystemPrompt } from "@/data/prompt/system/deep-research.system";
import { sendMessageToBackgroundScriptWithResponse } from "@/helpers/messaging";
import logger from "@/lib/logger";
import { md5Hash, sleep, estimateTokenCount } from "@/lib/utils";
import { Context } from "@/types/context";
import { preferencesStore } from "@/store/preferences.store";
import React, { useEffect, useState } from "react";
import {
  generateSearchQuery,
  getAllContextCategories,
} from "@/helpers/search-query-generator";
import { AIService } from "@/services/ai.service";
import { DeepResearchResult as DeepResearchResultType } from "@/types/search";

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

          // TODO: For now, we're not using the optimized search query (to reduce latency)
          // const optimizedSearchQuery = await generateSearchQuery(
          //   userQuery,
          //   conversationHistory,
          //   availableCategories
          // );

          const optimizedSearchQuery = userQuery;

          logger.log(
            `Using optimized search query: "${optimizedSearchQuery}" for user query: "${userQuery}"`
          );

          const relatedContexts = await findRelatedContexts(
            optimizedSearchQuery
          );

          logger.log("Related contexts:", relatedContexts?.displayContexts);

          const prompt = DeepResearchSystemPrompt({
            userQuery,
            conversationHistory,
            relatedContexts: relatedContexts.injectedContexts,
          });

          // console.log("Prompt:", prompt);

          // Use the centralized AI service for streaming
          const msgHash = md5Hash(userQuery);

          // Clear any existing message for this query to ensure fresh start
          setMessageStream((prev) => ({
            ...prev,
            [msgHash]: "",
          }));

          let hasReceivedFirstChunk = false;
          let totalCharactersReceived = 0;

          await AIService.streamText({
            prompt,
            onChunk: (chunk: string) => {
              // console.log("message stream >>>", chunk);

              if (!hasReceivedFirstChunk && chunk.trim().length > 0) {
                totalCharactersReceived += chunk.length;

                if (totalCharactersReceived >= 2) {
                  setStreamingState("streaming");
                  hasReceivedFirstChunk = true;
                }
              }

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

          // Provide more specific error messages for common issues
          if (
            err.message?.toLowerCase().includes("input is too large") ||
            err.message?.toLowerCase().includes("quotaexceedederror")
          ) {
            const enhancedError = new Error(
              "The context is too large for processing. Try asking a more specific question or check your internet connection for online processing."
            );
            onError(enhancedError);
          } else {
            onError(err);
          }
        }
      })();
    }
  }, [userQuery, isStreaming]);

  const findRelatedContexts = async (userQuery: string) => {
    try {
      const preferences = await preferencesStore.get();
      const mode =
        preferences?.generationStyle === "online" ? "online" : "local";

      const contextSearch = await sendMessageToBackgroundScriptWithResponse({
        action: "db-operation",
        payload: {
          operation: "semanticSearchDeepResearch",
          data: {
            query: userQuery,
            limit: mode === "online" ? 10 : 3, // Much fewer contexts for local processing
          },
        },
      });

      // Use more aggressive filtering for local processing to avoid "input too large" errors
      const threshold =
        mode === "online"
          ? GeneralSemanticSearchThreshold.online
          : GeneralSemanticSearchThreshold.offline; // Higher threshold for local processing

      const deepResearchResult =
        contextSearch?.result as DeepResearchResultType;

      let matchedContexts = deepResearchResult?.displayContexts?.filter(
        (context: any) => context.score >= threshold
      );
      let matchedInjectedContexts =
        deepResearchResult?.injectedContexts?.filter(
          (context: any) => context.score >= threshold
        );

      if (mode === "local") {
        const sortedInjectedContexts = [
          ...(matchedInjectedContexts || []),
        ].sort((a, b) => b.score - a.score);
        const sortedDisplayContexts = [...(matchedContexts || [])].sort(
          (a, b) => b.score - a.score
        );

        let totalTokens = 0;
        const filteredInjectedContexts: typeof matchedInjectedContexts = [];
        const filteredDisplayContexts: typeof matchedContexts = [];

        for (let i = 0; i < sortedInjectedContexts.length; i++) {
          const injectedContext = sortedInjectedContexts[i];
          const displayContext = sortedDisplayContexts[i];

          if (!injectedContext || !displayContext) continue;

          const contextText = `**${injectedContext.title}**\n${
            injectedContext.description
          }\n\nContent:\n${injectedContext.content.join("\n\n")}`;
          const contextTokens = estimateTokenCount(contextText);

          if (
            totalTokens + contextTokens <=
            GEMINI_NANO_MAX_TOKENS_PER_PROMPT
          ) {
            filteredInjectedContexts.push(injectedContext);
            filteredDisplayContexts.push(displayContext);
            totalTokens += contextTokens;
          } else {
            break;
          }
        }

        matchedInjectedContexts = filteredInjectedContexts;
        matchedContexts = filteredDisplayContexts;
      }

      setRelatedContexts(matchedContexts);

      if (mode === "local") {
        logger.log(
          `Local mode: ${deepResearchResult?.injectedContexts?.length || 0} → ${
            matchedInjectedContexts?.length || 0
          } contexts (${GEMINI_NANO_MAX_TOKENS_PER_PROMPT} token limit)`
        );
      }

      return {
        displayContexts: matchedContexts,
        injectedContexts: matchedInjectedContexts,
      };
    } catch (err: any) {
      console.error("Error finding related contexts:", err);
      return {
        displayContexts: [],
        injectedContexts: [],
      } as DeepResearchResultType;
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
