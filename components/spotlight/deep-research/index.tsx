import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { MessageSquare, FileText } from "lucide-react";

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

function ResearchMessage() {
  const [activeTab, setActiveTab] = useState("answer");
  const [contextLength, setContextLength] = useState(3);
  const [queryText, setQueryText] = useState("user query goes here");
  const [activeTabRef, setActiveTabRef] = useState<HTMLButtonElement | null>(
    null
  );

  // Dynamic font size based on text length
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

  return (
    <div className="w-full h-auto flex flex-col relative py-4">
      {/* header */}
      <div className="w-full flex flex-col gap-1 pb-4 px-4">
        <div className="w-full flex items-center justify-start mb-2">
          <p
            className={cn(
              "text-white font-geistmono",
              getQueryFontSize(queryText)
            )}
          >
            {queryText}
          </p>
        </div>

        {/* tabs */}
        <div className="relative w-auto flex items-center justify-start gap-4">
          {/* Base horizontal line */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/10" />

          {/* Active tab underline - 6px wider than tab */}
          {activeTabRef && (
            <div
              className="absolute bottom-0 h-0.5 bg-white transition-all duration-300 ease-in-out"
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

        {/* sliced sources */}
      </div>

      {/* body */}
      <section className="w-full h-auto max-h-[500px] overflow-y-auto"></section>
    </div>
  );
}
