import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { X, Sparkles } from "lucide-react";
import { SearchResult, SpotlightProps } from "@/types/search";
import { getResultIcon, getResultIconColor } from "@/lib/search-utils";

export default function SpotlightSearch({
  searchQuery: initialQuery = "",
  placeholder = "Ask your mind...",
  results = [],
  onResultClick,
  onClose,
  actions = [],
}: SpotlightProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);

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

  const allActions = defaultActions;

  const handleResultClick = (result: SearchResult) => {
    onResultClick?.(result);
  };

  const handleClose = () => {
    onClose?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  return (
    <div
      className={cn(
        "w-[800px] min-h-[500px] max-h-[80vh] rounded-xl fixed font-poppins",
        "bg-gradient-to-b from-white-100/80 from-10% to-50% to-purple-50 backdrop-blur-xl",
        "border border-gray-200/40",
        "shadow-2xl shadow-purple-200/20"
      )}
      style={{
        zIndex: 1000,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="p-4 border-b border-gray-200/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-gray-800 placeholder-gray-500 text-lg outline-none"
              autoFocus
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white-400/20 rounded transition-colors"
            >
              <X size={20} className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col max-h-[550px] overflow-hidden">
        <div className="flex-1 p-4 overflow-y-auto customScrollbar">
          <div className="mb-6">
            <h3 className="text-sm font-medium font-inter text-gray-600 mb-3">
              Actions
            </h3>
            <div className="space-y-2">
              {allActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <div
                    key={action.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100/5 cursor-pointer font-poppins"
                    onClick={action.onClick}
                  >
                    <IconComponent
                      size={20}
                      className="fill-purple-100 text-transparent"
                    />
                    <span className="text-md text-gray-800 font-medium font-poppins">
                      {action.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {filteredResults.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">
                Best matches
              </h3>
              <div className="space-y-2">
                {filteredResults.map((result) => {
                  const IconComponent = getResultIcon(result.type);
                  const iconColor = getResultIconColor(result.type);

                  return (
                    <div
                      key={result.id}
                      className="p-3 rounded-lg hover:bg-gray-100/5 cursor-pointer border border-gray-200/50"
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
                            <span className="font-medium text-gray-800">
                              {result.title}
                            </span>
                            {result.metadata?.tags &&
                              result.metadata.tags.length > 0 && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                  {result.metadata.tags[0]}
                                </span>
                              )}
                          </div>
                          {result.source && (
                            <div className="text-xs text-gray-500 mb-2">
                              {result.source}
                            </div>
                          )}
                          {result.description && (
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {result.description}
                            </p>
                          )}
                          {result.metadata && (
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
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
            <div className="text-center py-8">
              <p className="text-gray-500">
                No results found for "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
