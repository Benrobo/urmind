import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FolderInput, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type TransformedCategory = {
  id: string;
  name: string;
  color: string;
  count: number;
};

type MoveToCategoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetCategorySlug: string) => void;
  contextTitle?: string;
  currentCategorySlug: string;
  categories: TransformedCategory[];
  isMoving?: boolean;
};

export default function MoveToCategoryModal({
  isOpen,
  onClose,
  onConfirm,
  contextTitle = "this context",
  currentCategorySlug,
  categories,
  isMoving = false,
}: MoveToCategoryModalProps) {
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (selectedCategorySlug) {
      onConfirm(selectedCategorySlug);
    }
  };

  const handleCategorySelect = (categorySlug: string) => {
    setSelectedCategorySlug(categorySlug);
  };

  // Filter out the current category
  const availableCategories = categories.filter(
    (category) => category.id !== currentCategorySlug
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleBackdropClick}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="bg-gray-100 border border-white/20 rounded-lg shadow-2xl"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center">
                      <FolderInput className="w-4 h-4 text-blue-102" />
                    </div>
                    <h2 className="text-white font-semibold text-lg">
                      Move to Category
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white/50 hover:text-white transition-colors p-1"
                    disabled={isMoving}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-white/80 text-sm leading-relaxed mb-4">
                    Move{" "}
                    <span className="font-medium text-white">
                      "{contextTitle}"
                    </span>{" "}
                    to a different category.
                  </p>

                  {/* Category Selection */}
                  <div className="space-y-2 max-h-60 overflow-y-auto hideScrollBar2">
                    {availableCategories.length === 0 ? (
                      <p className="text-white/60 text-sm text-center py-4">
                        No other categories available
                      </p>
                    ) : (
                      availableCategories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => handleCategorySelect(category.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
                            selectedCategorySlug === category.id
                              ? "bg-blue-400/20 border-blue-400/50"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                        >
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: category.color,
                            }}
                          />
                          <span className="text-white text-sm font-medium flex-1 text-left">
                            {category.name}
                          </span>
                          {selectedCategorySlug === category.id && (
                            <div className="w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.2 }}
                  className="flex gap-3 p-4 border-t border-white/20"
                >
                  <motion.button
                    onClick={onClose}
                    disabled={isMoving}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      "bg-white/10 hover:bg-white/20 text-white border border-white/20",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleConfirm}
                    disabled={isMoving || !selectedCategorySlug}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      "bg-blue-400 hover:bg-blue-400/90 text-white border border-blue-400",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isMoving ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Moving...
                      </div>
                    ) : (
                      "Move"
                    )}
                  </motion.button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
