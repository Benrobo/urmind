import { SearchResult } from "@/types/search";
import { MessageCircle, Star, Sparkles } from "lucide-react";

// Mock search results with different types
export const mockSearchResults: SearchResult[] = [
  {
    id: "1",
    title: "GTA VI Leaks",
    description:
      "With just over 24 hours left before Rockstar Games was set to debut its first Grand Theft Auto 6 trailer, a grainy video started circulating online: The GTA 6 trailer, but marked with a massive bitcoin water...",
    type: "context",
    source: "Notion page • GTA VI / Controversy / GTA VI Leaks",
    icon: "🤫",
    metadata: {
      created: "Oct 25",
      edited: "2h",
      author: "Steve",
      tags: ["Verified"],
    },
  },
  {
    id: "2",
    title: "Grand Theft Auto VI",
    description: "Wikipedia article about the upcoming Grand Theft Auto game",
    type: "link",
    source: "W Wikipedia",
    url: "https://en.wikipedia.org/wiki/Grand_Theft_Auto_VI",
  },
  {
    id: "3",
    title: "Grand Theft Auto VI Trailer 1",
    description: "Official trailer for GTA VI",
    type: "video",
    source: "YouTube",
    url: "https://youtube.com/watch?v=example",
    metadata: {
      tags: ["Popular"],
    },
  },
  {
    id: "4",
    title: "GTA VI Development Notes",
    description: "Internal development documentation and notes",
    type: "artifact",
    source: "Code Repository",
    metadata: {
      created: "Dec 1",
      author: "Dev Team",
      tags: ["Internal"],
    },
  },
  {
    id: "5",
    title: "The first GTA VI trailer is here",
    description: "News article about the GTA VI trailer release",
    type: "document",
    source: "The Verge / Recent tabs",
    url: "https://theverge.com/gta-vi-trailer",
  },
  {
    id: "6",
    title: "Elon Musk Biography",
    description:
      "Comprehensive biography of Elon Musk, CEO of Tesla and SpaceX",
    type: "context",
    source: "Wikipedia • Biography / Business Leaders",
    icon: "🚀",
    metadata: {
      created: "Nov 15",
      edited: "1d",
      author: "Wikipedia",
      tags: ["Featured"],
    },
  },
  {
    id: "7",
    title: "Tesla Model 3 Review",
    description: "In-depth review of the Tesla Model 3 electric vehicle",
    type: "video",
    source: "YouTube",
    url: "https://youtube.com/watch?v=tesla-review",
    metadata: {
      tags: ["Trending"],
    },
  },
  {
    id: "8",
    title: "SpaceX Mars Mission",
    description:
      "Technical documentation for SpaceX's Mars colonization mission",
    type: "artifact",
    source: "SpaceX Internal Docs",
    metadata: {
      created: "Dec 5",
      author: "SpaceX Engineering",
      tags: ["Confidential"],
    },
  },
];

export const mockActions = [
  {
    id: "ask-urmind",
    label: "Ask Urmind",
    icon: Sparkles,
    onClick: () => console.log("Ask Urmind clicked"),
  },
];
