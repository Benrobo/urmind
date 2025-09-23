import { cn } from "@/lib/utils";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  MessageSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SpotlightConversations } from "@/types/spotlight";
import MarkdownRenderer from "@/components/markdown";
import { activeConversationStore } from "@/store/conversation.store";
import useStorageStore from "@/hooks/useStorageStore";
import useConversations from "@/hooks/useConversations";
import { sendMessageToBackgroundScriptWithResponse } from "@/helpers/messaging";
import shortUUID from "short-uuid";

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
  query: string;
  resetState: () => void;
  disableInput: () => void;
};

export default function DeepResearchResult({
  deepResearchState,
  query,
  resetState,
  disableInput,
}: DeepResearchResultProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const {
    value: activeConversationId,
    setValue: setActiveConversationId,
    refresh: refreshActiveConversation,
  } = useStorageStore(activeConversationStore);
  const [activeTab, setActiveTab] = useState("answer");
  const [contextLength, setContextLength] = useState(3);

  // Use ref to avoid unnecessary rerenders for tab underline
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  const [activeConversationIndex, setActiveConversationIndex] = useState(0);
  const [activeConversation, setActiveConversation] =
    useState<SpotlightConversations | null>(null);

  const { conversations, loading: conversationsLoading } = useConversations({
    isStreaming,
    limit: 10,
    mounted: true,
  });

  const hasMoreConversations = useMemo(
    () => conversations.length > 1,
    [conversations.length]
  );

  // Memoize the handler to avoid infinite rerenders
  const handleResearchStateChange = useCallback(async () => {
    if (deepResearchState === "new") {
      // create new conversation
      const convId = shortUUID.generate();
      try {
        await sendMessageToBackgroundScriptWithResponse({
          action: "db-operation",
          payload: {
            operation: "createConversation",
            data: {
              id: convId,
              messages: [
                { id: shortUUID.generate(), role: "user", content: query },
              ],
            },
          },
        });
        setActiveConversationId(convId);
        resetState();
      } catch (error) {
        console.error("Failed to create conversation:", error);
      }
    } else {
      // append query to active conversation
      if (activeConversationId) {
        try {
          await sendMessageToBackgroundScriptWithResponse({
            action: "db-operation",
            payload: {
              operation: "appendMessageToConversation",
              data: {
                conversationId: activeConversationId,
                message: {
                  id: shortUUID.generate(),
                  role: "user",
                  content: query,
                },
              },
            },
          });
        } catch (error) {
          console.error("Failed to append message:", error);
        }
      }
      setIsStreaming(false);
      refreshActiveConversation();
    }
    // eslint-disable-next-line
  }, [
    deepResearchState,
    query,
    setActiveConversationId,
    resetState,
    activeConversationId,
    refreshActiveConversation,
  ]);

  // Only run when deepResearchState changes, not on every render
  useEffect(() => {
    if (deepResearchState !== null) {
      handleResearchStateChange();
    }
    // Only resetState on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      resetState();
    };
    // eslint-disable-next-line
  }, [deepResearchState, handleResearchStateChange]);

  // Only run when deepResearchState or conversations changes
  useEffect(() => {
    if (deepResearchState === "new" && conversations.length > 0) {
      setIsStreaming(true);
      // disableInput();
    }
    // eslint-disable-next-line
  }, [deepResearchState, conversations.length, disableInput]);

  // Memoize the conversation lookup to avoid unnecessary rerenders
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
    // eslint-disable-next-line
  }, [activeConversationId, conversations]);

  // Only refresh on mount
  useEffect(() => {
    refreshActiveConversation();
    // eslint-disable-next-line
  }, []);

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

  // Memoize messages to avoid unnecessary rerenders - moved before early returns
  const renderedMessages = useMemo(
    () =>
      activeConversation?.messages.map((msg, idx) => (
        <div
          key={msg.id}
          className={cn(
            idx === activeConversation?.messages.length - 1 &&
              "pb-10 border-b-[1px] border-b-white-300/20"
          )}
        >
          {msg?.role === "user" && (
            <div className="w-full flex flex-col gap-1 pb-4 px-4">
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
                      width: `${activeTabRef.current.offsetWidth + 6}px`,
                      left: `${activeTabRef.current.offsetLeft}px`,
                    }}
                  />
                )}

                {researchMessageTabs.map((t) => {
                  const IconComponent = t.icon;
                  return (
                    <button
                      key={t.id}
                      ref={activeTab === t.id ? activeTabRef : null}
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

          {msg?.role === "assistant" && (
            <section className="w-full overflow-y-auto px-4">
              <MarkdownRenderer
                markdownString={msg?.content ?? ""}
                className="text-white"
              />
            </section>
          )}
        </div>
      )),
    [
      activeConversation?.messages,
      activeTab,
      contextLength,
      getQueryFontSize,
      getContextBadgeFontSize,
    ]
  );

  // Loading state
  if (conversationsLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center py-8 px-4">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-white/40 mx-auto mb-4 animate-pulse" />
          <h3 className="text-white/80 text-lg font-medium mb-2">
            Loading conversations...
          </h3>
          <p className="text-white/60 text-sm">
            Please wait while we fetch your research results
          </p>
        </div>
      </div>
    );
  }

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
    <div className="w-full h-full flex flex-col relative top-0 left-0 py-4 pb-[10em]">
      <div className="w-full flex items-center justify-end pr-1 mb-4">
        {/* Left and right arrow controls */}
        {hasMoreConversations && (
          <div className="flex items-center gap-2">
            <button
              className={cn(
                "w-6 h-6 border border-white/10 rounded-full bg-white/20 text-white-100 flex items-center justify-center",
                activeConversationIndex === 0 && "opacity-50 cursor-not-allowed"
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
              disabled={activeConversationIndex === conversations.length - 1}
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
      {activeConversation && renderedMessages}
    </div>
  );
}
