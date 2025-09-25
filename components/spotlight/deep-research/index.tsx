import { cn } from "@/lib/utils";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  memo,
} from "react";
import {
  MessageSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  Loader,
} from "lucide-react";
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

const researchMessageTabs = [
  {
    id: "answer",
    title: "Answer",
    icon: MessageSquare,
  },
  {
    id: "contexts",
    title: "Contexts",
    icon: FileText,
  },
];

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
    const [activeTab, setActiveTab] = useState("answer");
    const [contextLength, setContextLength] = useState(3);

    // local copy of query before resetState is called
    const [userQuery, setUserQuery] = useState<string | null>(null);
    // Use ref to avoid unnecessary rerenders for tab underline
    const activeTabRef = useRef<HTMLButtonElement | null>(null);
    const [conversations, setConversations] = useState<
      SpotlightConversations[]
    >([]);
    const [activeConversationIndex, setActiveConversationIndex] = useState(0);
    const [activeConversation, setActiveConversation] =
      useState<SpotlightConversations | null>(null);

    const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

    const conversationHistory = useMemo(() => {
      if (!activeConversation) return [];

      const messages = activeConversation.messages;
      const history = [];

      // Get the last 6 messages (3 pairs of user/assistant)
      const lastMessages = messages.slice(-6);

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
      // scroll to end of last ai message
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

    // useEffect(() => {
    //   if (query && deepResearchState === "follow-up") {
    //     queryClient.invalidateQueries({ queryKey: ["conversations", limit] });
    //   }
    // }, [deepResearchState, query]);

    useEffect(() => {
      if (content && activeMessageId && isStreaming && activeConversationId) {
        // update message content in database
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

    const getContextBadgeFontSize = useCallback((count: number) => {
      if (count >= 9) return "text-xs";
      if (count >= 99) return "text-[10px]";
      return "text-[9px]";
    }, []);

    // Loading state
    // if (loading) {
    //   return (
    //     <div className="w-full h-full flex flex-col items-center justify-center py-8 px-4">
    //       <div className="text-center">
    //         <MessageSquare className="w-12 h-12 text-white/40 mx-auto mb-4 animate-pulse" />
    //         <h3 className="text-white/80 text-lg font-medium mb-2">
    //           Loading conversations...
    //         </h3>
    //         <p className="text-white/60 text-sm">
    //           Please wait while we fetch your research results
    //         </p>
    //       </div>
    //     </div>
    //   );
    // }

    if (conversations.length === 0 || !activeConversation) {
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

    return (
      <>
        <div className="w-full min-h-[550px] flex flex-col relative top-0 left-0 py-4 pb-[10em]">
          <div className="w-full flex items-center justify-end pr-1 mb-4">
            {/* Left and right arrow controls */}
            {hasMoreConversations && (
              <div className="flex items-center gap-2">
                <button
                  className={cn(
                    "w-6 h-6 border border-white/10 rounded-full bg-white/20 text-white-100 flex items-center justify-center",
                    activeConversationIndex === 0 &&
                      "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (activeConversationIndex > 0) {
                      const newIndex = activeConversationIndex - 1;
                      setActiveConversationIndex(newIndex);
                      setActiveConversationId(conversations[newIndex]!.id);
                    }
                  }}
                  disabled={activeConversationIndex === 0}
                >
                  <ChevronLeft size={16} strokeWidth={2} />
                </button>

                <button
                  className={cn(
                    "w-6 h-6 border border-white/10 rounded-full bg-white/20 text-white-100 flex items-center justify-center",
                    activeConversationIndex === conversations.length - 1 &&
                      "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (activeConversationIndex < conversations.length - 1) {
                      const newIndex = activeConversationIndex + 1;
                      setActiveConversationIndex(newIndex);
                      setActiveConversationId(conversations[newIndex]!.id);
                    }
                  }}
                  disabled={
                    activeConversationIndex === conversations.length - 1
                  }
                >
                  <ChevronRight size={16} strokeWidth={2} />
                </button>
              </div>
            )}
          </div>
          {activeConversation &&
            activeConversation?.messages.map((msg, idx) => (
              <React.Fragment key={msg.id}>
                <div
                  key={msg.id}
                  className={cn(
                    idx !== 0 && msg.role === "user" && "mt-10",
                    idx !== activeConversation?.messages.length - 1 && "pb-10",
                    idx === activeConversation?.messages.length - 1 && "pb-10",
                    msg.role === "assistant" &&
                      idx !== activeConversation?.messages.length - 1 &&
                      "border-b-[1px] border-b-white-300/20"
                  )}
                >
                  {msg?.role === "user" && (
                    <div className="w-full flex flex-col gap-1 pb-0 px-4">
                      <div className="w-full flex items-center justify-start mb-2">
                        <p
                          className={cn(
                            "text-white font-geistmono",
                            getQueryFontSize(msg?.content ?? "")
                          )}
                        >
                          {msg?.content ?? ""}
                        </p>
                      </div>

                      <div className="relative w-auto flex items-center justify-start gap-4">
                        {/* Base horizontal line */}
                        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/10" />

                        {/* Active tab underline - 6px wider than tab */}
                        {activeTabRef.current && (
                          <div
                            className="absolute bottom-0 h-0.5 bg-white transition-all duration-200 ease-in-out"
                            style={{
                              width: `${
                                activeTabRef.current.offsetWidth + 6
                              }px`,
                              left: `${activeTabRef.current.offsetLeft}px`,
                            }}
                          />
                        )}

                        {researchMessageTabs.map((t) => {
                          const IconComponent = t.icon;
                          return (
                            <button
                              key={t.id}
                              ref={(el) => {
                                if (activeTab === t.id) {
                                  activeTabRef.current = el;
                                }
                              }}
                              // ref={activeTabRef}
                              onClick={() => setActiveTab(t.id)}
                              className={cn(
                                "relative w-auto px-0 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                                activeTab === t.id
                                  ? "text-white"
                                  : "text-white/60 hover:text-white/80"
                              )}
                            >
                              <IconComponent size={14} />
                              <span>{t.title}</span>
                              {t.id === "contexts" && (
                                <span
                                  className={cn(
                                    "bg-white/20 text-white/80 px-1.5 py-0.5 rounded-full",
                                    getContextBadgeFontSize(contextLength)
                                  )}
                                >
                                  {contextLength}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {msg.role === "assistant" &&
                    streamingState === "thinking" &&
                    idx === activeConversation?.messages.length - 1 && (
                      <div className="w-auto flex items-center justify-start ml-3 -translate-y-4 gap-2">
                        <Loader className="w-4 h-4 text-white animate-spin" />
                        <span className="text-white text-xs">Thinking...</span>
                      </div>
                    )}

                  {msg?.role === "assistant" && (
                    <section className="w-full overflow-y-auto px-4">
                      <MarkdownRenderer
                        markdownString={msg?.content ?? ""}
                        className="text-white"
                      />
                    </section>
                  )}
                </div>

                {/* divider */}
                {/* {idx !== activeConversation?.messages.length - 1 && (
                  <div className="w-full h-[1px] bg-white/10 mb-10 mt-5" />
                )} */}
              </React.Fragment>
            ))}
        </div>
        {/* {isUserAtBottom && (
          <div className="absolute bottom-4 right-4 z-10">
            <button
              onClick={() => {
                onScrollToBottom?.();
              }}
              className="flex items-center gap-2 bg-white/90 hover:bg-white text-gray-800 px-3 py-2 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
            >
              <ArrowDown size={16} />
            </button>
          </div>
        )} */}
      </>
    );
  }
);

export default DeepResearchResult;
