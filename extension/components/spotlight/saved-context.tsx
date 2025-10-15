import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import useSavedContext from "@/hooks/useContext";
import { FileText, Globe, LucideIcon, Image, File } from "lucide-react";
import { cn, constructUrlTextFragment, debounce } from "@/lib/utils";
import { Context } from "@/types/context";
import logger from "@/lib/logger";
import { contextSpotlightVisibilityStore } from "@/store/context.store";
import { contextNavigationService } from "@/services/context-navigation.service";
import React, { useCallback, useState } from "react";
import CustomLoader from "@/components/Loader";
import { SearchContextDebounceTimeMs } from "@/constant/internal";
import { preferencesStore } from "@/store/preferences.store";
import useStorageStore from "@/hooks/useStorageStore";
import { Key, Settings } from "lucide-react";
import { sendMessageToBackgroundScript } from "@/helpers/messaging";

dayjs.extend(relativeTime);

type SavedContextProps = {
  query: string;
  uiState: {
    showDeepResearch: boolean;
    showSavedContext: boolean;
  };
  openMindboard: () => void;
};

export default function SavedContext({
  query,
  uiState,
  openMindboard,
}: SavedContextProps) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const { value: preferences } = useStorageStore(preferencesStore);

  const debouncedSetQuery = useCallback(async (newQuery: string) => {
    const preferences = await preferencesStore.get();
    const hasApiKey = preferences?.geminiApiKey?.trim();

    debounce(
      (value) => {
        setDebouncedQuery(value);
      },
      hasApiKey
        ? SearchContextDebounceTimeMs.online
        : SearchContextDebounceTimeMs.offline,
      false
    )(newQuery);
  }, []);

  // Update debounced query when query changes
  React.useEffect(() => {
    debouncedSetQuery(query);
  }, [query, debouncedSetQuery]);

  const {
    contexts: filteredContext,
    loading,
    error,
  } = useSavedContext({
    query: !uiState?.showDeepResearch ? debouncedQuery.trim() : undefined,
    limit: 10,
    mounted: !uiState?.showDeepResearch,
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

  const handleClick = async (item: Context) => {
    contextNavigationService.navigateToContext(item);
  };

  const isMindboardOpened = window.location.pathname.includes("/options.html");

  return (
    <div className="w-full relative">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">Your saved context</h3>
          <button
            onClick={openMindboard}
            className={cn(
              "text-xs text-white/60 hover:text-white underline",
              isMindboardOpened && "invisible"
            )}
          >
            View all
          </button>
        </div>

        <div className="space-y-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CustomLoader
                size="md"
                text={
                  debouncedQuery.trim().length > 0
                    ? "Searching your mind..."
                    : "Loading your saved context..."
                }
                className="mb-3"
                colorClass="bg-white-100"
              />
            </div>
          ) : filteredContext.length > 0 ? (
            filteredContext.map((item) => {
              const IconComponent = getContentIcon(item.type);
              return (
                <button
                  key={item.id}
                  className="w-full flex text-start items-center space-x-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer group outline-none border-none"
                  onClick={() => {
                    handleClick(item);
                  }}
                >
                  <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                    <IconComponent size={16} className="text-white/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {item?.type === "text" ? item.summary : item.title}
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
                      {dayjs(item?.createdAt).fromNow()}
                    </div>
                  </div>
                </button>
              );
            })
          ) : !preferences?.geminiApiKey?.trim() ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-3 border border-blue-400/30">
                <Key size={20} className="text-blue-201" />
              </div>
              <h4 className="text-sm font-medium text-white mb-2">
                API Key Required
              </h4>
              <p className="text-xs text-white/70 max-w-sm mb-4">
                UrMind needs a Gemini API key to save and search your content.
                Set it up in the popup to start building your knowledge base.
              </p>
              <button
                onClick={() => {
                  contextSpotlightVisibilityStore.hide();
                  // Open popup using the messaging system
                  sendMessageToBackgroundScript({ action: "openPopup" });
                }}
                className="flex items-center space-x-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-201 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
              >
                <Settings size={14} />
                <span>Open Settings</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <FileText size={20} className="text-white/60" />
              </div>
              <h4 className="text-sm font-medium text-white mb-1">
                No contexts found
              </h4>
              <p className="text-xs text-white/60 max-w-xs">
                {query.trim()
                  ? `No contexts match "${query.trim()}"`
                  : "Your mind will grow as you explore"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
