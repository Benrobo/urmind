export type SearchResultType =
  | "context"
  | "artifact"
  | "page"
  | "video"
  | "link"
  | "document";

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: SearchResultType;
  url?: string;
  source?: string;
  metadata?: {
    created?: string;
    edited?: string;
    author?: string;
    tags?: string[];
  };
  icon?: string; // emoji or custom icon
}

export interface SpotlightProps {
  searchQuery?: string;
  placeholder?: string;
  results?: SearchResult[];
  onResultClick?: (result: SearchResult) => void;
  onClose?: () => void;
  actions?: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    onClick: () => void;
  }>;
}
