import React from "react";
import SpotlightSearch from "./spotlight-search";
import { SearchResult } from "@/types/search";
import { mockSearchResults, mockActions } from "@/mock-data/spotlight";

export default function Spotlight() {
  const handleResultClick = (result: SearchResult) => {
    console.log("Result clicked:", result);
    if (result.url) {
      window.open(result.url, "_blank");
    }
  };

  const handleClose = () => {
    console.log("Spotlight closed");
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
