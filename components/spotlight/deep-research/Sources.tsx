import { SpotlightConversationMessage } from "@/types/spotlight";
import { shortenText } from "@/lib/utils";
import { Globe, Search, FileText } from "lucide-react";
import React, { useState, useEffect } from "react";
import { ContextType } from "@/types/context";
import { ImageWithFallback } from "@/components/ImageWithFallback";

type SourcesProps = {
  sources: SpotlightConversationMessage["matchedContexts"];
};

export default function Sources({ sources }: SourcesProps) {
  if (!sources || sources.length === 0) {
    return <SourcesEmptyState />;
  }

  return (
    <div className="w-full flex flex-col items-start justify-start mt-1 gap-5 px-4">
      {sources.map((s, idx) => {
        return (
          <button
            key={s.id}
            className="w-full text-start flex flex-row items-start justify-between gap-3 py-2 group transition-colors duration-200 rounded-md"
            onClick={() => {
              window.open(s.fullUrl!, "_blank");
            }}
          >
            <div className="w-full text-start flex flex-col items-start justify-start">
              <div className="w-full flex items-center justify-between gap-1">
                <div className="w-[33px] h-[32px] rounded-full overflow-hidden bg-dark-102">
                  <ImageWithFallback src={s.og?.favicon ?? null} />
                </div>
                <div className="w-full flex flex-col items-start justify-start">
                  <div className="w-full flex flex-nowrap items-center justify-start gap-4">
                    <span className="text-white-100 text-[11px] font-medium">
                      {shortenText(s.og?.title ?? "", 70)}
                    </span>
                    {/* tag */}
                    <span className="text-[8px] px-1 py-[2px] rounded-full bg-white-100/10 text-white-100 border border-white-100/10">
                      {s.type.split(":")?.[1]?.replace(/-/g, " ")}
                    </span>
                  </div>
                  {s.url && (
                    <p className="text-white-100/30 text-xs font-normal">
                      {shortenText(s.url, 20)}
                    </p>
                  )}
                </div>
              </div>
              <div className="w-full flex flex-col items-start justify-start mt-1">
                <p className="text-white-100 text-md font-normal group-hover:text-cyan-100">
                  {s.title}
                </p>
                <p className="text-white-200 text-sm font-light">
                  {shortenText(s.summary, 300)}
                </p>
              </div>
            </div>

            {/* for og image if available */}
            {s.og?.image && (
              <div className="w-[150px] h-[100px] translate-y-2">
                <div className="w-[100px] h-[100px] bg-dark-102 rounded-md overflow-hidden">
                  <img
                    src={s.og.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function SourcesEmptyState() {
  return (
    <div className="w-full min-h-[250px] flex flex-col items-center justify-center py-8 px-4">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
          <Search className="w-6 h-6 text-white/40" />
        </div>
        <h3 className="text-white/80 text-lg font-medium mb-2">
          No sources found
        </h3>
        <p className="text-white/60 text-sm max-w-sm">
          This response wasn't based on any specific sources from your saved
          context.
        </p>
      </div>
    </div>
  );
}
