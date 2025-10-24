export type ChangelogEntryData = {
  version: string;
  date: string;
  title: string;
  description: string;
  image: string;
  features: string[];
  tags?: string[];
};

export const changelogEntries: ChangelogEntryData[] = [
  {
    version: "v1.1",
    tags: ["latest"],
    date: "October 24, 2025",
    title: "Universal Image Sync",
    description:
      "Urmind now supports image indexing from any site. Drag & drop, context menu saving, and instant AI-powered organization. Simply drag an image onto your mindboard to instantly add it to your memory. Right-click any image on any website → 'Add to your mind' for seamless saving.",
    image: "/changelogs/1.png",
    features: [
      "Drag & drop images to mindboard",
      "Right-click → 'Add to your mind'",
      "AI auto-generates image details",
      "Smart image categorization",
      "Image nodes on mindboard with thumbnails and AI insights",
      "Works on every website",
    ],
  },
  {
    version: "v0.1.0",
    date: "October 22, 2025",
    title: "Initial Release",
    description:
      "UrMind indexes everything you browse. Just ask to find answers, highlights, sources anytime.",
    image: "",
    features: [
      "Spotlight: ⌘ + U universal search",
      "Auto-index pages, highlights, insights",
      "Natural language memory search",
      "Citations & page context",
      "All data local/private",
      "Gemini Nano fast search (Chrome Dev/Canary)",
      "Simple Chrome install & guide",
    ],
  },
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
