import { md5Hash } from "@/lib/utils";
import logger from "@/lib/logger";
import { semanticCacheStore } from "@/store/semantic-cache.store";
import { PageIndexingSemanticDeduplicationThreshold } from "@/constant/internal";
import { preferencesStore, PreferencesState } from "@/store/preferences.store";
import urmindDb from "@/services/db";

export class SemanticAwareCache {
  async shouldProcessContent(
    batch: string,
    tabId: number,
    url: string
  ): Promise<boolean> {
    try {
      const semanticSignature = await this.generateSemanticSignature(batch);
      const urlFingerprint = md5Hash(url);
      const signatureKey = `${urlFingerprint}:${semanticSignature}`;

      logger.warn("🔍 Checking semantic signature:", signatureKey);

      const hasSignature = await semanticCacheStore.hasSignature(signatureKey);

      if (hasSignature) {
        const cachedScore = await semanticCacheStore.getSignatureScore(
          signatureKey
        );
        logger.warn(`⏭️ Already processed (score: ${cachedScore})`);
        return false;
      }

      const searchResults = await this.performSemanticSearch(batch, tabId);
      const preferences = await preferencesStore.get();
      const shouldProcess = this.evaluateResults(searchResults, preferences);

      console.log("searchResults", searchResults);

      if (!shouldProcess) {
        const topResult = searchResults[0];
        const score = topResult ? topResult.score : 0;
        await semanticCacheStore.addSignature(signatureKey, score);
        logger.warn(
          `💾 Cached negative result for future reference (score: ${score})`
        );
      }

      return shouldProcess;
    } catch (error) {
      logger.error("❌ Error in semantic cache check:", error);
      return true;
    }
  }

  async generateSemanticSignature(content: string): Promise<string> {
    const normalized = content.toLowerCase().replace(/\s+/g, " ").trim();

    const prefix = normalized.slice(0, 300);
    // const length = normalized.length;
    // const wordCount = normalized.split(/\s+/).length;

    // return md5Hash(`${prefix}|${length}|${wordCount}`);

    return md5Hash(prefix);
  }

  private async performSemanticSearch(
    batch: string,
    tabId: number
  ): Promise<any[]> {
    if (!urmindDb.embeddings) {
      throw new Error("Embeddings service not available");
    }

    return await urmindDb.embeddings.semanticSearch(batch, tabId, { limit: 4 });
  }

  private evaluateResults(
    searchResults: any[],
    preferences: PreferencesState
  ): boolean {
    if (!searchResults || searchResults.length === 0) {
      return true;
    }

    const topResult = searchResults[0];

    // Use different thresholds based on user preferences
    const threshold =
      preferences.embeddingStyle === "online"
        ? PageIndexingSemanticDeduplicationThreshold.online
        : PageIndexingSemanticDeduplicationThreshold.offline;

    if (topResult && topResult.score >= threshold) {
      logger.warn(
        `⏭️ Too similar (${topResult.score} >= ${threshold}) [${preferences.embeddingStyle}]`
      );
      return false;
    }

    return true;
  }

  async clearCache(): Promise<void> {
    await semanticCacheStore.clearCache();
    logger.info("🧹 Semantic cache cleared");
  }

  async getCacheStats(): Promise<{ size: number; signatures: string[] }> {
    return await semanticCacheStore.getCacheStats();
  }
}

export const semanticCache = new SemanticAwareCache();
