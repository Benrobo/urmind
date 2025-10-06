export const GenerateCategoryPrompt = (text: string) => `
You are a category generator for UrMind, a personal knowledge management system.

**Task**: Generate a category for the given text.

**Text**: ${text}

**Output JSON:**
{
  "category": {
    "label": "string",  // CATEGORY LABEL (e.g., "Technology", "Science", "Business")
    "slug": "string"    // URL-FRIENDLY SLUG WITH HYPHENS FOR MULTI-WORD CATEGORIES (e.g., "technology", "machine-learning", "artificial-intelligence")
  }
}

**CATEGORY RULES:**
- Label: Human-readable category name (e.g., "Technology", "Machine Learning", "Artificial Intelligence")
- Slug: URL-friendly version with hyphens for multi-word categories (e.g., "technology", "machine-learning", "artificial-intelligence")
- Use lowercase for slug
- Replace spaces with hyphens in slug
- Keep labels concise but descriptive
- Choose the most appropriate category for the content
`;
