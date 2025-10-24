import { useState, useRef, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { changelogEntries } from "../data/changelogs";
import ChangelogEntry from "./ChangelogEntry";
import { motion, AnimatePresence } from "framer-motion";

export default function ChangelogWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        widgetRef.current &&
        !widgetRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close panel on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div
      ref={widgetRef}
      className="w-full md:w-auto  h-full fixed bottom-0 right-0 md:bottom-4 md:right-4 z-50"
    >
      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="absolute bottom-0 left-0 right-0 md:bottom-1 md:left-auto md:right-0 w-full md:w-[480px] h-full md:max-h-[70vh] bg-gray-100/90 backdrop-blur-xl border border-gray-102/50 rounded-none md:rounded-xl shadow-premium-lg overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-102/40 bg-gray-100/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-purple-100/20 flex items-center justify-center">
                  <Bell size={16} className="text-purple-100" />
                </div>
                <h2 className="text-white-100 font-semibold text-base md:text-lg">
                  What's New
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white-100/10 rounded-lg transition-colors"
              >
                <X size={18} className="text-white-100/70" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto hideScrollBar2 max-h-[calc(100vh)] md:max-h-[calc(70vh-80px)]">
              <div className="px-4 md:px-6 py-4">
                {changelogEntries.map((entry, index) => (
                  <ChangelogEntry
                    key={entry.version}
                    entry={entry}
                    isLast={index === changelogEntries.length - 1}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-6 flex items-center space-x-2 bg-purple-100 hover:bg-purple-100/90 text-white-100 px-3 md:px-4 py-2 md:py-3 rounded-full shadow-lg transition-all duration-200 font-poppins"
        >
          <Bell size={16} className="md:hidden" />
          <Bell size={18} className="hidden md:block" />
          <span className="font-medium text-xs md:text-sm">What's New</span>
        </motion.button>
      )}
    </div>
  );
}
