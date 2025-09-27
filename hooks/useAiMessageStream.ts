import DeepResearchResult from "@/components/spotlight/deep-research";
import { GeneralSemanticSearchThreshold } from "@/constant/internal";
import { DeepResearchSystemPrompt } from "@/data/prompt/system/deep-research.system";
import { chromeAi, geminiAi } from "@/helpers/agent/utils";
import { sendMessageToBackgroundScriptWithResponse } from "@/helpers/messaging";
import logger from "@/lib/logger";
import { md5Hash, sleep } from "@/lib/utils";
import { Context } from "@/types/context";
import { preferencesStore } from "@/store/preferences.store";
import { generateText, streamText } from "ai";
import { ai_models } from "@/constant/internal";
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

          // console.log("Prompt:", prompt);

          setStreamingState("thinking");

          // Get user preferences for model selection
          const preferences = await preferencesStore.get();

          // Check generation style preference
          if (
            preferences.generationStyle === "online" &&
            preferences.geminiApiKey
          ) {
            try {
              await streamWithOnlineModel(
                prompt,
                userQuery,
                messageStream,
                setMessageStream
              );
            } catch (onlineError) {
              logger.warn(
                "🌐 Online model failed, falling back to local ChromeAI:",
                onlineError
              );
              await streamWithLocalModel(
                prompt,
                userQuery,
                messageStream,
                setMessageStream
              );
            }
          } else {
            // Use local ChromeAI for generation
            await streamWithLocalModel(
              prompt,
              userQuery,
              messageStream,
              setMessageStream
            );
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

      // Get user preferences for threshold
      const preferences = await preferencesStore.get();
      const threshold =
        preferences.embeddingStyle === "online"
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

  const streamWithOnlineModel = async (
    prompt: string,
    userQuery: string,
    messageStream: Record<string, string>,
    setMessageStream: React.Dispatch<
      React.SetStateAction<Record<string, string>>
    >
  ) => {
    const preferences = await preferencesStore.get();
    const genAI = geminiAi(preferences.geminiApiKey);
    const modelName = ai_models.generation.gemini_flash; // Always use Flash for online generation

    logger.log(`🤖 Using online model: ${modelName}`);

    const result = streamText({
      model: genAI(modelName),
      prompt: prompt,
    });

    const msgHash = md5Hash(userQuery);

    for await (const chunk of result.textStream) {
      setMessageStream((prev) => ({
        ...prev,
        [msgHash]: (prev[msgHash] || "") + chunk,
      }));
    }
  };

  const streamWithLocalModel = async (
    prompt: string,
    userQuery: string,
    messageStream: Record<string, string>,
    setMessageStream: React.Dispatch<
      React.SetStateAction<Record<string, string>>
    >
  ) => {
    logger.log("🤖 Using local model: ChromeAI");

    for await (const chunk of await chromeAi.stream(prompt)) {
      const msgHash = md5Hash(userQuery);
      setMessageStream((prev) => ({
        ...prev,
        [msgHash]: (prev[msgHash] || "") + chunk,
      }));
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
