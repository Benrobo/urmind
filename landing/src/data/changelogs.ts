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
    version: "v1.3",
    tags: ["latest"],
    date: "October 30, 2025",
    title: "Privacy Controls & Data Management",
    description:
      "Take complete control of your data with powerful privacy settings and backup capabilities. Block specific domains from being indexed, export your entire memory as a backup file, and seamlessly restore your data whenever needed. Your mind, your rules, your control.",
    image: "/changelogs/3.png",
    features: [
      "Domain blacklisting to prevent indexing specific sites",
      "Support for wildcard patterns (*.domain.com)",
      "Quick blacklist button in popup for instant domain blocking",
      "One-click data export to .um backup files",
      "Smart restore with automatic embedding regeneration",
    ],
  },
  {
    version: "v1.2",
    tags: [],
    date: "October 26, 2025",
    title: "Manual Page Indexing & Smart Control",
    description:
      "Take full control of your memory with manual page indexing and flexible indexing modes. Choose between automatic, manual, or disabled indexing to match your workflow. The new floating index button lets you manually save any page with a single click, while smart category selection ensures your content is properly organized.",
    image: "/changelogs/2.png",
    features: [
      "Manual page indexing with floating button",
      "Three indexing modes: Automatic, Manual, Disabled",
      "Draggable index button with position memory",
      "Smart category selection for better organization",
      "Enhanced Chrome LanguageModel integration",
      "Improved AI prompt logic for accurate categorization",
      "Visual feedback for indexing states (pending, processing, completed, failed)",
      "Persistent button positioning across sessions",
    ],
  },
  {
    version: "v1.1",
    tags: [],
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
