import React from "react";
import SpotlightSearch from "./spotlight-search";
import { SearchResult } from "@/types/search";
import { mockSearchResults, mockActions } from "@/mock-data/spotlight";
import { contextSpotlightVisibilityStore } from "@/store/context.store";
import useStorageStore from "@/hooks/useStorageStore";

export default function Spotlight() {
  const { value: isVisible } = useStorageStore(contextSpotlightVisibilityStore);

  const handleResultClick = (result: SearchResult) => {
    console.log("Result clicked:", result);
    if (result.url) {
      window.open(result.url, "_blank");
    }
    // Hide spotlight after clicking a result
    contextSpotlightVisibilityStore.hide();
  };

  const handleClose = () => {
    console.log("Spotlight closed");
    contextSpotlightVisibilityStore.hide();
  };

  return (
    <SpotlightSearch
      searchQuery=""
      placeholder="Ask your mind..."
      results={mockSearchResults}
      actions={mockActions}
      onResultClick={handleResultClick}
      onClose={handleClose}
    />
  );
}
