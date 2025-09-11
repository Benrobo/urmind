import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  X,
  Sparkles,
  ArrowRight,
  Command,
  FileText,
  Play,
  Globe,
  BookOpen,
  Code,
  LucideIcon,
} from "lucide-react";
import { SearchResult, SpotlightProps, SearchResultType } from "@/types/search";
import { useHotkeys } from "react-hotkeys-hook";
import { contextSpotlightVisibilityStore } from "@/store/context.store";
import useStorageStore from "@/hooks/useStorageStore";

// Search utility functions
const getResultIcon = (type: SearchResultType): LucideIcon => {
  switch (type) {
    case "context":
      return BookOpen;
    case "artifact":
      return Code;
    case "page":
      return FileText;
    case "video":
      return Play;
    case "link":
      return Globe;
    case "document":
      return FileText;
    default:
      return FileText;
  }
};

const getResultIconColor = (type: SearchResultType): string => {
  switch (type) {
    case "context":
      return "text-blue-100";
    case "artifact":
      return "text-purple-100";
    case "page":
      return "text-gray-102.1";
    case "video":
      return "text-red-100";
    case "link":
      return "text-blue-100";
    case "document":
      return "text-gray-102.1";
    default:
      return "text-gray-102.1";
  }
};

export default function SpotlightSearch({
  searchQuery: initialQuery = "",
  placeholder = "Ask your mind...",
  results = [],
  onResultClick,
  onClose,
  actions = [],
}: SpotlightProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const { value: isVisible, setValue: setVisibility } = useStorageStore(
    contextSpotlightVisibilityStore
  );

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

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return results;

    const query = searchQuery.toLowerCase();
    return results.filter(
      (result) =>
        result.title.toLowerCase().includes(query) ||
        result.description?.toLowerCase().includes(query) ||
        result.source?.toLowerCase().includes(query) ||
        result.metadata?.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [searchQuery, results]);

  const defaultActions = [
    {
      id: "ask-urmind",
      label: "Ask Urmind",
      icon: Sparkles,
      onClick: () => console.log("Ask Urmind clicked"),
    },
  ];

  const allActions = [...defaultActions];

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
        "w-[800px] min-h-[450px] max-h-[80vh] rounded-xl fixed font-poppins",
        "bg-gradient-to-b from-dark-100/50 via-dark-101/60 to-dark-101/50 backdrop-blur-xl",
        "border border-white-100/30",
        "shadow-2xl shadow-dark-100/50"
      )}
      style={{
        zIndex: 1000,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="p-4 border-b-[1px] border-white-100/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-gray-102.1 text-sm outline-none"
              autoFocus
            />
          </div>
          {/* <div className="flex items-center space-x-2">
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-102 rounded transition-colors"
            >
              <X size={20} className="w-4 h-4 text-white-100" />
            </button>
          </div> */}
        </div>
      </div>

      <div className="h-[400px] flex flex-col overflow-hidden">
        <div className="flex-1 p-4 overflow-y-auto customScrollbar">
          <div className="mb-6">
            <h3 className="text-xs font-medium font-poppins text-gray-102.1 mb-3">
              Actions
            </h3>
            <div className="space-y-2">
              {allActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <div
                    key={action.id}
                    data-action={index === 0 ? "first" : undefined}
                    className="flex items-center space-x-3 p-2 rounded-sm hover:bg-gray-102/90 cursor-pointer font-poppins transition-colors"
                    onClick={action.onClick}
                  >
                    <IconComponent size={20} className="text-blue-100" />
                    <span className="text-sm text-white-100 font-normal font-poppins">
                      {action.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {filteredResults.length > 0 && (
            <div>
              <h3 className="text-xs font-poppins font-medium text-gray-102.1 mb-3">
                Best matches
              </h3>
              <div className="space-y-2">
                {filteredResults.map((result) => {
                  const IconComponent = getResultIcon(result.type);
                  const iconColor = getResultIconColor(result.type);

                  return (
                    <div
                      key={result.id}
                      className="p-3 rounded-sm hover:bg-gray-102/50 cursor-pointer border border-gray-100/20 transition-colors"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="flex items-start space-x-3">
                        {result.icon ? (
                          <span className="text-xl">{result.icon}</span>
                        ) : (
                          <IconComponent className={`w-5 h-5 ${iconColor}`} />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-white">
                              {result.title}
                            </span>
                            {result.metadata?.tags &&
                              result.metadata.tags.length > 0 && (
                                <span className="text-xs text-gray-102.1 bg-gray-100/20 px-2 py-0.5 rounded">
                                  {result.metadata.tags[0]}
                                </span>
                              )}
                          </div>
                          {result.source && (
                            <div className="text-xs text-gray-102.1 mb-2">
                              {result.source}
                            </div>
                          )}
                          {result.description && (
                            <p className="text-sm text-gray-102.1 leading-relaxed">
                              {result.description}
                            </p>
                          )}
                          {result.metadata && (
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-102.1">
                              {result.metadata.created && (
                                <span>
                                  Created {result.metadata.author} •{" "}
                                  {result.metadata.created}
                                </span>
                              )}
                              {result.metadata.edited && (
                                <span>
                                  Edited {result.metadata.author} •{" "}
                                  {result.metadata.edited}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <IconComponent className={`w-5 h-5 ${iconColor}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredResults.length === 0 && searchQuery.trim() && (
            <div className="w-full min-h-[200px] flex-center text-center py-8 ">
              <p className="text-white-100/50 font-geistmono text-sm">
                No results found for{" "}
                <span className="text-white-100">"{searchQuery}"</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t-[1px] border-t-gray-102 bg-dark-102 px-4 py-3 rounded-b-xl">
        <div className="w-full flex items-center justify-between text-sm">
          <div></div>
          <div className="flex items-center space-x-4">
            <div className="w-px h-4 bg-gray-100/30"></div>
            <div className="flex font-geistmono items-center space-x-2 text-gray-102.1 hover:text-white cursor-pointer transition-colors">
              <span className="text-xs">Actions</span>
              <div className="flex items-center space-x-1 bg-gray-102 px-2 py-1 rounded">
                <Command size={12} />
              </div>
              <div className="flex items-center space-x-1 bg-gray-102 px-2 py-0.5 rounded">
                <span className="text-xs">K</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
