import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  X,
  CheckCheck,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import useContextCategories from "@/hooks/useContextCategories";
import { cn, shortenText } from "@/lib/utils";
import { ImageWithFallback } from "../ImageWithFallback";
import { mindboardStore } from "@/store/mindboard.store";
import useStorageStore from "@/hooks/useStorageStore";
import { sendMessageToBackgroundScriptWithResponse } from "@/helpers/messaging";
import useClickOutside from "@/hooks/useClickOutside";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

export default function MindBoardSidebar() {
  const { value: mindboardState } = useStorageStore(mindboardStore);
  const [searchQuery, setSearchQuery] = useState("");
  const {
    categories,
    loading: loadingCategories,
    refetch,
  } = useContextCategories({
    query: searchQuery,
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [showPopover, setShowPopover] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use click outside hook to close popover
  const popoverClickOutsideRef = useClickOutside<HTMLDivElement>(() => {
    setShowPopover(null);
  });

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

  const handleCategorySelect = (categorySlug: string) => {
    if (selectedCategory === categorySlug) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categorySlug);
    }
  };

  const handleDeleteCategory = (category: any) => {
    setCategoryToDelete(category);
    setDeleteModalOpen(true);
    setShowPopover(null);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      // Delete all contexts in this category
      await sendMessageToBackgroundScriptWithResponse({
        action: "db-operation",
        payload: {
          operation: "deleteContextsByCategory",
          data: { categorySlug: categoryToDelete.id },
        },
      });

      // Delete the category itself
      await sendMessageToBackgroundScriptWithResponse({
        action: "db-operation",
        payload: {
          operation: "deleteCategory",
          data: { categorySlug: categoryToDelete.id },
        },
      });

      // Refetch categories to update the UI first
      await refetch();

      // Handle selection if this category was selected
      if (selectedCategory === categoryToDelete.id) {
        // Get the updated categories list after refetch
        const updatedCategories =
          await sendMessageToBackgroundScriptWithResponse({
            action: "db-operation",
            payload: {
              operation: "getAllContextCategories",
            },
          });

        const categoriesList = (updatedCategories?.result as any[]) || [];
        if (categoriesList.length > 0) {
          // Select the first available category
          const firstCategory = categoriesList[0];
          setSelectedCategory(firstCategory.slug);
          await mindboardStore.setSelectedCategory(firstCategory.slug);
        } else {
          // No categories left, clear selection
          setSelectedCategory(null);
          await mindboardStore.clearSelectedCategory();
        }
      }

      setDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error("Failed to delete category:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateCategory = async () => {
    try {
      await sendMessageToBackgroundScriptWithResponse({
        action: "db-operation",
        payload: {
          operation: "createCategory",
          data: {
            label: "Untitled",
            slug: "untitled",
          },
        },
      });

      await refetch();
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  };

  const handleRefresh = async () => {
    await refetch();
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category.id);
    setEditName(category.name);
    setShowPopover(null);
  };

  const handleSaveEdit = async (categorySlug: string) => {
    try {
      // Always generate new slug from the edited label
      const newSlug = editName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "") // Remove special characters first
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-") // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

      const updates = {
        label: editName,
        slug: newSlug,
      };

      await sendMessageToBackgroundScriptWithResponse({
        action: "db-operation",
        payload: {
          operation: "updateCategory",
          data: {
            categorySlug, // old slug
            updates,
          },
        },
      });

      await refetch();

      // If the edited category was selected and the slug changed, update the selection
      if (selectedCategory === categorySlug && newSlug !== categorySlug) {
        setSelectedCategory(newSlug);
        await mindboardStore.setSelectedCategory(newSlug);
      }

      setEditingCategory(null);
      setEditName("");
    } catch (error) {
      console.error("Failed to update category:", error);
      await refetch();
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
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleRefresh}
              className="text-white/50 hover:text-white transition-colors enableMiniBounceEffect"
              title="Refresh categories"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4 transition-transform duration-500",
                  loadingCategories && "animate-spin"
                )}
              />
            </motion.button>
            <button
              onClick={handleCreateCategory}
              className="text-white/50 hover:text-white transition-colors"
              title="Add new category"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {loadingCategories ? (
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
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{
                      duration: 0.2,
                      delay: index * 0.02,
                      ease: "easeOut",
                    }}
                    className="relative"
                    onMouseEnter={() => setHoveredCategory(category.id)}
                    onMouseLeave={() => {
                      // Only clear hover if popover is not active for this category
                      if (showPopover !== category.id) {
                        setHoveredCategory(null);
                      }
                    }}
                  >
                    {editingCategory === category.id ? (
                      <div className="flex items-center gap-2 px-3 py-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveEdit(category.id);
                            } else if (e.key === "Escape") {
                              setEditingCategory(null);
                              setEditName("");
                            }
                          }}
                          className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(category.id)}
                          className="text-green-400 hover:text-green-300 p-1 rounded transition-colors"
                          title="Save"
                        >
                          <CheckCheck size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingCategory(null);
                            setEditName("");
                          }}
                          className="text-red-305 hover:text-red-400 p-1 rounded transition-colors"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <motion.button
                        onClick={() => handleCategorySelect(category.id)}
                        className={cn(
                          "w-full flex items-center text-start gap-3 px-3 py-2 rounded-lg transition-all duration-200 enableBounceEffect",
                          selectedCategory === category.id ||
                            showPopover === category.id
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
                            "text-white font-medium flex-1",
                            "text-xs text-nowrap"
                          )}
                        >
                          {shortenText(category.name, 20)}
                        </span>

                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPopover(
                              showPopover === category.id ? null : category.id
                            );
                          }}
                          className={cn(
                            "text-white/50 hover:text-white transition-colors p-1",
                            hoveredCategory === category.id ||
                              showPopover === category.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        >
                          <MoreHorizontal size={14} />
                        </motion.span>
                      </motion.button>
                    )}

                    {/* Popover */}
                    {showPopover === category.id && (
                      <motion.div
                        ref={popoverClickOutsideRef}
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-full mt-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg z-50 min-w-[120px]"
                      >
                        <div className="py-1">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white hover:bg-white/10 transition-colors"
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:bg-white/10 transition-colors"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCategoryToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        contextTitle={categoryToDelete?.name || "this category"}
        isDeleting={isDeleting}
      />
    </div>
  );
}
