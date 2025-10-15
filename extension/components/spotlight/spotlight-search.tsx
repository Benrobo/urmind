import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  useInputFocusManagement,
  useContainerFocusManagement,
} from "@/hooks/useFocusManagement";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Search,
  Hash,
  ChevronUp,
  ChevronDown,
  CornerDownLeft,
  GripHorizontal,
  BrainCircuit,
} from "lucide-react";
import { SearchResult, SpotlightProps } from "@/types/search";
import { useHotkeys } from "react-hotkeys-hook";
import { useSpotlightVisibility } from "@/hooks/useSpotlightVisibility";
import { uiStore } from "@/store/ui.store";
import useStorageStore from "@/hooks/useStorageStore";
import DeepResearchResult, { DeepResearchResultProps } from "./deep-research";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import SavedContext from "./saved-context";
import { ContextType } from "@/types/context";
import {
  sendMessageToBackgroundScript,
  sendMessageToBackgroundScriptWithResponse,
} from "@/helpers/messaging";
import { SpotlightConversations } from "@/types/spotlight";
import useClickOutside from "@/hooks/useClickOutside";
import UrmindDraggable from "../Draggable";

dayjs.extend(relativeTime);

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  sources?: Source[];
}

interface Source {
  id: string;
  title: string;
  subtitle: string;
  type: ContextType;
  url?: string;
}

export default function SpotlightSearch({
  searchQuery: initialQuery = "",
  placeholder = "Ask your mind...",
  results = [],
  onResultClick,
  onClose,
}: SpotlightProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [deepResearchState, setDeepResearchState] =
    useState<DeepResearchResultProps["deepResearchState"]>(null);
  const [disableInput, setDisableInput] = useState(false);
  const { isVisible, show, hide } = useSpotlightVisibility();
  const spotlightSearchRef = useClickOutside(() => {
    handleClose();
  });

  const { ref: inputRef, eventHandlers: inputEventHandlers } =
    useInputFocusManagement(isVisible && !disableInput, {
      excludeElements: [".urmind-wrapper", "[data-urmind]"],
    });

  const { eventHandlers: containerEventHandlers } =
    useContainerFocusManagement(isVisible);
  const { value: uiState } = useStorageStore(uiStore);
  const uiMounted = useRef(false);
  const [aiSubmittedQuery, setAiSubmittedQuery] = useState<string | null>(null);
  const deepResearchScrollRef = useRef<HTMLDivElement>(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);

  const conversationsCount = useCallback(async () => {
    const response = await sendMessageToBackgroundScriptWithResponse({
      action: "db-operation",
      payload: { operation: "getAllConversations" },
    });
    return (response?.result as SpotlightConversations[]).length;
  }, []);

  const [centerPosition, setCenterPosition] = useState({
    x: 497,
    y: 284,
  });
  const dragHandleRef = useRef<HTMLDivElement>(null);

  const hotKeysConfigOptions = {
    enableOnFormTags: true,
    enableOnContentEditable: true,
  };

  const toggleDeepResearch = async () => {
    await uiStore.setShowDeepResearch(true);
    await uiStore.setShowSavedContext(false);
  };

  const toggleSavedContext = async () => {
    await uiStore.setShowSavedContext(true);
    await uiStore.setShowDeepResearch(false);
  };

  useHotkeys(
    "ctrl+u, meta+u",
    () => {
      if (isVisible) {
        hide();
      } else {
        show();
      }
    },
    hotKeysConfigOptions
  );

  useHotkeys(
    "escape",
    () => {
      if (isVisible) {
        hide();
      }
    },
    hotKeysConfigOptions
  );

  useHotkeys(
    "meta+enter, ctrl+enter",
    async (e) => {
      e.preventDefault();
      console.log("🔍 UI State:", uiState);
      if (!uiState.showDeepResearch) {
        await toggleDeepResearch();
      } else {
        await toggleSavedContext();
      }
    },
    hotKeysConfigOptions
  );

  useHotkeys(
    "ctrl+k, meta+k",
    () => {
      if (isVisible) {
        const firstAction = document.querySelector('[data-action="first"]');
        if (firstAction) {
          (firstAction as HTMLElement).click();
        }
      }
    },
    hotKeysConfigOptions
  );

  useHotkeys(
    "ctrl+shift+m, meta+shift+m",
    () => {
      if (isVisible) {
        openMindboard();
      }
    },
    hotKeysConfigOptions
  );

  useEffect(() => {
    if (uiMounted.current) return;
    uiMounted.current = true;

    if (uiState.showSavedContext && uiState.showDeepResearch) {
      setDeepResearchState(null);
    } else if (uiState.showDeepResearch) {
      setDeepResearchState("follow-up");
    } else {
      setDeepResearchState(null);
    }
  }, [uiState.showDeepResearch, uiState.showSavedContext]);

  const aiAction = {
    id: "ask-urmind-ai",
    title: "Ask UrMind AI",
    subtitle: searchQuery
      ? `Ask about: "${searchQuery}"`
      : "Ask AI about anything in your memory",
    icon: Sparkles,
    shortcut: "⌘⏎",
  };

  const handleAskUrMind = async () => {
    if (searchQuery.trim().length > 0) {
      const convCount = await conversationsCount();
      if (!uiState.showDeepResearch) await toggleDeepResearch();
      setAiSubmittedQuery(searchQuery);
      setDeepResearchState(
        !uiState.showDeepResearch ? "new" : convCount > 0 ? "follow-up" : "new"
      );
      setSearchQuery("");
      // scrollToBottom();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onResultClick?.(result);
  };

  const handleClose = () => {
    hide();
    onClose?.();
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
    if (e.key === "Enter") {
      await handleAskUrMind();
    }
  };

  const openMindboard = async () => {
    try {
      sendMessageToBackgroundScript({
        action: "openOptionsPage",
      });
      hide();
    } catch (error) {
      console.error("Error opening options:", error);
    }
  };

  const handleScroll = useCallback(() => {
    if (deepResearchScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        deepResearchScrollRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setIsUserAtBottom(isAtBottom);
    }
  }, []);

  const scrollToBottom = useCallback(
    (offset: number = 450) => {
      if (deepResearchScrollRef.current && isUserAtBottom) {
        setTimeout(() => {
          if (deepResearchScrollRef.current) {
            deepResearchScrollRef.current.scrollTo({
              top: deepResearchScrollRef.current.scrollHeight - offset,
              behavior: "smooth",
            });
          }
        }, 10);
      }
    },
    [isUserAtBottom]
  );

  useEffect(() => {
    if (deepResearchState === "new") {
      setIsUserAtBottom(true);
      // Scroll to bottom when new conversation starts
      setTimeout(() => {
        if (deepResearchScrollRef.current) {
          deepResearchScrollRef.current.scrollTop =
            deepResearchScrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [deepResearchState]);

  const deepResearchProps = useMemo(
    () => ({
      showDeepResearch: uiState.showDeepResearch,
      deepResearchState: deepResearchState,
      query: aiSubmittedQuery, // Only changes on Enter, not typing
      resetState: () => {
        setDeepResearchState(null);
        setAiSubmittedQuery(null);
      },
      disableInput: () => setDisableInput(true),
      onScrollToBottom: (offset: number = 450) => scrollToBottom(offset),
      isUserAtBottom: isUserAtBottom,
    }),
    [
      uiState.showDeepResearch,
      deepResearchState,
      aiSubmittedQuery,
      scrollToBottom,
    ]
  );

  if (!isVisible) {
    return null;
  }

  return (
    <UrmindDraggable
      storageKey={"urmind-draggable-spotlight-search"}
      initialPosition={centerPosition}
      shouldPersistInChromeStorage={true}
      handleRef={dragHandleRef}
      scale={1.1}
      indicator={
        <div
          ref={dragHandleRef as any}
          className="absolute bottom-3 right-0 cursor-grab select-none pointer-events-none"
        >
          <GripHorizontal size={20} className="text-white-300/50 rotate-120" />
        </div>
      }
    >
      <div
        className={cn(
          "w-[650px] max-h-[80vh] rounded-[12px]",
          "bg-gray-100/80 backdrop-blur-xl",
          "border border-gray-102/30",
          "shadow-2xl shadow-black/20"
        )}
        style={{
          zIndex: 1000,
          // top: "50%",
          // left: "50%",
          // transform: "translate(-50%, -50%) scale(1)",
        }}
        onKeyDown={handleKeyDown}
        ref={spotlightSearchRef}
      >
        {/* Search Header */}
        <div className="px-4 py-3 border-b border-white-400/60">
          <div
            className={cn(
              "flex items-center space-x-3",
              disableInput && "opacity-50 cursor-not-allowed grayscale"
            )}
            {...containerEventHandlers}
          >
            <Search size={18} className="text-white/60" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask your mind... or search your memory"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              {...inputEventHandlers}
              onKeyDown={(e) => {
                // Call the hook's event handler first
                inputEventHandlers.onKeyDown?.(e);
                // Handle escape key
                if (e.key === "Escape") {
                  e.preventDefault();
                  // Handle escape key if needed
                }
              }}
              className={cn(
                "flex-1 bg-transparent text-white placeholder-white/60 text-sm outline-none",
                disableInput && "opacity-50 cursor-not-allowed grayscale"
              )}
              autoFocus={true}
              disabled={disableInput}
            />
            <div className="flex items-center space-x-1 text-white/60 text-xs">
              <span className="bg-white/10 px-2 py-1 rounded text-xs">⌘</span>
              <span>U</span>
            </div>
          </div>
        </div>

        <div className="max-h-[80vh] overflow-y-auto customScrollbar">
          {/* Ask UrMind AI Action */}
          {!uiState.showDeepResearch && (
            <div className="px-4 py-3 border-b border-gray-102/20">
              <div
                className="flex items-center space-x-3 p-3 rounded-lg bg-white/15 hover:bg-white/20 cursor-pointer group border border-white/20"
                onClick={handleAskUrMind}
              >
                <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">
                    {aiAction.title}
                  </div>
                  <div className="text-xs text-white/70">
                    {aiAction.subtitle}
                  </div>
                </div>
                <div className="text-xs text-white bg-white/20 px-2 py-1 rounded font-mono">
                  {aiAction.shortcut}
                </div>
              </div>
            </div>
          )}

          {/* Show Chat Messages or Saved Context */}
          <section className="w-full min-h-[400px] relative overflow-hidden">
            <div
              className={cn(
                "absolute inset-0 transition-transform duration-300 ease-in-out overflow-y-auto customScrollbar",
                uiState.showDeepResearch ? "-translate-x-full" : "translate-x-0"
              )}
            >
              <SavedContext query={searchQuery} uiState={uiState} />
            </div>

            <div
              ref={deepResearchScrollRef}
              onScroll={handleScroll}
              className={cn(
                "absolute inset-0 transition-transform duration-300 ease-in-out overflow-y-auto customScrollbar pl-[2px]",
                uiState.showDeepResearch ? "translate-x-0" : "translate-x-full"
              )}
            >
              {uiState.showDeepResearch && (
                <>
                  <DeepResearchResult {...deepResearchProps} />
                </>
              )}
            </div>
          </section>
        </div>

        {/* Bottom Navigation */}
        <div className="border-t border-white-400/60 px-4 py-3 bg-gray-100/50 backdrop-blur-sm rounded-b-[12px] z-[10]">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-3">
              {/* <div className="flex items-center space-x-1 bg-white/10 px-2 py-1.5 rounded-md">
                <ChevronUp size={12} className="text-white/80" />
                <ChevronDown size={12} className="text-white/80" />
                <span className="text-white/80 ml-1">navigate</span>
              </div> */}

              <button
                onClick={openMindboard}
                className="flex items-center space-x-1 bg-white/10 px-2 py-1.5 rounded-md hover:bg-white/20 transition-colors cursor-pointer z-[2]"
              >
                <BrainCircuit size={15} className="text-white/80" />
                <span className="text-white/80 ml-1">mindboard</span>
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-white/10 px-2 py-1.5 rounded-md">
                <CornerDownLeft size={12} className="text-white/80" />
                <span className="text-white/80 ml-1">open</span>
              </div>
              <div className="flex items-center space-x-1 bg-white/10 px-2 py-1.5 rounded-md">
                <span className="text-white/80 bg-white/20 px-1.5 py-0.5 rounded text-xs font-mono">
                  ⌘↵
                </span>
                <span className="text-white/80 ml-1">
                  {uiState.showDeepResearch ? "saved" : "research"}
                </span>
              </div>
              <div className="flex items-center space-x-1 bg-white/10 px-2 py-1.5 rounded-md mr-10">
                <span className="text-white/80 bg-white/20 px-1.5 py-0.5 rounded text-xs font-mono">
                  esc
                </span>
                <span className="text-white/80 ml-1">close</span>
              </div>
              {/* <button
                onClick={openMindboard}
                className="flex items-center space-x-1 bg-white/10 px-2 py-1.5 rounded-md hover:bg-white/20 transition-colors cursor-pointer"
              >
                <span className="text-white/80 ml-1">mindboard</span>
              </button> */}
            </div>
          </div>
        </div>
      </div>
    </UrmindDraggable>
  );
}
