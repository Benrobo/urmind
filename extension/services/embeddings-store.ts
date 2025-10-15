import { IDBPDatabase } from "idb";
import { UrmindDB } from "@/types/database";
import { sendMessageToContentScriptWithResponse } from "@/helpers/messaging";
import urmindDb from "./db";
import { Context, SavedContext } from "@/types/context";
import { cos_sim } from "@xenova/transformers";
import { AIService } from "./ai.service";
import shortUUID from "short-uuid";
import { estimateTokenCount, md5Hash } from "@/lib/utils";
import { MAX_CONTEXT_WINDOW_TOKENS } from "@/constant/internal";
import { preferencesStore } from "@/store/preferences.store";
import { DeepResearchResult } from "@/types/search";

/**
 * EmbeddingsStore - Background script only
 * Lightweight storage-only CRUD for embeddings
 */
export class EmbeddingsStore {
  constructor(private db: IDBPDatabase<UrmindDB>) {}

  async add(embedding: UrmindDB["embeddings"]["value"]): Promise<string> {
    await this.db.add("embeddings", embedding);
    return embedding.id;
  }

  async getAll(): Promise<UrmindDB["embeddings"]["value"][]> {
    return await this.db.getAll("embeddings");
  }

  async get(id: string): Promise<UrmindDB["embeddings"]["value"] | undefined> {
    return await this.db.get("embeddings", id);
  }

  async update(
    id: string,
    updates: Partial<UrmindDB["embeddings"]["value"]>
  ): Promise<void> {
    const existing = await this.get(id);
    if (!existing) throw new Error("Embedding not found");
    const updated = { ...existing, ...updates };
    await this.db.put("embeddings", updated);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete("embeddings", id);
  }

  async deleteEmbeddingsByContextId(contextId: string): Promise<void> {
    const embeddings = await this.getAll();
    const contextEmbeddings = embeddings.filter(
      (embedding) => embedding.metadata?.contextId === contextId
    );

    for (const embedding of contextEmbeddings) {
      await this.delete(embedding.id);
    }
  }

  /**
   * Generate embedding for text using content script
   * Background -> Content: Generate embedding
   * Content -> Background: Return embedding vector
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const response = await AIService.generateEmbedding(text);
    return response;
  }

  cosineSimilarity(
    queryEmbedding: number[],
    vectors: {
      id: string;
      vector: number[];
      metadata?: any;
      type?: string;
      rawContent?: string;
    }[],
    limit = 10
  ) {
    return vectors
      .map((e) => ({
        id: e.id,
        score: cos_sim(queryEmbedding, e.vector),
        metadata: e.metadata,
        type: e.type,
        rawContent: e.rawContent,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Perform semantic search using content script
   * Background -> Content: Send query + all embeddings
   * Content -> Background: Return similarity results
   */
  async semanticSearch(query: string, options: { limit?: number } = {}) {
    const allEmbeddings = await this.getAll();
    const queryEmbedding = await this.generateEmbedding(query);

    const response = this.cosineSimilarity(
      queryEmbedding,
      allEmbeddings,
      options.limit || 10
    );

    const finalResponse: (Context & {
      score: number;
      createdAt: number;
      updatedAt: number;
    })[] = [];

    for (const result of response) {
      const context = await urmindDb.contexts?.getContext(result.id);
      if (context) {
        finalResponse.push({
          ...context,
          score: result.score,
        });
      }
    }

    return finalResponse;
  }

  async semanticSearchDeepResearch(
    query: string,
    options: { limit?: number } = {}
  ): Promise<DeepResearchResult> {
    const allEmbeddings = await this.getAll();
    const queryEmbedding = await this.generateEmbedding(query);

    const response = this.cosineSimilarity(
      queryEmbedding,
      allEmbeddings,
      options.limit || 10
    );

    const preferences = await preferencesStore.get();
    const hasApiKey = preferences?.geminiApiKey?.trim();
    const maxContextWindowTokens = hasApiKey
      ? MAX_CONTEXT_WINDOW_TOKENS.online
      : MAX_CONTEXT_WINDOW_TOKENS.offline;

    const sortedParentContextFirst = response.sort((a, b) => {
      if (a.type === "parent") {
        return -1;
      }
      return 1;
    });

    const initialBatches: Map<
      string,
      Array<{ id: string; rawContent: string }>
    > = new Map();
    let totalBatchTokens = 0;

    // contexts that are displayed to the user. this can only be the parent contexts
    const displayContexts: (SavedContext & { score: number })[] = [];

    // contexts that are injected into the prompt. this can be the parent or chunk contexts
    const injectedContexts: Array<{
      title: string;
      description: string;
      content: string[]; // parent & chunk contexts content
      score: number;
    }> = [];

    for (const result of sortedParentContextFirst) {
      if (result.type === "parent") {
        initialBatches.set(result.id, [
          { id: result.id, rawContent: result?.rawContent ?? "" },
        ]); // include the parent for the first batch
        totalBatchTokens += estimateTokenCount(result?.rawContent ?? "");
      } else {
        // result.id === mJvTwMS21LKCwmr8Tu4M6d-chunk-c17eb88c61f016afbba71f4077ddf934
        const [parentId, _, chunkId] = result.id.split("-");

        const estimatedToken = estimateTokenCount(result?.rawContent ?? "");

        const isExceedingMaxContextWindowTokens =
          totalBatchTokens + estimatedToken > maxContextWindowTokens;

        if (!isExceedingMaxContextWindowTokens) {
          const parentBatch = initialBatches.get(parentId!);
          initialBatches.set(parentId!, [
            ...(parentBatch || []),
            { id: result.id, rawContent: result?.rawContent ?? "" },
          ]);
          totalBatchTokens += estimatedToken;
        } else {
          console.log("Exceeding max context window tokens");
        }
      }
    }

    for (const [parentId, batch] of initialBatches.entries()) {
      const parentContext = await urmindDb.contexts?.getContext(parentId)!;

      if (parentContext) {
        const result = sortedParentContextFirst.find((r) => r.id === parentId);

        displayContexts.push({
          ...parentContext,
          score: result?.score ?? 0,
        });

        injectedContexts.push({
          title: parentContext.title,
          description: parentContext.description,
          content: batch.map((item) => item.rawContent),
          score: result?.score ?? 0, // use parent score
        });
      }
    }

    const result: DeepResearchResult = { displayContexts, injectedContexts };

    console.log("Deep research result:", result);
    return result;
  }

  /**
   * Generate embedding and store it
   * Combines generateEmbedding + add operations
   */
  async generateAndStore(
    rawContent: string,
    metadata: {
      contextId: string;
      type: "parent" | "chunk";
      category: string;
      url: string;
    }
  ): Promise<string> {
    const embeddingVector = await this.generateEmbedding(rawContent);

    // Store in background script
    const embeddingId =
      metadata?.type === "parent"
        ? metadata.contextId
        : `${metadata.contextId}-chunk-${md5Hash(rawContent)}`;
    const embedding: UrmindDB["embeddings"]["value"] = {
      id: embeddingId,
      type: metadata.type,
      vector: embeddingVector,
      rawContent: rawContent,
      metadata,
    };

    return await this.add(embedding);
  }
}
