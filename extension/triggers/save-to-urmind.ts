import { Task, task } from "./task";
import { chromeAI, geminiAi } from "@/helpers/agent/utils";
import { preferencesStore } from "@/store/preferences.store";
import { generateText } from "ai";
import {
  ai_models,
  SaveToUrmindSemanticSearchThreshold,
} from "@/constant/internal";
import { md5Hash, cleanUrlForFingerprint, sleep } from "@/lib/utils";
import urmindDb from "@/services/db";
import retry from "async-retry";
import cleanLLMResponse from "@/helpers/clean-llm-response";
import shortId from "short-uuid";
import logger from "@/lib/logger";
import { UrmindDB } from "@/types/database";
import { activityManagerStore } from "@/store/activity-manager.store";
import { QueueStore } from "@/store/queue.store";
import { domainBlacklistStore } from "@/store/domain-blacklist.store";
import {
  GenerateCategoryPrompt,
  TextContextCreatorPrompt,
} from "@/data/prompt/system/save-to-urmind.system";
import { ImageAnalysisPrompt } from "@/data/prompt/system/image-analysis.system";

export type SaveToUrMindPayload = {
  categorySlug?: string; // this would be available if the user tries save context directly via mindboard
  type: "image" | "link" | "text";
  url: string;
  selectedText?: string;
  srcUrl?: string;
  linkUrl?: string;
  file?: File; // for image uploads (legacy)
  dataUrl?: string; // for image uploads (base64 data URL)
  filename?: string; // for image uploads
  mimeType?: string; // for image uploads
  size?: number; // for image uploads
  source?: "local-upload" | "web-page"; // for image uploads
  tabId: number;
};

export const saveToUrmindQueue = new QueueStore<SaveToUrMindPayload>(
  "local:save_to_urmind_queue"
);

const saveToUrMindJob: Task<SaveToUrMindPayload> = task<SaveToUrMindPayload>({
  id: "save-to-urmind",
  run: async (payload: SaveToUrMindPayload) => {
    const {
      type,
      url,
      selectedText,
      srcUrl,
      linkUrl,
      tabId,
      categorySlug,
      file,
      dataUrl,
      filename,
      mimeType,
      size,
      source,
    } = payload;

    const isBlacklisted = await domainBlacklistStore.isDomainBlacklisted(url);
    if (isBlacklisted) {
      logger.log.setConfig({ global: true })(
        "🚫 Domain is blacklisted, skipping save"
      );
      return;
    }

    const getFilename = (): string => {
      if (filename) return filename;
      if (file?.name) return file.name;
      if (srcUrl) {
        try {
          const url = new URL(srcUrl);
          const name = url.pathname.split("/").pop();
          return name && name.includes(".") ? name : "image.jpg";
        } catch {
          return "image.jpg";
        }
      }
      return "image";
    };

    const displayName = getFilename();

    console.log("Saving to UrMind:", payload);

    if (type === "image" && (file || dataUrl || srcUrl)) {
      const contentFingerprint = file
        ? md5Hash(file.name + file.size + file.lastModified)
        : dataUrl
        ? md5Hash(dataUrl + filename! + size!)
        : md5Hash(srcUrl! + url);

      // Check if already in queue
      const existingItem = await saveToUrmindQueue.find(contentFingerprint);
      if (existingItem) {
        if (existingItem.status === "completed") {
          logger.log.setConfig({ global: true })(
            "Already saved:",
            contentFingerprint
          );
          return;
        }
        if (existingItem.status === "processing") {
          logger.log.setConfig({ global: true })(
            "Already processing:",
            contentFingerprint
          );
          return;
        }
        if (existingItem.status === "failed") {
          logger.log.setConfig({ global: true })(
            "Retrying failed save:",
            contentFingerprint
          );
        }
      }

      // Add to queue
      await saveToUrmindQueue.add(contentFingerprint, payload);
      await saveToUrmindQueue.updateStatus(contentFingerprint, "processing");

      // Track the save activity
      const activityId = await activityManagerStore.track({
        title: "Saving image to Urmind...",
        description: `Saving "${displayName}" to Urmind`,
        status: "in-progress",
      });

      try {
        await processSaveImageToUrMind(payload, displayName);

        await saveToUrmindQueue.updateStatus(contentFingerprint, "completed");
        await activityManagerStore.updateActivity(activityId, {
          status: "completed",
          description: `Successfully saved "${displayName}" to Urmind`,
        });
      } catch (error) {
        await saveToUrmindQueue.updateStatus(contentFingerprint, "failed");
        await activityManagerStore.updateActivity(activityId, {
          status: "failed",
          description: `Failed to save "${displayName}" to Urmind: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
        throw error;
      }
    } else if (type === "text" && selectedText) {
      const contentFingerprint = md5Hash(selectedText);

      // Check if already in queue
      const existingItem = await saveToUrmindQueue.find(contentFingerprint);
      if (existingItem) {
        if (existingItem.status === "completed") {
          logger.log.setConfig({ global: true })(
            "Already saved:",
            contentFingerprint
          );
          return;
        }
        if (existingItem.status === "processing") {
          logger.log.setConfig({ global: true })(
            "Already processing:",
            contentFingerprint
          );
          return;
        }
        if (existingItem.status === "failed") {
          logger.log.setConfig({ global: true })(
            "Retrying failed save:",
            contentFingerprint
          );
        }
      }

      // Add to queue
      await saveToUrmindQueue.add(contentFingerprint, payload);
      await saveToUrmindQueue.updateStatus(contentFingerprint, "processing");

      // Track the save activity
      const activityId = await activityManagerStore.track({
        title: "Saving to Urmind...",
        description: `Saving "${selectedText || url}" to Urmind`,
        status: "in-progress",
      });

      try {
        await processSaveToUrMind(payload);

        await saveToUrmindQueue.updateStatus(contentFingerprint, "completed");
        await activityManagerStore.updateActivity(activityId, {
          status: "completed",
          description: `Successfully saved "${selectedText || url}" to Urmind`,
        });
      } catch (error) {
        await saveToUrmindQueue.updateStatus(contentFingerprint, "failed");
        await activityManagerStore.updateActivity(activityId, {
          status: "failed",
          description: `Failed to save "${selectedText || url}" to Urmind: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
        throw error;
      }
    }
  },
});

export default saveToUrMindJob;

async function processSaveToUrMind(payload: SaveToUrMindPayload) {
  const { type, url, selectedText, srcUrl, linkUrl, tabId, categorySlug } =
    payload;
  const cleanUrl = cleanUrlForFingerprint(url);
  const fingerprint = md5Hash(cleanUrl);

  if (type === "text" && selectedText) {
    const contentFingerprint = md5Hash(selectedText);

    if (!urmindDb.contexts || !urmindDb.embeddings) {
      logger.error.setConfig({ global: true })(
        "❌ Contexts or embeddings service not available"
      );
      return;
    }

    const contextId = shortId.generate();

    const searchText = `${selectedText}`;

    if (!urmindDb.embeddings) {
      logger.error.setConfig({ global: true })(
        "❌ Embeddings service not available"
      );
      return;
    }

    const contextResponse = await generateTextContext(selectedText);

    const genericContextData: Omit<
      UrmindDB["contexts"]["value"],
      "createdAt" | "updatedAt" | "categorySlug"
    > = {
      id: contextId,
      fingerprint,
      contentFingerprint,
      type: "text",
      title: contextResponse.context.title,
      description: contextResponse.context.description,
      summary: contextResponse.context.summary,
      rawContent: selectedText,
      og: null,
      url: cleanUrl,
      fullUrl: url,
      image: null,
      highlightText: selectedText, // Legacy field
      highlightElements: [], // Empty for text-based approach
    };

    let matchedCategorySlug: string | null = null;

    if (categorySlug) {
      matchedCategorySlug = categorySlug;
      const contextData: Omit<
        UrmindDB["contexts"]["value"],
        "createdAt" | "updatedAt"
      > = {
        ...genericContextData,
        categorySlug: matchedCategorySlug,
      };

      await urmindDb.contexts?.createContext(contextData);

      await urmindDb.embeddings?.generateAndStore(selectedText, {
        contextId,
        type: "parent",
        category: matchedCategorySlug,
        url: cleanUrl,
      });

      logger.info.setConfig({ global: true })(
        "✅ Context created with ID:",
        contextId
      );
    } else {
      const semanticSearchResults = await urmindDb.embeddings.semanticSearch(
        searchText,
        { limit: 5 }
      );

      const preferences = await preferencesStore.get();
      const hasApiKey = preferences?.geminiApiKey?.trim();
      const threshold = hasApiKey
        ? SaveToUrmindSemanticSearchThreshold.online
        : SaveToUrmindSemanticSearchThreshold.offline;

      const similarContexts = semanticSearchResults?.filter(
        (c) => c.score >= threshold
      );

      logger.info.setConfig({ global: true })(
        `🔍 Semantic search results [save-to-urmind]:`,
        semanticSearchResults
      );
      logger.info.setConfig({ global: true })(
        `🔍 Closely similar contexts [save-to-urmind]:`,
        similarContexts
      );

      if (similarContexts?.length > 0) {
        matchedCategorySlug = similarContexts?.[0]?.categorySlug || null;
        logger.info.setConfig({ global: true })(
          `🔍 Matched context [save-to-urmind]: ${similarContexts?.[0]?.categorySlug} with score: ${similarContexts?.[0]?.score}`
        );
      }

      if (matchedCategorySlug) {
        logger.info.setConfig({ global: true })(
          `🔍 Matched category [save-to-urmind]: ${matchedCategorySlug}`
        );

        const contextData: Omit<
          UrmindDB["contexts"]["value"],
          "createdAt" | "updatedAt"
        > = {
          ...genericContextData,
          categorySlug: matchedCategorySlug,
        };

        await urmindDb.contexts?.createContext(contextData);

        await urmindDb.embeddings?.generateAndStore(selectedText, {
          contextId,
          type: "parent",
          category: matchedCategorySlug,
          url: cleanUrl,
        });

        logger.info.setConfig({ global: true })(
          "✅ Context created with ID:",
          contextId
        );
      } else {
        const { category } = await generateCategory(selectedText);

        if (!urmindDb.contextCategories) {
          logger.error.setConfig({ global: true })(
            "❌ Context categories service not available"
          );
          return;
        }

        const categorySlug = category.label
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-+|-+$/g, "");

        logger.info.setConfig({ global: true })(
          `Category generation - Label: "${category.label}", LLM Slug: "${category.slug}", Auto Slug: "${categorySlug}"`
        );

        const existingCategory =
          await urmindDb.contextCategories?.getCategoryBySlug(categorySlug);
        if (existingCategory) {
          logger.info.setConfig({ global: true })(
            `Category already exists with slug "${categorySlug}": "${existingCategory.label}"`
          );
        } else {
          await urmindDb.contextCategories?.getOrCreateCategory(
            category.label,
            categorySlug
          );
          logger.info.setConfig({ global: true })(
            `Created new category: "${category.label}" with slug "${categorySlug}"`
          );
        }

        const contextData: Omit<
          UrmindDB["contexts"]["value"],
          "createdAt" | "updatedAt"
        > = {
          ...genericContextData,
          categorySlug: categorySlug,
        };

        await urmindDb.contexts?.createContext(contextData);

        await urmindDb.embeddings?.generateAndStore(selectedText, {
          contextId,
          type: "parent",
          category: categorySlug,
          url: cleanUrl,
        });

        logger.info.setConfig({ global: true })(
          "✅ Context created with ID:",
          contextId
        );
      }
    }
  }
}

async function generateCategory(text: string) {
  return await retry(
    async () => {
      const preferences = await preferencesStore.get();

      const existingCategories =
        (await urmindDb.contextCategories?.getAllCategories()) || [];
      const categoriesList = existingCategories.map((cat) => ({
        label: cat.label,
        slug: cat.slug,
      }));

      let llmResponse: string;

      if (preferences.geminiApiKey?.trim()) {
        try {
          llmResponse = await generateWithOnlineModel(
            text,
            categoriesList,
            preferences
          );
        } catch (onlineError) {
          console.warn(
            "Online model failed, falling back to local model:",
            onlineError
          );
          llmResponse = await generateWithLocalModel(text, categoriesList);
        }
      } else {
        llmResponse = await generateWithLocalModel(text, categoriesList);
      }

      const sanitizedResponse = cleanLLMResponse({
        response: llmResponse,
        requiredFields: ["category"],
        preserveFormatting: false,
      }) as unknown as { category: { label: string; slug: string } };

      logger.info.setConfig({ global: true })(
        "Category generation response:",
        sanitizedResponse
      );
      return sanitizedResponse;
    },
    {
      retries: 3,
      factor: 1,
      minTimeout: 1000,
      maxTimeout: 5000,
      onRetry: (error, attempt) => {
        logger.error(`🔄 Category generation retry ${attempt}:`, error);
      },
    }
  );
}

async function generateWithOnlineModel(
  text: string,
  existingCategories: Array<{ label: string; slug: string }>,
  preferences: any
): Promise<string> {
  const genAI = geminiAi(preferences.geminiApiKey);
  const modelName = ai_models.generation.gemini_flash; // Always use Flash for online generation

  logger.log.setConfig({ global: true })(
    `🤖 Using online model for category generation: ${modelName}`
  );

  const result = await generateText({
    model: genAI(modelName),
    prompt: GenerateCategoryPrompt(text, existingCategories),
  });

  logger.log.setConfig({ global: true })(
    "✅ Online category generation completed"
  );
  return result.text;
}

async function generateWithLocalModel(
  text: string,
  existingCategories: Array<{ label: string; slug: string }>
): Promise<string> {
  logger.log.setConfig({ global: true })(
    "🏠 Using local ChromeAI for category generation"
  );

  const result = await chromeAI.generateText([
    {
      role: "user",
      content: GenerateCategoryPrompt(text, existingCategories),
    },
  ]);

  logger.log.setConfig({ global: true })(
    "✅ Local category generation completed"
  );
  return result.text;
}

async function generateTextContext(text: string) {
  return await retry(
    async () => {
      const preferences = await preferencesStore.get();

      let llmResponse: string;

      if (preferences.geminiApiKey?.trim()) {
        try {
          llmResponse = await generateTextContextWithOnlineModel(
            text,
            preferences
          );
        } catch (onlineError) {
          console.warn(
            "Online model failed, falling back to local model:",
            onlineError
          );
          llmResponse = await generateTextContextWithLocalModel(text);
        }
      } else {
        llmResponse = await generateTextContextWithLocalModel(text);
      }

      const sanitizedResponse = cleanLLMResponse({
        response: llmResponse,
        requiredFields: ["context"],
        preserveFormatting: false,
      }) as unknown as {
        context: { title: string; description: string; summary: string };
      };

      logger.info.setConfig({ global: true })(
        "Text context generation response:",
        sanitizedResponse
      );
      return sanitizedResponse;
    },
    {
      retries: 3,
      factor: 1,
      minTimeout: 1000,
      maxTimeout: 5000,
      onRetry: (error, attempt) => {
        logger.error.setConfig({ global: true })(
          `🔄 Text context generation retry ${attempt}:`,
          error
        );
      },
    }
  );
}

async function generateTextContextWithOnlineModel(
  text: string,
  preferences: any
): Promise<string> {
  const genAI = geminiAi(preferences.geminiApiKey);
  const modelName = ai_models.generation.gemini_flash; // Always use Flash for online generation

  logger.log.setConfig({ global: true })(
    `🤖 Using online model for text context generation: ${modelName}`
  );

  const result = await generateText({
    model: genAI(modelName),
    prompt: TextContextCreatorPrompt(text),
  });

  logger.log.setConfig({ global: true })(
    "✅ Online text context generation completed"
  );
  return result.text;
}

async function generateTextContextWithLocalModel(
  text: string
): Promise<string> {
  logger.log.setConfig({ global: true })(
    "🏠 Using local ChromeAI for text context generation"
  );

  const result = await chromeAI.generateText([
    {
      role: "user",
      content: TextContextCreatorPrompt(text),
    },
  ]);

  logger.log.setConfig({ global: true })(
    "✅ Local text context generation completed"
  );
  return result.text;
}

// Image processing functions
async function prepareImageForAnalysis(
  file?: File,
  dataUrl?: string,
  srcUrl?: string
): Promise<File | string> {
  if (file) {
    return file;
  } else if (dataUrl) {
    return dataUrl;
  } else if (srcUrl) {
    // Fetch image from URL and convert to data URL
    try {
      const response = await fetch(srcUrl);
      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      return dataUrl;
    } catch (error) {
      throw new Error(`Failed to fetch image from URL: ${error}`);
    }
  } else {
    throw new Error("No image data available for analysis");
  }
}

async function processSaveImageToUrMind(
  payload: SaveToUrMindPayload,
  displayName: string
) {
  const {
    file,
    dataUrl,
    filename,
    mimeType,
    size,
    categorySlug,
    source,
    url,
    srcUrl,
  } = payload;

  if (!file && !dataUrl && !srcUrl) {
    throw new Error(
      "No file, dataUrl, or srcUrl provided for image processing"
    );
  }

  if (!urmindDb.contexts || !urmindDb.embeddings || !urmindDb.assets) {
    logger.error.setConfig({ global: true })(
      "❌ Required services not available for image processing"
    );
    logger.error.setConfig({ global: true })(
      `Services available: contexts=${!!urmindDb.contexts}, embeddings=${!!urmindDb.embeddings}, assets=${!!urmindDb.assets}`
    );
    return;
  }

  const assetId = shortId.generate();
  const contextId = shortId.generate();
  const cleanUrl = cleanUrlForFingerprint(url);
  const fingerprint = md5Hash(cleanUrl);
  const contentFingerprint = file
    ? md5Hash(file.name + file.size + file.lastModified)
    : dataUrl
    ? md5Hash(dataUrl + filename! + size!)
    : md5Hash(srcUrl! + url);

  // Use provided dataUrl, convert file to base64, or use srcUrl directly
  const finalDataUrl = dataUrl || (file ? await fileToBase64(file) : srcUrl!);

  // Create asset record
  await urmindDb.assets!.createAsset({
    id: assetId,
    type: "image",
    source: source || "local-upload",
    filename: displayName,
    mimeType: file?.type || mimeType || "image/png",
    size: file?.size || size || 0,
    dataUrl: finalDataUrl,
    url: source === "web-page" ? srcUrl || url : undefined,
    metadata: {},
  });

  logger.log.setConfig({ global: true })("✅ Asset created with ID:", assetId);

  // Analyze image with AI
  const imageForAnalysis = await prepareImageForAnalysis(file, dataUrl, srcUrl);
  const analysis = await analyzeImage(imageForAnalysis);

  // Determine category
  let matchedCategorySlug = categorySlug;

  if (!matchedCategorySlug) {
    // Use semantic search to find similar contexts
    const semanticSearchResults = await urmindDb.embeddings.semanticSearch(
      analysis.summary,
      { limit: 5 }
    );

    const preferences = await preferencesStore.get();
    const hasApiKey = preferences?.geminiApiKey?.trim();
    const threshold = hasApiKey
      ? SaveToUrmindSemanticSearchThreshold.online
      : SaveToUrmindSemanticSearchThreshold.offline;

    const similarContexts = semanticSearchResults?.filter(
      (c) => c.score >= threshold
    );

    if (similarContexts?.length > 0) {
      matchedCategorySlug = similarContexts[0]?.categorySlug || undefined;
      logger.log.setConfig({ global: true })(
        `🔍 Matched category from semantic search: ${matchedCategorySlug}`
      );
    } else {
      // Generate new category
      const { category } = await generateCategoryFromImage(analysis);
      const categorySlug = category.label
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");

      await urmindDb.contextCategories?.getOrCreateCategory(
        category.label,
        categorySlug
      );

      matchedCategorySlug = categorySlug;
      logger.log.setConfig({ global: true })(
        `🔍 Created new category: "${category.label}" with slug "${categorySlug}"`
      );
    }
  }

  // Create context
  const contextData: Omit<
    UrmindDB["contexts"]["value"],
    "createdAt" | "updatedAt"
  > = {
    id: contextId,
    fingerprint,
    contentFingerprint,
    type: "artifact:image",
    title: analysis.title,
    description: analysis.description,
    summary: analysis.summary,
    assetId,
    og: null,
    url: cleanUrl,
    fullUrl: url,
    image: null,
    highlightText: "", // Not applicable for images
    highlightElements: [],
    categorySlug: matchedCategorySlug!,
  };

  await urmindDb.contexts.createContext(contextData);

  // Generate embeddings from summary
  await urmindDb.embeddings.generateAndStore(analysis.summary, {
    contextId,
    type: "parent",
    category: matchedCategorySlug!,
    url: cleanUrl,
  });

  logger.log.setConfig({ global: true })(
    "✅ Image context created with ID:",
    contextId
  );
}

async function analyzeImage(fileOrDataUrl: File | string): Promise<{
  title: string;
  description: string;
  summary: string;
  tags: string[];
}> {
  const preferences = await preferencesStore.get();

  if (preferences.geminiApiKey?.trim()) {
    return await analyzeImageOnline(fileOrDataUrl, preferences);
  } else {
    return await analyzeImageLocal(fileOrDataUrl);
  }
}

async function analyzeImageLocal(fileOrDataUrl: File | string) {
  // const { ImageAnalysisPrompt } = await import(
  //   "@/data/prompt/system/image-analysis.system"
  // );

  // Convert dataUrl to File if needed
  let imageFile: File;
  if (typeof fileOrDataUrl === "string") {
    // Convert dataUrl to File without using fetch (CSP-safe)
    const base64Data = fileOrDataUrl.split(",")[1];
    const mimeType = fileOrDataUrl?.split(",")[0]?.split(":")[1]?.split(";")[0];
    const byteCharacters = atob(base64Data || "");
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    imageFile = new File([blob], "image.png", { type: mimeType });
  } else {
    imageFile = fileOrDataUrl;
  }

  const result = await chromeAI.generateText([
    {
      role: "user",
      content: [
        { type: "text", text: ImageAnalysisPrompt() },
        { type: "image", image: imageFile },
      ],
    },
  ]);

  return cleanLLMResponse({
    response: result.text,
    requiredFields: ["title", "description", "summary", "tags"],
  });
}

async function analyzeImageOnline(
  fileOrDataUrl: File | string,
  preferences: any
) {
  const { ImageAnalysisPrompt } = await import(
    "@/data/prompt/system/image-analysis.system"
  );
  const genAI = geminiAi(preferences.geminiApiKey);

  // Convert to base64 string (not data URL) for Vercel AI SDK
  let base64String: string;
  if (typeof fileOrDataUrl === "string") {
    // Extract base64 data from data URL
    base64String = fileOrDataUrl?.split(",")?.[1] || "";
  } else {
    // Convert File to base64 string
    const dataUrl = await fileToBase64(fileOrDataUrl);
    base64String = dataUrl?.split(",")?.[1] || "";
  }

  const result = await generateText({
    model: genAI("gemini-2.0-flash-exp"), // Vision model
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: ImageAnalysisPrompt() },
          { type: "image", image: base64String },
        ],
      },
    ],
  });

  return cleanLLMResponse({
    response: result.text,
    requiredFields: ["title", "description", "summary", "tags"],
  });
}

async function generateCategoryFromImage(analysis: {
  title: string;
  description: string;
  summary: string;
  tags: string[];
}) {
  const existingCategories =
    (await urmindDb.contextCategories?.getAllCategories()) || [];
  const categoriesList = existingCategories.map((cat) => ({
    label: cat.label,
    slug: cat.slug,
  }));

  const prompt = `Based on this image analysis, generate an appropriate category:

Image Title: ${analysis.title}
Image Description: ${analysis.description}
Image Summary: ${analysis.summary}
Image Tags: ${analysis.tags.join(", ")}

${GenerateCategoryPrompt(analysis.summary, categoriesList)}`;

  const preferences = await preferencesStore.get();
  let llmResponse: string;

  if (preferences.geminiApiKey?.trim()) {
    try {
      llmResponse = await generateWithOnlineModel(
        analysis.summary,
        categoriesList,
        preferences
      );
    } catch (onlineError) {
      console.warn(
        "Online model failed, falling back to local model:",
        onlineError
      );
      llmResponse = await generateWithLocalModel(
        analysis.summary,
        categoriesList
      );
    }
  } else {
    llmResponse = await generateWithLocalModel(
      analysis.summary,
      categoriesList
    );
  }

  return cleanLLMResponse({
    response: llmResponse,
    requiredFields: ["category"],
  });
}

// Utility function to convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
