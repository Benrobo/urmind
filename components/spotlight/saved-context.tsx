import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import useSavedContext from "@/hooks/useContext";
import { FileText, Globe, LucideIcon, Image, File } from "lucide-react";

dayjs.extend(relativeTime);

type SavedContextProps = {
  query: string;
};

export default function SavedContext({ query }: SavedContextProps) {
  const {
    contexts: filteredContext,
    loading,
    error,
  } = useSavedContext({
    query: query.trim(),
    limit: 6,
  });

  const getContentIcon = (type: string): LucideIcon => {
    switch (type) {
      case "text":
        return FileText;
      case "url":
        return Globe;
      case "artifact:document":
        return File;
      case "artifact:image":
        return Image;
      default:
        return FileText;
    }
  };

  return (
    <div className="w-full relative">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">Your saved context</h3>
          <button className="text-xs text-white/60 hover:text-white underline">
            View all
          </button>
        </div>

        <div className="space-y-1">
          {filteredContext.map((item) => {
            const IconComponent = getContentIcon(item.type);
            return (
              <div
                key={item.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                  <IconComponent size={16} className="text-white/80" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {item.title}
                  </div>
                  <div className="text-xs text-white/60 truncate">
                    {item.description}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded">
                    {item.type}
                  </div>
                  <div className="text-xs text-white/50">
                    {dayjs(item.createdAt).fromNow()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
