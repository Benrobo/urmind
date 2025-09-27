import { cn } from "@/lib/utils";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  memo,
} from "react";
import { SpotlightConversations } from "@/types/spotlight";
import MarkdownRenderer from "@/components/markdown";
import { activeConversationStore } from "@/store/conversation.store";
import useStorageStore from "@/hooks/useStorageStore";
import useConversations from "@/hooks/useConversations";
import { sendMessageToBackgroundScriptWithResponse } from "@/helpers/messaging";
import shortUUID from "short-uuid";
import { useQuery } from "@tanstack/react-query";
import queryClient from "@/config/tanstack-query";
import useAiMessageStream from "@/hooks/useAiMessageStream";
import { Context } from "@/types/context";
import ConversationNavigation from "./ConversationNavigation";
import MessageTabs from "./MessageTabs";
import SourcesDisplay from "./SourcesDisplay";
import { Loader, MessageSquare } from "lucide-react";
import Sources from "./Sources";

export type DeepResearchResultProps = {
  deepResearchState: "new" | "follow-up" | null;
  query: string | null;
  resetState: () => void;
  disableInput: () => void;
  showDeepResearch: boolean;
  onScrollToBottom?: (offset?: number) => void;
  isUserAtBottom: boolean;
};

const DeepResearchResult = memo(
  ({
    deepResearchState,
    query,
    resetState,
    disableInput,
    showDeepResearch,
    onScrollToBottom,
    isUserAtBottom,
  }: DeepResearchResultProps) => {
    const [isStreaming, setIsStreaming] = useState(false);
    const {
      value: activeConversationId,
      setValue: setActiveConversationId,
      refresh: refreshActiveConversation,
    } = useStorageStore(activeConversationStore);
    const [activeTab, setActiveTab] = useState<Record<string, string>>({});
    const [contextLength, setContextLength] = useState(0);

    // local copy of query before resetState is called
    const [userQuery, setUserQuery] = useState<string | null>(null);
    const activeTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const allTabRefs = useRef<
      Record<string, Record<string, HTMLButtonElement | null>>
    >({});
    const [conversations, setConversations] = useState<
      SpotlightConversations[]
    >([]);
    const [activeConversationIndex, setActiveConversationIndex] = useState(0);
    const [activeConversation, setActiveConversation] =
      useState<SpotlightConversations | null>(null);

    const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

    const [messageContext, setMessageContext] = useState<Record<
      string,
      Context[]
    > | null>(null);

    const conversationHistory = useMemo(() => {
      if (!activeConversation) return [];

      const messages = activeConversation.messages;
      const history = [];

      // check if assistant response is included
      const assistantResponseIncluded = messages.some(
        (msg) => msg.role === "assistant" && msg.content.trim().length > 0
      );

      if (!assistantResponseIncluded) {
        return [];
      }

      // Get the last 12 messages (6 pairs of user/assistant)
      const lastMessages = messages.slice(-12);

      // Group messages into user/assistant pairs, starting from the end
      for (let i = lastMessages.length - 2; i >= 0; i -= 2) {
        if (history.length >= 3) break;

        const userMessage = lastMessages[i];
        const assistantMessage = lastMessages[i + 1];

        if (userMessage && assistantMessage) {
          history.unshift({
            user: userMessage.content,
            assistant: assistantMessage.content,
          });
        }
      }

      return history;
    }, [activeConversation]);

    const { messageStream, content, streamingState, relatedContexts } =
      useAiMessageStream({
        userQuery: userQuery ?? "",
        conversationHistory,
        isStreaming,
        onComplete: () => {
          setIsStreaming(false);
        },
        onError: (error) => {
          console.error("Failed to stream message:", error);
        },
      });

    // handle semantic matched contexts
    useEffect(() => {
      if (relatedContexts.length > 0 && activeMessageId) {
        const matchedContexts = relatedContexts.map((ctx) => ({
          id: ctx.id,
          fingerprint: ctx.fingerprint,
          contentFingerprint: ctx.contentFingerprint,
          category: ctx.category,
          title: ctx.title,
          description: ctx.description,
          summary: ctx.summary,
          og: ctx.og,
          highlightText: ctx.highlightText,
          highlightElements: ctx.highlightElements,
          type: ctx.type,
          url: ctx.url,
          fullUrl: ctx.fullUrl,
          image: ctx.image,
        })) as Context[];

        if (matchedContexts.length > 0) {
          setMessageContext((prev) => ({
            ...prev,
            [activeMessageId!]: matchedContexts,
          }));
        }

        // update message context ids in database
        const contextIds = matchedContexts.map((ctx) => ctx.id);

        sendMessageToBackgroundScriptWithResponse({
          action: "db-operation",
          payload: {
            operation: "updateMessageContextIds",
            data: {
              conversationId: activeConversationId,
              messageId: activeMessageId,
              contextIds,
            },
          },
        });
      }
    }, [relatedContexts, activeMessageId]);

    const hasMoreConversations = useMemo(
      () => conversations.length > 1,
      [conversations.length]
    );

    const getAllConversations = useCallback(async () => {
      const response = await sendMessageToBackgroundScriptWithResponse({
        action: "db-operation",
        payload: { operation: "getAllConversations" },
      });
      return (response?.result as SpotlightConversations[]) || [];
    }, []);

    useEffect(() => {
      onScrollToBottom?.(450);
    }, []);

    useEffect(() => {
      getAllConversations().then((conversations) => {
        console.log("🔍 Conversations:", conversations);
        setConversations(conversations);
      });
    }, [getAllConversations]);

    useEffect(() => {
      if (activeConversationId !== null) {
        const conversation = conversations.find(
          (c) => c.id === activeConversationId
        );
        if (conversation) {
          setActiveConversation(conversation);
          setActiveConversationIndex(conversations.indexOf(conversation));
        }
      }
    }, [activeConversationId, conversations]);

    useEffect(() => {
      if (deepResearchState !== null) {
        switch (deepResearchState) {
          case "new":
            handleDeepResearchState("new");
            break;
          case "follow-up":
            handleDeepResearchState("follow-up");
            break;
          default:
            break;
        }
      }
    }, [deepResearchState]);

    // Auto-scroll when streaming text updates
    useEffect(() => {
      if (isStreaming && onScrollToBottom) {
        onScrollToBottom();
      }
    }, [messageStream, isStreaming, onScrollToBottom]);

    // Initialize default tab for each message
    useEffect(() => {
      if (activeConversation) {
        const newActiveTab = { ...activeTab };
        activeConversation.messages.forEach((msg) => {
          if (msg.role === "assistant" && !newActiveTab[msg.id]) {
            newActiveTab[msg.id] = "answer";
          }
        });
        setActiveTab(newActiveTab);
      }
    }, [activeConversation]);

    // Update active tab ref when active tab changes
    useEffect(() => {
      Object.entries(activeTab).forEach(([messageId, tabId]) => {
        if (
          allTabRefs.current[messageId] &&
          allTabRefs.current[messageId][tabId]
        ) {
          activeTabRefs.current[messageId] =
            allTabRefs.current[messageId][tabId];
        }
      });
    }, [activeTab]);

    // TODO: Move to background script to persist message content on UI refresh
    // update message content in database when streaming
    useEffect(() => {
      if (content && activeMessageId && isStreaming && activeConversationId) {
        sendMessageToBackgroundScriptWithResponse({
          action: "db-operation",
          payload: {
            operation: "updateMessageContent",
            data: {
              conversationId: activeConversationId,
              messageId: activeMessageId,
              content: content,
            },
          },
        }).catch((error) => {
          console.error("Failed to save message chunk:", error);
        });

        // Update local state
        setConversations((prev) => {
          return prev.map((conversation) => {
            if (conversation.id === activeConversationId) {
              return {
                ...conversation,
                messages: conversation.messages.map((message) => {
                  if (message.id === activeMessageId) {
                    return { ...message, content: content };
                  }
                  return message;
                }),
              };
            }
            return conversation;
          });
        });
      }
    }, [content, activeMessageId, isStreaming, activeConversationId]);

    const createNewConversation = async () => {
      try {
        if (!query || query.trim().length === 0) {
          console.error("No user query");
          return;
        }

        const convId = shortUUID.generate();
        const newConversation: SpotlightConversations = {
          id: convId,
          messages: [
            { id: shortUUID.generate(), role: "user", content: query! },
            { id: shortUUID.generate(), role: "assistant", content: "" },
          ],
        };

        await sendMessageToBackgroundScriptWithResponse({
          action: "db-operation",
          payload: {
            operation: "createConversation",
            data: newConversation,
          },
        });

        setConversations([...conversations, newConversation]);
        setActiveConversationId(convId);
        setActiveConversation(newConversation);
        setActiveMessageId(newConversation.messages[1]?.id!);
        setIsStreaming(true);
        setUserQuery(query!);
        resetState();
        onScrollToBottom?.();
      } catch (err: any) {
        console.error("Failed to create new conversation:", err);
      }
    };

    const appendMessageToConversation = async () => {
      if (!query || query.trim().length === 0) {
        console.error("No user query");
        return;
      }

      try {
        const userMessage = {
          id: shortUUID.generate(),
          role: "user" as "user" | "assistant",
          content: query!,
        };
        const emptyAssistantMessage = {
          id: shortUUID.generate(),
          role: "assistant" as "user" | "assistant",
          content: "",
        };

        console.log({ userMessage, emptyAssistantMessage });

        const appendMessagesData = {
          conversationId: activeConversationId,
          messages: [userMessage, emptyAssistantMessage],
        };

        await sendMessageToBackgroundScriptWithResponse({
          action: "db-operation",
          payload: {
            operation: "appendMessagesToConversation",
            data: appendMessagesData,
          },
        });

        setConversations((prev) => {
          return prev.map((conversation) => {
            if (conversation.id === activeConversationId) {
              return {
                ...conversation,
                messages: [
                  ...conversation.messages,
                  userMessage,
                  emptyAssistantMessage,
                ],
              };
            }
            return conversation;
          });
        });

        console.log("🔄 Setting activeMessageId to:", emptyAssistantMessage.id);

        onScrollToBottom?.(150);
        setActiveMessageId(emptyAssistantMessage.id);
        setIsStreaming(true);
        setUserQuery(query!);
        resetState();
      } catch (err: any) {
        console.error("Failed to append message:", err);
      }
    };

    const handleDeepResearchState = async (state: "new" | "follow-up") => {
      switch (state) {
        case "new":
          await createNewConversation();
          break;
        case "follow-up":
          if (conversations.length > 0) {
            if (activeConversationId) {
              await appendMessageToConversation();
            } else if (
              conversations.length === 0 &&
              query!?.trim().length > 0
            ) {
              await createNewConversation();
            } else {
              console.error("No active conversation id");
            }
          }
          break;
        default:
          console.error("Invalid deep research state");
          break;
      }
    };

    // Memoize font size calculation
    const getQueryFontSize = useCallback((text: string) => {
      const length = text.length;
      if (length <= 20) return "text-xl";
      if (length <= 40) return "text-lg";
      if (length <= 60) return "text-base";
      if (length <= 80) return "text-sm";
      return "text-xs";
    }, []);

    if (conversations.length === 0 || !activeConversation) {
      return <EmptyState />;
    }

    return (
      <>
        <div className="w-full min-h-[550px] flex flex-col relative top-0 left-0 py-4 pb-[10em]">
          <div className="w-full flex items-center justify-end pr-1 mb-4">
            <ConversationNavigation
              hasMoreConversations={hasMoreConversations}
              activeConversationIndex={activeConversationIndex}
              totalConversations={conversations.length}
              onPrevious={() => {
                if (activeConversationIndex > 0) {
                  const newIndex = activeConversationIndex - 1;
                  setActiveConversationIndex(newIndex);
                  setActiveConversationId(conversations[newIndex]!.id);
                }
              }}
              onNext={() => {
                if (activeConversationIndex < conversations.length - 1) {
                  const newIndex = activeConversationIndex + 1;
                  setActiveConversationIndex(newIndex);
                  setActiveConversationId(conversations[newIndex]!.id);
                }
              }}
            />
          </div>
          {activeConversation &&
            activeConversation?.messages.map((msg, idx) => (
              <React.Fragment key={msg.id}>
                <div
                  key={msg.id}
                  className={cn(
                    idx !== 0 && msg.role === "user" && "mt-5",
                    idx !== activeConversation?.messages.length - 1 &&
                      msg.role === "assistant" &&
                      "pb-10",
                    idx === activeConversation?.messages.length - 1 && "pb-10",
                    msg.role === "assistant" &&
                      idx !== activeConversation?.messages.length - 1 &&
                      "border-b-[1px] border-b-white-300/20"
                  )}
                >
                  {msg?.role === "user" && (
                    <div className="w-full flex flex-col gap-1 px-4 pb-2">
                      <p
                        className={cn(
                          "text-white font-geistmono",
                          getQueryFontSize(msg?.content ?? "")
                        )}
                      >
                        {msg?.content ?? ""}
                      </p>
                    </div>
                  )}

                  {msg?.role === "assistant" && (
                    <MessageTabs
                      message={msg}
                      matchedSources={
                        (msg.matchedContexts as Context[])?.length > 0
                          ? (msg.matchedContexts as Context[])
                          : messageContext?.[msg.id] ?? []
                      }
                      activeTab={activeTab[msg.id] || "answer"}
                      onTabChange={(tabId) => {
                        setActiveTab((prev) => ({
                          ...prev,
                          [msg.id]: tabId,
                        }));
                      }}
                      activeTabRefs={activeTabRefs}
                      allTabRefs={allTabRefs}
                      matchedSourcesCount={
                        (msg.matchedContexts as Context[])?.length > 0
                          ? (msg.matchedContexts as Context[])?.length
                          : (messageContext?.[msg.id] ?? [])?.length ?? 0
                      }
                    />
                  )}

                  {/* thinking */}
                  <ThinkingIndicator
                    isVisible={
                      msg.role === "assistant" &&
                      (streamingState === "thinking" ||
                        streamingState === "pending") &&
                      idx === activeConversation?.messages.length - 1 &&
                      isStreaming
                    }
                  />

                  {/* sources */}
                  {msg.role === "assistant" &&
                    activeTab[msg.id] === "answer" && (
                      <SourcesDisplay message={msg} />
                    )}

                  {msg?.role === "assistant" &&
                    activeTab[msg.id] === "answer" && (
                      <section className="w-full overflow-y-auto px-4">
                        <MarkdownRenderer
                          markdownString={msg?.content ?? ""}
                          className="text-white"
                        />
                      </section>
                    )}

                  {/* Sources tab content */}
                  {msg?.role === "assistant" &&
                    activeTab[msg.id] === "sources" && (
                      <div className="w-full">
                        <Sources
                          sources={
                            (msg.matchedContexts as Context[])?.length > 0
                              ? (msg.matchedContexts as Context[])
                              : messageContext?.[msg.id] ?? []
                          }
                        />
                      </div>
                    )}
                </div>
              </React.Fragment>
            ))}
        </div>
      </>
    );
  }
);

export default DeepResearchResult;

interface ThinkingIndicatorProps {
  isVisible: boolean;
}

function ThinkingIndicator({ isVisible }: ThinkingIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div className="w-auto flex items-center justify-start ml-3 gap-2">
      <Loader className="w-4 h-4 text-white animate-spin" />
      <span className="text-white text-xs">Researching...</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="w-full min-h-[350px] flex flex-col items-center justify-center py-8 px-4">
      <div className="text-center">
        <MessageSquare className="w-12 h-12 text-white/40 mx-auto mb-4" />
        <h3 className="text-white/80 text-lg font-medium mb-2">
          No conversations yet
        </h3>
        <p className="text-white/60 text-sm">
          Start a conversation to see your research results here
        </p>
      </div>
    </div>
  );
}
