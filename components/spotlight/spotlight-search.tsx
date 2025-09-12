import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Command,
  FileText,
  Globe,
  BookOpen,
  LucideIcon,
  Search,
  Hash,
  ChevronUp,
  ChevronDown,
  CornerDownLeft,
  Image,
  File,
} from "lucide-react";
import { SearchResult, SpotlightProps, SearchResultType } from "@/types/search";
import { useHotkeys } from "react-hotkeys-hook";
import { contextSpotlightVisibilityStore } from "@/store/context.store";
import useStorageStore from "@/hooks/useStorageStore";

// Get icon for content type
const getContentIcon = (type: string): LucideIcon => {
  switch (type) {
    case "text":
      return FileText;
    case "url":
      return Globe;
    case "artifact:document":
      return File;
    case "artifact:image":
      return Image;
    default:
      return FileText;
  }
};

export default function SpotlightSearch({
  searchQuery: initialQuery = "",
  placeholder = "Ask your mind...",
  results = [],
  onResultClick,
  onClose,
}: SpotlightProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const { value: isVisible } = useStorageStore(contextSpotlightVisibilityStore);

  // Hotkey configuration
  const hotKeysConfigOptions = {
    enableOnFormTags: true,
    enableOnContentEditable: true,
  };

  useHotkeys(
    "ctrl+u, meta+u",
    () => {
      if (isVisible) {
        contextSpotlightVisibilityStore.hide();
      } else {
        contextSpotlightVisibilityStore.show();
      }
    },
    hotKeysConfigOptions
  );

  useHotkeys(
    "escape",
    () => {
      if (isVisible) {
        contextSpotlightVisibilityStore.hide();
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

  // Recent saved context items
  const savedContext = [
    {
      id: "1",
      title: "Docker Setup Tutorial",
      subtitle: "Highlighted text from docker.com • 2 hours ago",
      icon: FileText,
      type: "text",
      timestamp: "2h ago",
    },
    {
      id: "2",
      title: "Xbox Game Pass Research",
      subtitle: "gaming.microsoft.com/xbox/game-pass",
      icon: Globe,
      type: "url",
      timestamp: "1d ago",
    },
    {
      id: "3",
      title: "React Best Practices.pdf",
      subtitle: "PDF document saved from dev.to",
      icon: File,
      type: "artifact:document",
      timestamp: "3h ago",
    },
    {
      id: "4",
      title: "UI Design Screenshot",
      subtitle: "Interface mockup saved from Figma",
      icon: Image,
      type: "artifact:image",
      timestamp: "1h ago",
    },
  ];

  const filteredContext = useMemo(() => {
    if (!searchQuery.trim()) return savedContext;

    const query = searchQuery.toLowerCase();
    return savedContext.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
    );
  }, [searchQuery, savedContext]);

  // AI action for querying the user's memory
  const aiAction = {
    id: "ask-urmind-ai",
    title: "Ask UrMind AI",
    subtitle: searchQuery
      ? `Ask about: "${searchQuery}"`
      : "Ask AI about anything in your memory",
    icon: Sparkles,
    shortcut: "⌘⏎",
  };

  const handleResultClick = (result: SearchResult) => {
    onResultClick?.(result);
  };

  const handleClose = () => {
    contextSpotlightVisibilityStore.hide();
    onClose?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "w-[700px] max-h-[80vh] rounded-[12px] fixed",
        "bg-gray-100/95 backdrop-blur-xl",
        "border border-gray-102/30",
        "shadow-2xl shadow-black/20"
      )}
      style={{
        zIndex: 1000,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Search Header */}
      <div className="px-4 py-3 border-b border-white-400/60">
        <div className="flex items-center space-x-3">
          <Search size={18} className="text-white/60" />
          <input
            type="text"
            placeholder="Ask your mind... or search your memory"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-white/60 text-sm outline-none"
            autoFocus
          />
          <div className="flex items-center space-x-1 text-white/60 text-xs">
            <span className="bg-white/10 px-2 py-1 rounded text-xs">⌘</span>
            <span>U</span>
          </div>
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {/* Ask UrMind AI Action */}
        <div className="px-4 py-3 border-b border-gray-102/20">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/15 hover:bg-white/20 cursor-pointer group border border-white/20">
            <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white">
                {aiAction.title}
              </div>
              <div className="text-xs text-white/70">{aiAction.subtitle}</div>
            </div>
            <div className="text-xs text-white bg-white/20 px-2 py-1 rounded font-mono">
              {aiAction.shortcut}
            </div>
          </div>
        </div>

        {/* Saved Context Section */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">
              Your saved context
            </h3>
            <button className="text-xs text-white/60 hover:text-white underline">
              View all
            </button>
          </div>

          <div className="space-y-1">
            {filteredContext.map((item) => {
              const IconComponent = getContentIcon(item.type);
              return (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                    <IconComponent size={16} className="text-white/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-white/60 truncate">
                      {item.subtitle}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded">
                      {item.type}
                    </div>
                    <div className="text-xs text-white/50">
                      {item.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-white-400/60 px-4 py-3 bg-gray-100/50 backdrop-blur-sm rounded-b-[12px]">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-white/10 px-2 py-1.5 rounded-md">
              <ChevronUp size={12} className="text-white/80" />
              <ChevronDown size={12} className="text-white/80" />
              <span className="text-white/80 ml-1">navigate</span>
            </div>
            <div className="flex items-center space-x-1 bg-white/10 px-2 py-1.5 rounded-md">
              <Hash size={12} className="text-white/80" />
              <span className="text-white/80 ml-1">tags</span>
            </div>
            <div className="flex items-center space-x-1 bg-white/10 px-2 py-1.5 rounded-md">
              <CornerDownLeft size={12} className="text-white/80" />
              <span className="text-white/80 ml-1">open</span>
            </div>
            <div className="flex items-center space-x-1 bg-white/10 px-2 py-1.5 rounded-md">
              <span className="text-white/80 bg-white/20 px-1.5 py-0.5 rounded text-xs font-mono">
                esc
              </span>
              <span className="text-white/80 ml-1">close</span>
            </div>
          </div>
          <div className="flex items-center space-x-1 bg-white/10 px-2 py-1.5 rounded-md">
            <CornerDownLeft size={12} className="text-white/80" />
            <span className="text-white/80 ml-1">parent</span>
          </div>
        </div>
      </div>
    </div>
  );
}
