## Context Chunking Architecture

**Current Issue:**  
When indexing a webpage, we may extract multiple "batches" or chunks of content from the page (e.g., 5 batches). Currently, each batch is processed as a completely separate context, even if they all come from the same page URL. This leads to multiple contexts for the same page, which is inefficient and results in redundant or confusing semantic search results.

**Desired Approach:**  
Instead of creating separate contexts for each batch, we should create _one parent context per page_, and then only generate additional embeddings for subsequent batches that belong to that same page. All those embeddings should reference the single parent context.

### Proposed Flow

Suppose the first page a user visits yields 5 content batches. The correct processing logic should be:

1. **Page Indexing Job Triggered**
2. **Input:** BATCHES[5] (an array of 5 content chunks):

   - **First batch (BATCH[0]):**

     - Generate context metadata (title, description, summary, category, etc)
     - Generate embedding for the content
     - Save as a new context in the database

   - **Subsequent batches (if any exist, i.e., BATCHES.slice(1)):**
     - For each batch:
       - Generate embedding for the batch's content
       - Attach metadata referencing the context ID created from the first batch
       - Save the embedding (not as a new context, but as an additional chunk linked to the parent)

3. **If there are no additional batches:** Done after first context creation.

**Benefits:**

- Semantic search will only surface a single (parent) context per webpage, rather than multiple redundant contexts.
- When displaying search results, deduplication is straightforward—results with the same context ID are grouped as one context.

### Deep-Research Behavior

When the user wants to perform deep research or ask a question about their saved data:

- Perform semantic search as usual.
- Extract unique parent context IDs from the search results. (this is what would be shown within the spotlight component sources tab)
- Collect all the embedding matches and map them by their parent context ID:
  ```js
  // Example mapping: contextId => [embeddingIds]
  {
    "contextId": ["embeddingId1", "embeddingId2", "embeddingId3"]
  }
  ```
- Next, batches of context are prepared for prompt input. To manage prompt size limits:
  - Each batch should contain up to 6 contexts _and_ not exceed 1024 estimated tokens (per batch).
  - If token estimate for a batch is reached before hitting 6 contexts, start a new batch (move to the next parent and create a new batch for the contexts).
  - **Hard cap**: The total context window per batch should not exceed 1024 estimated tokens. The final total context window overall should not exceed 4000 estimated tokens.
  - Also, a side note, the parent context raw content would also be included as well.

Final step:  
When ready to construct the LLM prompt, sequentially process each batch, retrieving the full context details (and grouped related chunks) for injection into the prompt.

**Summary:**

- Only one context per page.
- All page content chunks are embedded and linked to the parent context.
- Semantic search and deep-research rely on deduplicating by context ID.
- Batching for prompt construction observes both a context count and token window limit.

<!-- still thinking of this below -->
<!-- We can also include some sort of queue system which stores the page metadata extraction whenever the job get triggered, this way we dont have race conditions especially when  -->
