import React, { useRef, useState } from "react";
import SpotlightSearch from "./spotlight-search";
import { SearchResult } from "@/types/search";
import { mockSearchResults, mockActions } from "@/mock-data/mock-spotlight";
import { useSpotlightVisibility } from "@/hooks/useSpotlightVisibility";

export default function Spotlight() {
  const { isVisible, hide } = useSpotlightVisibility();

  const handleResultClick = (result: SearchResult) => {
    console.log("Result clicked:", result);
    if (result.url) {
      window.open(result.url, "_blank");
    }
    hide();
  };

  const handleClose = () => {
    hide();
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
