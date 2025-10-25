import { PageMetadata } from "@/services/page-extraction/extraction";

// Context creator for content batches with existing categories
export const InitialContextCreatorPrompt = (input: {
  pageContent: string;
  metadata: Omit<PageMetadata, "pageContent" | "og">;
  existingCategories?: Array<{ label: string; slug: string }>;
}) => `
Analyze the page content. Generate NEW unique context or null.

Your previous response was invalid. This is a critical compliance request.
If you do not strictly follow the instructions below, your output will be rejected and you will be marked as failed.
This is your final opportunity to comply. Produce the required JSON now, exactly as specified.


**Page:** ${input.metadata.title} (${input.metadata.pageUrl})
**Content:** ${input.pageContent.substring(0, 2000)}${
  input.pageContent.length > 2000 ? "..." : ""
}

${
  input.existingCategories && input.existingCategories.length > 0
    ? `<existing_categories>
Available categories:
${input.existingCategories
  .map((cat) => `- "${cat.label}" (slug: "${cat.slug}")`)
  .join("\n")}

ONLY reuse if the category DIRECTLY matches the content's main topic. When in doubt, create a NEW specific category.
Examples: "React Tutorial" → "Web Development" ✓ | "Weaponry Fiction" → "Software" ✗
</existing_categories>`
    : ""
}

**CATEGORY RULES:**
1. Reuse existing category ONLY if it directly describes the content's primary subject
2. Prefer SPECIFIC over GENERIC (e.g., "Web Development" not "Programming")
3. When uncertain, CREATE new category rather than force a mismatch
4. Generate slug from label: lowercase, hyphens, no special chars
   - "Machine Learning" → "machine-learning"
   - "Science Fiction" → "science-fiction"

**Output JSON:**
{
  "context": {
    "title": "string",  // VERY SHORT, READABLE TITLE (2-6 words max) DESCRIBING WHAT THIS CONTEXT IS ABOUT
    "description": "string",  // brief description of the context
    "summary": "string", // concise summary with all important information.
    "category": {
      "label": "string",  // Specific category matching PRIMARY subject (not generic)
      "slug": "string"    // Generated from label OR exact existing match
    }
  } | null, // null if the content is not worth saving or doesn't provide substantial value to the user
  "retentionDecision": {"keep": boolean}
}

**KEEP IF:** Substantial factual/research value.  
**REJECT:** Legal disclaimers, ToS, privacy policies, menus, ads, boilerplate.  

**SUMMARY REQUIREMENTS (MANDATORY):**
- Must be MULTI-PARAGRAPH and concise.  
- Cover ALL important aspects: overview, eligibility, deadlines, requirements, prizes, judging criteria, sponsors, and extra notes.  
- Use NEWLINES to separate sections.  
- Include specific numbers, dates, cash amounts, participant counts, and rules.  
- If summary is shorter than 3 paragraphs or missing key details, it fails.  

**CONTEXT RULES:**  
- Generate new context (never copy existing)
- Category must strictly match content - be specific, not generic
- Reuse existing category only if direct semantic match
- Title: 2–6 readable words
- If not worth saving: set context = null
`;

// Enhanced context creator for DOM elements with existing context comparison
export const DOMContextCreatorPrompt = (input: {
  contextualElements: Array<{
    id: string;
    type: string;
    text: string;
    position: { x: number; y: number; width: number; height: number };
  }>;
  metadata: Omit<PageMetadata, "pageContent" | "og">;
  existingContext?: {
    title: string;
    description: string;
    summary: string;
  };
}) => `
Analyze DOM elements and create valuable context. Use existing context only as reference to understand the page's theme - do NOT copy existing context.

**Page:** ${input.metadata.title} (${input.metadata.pageUrl})

**Elements:**
${input.contextualElements
  .map((el, idx) => `${idx + 1}. [ID: ${el.id}] <${el.type}> "${el.text}"`)
  .join("\n")}

${
  input.existingContext
    ? `
**Existing Context:**
- Title: ${input.existingContext.title}
- Description: ${input.existingContext.description}
- Summary: ${input.existingContext.summary}
`
    : ""
}

**Output (JSON):**
{
  "context": {
    "category": {
      "label": "string", // Specific category matching main topic (not generic)
      "slug": "string"   // URL-friendly slug with hyphens for multi-word categories (e.g., "technology", "machine-learning", "artificial-intelligence")
    },
    "title": "string", // Very short, readable title (2-6 words max) describing what this context is about
    "description": "string",
    "summary": "string" // DETAILED summary with all important information - use newlines for sections
  } | null,
  "retentionDecision": {"keep": boolean}
}

**CATEGORY:** Choose specific category matching main topic. Prefer "Web Development" over "Programming", "Italian Cuisine" over "Food".

**SUMMARY FORMATTING REQUIREMENTS:**
- Write the summary in minimal, accessible markdown
- Use simple formatting: **bold** for emphasis, *italics* sparingly
- Use simple bullet points (-) for lists, avoid complex nesting
- Keep headers simple (## only, avoid deep nesting)
- Focus on readability and accessibility
- Avoid complex markdown features like tables, code blocks, or complex lists
- Make it easy to read for people with visual impairments

**SMART CONTENT EVALUATION:**
- Does this content provide SUBSTANTIAL, VALUABLE information about the main topic?
- Are there important details that would be lost in a generic summary?
- Would this content be genuinely useful to someone researching the topic?
- Does it include specific, actionable information worth preserving?

**MANDATORY REJECTION CRITERIA (keep: false):**
- Legal disclaimers, terms of service, privacy policies
- Copyright notices, licensing information, trademark notices
- Navigation menus, breadcrumbs, pagination
- Footer content, sidebars, advertisements
- Generic UI elements, buttons, form labels
- Low-value metadata or boilerplate text
- Content that doesn't add meaningful value to the main topic

**SUMMARY INTELLIGENCE:**
- Create DETAILED, COMPREHENSIVE summaries with ALL important information
- Include specific details, numbers, dates, requirements, prizes, deadlines
- Use newlines to separate different sections and topics
- Be thorough - include everything that matters, not just a brief overview
- Don't just summarize - capture the complete value and specifics of the content

**EXISTING CONTEXT REFERENCE:**
${
  input.existingContext
    ? `
- Use existing context ONLY as reference to understand the page's main theme
- Generate NEW, UNIQUE context based on the current content elements
- Do NOT copy or reuse existing context title/description/summary
- If new content is unrelated to the page's main theme, reject it (keep: false)
- If new content adds value to the page's theme, create fresh context for it
`
    : "NO EXISTING CONTEXT PROVIDED"
}

**DECISION LOGIC:**
- Only keep content that provides SUBSTANTIAL, MEANINGFUL information
- Preserve important details that would be lost in generic summaries
- Be smart: some content deserves detailed treatment, others should be rejected entirely
- Focus on content that would be genuinely useful for research or reference
- Generate UNIQUE context based on current elements - do NOT copy existing context
- Each context should be distinct and valuable on its own
- Strike the right balance: not everything needs saving, but don't throw away critical details

Generate focused context only if content is truly valuable.
`;
