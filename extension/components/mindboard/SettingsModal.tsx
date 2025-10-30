import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Plus,
  Download,
  Upload,
  Settings2,
  Shield,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { domainBlacklistStore } from "@/store/domain-blacklist.store";
import { extractDomain } from "@/lib/utils";
import { backupService, ImportProgress } from "@/services/backup.service";
import RestoreProgressModal from "./RestoreProgressModal";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  hasContexts: boolean;
};

type SettingsTab = "domain-filters" | "backup-restore";

export default function SettingsModal({
  isOpen,
  onClose,
  hasContexts,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("domain-filters");
  const [domainInput, setDomainInput] = useState("");
  const [blacklistedDomains, setBlacklistedDomains] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(
    null
  );
  const [isImportComplete, setIsImportComplete] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importStats, setImportStats] = useState<{
    categories: number;
    contexts: number;
    chunks: number;
    assets: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadBlacklistedDomains();
    }
  }, [isOpen]);

  const loadBlacklistedDomains = async () => {
    const domains = await domainBlacklistStore.getAllBlacklistedDomains();
    setBlacklistedDomains(domains);
  };

  const handleAddDomain = async () => {
    if (!domainInput.trim()) return;

    setIsAdding(true);
    try {
      await domainBlacklistStore.addDomain(domainInput);
      setDomainInput("");
      await loadBlacklistedDomains();
    } catch (error) {
      console.error("Failed to add domain:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveDomain = async (domain: string) => {
    try {
      await domainBlacklistStore.removeDomain(domain);
      await loadBlacklistedDomains();
    } catch (error) {
      console.error("Failed to remove domain:", error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddDomain();
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await backupService.exportData();
      backupService.downloadUMFile(blob);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(null);
    setImportError(null);
    setIsImportComplete(false);
    setImportStats(null);

    try {
      const stats = await backupService.importData(file, (progress) => {
        console.log("Progress update:", progress);
        setImportProgress({ ...progress });
      });
      setImportStats(stats);
      setIsImportComplete(true);
    } catch (error) {
      console.error("Import failed:", error);
      setImportError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCloseRestoreModal = () => {
    setIsImporting(false);
    setIsImportComplete(false);
    setImportError(null);
    setImportProgress(null);
    setImportStats(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleBackdropClick}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-4xl h-[600px]">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="bg-dark-100.1 border border-white/20 rounded-lg shadow-2xl h-full flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-white/20">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-purple-100" />
                    <h2 className="text-white font-semibold text-lg">
                      Settings
                    </h2>
                  </div>
                  <motion.button
                    onClick={onClose}
                    className="text-white/50 hover:text-white transition-colors p-1"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                  <div className="w-48 bg-dark-100.3 border-r border-white/20 p-3 space-y-1">
                    <button
                      onClick={() => setActiveTab("domain-filters")}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                        activeTab === "domain-filters"
                          ? "bg-white/10 text-white font-medium"
                          : "text-white/70 hover:bg-white/5"
                      )}
                    >
                      <Shield className="w-4 h-4" />
                      Domain Filters
                    </button>
                    <button
                      onClick={() => setActiveTab("backup-restore")}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                        activeTab === "backup-restore"
                          ? "bg-white/10 text-white font-medium"
                          : "text-white/70 hover:bg-white/5"
                      )}
                    >
                      <Database className="w-4 h-4" />
                      Backup & Restore
                    </button>
                  </div>

                  <div className="flex-1 p-6 overflow-y-auto">
                    {activeTab === "domain-filters" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        <div>
                          <h3 className="text-white font-semibold text-base mb-2">
                            Domain Filters
                          </h3>
                          <p className="text-white/60 text-sm mb-4">
                            Prevent UrMind from indexing or saving content from
                            specific domains. Supports wildcards like
                            *.domain.com
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={domainInput}
                              onChange={(e) => setDomainInput(e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder="Enter domain or URL (e.g., facebook.com, *.ads.com)"
                              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-transparent text-sm"
                            />
                            <motion.button
                              onClick={handleAddDomain}
                              disabled={isAdding || !domainInput.trim()}
                              className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                                "bg-purple-100 hover:bg-purple-100/90 text-white",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                              )}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Plus size={16} />
                              Add
                            </motion.button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-white/70 text-sm font-medium">
                            Blacklisted Domains ({blacklistedDomains.length})
                          </h4>

                          {blacklistedDomains.length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-white/40 text-sm">
                                No domains blacklisted yet
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {blacklistedDomains.map((domain) => (
                                <motion.div
                                  key={domain}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  transition={{ duration: 0.15 }}
                                  className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full group hover:bg-white/15 transition-all"
                                >
                                  <span className="text-white text-[10px] font-mono">
                                    {domain}
                                  </span>
                                  <motion.button
                                    onClick={() => handleRemoveDomain(domain)}
                                    className="text-white/50 hover:text-red-305 transition-colors"
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <X size={12} />
                                  </motion.button>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "backup-restore" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        <div>
                          <h3 className="text-white font-semibold text-base mb-2">
                            Backup & Restore
                          </h3>
                          <p className="text-white/60 text-sm mb-4">
                            Export your UrMind data as a backup or import
                            previously exported data
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <h4 className="text-white font-medium text-sm mb-2">
                              Export Data
                            </h4>
                            <p className="text-white/60 text-xs mb-4">
                              {hasContexts
                                ? "Save all your data to a backup file"
                                : "No data available to export"}
                            </p>
                            <motion.button
                              onClick={handleExport}
                              disabled={isExporting || !hasContexts}
                              className={cn(
                                "w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2",
                                "bg-purple-100 hover:bg-purple-100/90 text-white",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                !hasContexts &&
                                  "opacity-50 cursor-not-allowed pointer-events-none"
                              )}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Download size={16} />
                              {isExporting ? "Exporting..." : "Export Data"}
                            </motion.button>
                          </div>

                          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <h4 className="text-white font-medium text-sm mb-2">
                              Import Data
                            </h4>
                            <p className="text-white/60 text-xs mb-4">
                              Restore data from a previously exported .um file
                            </p>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".um"
                              onChange={handleImport}
                              className="hidden"
                            />
                            <motion.button
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isImporting}
                              className={cn(
                                "w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2",
                                "bg-white/10 hover:bg-white/15 text-white border border-white/20",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                              )}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Upload size={16} />
                              {isImporting ? "Importing..." : "Import Data"}
                            </motion.button>
                          </div>

                          <div className="bg-orange-350/10 border border-orange-350/20 rounded-lg p-4">
                            <p className="text-orange-350 text-xs">
                              <strong>Note:</strong> Your imported data will be
                              combined with what you already have. This process
                              may take a few minutes to complete.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <RestoreProgressModal
            isOpen={isImporting || isImportComplete}
            progress={importProgress}
            isComplete={isImportComplete}
            error={importError}
            onClose={handleCloseRestoreModal}
            stats={importStats || undefined}
          />
        </>
      )}
    </AnimatePresence>
  );
}
