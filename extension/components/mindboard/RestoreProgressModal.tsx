import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, XCircle, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImportProgress } from "@/services/backup.service";
import ActivitySpinner from "@/components/spinner";

type RestoreProgressModalProps = {
  isOpen: boolean;
  progress: ImportProgress | null;
  isComplete: boolean;
  error: string | null;
  onClose: () => void;
  stats?: {
    categories: number;
    contexts: number;
    chunks: number;
    assets: number;
  };
};

export default function RestoreProgressModal({
  isOpen,
  progress,
  isComplete,
  error,
  onClose,
  stats,
}: RestoreProgressModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-[60]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="bg-dark-100.1 border border-white/20 rounded-lg shadow-2xl"
              >
                <div className="flex items-center justify-between p-4 border-b border-white/20">
                  <div className="flex items-center gap-3">
                    {error ? (
                      <div className="w-8 h-8 rounded-full bg-red-400/20 flex items-center justify-center">
                        <XCircle className="w-4 h-4 text-red-305" />
                      </div>
                    ) : isComplete ? (
                      <div className="w-8 h-8 rounded-full bg-green-400/20 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-100/20 flex items-center justify-center">
                        <Download className="w-4 h-4 text-purple-100" />
                      </div>
                    )}
                    <h2 className="text-white font-semibold text-lg">
                      {error
                        ? "Import Failed"
                        : isComplete
                        ? "Import Complete"
                        : "Importing Data"}
                    </h2>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {error ? (
                    <div className="space-y-2">
                      <p className="text-white/80 text-sm">
                        An error occurred during import:
                      </p>
                      <p className="text-red-305 text-sm font-mono bg-red-305/10 p-3 rounded-lg">
                        {error}
                      </p>
                    </div>
                  ) : isComplete ? (
                    <div className="space-y-4">
                      <div className="text-center py-2">
                        <p className="text-white/80 text-sm">
                          Your data has been successfully restored!
                        </p>
                      </div>

                      {stats && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
                          <h4 className="text-white/70 text-xs font-medium mb-3">
                            Import Summary
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center justify-between">
                              <span className="text-white/60 text-xs">
                                Categories
                              </span>
                              <span className="text-white font-mono text-sm">
                                {stats.categories}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-white/60 text-xs">
                                Contexts
                              </span>
                              <span className="text-white font-mono text-sm">
                                {stats.contexts}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-white/60 text-xs">
                                Chunks
                              </span>
                              <span className="text-white font-mono text-sm">
                                {stats.chunks}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-white/60 text-xs">
                                Assets
                              </span>
                              <span className="text-white font-mono text-sm">
                                {stats.assets}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : progress ? (
                    <>
                      <div className="flex items-center justify-center gap-3 py-2">
                        <span className="text-white/70 text-sm">
                          {progress.phase} ({progress.current}/{progress.total})
                        </span>
                        <ActivitySpinner
                          size="sm"
                          color="bg-purple-100"
                          speed="normal"
                        />
                      </div>

                      <div className="bg-purple-100/10 border border-purple-100/20 rounded-lg p-3">
                        <p className="text-white/60 text-xs text-center">
                          Please wait while we restore your data. This may take
                          a few minutes.
                        </p>
                      </div>
                    </>
                  ) : null}
                </div>

                {(isComplete || error) && (
                  <div className="flex gap-3 p-4 border-t border-white/20">
                    {isComplete && (
                      <motion.button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-white/10 hover:bg-white/15 text-white border border-white/20"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Close
                      </motion.button>
                    )}
                    <motion.button
                      onClick={() => window.location.reload()}
                      className={cn(
                        "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        error
                          ? "bg-red-305 hover:bg-red-305/90 text-white"
                          : "bg-purple-100 hover:bg-purple-100/90 text-white"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {error ? "Close" : "Reload Page"}
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
