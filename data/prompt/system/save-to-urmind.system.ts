// Category generator for save-to-urmind functionality
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

// Text context creator for save-to-urmind functionality
export const TextContextCreatorPrompt = (text: string) => `
You are a context generator for UrMind, a personal knowledge management system.

**Task**: Generate a structured context from the given text.

**Text**: ${text}

**Output JSON:**
{
  "context": {
    "title": "string",  // VERY SHORT, READABLE TITLE (2-6 words max) DESCRIBING WHAT THIS CONTEXT IS ABOUT
    "description": "string",  // BRIEF DESCRIPTION OF THE CONTEXT (1-2 sentences)
    "summary": "string" // DETAILED SUMMARY WITH ALL IMPORTANT INFORMATION FROM THE TEXT
  }
}

**GUIDELINES:**
- Title: Keep it concise and descriptive (2-6 words max)
- Description: Brief overview in 1-2 sentences
- Summary: Comprehensive summary capturing all key information from the text
- Use clear, professional language
- Focus on the most important information
- Make it searchable and useful for future reference

**EXAMPLES:**
- Title: "Machine Learning Basics"
- Description: "Introduction to fundamental concepts of machine learning and its applications."
- Summary: "This text covers the basic principles of machine learning, including supervised and unsupervised learning, common algorithms, and real-world applications in various industries."

Generate the context now:
`;
