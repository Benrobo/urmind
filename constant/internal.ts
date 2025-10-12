export const GeneralSemanticSearchThreshold = {
  offline: 0.5,
  online: 0.6,
};

export const PageIndexingSemanticSearchThreshold = {
  offline: 0.5,
  online: 0.9,
};

export const SaveToUrmindSemanticSearchThreshold = {
  offline: 0.5,
  online: 0.7,
};

export const PageIndexingSemanticDeduplicationThreshold = {
  offline: 0.6,
  online: 0.8,
};

export const SearchContextDebounceTimeMs = {
  offline: 1,
  online: 500,
};

// Gemini Nano token limits
export const GEMINI_NANO_MAX_TOKENS_PER_PROMPT = 1024;
export const GEMINI_NANO_MAX_CONTEXT_TOKENS = 4096;

export const INVALID_TAB_URLS = [
  // Chrome internal pages
  "chrome://newtab/",
  "chrome://extensions/",
  "chrome://settings/",
  "chrome://downloads/",
  "chrome://history/",
  "chrome://bookmarks/",
  "chrome://plugins/",
  "chrome://sync-internals/",
  "chrome://help/",
  "chrome://reset-profile/",
];

// AI Models Configuration
export const ai_models = {
  embedding: {
    gemini_embedding: "gemini-embedding-001",
    xenova_local: "Xenova/all-MiniLM-L6-v2",
  },
  generation: {
    gemini_flash: "gemini-2.0-flash",
    gemini_nano_offline: "chrome-ai", // Chrome built-in AI
  },
} as const;

// API Configuration
export const API_RETRY_CONFIG = {
  MAX_RETRIES: 2,
  MIN_TIMEOUT: 1000,
  MAX_TIMEOUT: 5000,
} as const;

// UI Configuration
export const UI_CONFIG = {
  POPUP_DIMENSIONS: {
    WIDTH: 400,
    HEIGHT: 600,
  },
  AUTO_DISMISS_DELAY: 3000,
} as const;

// Embedding Configuration
export const EMBEDDING_CONFIG = {
  LOCAL_MODEL: "Xenova/all-MiniLM-L6-v2",
  VECTOR_DIMENSION: 384,
} as const;

// Tab Timing Configuration
export const MINIMUM_TAB_TIME_MS = 2 * 60 * 1000; // 2 minutes
export const TAB_TIMING_CHECK_INTERVAL_MS = 5 * 1000; // 30 seconds
