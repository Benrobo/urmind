import { ImageWithFallback } from "@/components/ImageWithFallback";
import { SpotlightConversationMessage } from "@/types/spotlight";

interface SourcesDisplayProps {
  message: SpotlightConversationMessage;
}

export default function SourcesDisplay({ message }: SourcesDisplayProps) {
  if (!message?.matchedContexts || message.matchedContexts.length === 0) {
    return null;
  }

  return (
    <div className="w-full px-4 mb-3">
      <div className="flex items-center gap-2 w-full">
        {message.matchedContexts.slice(0, 4).map((ctx, index) => (
          <button
            key={ctx.id}
            className="flex items-center gap-2 bg-gray-103 rounded-md px-2 py-1 w-1/4 min-w-0 hover:bg-gray-103/80 transition-colors"
          >
            <div className="max-w-[20px] rounded-full mr-1">
              <ImageWithFallback
                src={ctx.og?.favicon ?? null}
                className="object-contain min-w-[20px] min-h-[20px] rounded-full"
              />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-white-100 text-xs font-medium truncate">
                {ctx.title}
              </span>
              {ctx.description && (
                <span className="text-gray-102.1 text-xs truncate">
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
