import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import useSavedContext from "@/hooks/useContext";
import { FileText, Globe, LucideIcon, Image, File } from "lucide-react";
import { constructUrlTextFragment, debounce } from "@/lib/utils";
import { Context } from "@/types/context";
import logger from "@/lib/logger";
import { contextSpotlightVisibilityStore } from "@/store/context.store";
import { contextNavigationService } from "@/services/context-navigation.service";
import React, { useCallback, useState } from "react";
import CustomLoader from "@/components/Loader";
import { SearchContextDebounceTimeMs } from "@/constant/internal";
import { preferencesStore } from "@/store/preferences.store";

dayjs.extend(relativeTime);

type SavedContextProps = {
  query: string;
  uiState: {
    showDeepResearch: boolean;
    showSavedContext: boolean;
  };
};

export default function SavedContext({ query, uiState }: SavedContextProps) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  const debouncedSetQuery = useCallback(async (newQuery: string) => {
    const preferences = await preferencesStore.get();
    const embeddingStyle = preferences?.embeddingStyle;

    debounce(
      (value) => {
        setDebouncedQuery(value);
      },
      embeddingStyle === "local"
        ? SearchContextDebounceTimeMs.offline
        : SearchContextDebounceTimeMs.online,
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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CustomLoader
                size="md"
                text="Searching your mind..."
                className="mb-3"
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
                      {dayjs(item?.createdAt).fromNow()}
                    </div>
                  </div>
                </button>
              );
            })
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
