import DeepResearchResult from "@/components/spotlight/deep-research";
import { SemanticSearchThreshold } from "@/constant/internal";
import { DeepResearchSystemPrompt } from "@/data/prompt/system/deep-research.system";
import { chromeAi } from "@/helpers/agent/utils";
import { sendMessageToBackgroundScriptWithResponse } from "@/helpers/messaging";
import logger from "@/lib/logger";
import { md5Hash, sleep } from "@/lib/utils";
import { Context } from "@/types/context";
import React, { useEffect, useState } from "react";

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

          const relatedContexts = await findRelatedContexts(userQuery);

          logger.log("Related contexts:", relatedContexts);

          const prompt = DeepResearchSystemPrompt({
            userQuery,
            conversationHistory,
            relatedContexts,
          });

          setStreamingState("streaming");

          for await (const chunk of await chromeAi.stream(prompt)) {
            const msgHash = md5Hash(userQuery);
            const content = messageStream[msgHash] ?? "" + chunk;
            setMessageStream((prev) => {
              return {
                ...prev,
                [msgHash]: prev[msgHash] + content,
              };
            });
          }
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

      const matchedContexts = (
        contextSearch?.result as Array<Context & { score: number }>
      )?.filter((context) => context.score >= SemanticSearchThreshold);

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
    content: messageStream[md5Hash(userQuery)],
    setStreamingState,
    setMessageStream,
    relatedContexts,
  };
}
