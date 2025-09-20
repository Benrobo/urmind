import { ContextualTextElement } from "@/types/page-extraction";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GEMINI_NANO_MAX_TOKENS_PER_PROMPT } from "@/constant/internal";

// Conservative estimate: ~4 characters per token, so 1024 tokens ≈ 4000 characters
const MAX_BYTES_PER_BATCH = GEMINI_NANO_MAX_TOKENS_PER_PROMPT * 4; // ~4096 bytes

function getByteLength(pair: string): number {
  const encoder = new TextEncoder();
  return encoder.encode(pair || "").length;
}

export function batchPageContentByByteLength(
  pageContent: string,
  maxBytes = MAX_BYTES_PER_BATCH
) {
  const batches: string[] = [];
  let currentBatch: string[] = [];
  let currentBytes = 0;

  for (const pair of pageContent.split("\n")) {
    const pairBytes = getByteLength(pair);

    // If pair is too large, push existing batch and isolate this pair
    if (pairBytes > maxBytes) {
      if (currentBatch.length > 0) {
        batches.push(currentBatch.join("\n"));
        currentBatch = [];
        currentBytes = 0;
      }
      batches.push(pair);
      continue;
    }

    if (currentBytes + pairBytes > maxBytes) {
      batches.push(currentBatch.join("\n"));
      currentBatch = [];
      currentBytes = 0;
    }

    currentBatch.push(pair);
    currentBytes += pairBytes;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch.join("\n"));
  }

  return batches;
}

/**
 * Batches contextual text elements into arrays with size constraints.
 * Splits by both element count and text byte size to prevent quota exceeded errors.
 * Large elements (> maxTokenBytes) get split using RecursiveCharacterTextSplitter.
 *
 * @param contextualTextElements - Array of ContextualTextElement to batch
 * @param maxElementsPerBatch - Maximum number of elements per batch (default: 10)
 * @param maxTokenBytes - Maximum bytes per batch (default: 5000)
 * @returns Array of batches, each batch is an array of ContextualTextElement
 */
export async function batchContextualTextElementsByCount(
  contextualTextElements: ContextualTextElement[],
  maxElementsPerBatch = 10,
  maxTokenBytes = MAX_BYTES_PER_BATCH
) {
  const batches: ContextualTextElement[][] = [];
  let currentBatch: ContextualTextElement[] = [];
  let currentBatchBytes = 0;

  for (const element of contextualTextElements) {
    const elementText = element.text || "";
    const elementBytes = new TextEncoder().encode(elementText).length;

    // If this single element is too large, split its text and create multiple elements
    if (elementBytes > maxTokenBytes) {
      // Push current batch if it has content
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
        currentBatch = [];
        currentBatchBytes = 0;
      }

      // Split the large element's text using RecursiveCharacterTextSplitter
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: maxTokenBytes,
        chunkOverlap: 200,
      });

      const textChunks = await textSplitter.splitText(elementText);

      // Create separate elements for each text chunk
      for (let i = 0; i < textChunks.length; i++) {
        const chunk = textChunks[i];
        const splitElement: ContextualTextElement = {
          ...element,
          id: `${element.id}_chunk_${i}`, // Unique ID for each chunk
          text: chunk || null,
        };

        // Each chunk gets its own batch
        batches.push([splitElement]);
      }
      continue;
    }

    // Check if adding this element would exceed limits
    if (
      currentBatch.length >= maxElementsPerBatch ||
      currentBatchBytes + elementBytes > maxTokenBytes
    ) {
      // Push current batch and start a new one
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
      }
      currentBatch = [element];
      currentBatchBytes = elementBytes;
    } else {
      // Add element to current batch
      currentBatch.push(element);
      currentBatchBytes += elementBytes;
    }
  }

  // Push the last batch if it has content
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}
