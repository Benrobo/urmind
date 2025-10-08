import React, { useState, useEffect } from "react";
import {
  X,
  ExternalLink,
  Copy,
  Calendar,
  Tag,
  Globe,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "../ImageWithFallback";
import { cn, constructUrlTextFragment, shortenText } from "@/lib/utils";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMindboardContext } from "@/context/MindboardCtx";
import { SavedContext } from "@/types/context";
import { SelectedContext } from "@/types/mindboard";

dayjs.extend(relativeTime);

type ContextInfoSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedContext?: SelectedContext | null;
};

export default function ContextInfoSidebar({
  isOpen,
  onClose,
  selectedContext,
}: ContextInfoSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { openDeleteModal } = useMindboardContext();

  const context = selectedContext?.data?.context;

  // Handle slide animations
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle delete context
  const handleDeleteContext = () => {
    if (!context?.id) return;
    openDeleteModal(context);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed right-0 top-0 h-screen w-[450px] bg-gray-100 border-l border-white/20 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-semibold text-lg">
                  Context Details
                </h2>
                <button
                  onClick={onClose}
                  className="text-white/50 hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-8 space-y-6 customScrollbar">
              <AnimatePresence>
                {selectedContext && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.1 }}
                    className="space-y-6"
                  >
                    {/* Context Type Badge */}
                    <motion.div
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: 0.2 }}
                    >
                      <span className="text-[9px] text-white/60 bg-white/5 px-1.5 py-0.3 rounded-sm border border-white/10">
                        {selectedContext.type?.split(":")[1]?.toUpperCase() ||
                          selectedContext.type?.toUpperCase()}
                      </span>
                    </motion.div>

                    <motion.div
                      className="w-full space-y-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      {/* Title */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.4 }}
                      >
                        <h3 className="text-white font-medium text-lg mb-2">
                          {context?.title || "Untitled"}
                        </h3>

                        {/* Summary with expand/collapse */}
                        <div className="relative h-auto">
                          <div
                            className={cn(
                              "text-white/70 text-sm leading-relaxed transition-all duration-300",
                              isExpanded
                                ? "max-h-none"
                                : "max-h-[300px] overflow-hidden"
                            )}
                          >
                            {context?.summary
                              ? context.summary
                                  .split("\n")
                                  .map((line: string, idx: number) =>
                                    line.trim() === "" ? (
                                      <br key={idx} />
                                    ) : (
                                      <p key={idx}>{line}</p>
                                    )
                                  )
                              : "No summary available"}
                          </div>

                          {/* Blur effect at bottom when collapsed */}
                          {!isExpanded &&
                            context?.summary &&
                            context.summary.length > 100 && (
                              <div className="absolute bottom-0 left-0 right-0 h-[150px] bg-gradient-to-t from-gray-100 via-gray-100/50 to-transparent pointer-events-none" />
                            )}

                          {/* See more button */}
                          {context?.summary && context.summary.length > 100 && (
                            <motion.div
                              className="flex justify-center mt-2"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: 0.7 }}
                            >
                              <motion.button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="flex items-center gap-1 px-3 py-1.5 text-white/60 hover:text-white/80 text-xs rounded-md transition-all duration-200 hover:bg-white/5 z-20 relative"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <span className="text-xs">
                                  {isExpanded ? "Show less" : "See more"}
                                </span>
                                <motion.div
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </motion.div>
                              </motion.button>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>

                      {/* Metadata */}
                      <motion.div
                        className="space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                      >
                        {/* URL */}
                        {context?.url && (
                          <div className="flex items-start gap-3">
                            <Globe className="w-4 h-4 text-white/50 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-white/50 text-xs mb-1">URL</p>
                              <a
                                href={
                                  context.highlightText?.length > 0
                                    ? constructUrlTextFragment(
                                        context?.url,
                                        context?.highlightText
                                      )
                                    : context.url
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-sm break-all"
                              >
                                {context.url}
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Created Date */}
                        <div className="flex items-start gap-3">
                          <Calendar className="w-4 h-4 text-white/50 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-white/50 text-xs mb-1">
                              Created
                            </p>
                            <p className="text-white/70 text-sm">
                              {dayjs(context?.createdAt).format(
                                "MMMM D, YYYY [at] h:mm A"
                              )}
                            </p>
                            <p className="text-white/50 text-xs">
                              {dayjs(context?.createdAt).fromNow()}
                            </p>
                          </div>
                        </div>

                        {/* Category */}
                        {context?.categorySlug && (
                          <div className="flex items-start gap-3">
                            <Tag className="w-4 h-4 text-white/50 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-white/50 text-xs mb-1">
                                Category
                              </p>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded"
                                  style={{
                                    backgroundColor: "#6b7280", // Default color since we don't have category color in context
                                  }}
                                />
                                <span className="text-white/70 text-sm">
                                  {context.categorySlug}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>

                      {/* Actions */}
                      <motion.div
                        className="pt-4 border-t border-white/20"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.6 }}
                      >
                        <div className="space-y-2">
                          <motion.button
                            className="w-full flex items-center gap-3 px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span className="text-sm">Open in new tab</span>
                          </motion.button>
                          <motion.button
                            className="w-full flex items-center gap-3 px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Copy className="w-4 h-4" />
                            <span className="text-sm">Copy URL</span>
                          </motion.button>
                          <motion.button
                            onClick={handleDeleteContext}
                            className="w-full flex items-center gap-3 px-3 py-2 text-red-305 hover:bg-red-305 hover:text-white-100 bg-red-305/10 rounded-lg transition-all duration-200 border border-red-305/50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-sm">Delete context</span>
                          </motion.button>
                        </div>
                      </motion.div>

                      {/* Footer */}
                      <div className="p-4 border-t border-white/20">
                        <div className="flex items-center gap-3">
                          <ImageWithFallback
                            src={
                              context?.og?.favicon ||
                              chrome.runtime.getURL("icons/icon32.png")
                            }
                            className="object-contain w-4 h-4 rounded"
                          />
                          <span className="text-xs text-white/40">
                            {context?.og?.title || "UrMind Context"}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
