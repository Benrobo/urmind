const MAX_BYTES_PER_BATCH = 80 * 1024; // 80KB

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
