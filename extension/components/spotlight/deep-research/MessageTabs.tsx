import { cn } from "@/lib/utils";
import React, { useRef } from "react";
import { MessageSquare, FileText, Globe } from "lucide-react";
import { SpotlightConversationMessage } from "@/types/spotlight";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { Context } from "@/types/context";
import { needsUIAdjustments } from "@/constant/ui-config";

const researchMessageTabs = [
  {
    id: "answer",
    title: "Answer",
    icon: MessageSquare,
  },
  {
    id: "sources",
    title: "Sources",
    icon: FileText,
  },
];

interface MessageTabsProps {
  message: SpotlightConversationMessage;
  matchedSources: Context[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  activeTabRefs: React.MutableRefObject<
    Record<string, HTMLButtonElement | null>
  >;
  allTabRefs: React.MutableRefObject<
    Record<string, Record<string, HTMLButtonElement | null>>
  >;
  matchedSourcesCount: number;
}

export default function MessageTabs({
  message,
  matchedSources,
  activeTab,
  onTabChange,
  activeTabRefs,
  allTabRefs,
  matchedSourcesCount,
}: MessageTabsProps) {
  const _needsUIAdjustments = needsUIAdjustments.find((adjustment) =>
    new URL(window.location.href).hostname.includes(adjustment.domain)
  );

  const deepResearchAdjustments = _needsUIAdjustments?.adjustments;

  const getContextBadgeFontSize = (count: number) => {
    if (count >= 9)
      return deepResearchAdjustments?.deepResearch?.fontSize
        ? "text-[11px]"
        : "text-xs";
    if (count >= 99)
      return deepResearchAdjustments?.deepResearch?.fontSize
        ? "text-[10px]"
        : "text-[10px]";
    return deepResearchAdjustments?.deepResearch?.fontSize
      ? "text-[9px]"
      : "text-[9px]";
  };

  return (
    <div className="w-full flex gap-1 pb-3 px-4">
      <div className="relative w-full flex items-center justify-start gap-4">
        {/* Base horizontal line */}
        <div className="w-full absolute bottom-0 left-0 right-0 h-[1px] bg-white/10" />

        {/* Active tab underline - 6px wider than tab */}
        {activeTabRefs.current[message.id] && (
          <div
            className="absolute bottom-0 h-0.5 bg-white transition-all duration-200 ease-in-out"
            style={{
              width: `${activeTabRefs.current[message.id]!.offsetWidth + 6}px`,
              left: `${activeTabRefs.current[message.id]!.offsetLeft}px`,
            }}
          />
        )}

        {researchMessageTabs.map((t) => {
          const IconComponent = t.icon;

          //   if (t.id === "sources" && matchedSourcesCount === 0) {
          //     return null;
          //   }

          return (
            <button
              key={t.id}
              ref={(el) => {
                // Store all tab refs for this message
                if (!allTabRefs.current[message.id]) {
                  allTabRefs.current[message.id] = {};
                }
                if (allTabRefs.current[message.id]) {
                  allTabRefs.current[message.id]![t.id] = el;
                }

                // Set active tab ref when this tab is active
                if (activeTab === t.id) {
                  activeTabRefs.current[message.id] = el;
                }
              }}
              onClick={() => {
                onTabChange(t.id);
                // Update the active tab ref immediately
                if (
                  allTabRefs.current[message.id] &&
                  allTabRefs.current[message.id]![t.id]
                ) {
                  activeTabRefs.current[message.id] =
                    allTabRefs.current[message.id]![t.id] || null;
                }
              }}
              className={cn(
                "relative w-auto px-3 py-2 font-medium transition-colors flex items-center justify-center gap-2 group hover:bg-gray-100/20 rounded-md -translate-y-1",
                deepResearchAdjustments?.deepResearch?.fontSize
                  ? "text-[12px]"
                  : "text-sm",
                activeTab === t.id ? "text-white" : "text-white/60"
              )}
            >
              {t.id === "answer" ? (
                <IconComponent
                  size={
                    deepResearchAdjustments?.deepResearch?.iconSize ? 16 : 14
                  }
                />
              ) : (
                <div className="flex max-w-5 -space-x-2 rtl:space-x-reverse mr-3">
                  {matchedSources?.slice(0, 3)?.map((ctx, idx) => (
                    <div key={ctx.id || idx}>
                      {ctx?.og?.favicon ? (
                        <ImageWithFallback
                          src={ctx.og.favicon!}
                          className={cn(
                            "object-contain rounded-full border-3 border-[#5b5b5b] backdrop-blur-sm",
                            deepResearchAdjustments?.deepResearch?.iconSize
                              ? "min-w-8 min-h-8 max-h-8"
                              : "min-h-5 max-w-5 max-h-5"
                          )}
                        />
                      ) : (
                        <Globe
                          size={
                            deepResearchAdjustments?.deepResearch?.iconSize
                              ? 16
                              : 14
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              <span className="group-hover:text-white-100">{t.title}</span>
              {t.id === "sources" && (
                <span
                  className={cn(
                    "bg-white/20 text-white/80 px-1.5 py-0.5 rounded-full group-hover:text-white-100",
                    getContextBadgeFontSize(matchedSourcesCount || 0)
                  )}
                >
                  {matchedSourcesCount || 0}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
