import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import {
  MessageSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SpotlightConversations } from "@/types/spotlight";
import { mockSpotlightConversationsV2 } from "@/mock-data/mock-spotlight";
import MarkdownRenderer from "@/components/markdown";
import { activeConversationStore } from "@/store/conversation.store";
import useStorageStore from "@/hooks/useStorageStore";
import useConversations from "@/hooks/useConversations";

export default function DeepResearchResult() {
  return (
    <div className="w-full h-auto flex flex-col relative overflow-y-auto">
      <ResearchMessage />
    </div>
  );
}

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

const conversationControls = [
  {
    id: "left",
    icon: ChevronLeft,
  },
  {
    id: "right",
    icon: ChevronRight,
  },
];

function ResearchMessage() {
  const { value: activeConversationId, setValue: setActiveConversationId } =
    useStorageStore(activeConversationStore);
  const [activeTab, setActiveTab] = useState("answer");
  const [contextLength, setContextLength] = useState(3);
  const [queryText, setQueryText] = useState("user query goes here");
  const [activeTabRef, setActiveTabRef] = useState<HTMLButtonElement | null>(
    null
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeConversationIndex, setActiveConversationIndex] = useState(0);
  const [activeConversation, setActiveConversation] =
    useState<SpotlightConversations | null>(null);

  const { conversations, loading: conversationsLoading } = useConversations({
    isStreaming,
    limit: 10,
  });

  const hasMoreConversations = conversations.length > 1;

  useEffect(() => {
    const availableConversations =
      conversations.length > 0 ? conversations : mockSpotlightConversationsV2;

    if (!activeConversationId) {
      const firstConversation = availableConversations[0];
      if (firstConversation) {
        setActiveConversationId(firstConversation.id);
        setActiveConversation(firstConversation);
        setActiveConversationIndex(0);
      }
    } else {
      const conversation = availableConversations.find(
        (c) => c.id === activeConversationId
      );
      if (conversation) {
        setActiveConversation(conversation);
        setActiveConversationIndex(
          availableConversations.indexOf(conversation)
        );
      }
    }
  }, [activeConversationId, conversations]);

  const getQueryFontSize = (text: string) => {
    const length = text.length;
    if (length <= 20) return "text-xl";
    if (length <= 40) return "text-lg";
    if (length <= 60) return "text-base";
    if (length <= 80) return "text-sm";
    return "text-xs";
  };

  const getContextBadgeFontSize = (count: number) => {
    if (count >= 9) return "text-xs";
    if (count >= 99) return "text-[10px]";
    return "text-[9px]";
  };

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
        {/* left and right arrow paginated button to switch between conversations */}
        {hasMoreConversations &&
          conversationControls.map((control, idx) => (
            <button
              key={control.id}
              className={cn(
                "w-6 h-6 border border-white/10 rounded-full mr-2 mb-2 bg-white/20 text-white-100 flex flex-center",
                activeConversationIndex === 0 &&
                  control.id === "left" &&
                  "opacity-50 cursor-not-allowed",
                activeConversationIndex === conversations.length - 1 &&
                  control.id === "right" &&
                  "opacity-50 cursor-not-allowed"
              )}
            >
              <control.icon
                size={16}
                strokeWidth={2}
                onClick={() => setActiveConversationIndex(idx)}
              />
            </button>
          ))}
      </div>
      {activeConversation &&
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
                      getQueryFontSize(msg?.text ?? "")
                    )}
                  >
                    {msg?.text ?? ""}
                  </p>
                </div>

                <div className="relative w-auto flex items-center justify-start gap-4">
                  {/* Base horizontal line */}
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/10" />

                  {/* Active tab underline - 6px wider than tab */}
                  {activeTabRef && (
                    <div
                      className="absolute bottom-0 h-0.5 bg-white transition-all duration-200 ease-in-out"
                      style={{
                        width: `${activeTabRef.offsetWidth + 6}px`,
                        left: `${activeTabRef.offsetLeft}px`,
                      }}
                    />
                  )}

                  {researchMessageTabs.map((t) => {
                    const IconComponent = t.icon;
                    return (
                      <button
                        key={t.id}
                        ref={activeTab === t.id ? setActiveTabRef : null}
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
                {/* V1.0 */}
                {/* {msg?.parts.map((part, idx) => {
                  switch (part.type) {
                    case "text":
                      return (
                        <MarkdownRenderer
                          markdownString={part.text ?? ""}
                          key={idx}
                          className="text-white"
                        />
                      );
                    case "tool-searchContexts":
                      return (
                        <ExpandableToolCard
                          key={idx}
                          type={"tool-searchContexts"}
                          state={part.state!}
                          input={part.input!}
                          output={part.output!}
                        />
                      );
                    default:
                      return null;
                  }
                })} */}

                <MarkdownRenderer
                  markdownString={msg?.text ?? ""}
                  className="text-white"
                />
              </section>
            )}
          </div>
        ))}
    </div>
  );
}
