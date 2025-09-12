import React, { useState } from "react";
import { Send, Mic } from "lucide-react";

export default function SidepanelSearchInput({
  onQueryChange,
  onResultsChange,
}: {
  onQueryChange: (query: string) => void;
  onResultsChange: (results: any[]) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="w-full px-4 py-4 border-t border-gray-102/30">
      <div className="w-full">
        <div className="relative">
          <div className="w-full rounded-lg bg-white/10 border border-white/20 p-3 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                placeholder="Ask your mind..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onQueryChange(e.target.value);
                }}
                className="flex-1 bg-transparent text-white placeholder-white/60 text-sm outline-none"
              />

              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Mic size={16} className="text-white/60" />
                </button>
                <button className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <Send size={16} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
