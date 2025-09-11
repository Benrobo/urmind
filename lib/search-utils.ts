import { SearchResultType } from "@/types/search";
import {
  FileText,
  Play,
  Globe,
  BookOpen,
  Code,
  Image,
  LucideIcon,
} from "lucide-react";

export const getResultIcon = (type: SearchResultType): LucideIcon => {
  switch (type) {
    case "context":
      return BookOpen;
    case "artifact":
      return Code;
    case "page":
      return FileText;
    case "video":
      return Play;
    case "link":
      return Globe;
    case "document":
      return FileText;
    default:
      return FileText;
  }
};

export const getResultIconColor = (type: SearchResultType): string => {
  switch (type) {
    case "context":
      return "text-blue-600";
    case "artifact":
      return "text-purple-600";
    case "page":
      return "text-gray-600";
    case "video":
      return "text-red-600";
    case "link":
      return "text-blue-600";
    case "document":
      return "text-gray-600";
    default:
      return "text-gray-600";
  }
};
