import { useState, useRef, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { changelogEntries } from "../data/changelogs";
import ChangelogEntry from "./ChangelogEntry";

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
    <div ref={widgetRef} className="fixed bottom-6 right-6 z-50">
      {/* Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute bottom-16 right-0 w-96 max-h-[70vh] bg-gray-100/80 backdrop-blur-xl border border-gray-102/30 rounded-lg shadow-premium overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-102/30">
            <div className="flex items-center space-x-2">
              <Bell size={18} className="text-white-100" />
              <h2 className="text-white-100 font-semibold">What's New</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white-100/10 rounded transition-colors"
            >
              <X size={16} className="text-white-100/70" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto customScrollbar max-h-[calc(70vh-60px)]">
            <div className="p-4">
              {changelogEntries.map((entry, index) => (
                <ChangelogEntry
                  key={entry.version}
                  entry={entry}
                  isLast={index === changelogEntries.length - 1}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-purple-100 hover:bg-purple-100/90 text-white-100 px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
      >
        <Bell size={18} />
        <span className="font-medium">What's New</span>
      </button>
    </div>
  );
}
