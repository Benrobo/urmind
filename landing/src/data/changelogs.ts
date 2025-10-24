export type ChangelogEntryData = {
  version: string;
  date: string;
  title: string;
  description: string;
  image: string;
  features: string[];
};

export const changelogEntries: ChangelogEntryData[] = [
  {
    version: "v1.1",
    date: "January 15, 2025",
    title: "Universal Image Sync",
    description:
      "UrMind transforms your unorganized browsing into a powerful, searchable memory. Every page, highlight, insight, and image you encounter is automatically indexed — no effort required.",
    image: "/readme-screenshots/3.png",
    features: [
      "Drag & Drop: Drag images directly onto your mindboard canvas for instant AI analysis",
      "Context Menu: Right-click any image on any website → 'Add to your mind' for seamless saving",
      "AI-Powered Analysis: Every image gets automatically analyzed with AI to generate titles, descriptions, and tags",
      "Smart Categorization: Images are intelligently categorized based on content and context",
      "Visual Memory: Your mindboard now displays rich image nodes with thumbnails and AI insights",
      "Universal Support: Works with images from any website (HTTPS/HTTP) without configuration",
    ],
  },
];
