import React, { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="p-4 border-b border-white/20"
      >
        <div className="flex items-center gap-3">
          <motion.div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <ImageWithFallback
              src={chrome.runtime.getURL("icons/icon48.png")}
              className="object-contain min-w-[20px] min-h-[20px] rounded-xs"
            />
          </motion.div>

          <motion.h1
            className="text-white font-semibold text-lg"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            Mindboard
          </motion.h1>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 border-b border-white/20"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
          <motion.input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </motion.div>

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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white/50 text-sm"
            >
              Loading categories...
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={searchQuery}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.1 }}
                className="space-y-2"
              >
                {categories.map((category: any, index: number) => (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{
                      duration: 0.2,
                      delay: index * 0.02,
                      ease: "easeOut",
                    }}
                    onClick={() => handleCategorySelect(category.id)}
                    className={cn(
                      "w-full flex items-center text-start gap-3 px-3 py-2 rounded-lg transition-all duration-200 enableBounceEffect",
                      selectedCategory === category.id
                        ? "bg-white/10"
                        : "hover:bg-white/10"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      className="w-4 h-4 rounded flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    />
                    <span
                      className={cn(
                        "text-white font-medium",
                        "text-xs text-nowrap"
                      )}
                    >
                      {shortenText(category.name, 28)}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="p-4 border-t border-white/20"
      >
        <motion.div
          className="flex items-center gap-3 px-3 py-2"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            whileHover={{ scale: 1.2, rotate: 10 }}
            transition={{ duration: 0.2 }}
          >
            <ImageWithFallback
              src={chrome.runtime.getURL("icons/icon32.png")}
              className="object-contain w-4 h-4 grayscale opacity-50"
            />
          </motion.div>
          <span className="text-xs text-white/40">UrMind v1.0.0</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
