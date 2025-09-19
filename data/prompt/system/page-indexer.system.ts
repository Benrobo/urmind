import { PageMetadata } from "@/services/page-extraction/extraction";

// Initial context creator for new pages
export const InitialContextCreatorPrompt = (input: {
  pageContent: string;
  metadata: Omit<PageMetadata, "pageContent" | "og">;
}) => `
Create a detailed context summary for this web page content. This will be the initial context for this URL.

**Page Information:**
- URL: ${input.metadata.pageUrl}
- Title: ${input.metadata.title}

**Content:**
${input.pageContent}

**Task:**
Extract valuable, factual information into a comprehensive, standalone summary.

**Output Format (JSON):**
{
  "context": {
    "category": "string", // e.g., "biography", "technology-news", "documentation"
    "title": "string",    // Descriptive title for this content
    "description": "string", // Single sentence summary
    "summary": "string"   // Detailed summary with key facts, names, dates, concepts
  } | null,
  "retentionDecision": {
    "keep": boolean,
    "reason": "string"
  }
}

**Guidelines:**
- Focus on factual content, not meta-information about the page
- Include specific details: names, dates, numbers, key concepts
- Write summary as standalone facts that don't require the original source
- Return null for context if content has no lasting value

Generate comprehensive but concise summaries.
`;

// Summary updater for existing pages
export const SummaryUpdaterPrompt = (input: {
  newContent: string;
  existingContext: {
    title: string;
    description: string;
    summary: string;
    category: string;
  };
  metadata: Omit<PageMetadata, "pageContent" | "og">;
}) => `
Update the existing context with new content from the same page. Add new information or remove outdated info.

**Existing Context:**
- Title: ${input.existingContext.title}
- Description: ${input.existingContext.description}
- Category: ${input.existingContext.category}
- Summary: ${input.existingContext.summary}

**New Content:**
${input.newContent}

**Task:**
Compare new content with existing context and update accordingly.

**Output Format (JSON):**
{
  "context": {
    "category": "string", // Update only if significant drift detected
    "title": "string",    // Update only if significant drift detected  
    "description": "string", // Update only if significant drift detected
    "summary": "string"   // Always update - add new info, remove outdated info
  },
  "retentionDecision": {
    "keep": boolean,
    "reason": "string"
  }
}

**Guidelines:**
- Only update title/description/category if major drift in page focus
- Update summary ONLY if new content adds meaningful information
- If new content is redundant or adds no value, keep existing summary unchanged
- Preserve valuable existing information
- Add new facts, names, dates, developments
- Remove information that's been superseded
- Set retentionDecision.keep to false if new content adds no value

**Decision Logic:**
- keep: true = New content adds meaningful information worth updating
- keep: false = New content is redundant, duplicate, or adds no value

Focus on creating an accurate, up-to-date summary only when warranted.
`;
