// Category generator for save-to-urmind functionality
export const GenerateCategoryPrompt = (
  text: string,
  existingCategories?: Array<{ label: string; slug: string }>
) => `
You are a category generator for UrMind, a personal knowledge management system.

**Task**: Generate a category for the given text.

${
  existingCategories && existingCategories.length > 0
    ? `<existing_categories>
You MUST check if any of these existing categories fit the content before creating a new one.
If a category fits, use its EXACT label and slug:
${existingCategories
  .map((cat) => `- "${cat.label}" (slug: "${cat.slug}")`)
  .join("\n")}
</existing_categories>`
    : ""
}

**CRITICAL CATEGORY RULES - FAILURE TO FOLLOW WILL RESULT IN REJECTION:**
1. ALWAYS check existing categories FIRST - reuse if any category fits
2. If creating NEW category: Generate slug FROM the label using this EXACT formula:
   - Take the category label
   - Convert to lowercase
   - Replace spaces with hyphens
   - Remove special characters
   - Example: "Machine Learning" → slug: "machine-learning"
   - Example: "Software" → slug: "software" (NOT "software-applications")
   - Example: "AI & Robotics" → slug: "ai-robotics"
3. NEVER create arbitrary slugs that don't match the label
4. Label and slug MUST be semantically identical (just different formatting)
5. If label is "Software", slug MUST be "software" (not "software-applications" or any other variation)

**Text**: ${text}

**Output JSON:**
{
  "category": {
    "label": "string",  // MUST be meaningful category name
    "slug": "string"    // MUST be generated from label using the formula above
  }
}
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
