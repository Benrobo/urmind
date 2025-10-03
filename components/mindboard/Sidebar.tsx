import React, { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import useContextCategories from "@/hooks/useContextCategories";
import { cn, shortenText } from "@/lib/utils";
import { ImageWithFallback } from "../ImageWithFallback";
import { mindboardStore } from "@/store/mindboard.store";
import useStorageStore from "@/hooks/useStorageStore";

export default function MindBoardSidebar() {
  const { value: mindboardState } = useStorageStore(mindboardStore);
  const [searchQuery, setSearchQuery] = useState("");
  const { categories, loading } = useContextCategories({ query: searchQuery });
  const [selectedCategory, setSelectedCategory] = useState<string | null>();

  useEffect(() => {
    if (selectedCategory) {
      mindboardStore.setSelectedCategory(selectedCategory);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (mindboardState) {
      setSelectedCategory(mindboardState.selectedCategory);
    }
  }, [mindboardState]);

  const handleCategorySelect = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryId);
    }
  };

  return (
    <div className="w-[250px] h-screen bg-gray-100123 bg-dark-100.3 border-r border-white/20 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center gap-3">
          {/* <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div> */}

          <div className="w-8 h-8 rounded-lg flex items-center justify-center">
            <ImageWithFallback
              src={chrome.runtime.getURL("icons/icon48.png")}
              className="object-contain min-w-[20px] min-h-[20px] rounded-xs"
            />
          </div>

          <h1 className="text-white font-semibold text-lg">Mindboard</h1>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-white/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white/50 text-sm font-medium uppercase tracking-wide">
            Categories
          </h2>
          <button className="text-white/50 hover:text-white transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="text-white/50 text-sm">Loading categories...</div>
          ) : (
            categories.map((category: any) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={cn(
                  "w-full flex items-center text-start gap-3 px-3 py-2 rounded-lg transition-all duration-200 enableBounceEffect",
                  selectedCategory === category.id
                    ? "bg-white/10"
                    : "hover:bg-white/10"
                )}
              >
                <div
                  className="w-4 h-4 rounded flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <span
                  className={cn(
                    "text-white font-medium",
                    "text-xs text-nowrap"
                  )}
                >
                  {shortenText(category.name, 28)}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/20">
        <button className="w-full flex items-center gap-3 px-3 py-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
          <Plus className="w-4 h-4" />
          <span className="text-sm">Invite people</span>
        </button>
      </div>
    </div>
  );
}
