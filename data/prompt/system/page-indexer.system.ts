import { PageMetadata } from "@/services/page-extraction/extraction";

// Context creator for content batches with existing context comparison
export const InitialContextCreatorPrompt = (input: {
  pageContent: string;
  metadata: Omit<PageMetadata, "pageContent" | "og">;
  existingContext?: {
    title: string;
    description: string;
    summary: string;
  };
}) => `
Analyze content batch for valuable information, comparing against existing context if available.

**Page:** ${input.metadata.title} (${input.metadata.pageUrl})

**Content:**
${input.pageContent.substring(0, 2000)}${
  input.pageContent.length > 2000 ? "..." : ""
}

${
  input.existingContext
    ? `
**Existing Context:**
- Title: ${input.existingContext.title}
- Description: ${input.existingContext.description}
- Summary: ${input.existingContext.summary}
`
    : "NO EXISTING CONTEXT PROVIDED"
}

**Output (JSON):**
{
  "context": {
    "category": "string",
    "title": "string", 
    "description": "string",
    "summary": "string" // Detailed, well-structured markdown with headers, lists, and formatting
  } | null,
  "retentionDecision": {"keep": boolean, "reason": "string"}
}

**SUMMARY FORMATTING REQUIREMENTS:**
- Write the summary in detailed, well-structured markdown
- Use headers (##, ###) to organize information
- Use bullet points and numbered lists for clarity
- Include key facts, dates, names, and important details
- Structure information logically with proper markdown formatting
- Make it comprehensive and easy to read

**STRICT CONTENT EVALUATION:**
- Does this content provide SUBSTANTIAL, VALUABLE information about the main topic?
- Is this content worth preserving for future reference and research?
- Does this content contain meaningful factual information, not just metadata?
- Would this content be genuinely useful to someone researching the topic?

**MANDATORY REJECTION CRITERIA (keep: false):**
- Legal disclaimers, terms of service, privacy policies
- Copyright notices, licensing information, trademark notices
- Navigation menus, breadcrumbs, pagination
- Footer content, sidebars, advertisements
- Generic UI elements, buttons, form labels
- Low-value metadata or boilerplate text
- Content that doesn't add meaningful value to the main topic

**EXISTING CONTEXT REFERENCE:**
${
  input.existingContext
    ? `
- Use existing context ONLY as reference to understand the page's main theme
- Generate NEW, UNIQUE context based on the current content
- Do NOT copy or reuse existing context title/description/summary
- If new content is unrelated to the page's main theme, reject it (keep: false)
- If new content adds value to the page's theme, create fresh context for it
`
    : ""
}

**DECISION LOGIC:**
- Only keep content that provides SUBSTANTIAL, MEANINGFUL information
- Reject any content that is legal boilerplate, navigation, or low-value
- Be extremely strict - better to reject than to save worthless content
- Focus on content that would be genuinely useful for research or reference
- Generate UNIQUE context based on current content - do NOT copy existing context
- Each context should be distinct and valuable on its own

Generate focused context only if content is truly valuable.
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
    "category": "string",
    "title": "string", 
    "description": "string",
    "summary": "string" // Detailed, well-structured markdown with headers, lists, and formatting
  } | null,
  "retentionDecision": {"keep": boolean, "reason": "string"}
}

**SUMMARY FORMATTING REQUIREMENTS:**
- Write the summary in detailed, well-structured markdown
- Use headers (##, ###) to organize information
- Use bullet points and numbered lists for clarity
- Include key facts, dates, names, and important details
- Structure information logically with proper markdown formatting
- Make it comprehensive and easy to read

**STRICT CONTENT EVALUATION:**
- Does this content provide SUBSTANTIAL, VALUABLE information about the main topic?
- Is this content worth preserving for future reference and research?
- Does this content contain meaningful factual information, not just metadata?
- Would this content be genuinely useful to someone researching the topic?

**MANDATORY REJECTION CRITERIA (keep: false):**
- Legal disclaimers, terms of service, privacy policies
- Copyright notices, licensing information, trademark notices
- Navigation menus, breadcrumbs, pagination
- Footer content, sidebars, advertisements
- Generic UI elements, buttons, form labels
- Low-value metadata or boilerplate text
- Content that doesn't add meaningful value to the main topic

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
- Reject any content that is legal boilerplate, navigation, or low-value
- Be extremely strict - better to reject than to save worthless content
- Focus on content that would be genuinely useful for research or reference
- Generate UNIQUE context based on current elements - do NOT copy existing context
- Each context should be distinct and valuable on its own

Generate focused context only if content is truly valuable.
`;
