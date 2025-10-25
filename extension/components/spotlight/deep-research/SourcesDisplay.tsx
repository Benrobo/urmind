import { ImageWithFallback } from "@/components/ImageWithFallback";
import { needsUIAdjustments } from "@/constant/ui-config";
import { cn } from "@/lib/utils";
import { SpotlightConversationMessage } from "@/types/spotlight";

interface SourcesDisplayProps {
  message: SpotlightConversationMessage;
}

export default function SourcesDisplay({ message }: SourcesDisplayProps) {
  if (!message?.matchedContexts || message.matchedContexts.length === 0) {
    return null;
  }

  const _needsUIAdjustments = needsUIAdjustments.find((adjustment) =>
    new URL(window.location.href).hostname.includes(adjustment.domain)
  );

  const deepResearchAdjustments = _needsUIAdjustments?.adjustments;

  return (
    <div className="w-full px-4 mb-3">
      <div className="flex items-center gap-2 w-full">
        {message.matchedContexts.slice(0, 4).map((ctx, index) => (
          <button
            key={ctx.id}
            className={cn(
              "flex items-center gap-2 bg-gray-103 rounded-md w-1/4 min-w-0 hover:bg-gray-103/80 transition-colors",
              deepResearchAdjustments?.deepResearch?.fontSize
                ? "px-3 py-3"
                : "px-2 py-1"
            )}
          >
            <div className="max-w-[20px] rounded-full mr-1">
              <ImageWithFallback
                src={ctx.og?.favicon ?? null}
                className={cn(
                  "object-contain min-w-[20px] min-h-[20px] rounded-full",
                  deepResearchAdjustments?.deepResearch?.iconSize
                    ? "min-w-[24px] min-h-[24px]"
                    : "min-w-[20px] min-h-[20px]"
                )}
              />
            </div>

            <div className="flex flex-col min-w-0">
              <span
                className={cn(
                  "text-white-100 font-medium truncate",
                  deepResearchAdjustments?.deepResearch?.fontSize
                    ? "text-[12px]"
                    : "text-sm"
                )}
              >
                {ctx.title}
              </span>
              {ctx.description && (
                <span
                  className={cn(
                    "text-gray-102.1 truncate",
                    deepResearchAdjustments?.deepResearch?.fontSize
                      ? "text-[10px]"
                      : "text-sm"
                  )}
                >
                  {ctx.description.length > 30
                    ? `${ctx.description.slice(0, 30)}...`
                    : ctx.description}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
