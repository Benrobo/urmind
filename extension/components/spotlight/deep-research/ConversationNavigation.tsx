import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ConversationNavigationProps {
  hasMoreConversations: boolean;
  activeConversationIndex: number;
  totalConversations: number;
  onPrevious: () => void;
  onNext: () => void;
}

export default function ConversationNavigation({
  hasMoreConversations,
  activeConversationIndex,
  totalConversations,
  onPrevious,
  onNext,
}: ConversationNavigationProps) {
  if (!hasMoreConversations) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        className={cn(
          "w-6 h-6 border border-white/10 rounded-full bg-white/20 text-white-100 flex items-center justify-center",
          activeConversationIndex === 0 && "opacity-50 cursor-not-allowed"
        )}
        onClick={onPrevious}
        disabled={activeConversationIndex === 0}
      >
        <ChevronLeft size={16} strokeWidth={2} />
      </button>

      <button
        className={cn(
          "w-6 h-6 border border-white/10 rounded-full bg-white/20 text-white-100 flex items-center justify-center",
          activeConversationIndex === totalConversations - 1 &&
            "opacity-50 cursor-not-allowed"
        )}
        onClick={onNext}
        disabled={activeConversationIndex === totalConversations - 1}
      >
        <ChevronRight size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
