import {
  ContextualTextElementTypes,
  InvalidContextualTextElementText,
  InvalidContextualTextElementSelectors,
} from "@/constant/page-extraction";
import {
  batchContextualTextElementsByCount,
  batchPageContentByByteLength,
} from "@/helpers/page-indexing.helpers";
import { GEMINI_NANO_MAX_TOKENS_PER_PROMPT } from "@/constant/internal";
import { md5Hash } from "@/lib/utils";
import { ContextualTextElement } from "@/types/page-extraction";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import getXPath from "get-xpath";
import shortUUID from "short-uuid";

export type PageMetadata = {
  title: string;
  description: string | null;
  og: {
    image: string | null;
    title: string | null;
    favicon: string | null;
  };
  pageContent: string;
  pageUrl: string;
  pageContentBatches: string[];
  pageContextualTextElementBatches: ContextualTextElement[][];
};

class PageExtractionService {
  private readonly MAX_DUPLICATE_ELEMENTS = 1; // Maximum number of elements with same value to keep

  async extractPageMetadata(): Promise<PageMetadata> {
    if (!document || !document.head || !document.body) {
      console.log("No document or head or body");
      return {
        title: "",
        description: null,
        og: {
          image: null,
          title: null,
          favicon: null,
        },
        pageContent: "",
        pageUrl: "",
        pageContentBatches: [],
        pageContextualTextElementBatches: [],
      };
    }

    const _title = document.title;
    const _description = document.querySelector("meta[name='description']");
    const _metaTags = document?.head?.querySelectorAll("meta");
    const ogdetails = this.extractOgDetails(Array.from(_metaTags));
    const pageContent = document?.body?.innerText;
    const pageUrl = window.location.href;
    const favicon = this.extractFavicon(pageUrl);

    // Split content into batches for LLM processing
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 15000,
      chunkOverlap: 600,
    });
    const pageContentBatches = await textSplitter.splitText(pageContent ?? "");

    const pageContextualTextElementBatches =
      await batchContextualTextElementsByCount(
        this.extractContextualPageTextElements(),
        5, // maxElementsPerBatch - reduced for Gemini Nano
        GEMINI_NANO_MAX_TOKENS_PER_PROMPT * 4 // ~4096 bytes for 1024 tokens
      );

    return {
      title: _title,
      description: _description?.getAttribute("content") ?? null,
      og: {
        image: ogdetails.ogImage ?? null,
        title: ogdetails.ogTitle ?? null,
        favicon: favicon ?? null,
      },
      pageContent: pageContent ?? "",
      pageUrl: pageUrl,
      pageContentBatches,
      pageContextualTextElementBatches,
    };
  }

  private cleanUrl(url: string) {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }

  private extractFavicon(url: string) {
    const cleanUrl = this.cleanUrl(url);
    const rels = [
      "icon",
      "shortcut icon",
      "apple-touch-icon",
      "apple-touch-icon-precomposed",
      "mask-icon",
      "fluid-icon",
      "alternate icon",
    ];

    const links = Array.from(
      document.querySelectorAll(`link[rel]`)
    ) as HTMLLinkElement[];

    for (const rel of rels) {
      const link = links.find((l) => l.rel === rel);
      if (link && link.href) {
        const href = link.getAttribute("href") || link.href;
        return this.normalizeFaviconUrl(href, url);
      }
    }

    const anyIcon = links.find((l) => l.rel.toLowerCase().includes("icon"));
    if (anyIcon && anyIcon.href) {
      const href = anyIcon.getAttribute("href") || anyIcon.href;
      return this.normalizeFaviconUrl(href, url);
    }

    return `${cleanUrl}/favicon.ico`;
  }

  private normalizeFaviconUrl(faviconUrl: string, pageUrl: string): string {
    // If it's already a full URL, return as is
    if (faviconUrl.startsWith("http://") || faviconUrl.startsWith("https://")) {
      return faviconUrl;
    }

    // If it's protocol-relative (starts with //), add the current protocol
    if (faviconUrl.startsWith("//")) {
      const protocol = new URL(pageUrl).protocol;
      return `${protocol}${faviconUrl}`;
    }

    // If it's relative, make it absolute
    if (faviconUrl.startsWith("/")) {
      const url = new URL(pageUrl);
      return `${url.protocol}//${url.host}${faviconUrl}`;
    }

    // If it's a relative path without leading slash, add it to the current path
    const url = new URL(pageUrl);
    const basePath = url.pathname.substring(
      0,
      url.pathname.lastIndexOf("/") + 1
    );
    return `${url.protocol}//${url.host}${basePath}${faviconUrl}`;
  }

  private extractOgDetails(_metaTags: HTMLMetaElement[]) {
    let ogImage: string | undefined = undefined;
    let ogTitle: string | undefined = undefined;
    for (const meta of _metaTags) {
      for (const attr of Array.from(meta?.attributes ?? [])) {
        if (
          (attr.name === "property" || attr.localName === "property") &&
          attr.value.includes("og:image")
        ) {
          if (!ogImage) ogImage = meta.getAttribute("content") || undefined;
        }
        if (attr.name === "property" && attr.value.includes("og:title")) {
          if (!ogTitle) ogTitle = meta.getAttribute("content") || undefined;
        }
      }
      if (ogImage && ogTitle) break;
    }

    return {
      ogImage,
      ogTitle,
    };
  }

  private generateSelectorsArray(
    element: Element
  ): ContextualTextElement["selectors"] {
    const selectors: Array<{
      type: "id" | "xpath" | "tag";
      value: string;
    }> = [];

    // ID selector
    if (element.id) {
      selectors.push({ type: "id", value: element.id });
    }

    // Tag selector
    selectors.push({ type: "tag", value: element.tagName.toLowerCase()! });

    // XPath selector
    try {
      const xpath = getXPath(element);
      if (xpath) {
        selectors.push({ type: "xpath", value: xpath });
      }
    } catch (error) {
      // XPath generation failed, skip it
    }

    return selectors;
  }

  private extractContextualPageTextElements(): ContextualTextElement[] {
    const elements: ContextualTextElement[] = [];
    const seenValues = new Map<string, number>();
    const allElements = document.querySelectorAll("*");

    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i] as HTMLElement;
      if (
        element &&
        this.isContextualTextElement(element) &&
        this.isElementVisible(element)
        // &&
        // !this.hasInvalidSelector(element)
      ) {
        const contextualTextElement =
          this.convertToContextualTextElement(element);
        if (
          contextualTextElement &&
          contextualTextElement.text
          // &&
          // this.isValidContextualText(contextualTextElement.text)
        ) {
          const normalizedValue = contextualTextElement.text
            .toLowerCase()
            .trim();
          const currentCount = seenValues.get(normalizedValue) || 0;

          // Only add if we haven't seen this value too many times
          if (currentCount < this.MAX_DUPLICATE_ELEMENTS) {
            elements.push(contextualTextElement);
            seenValues.set(normalizedValue, currentCount + 1);
          }
        }
      }
    }

    return elements;
  }

  private isContextualTextElement(element: Element): boolean {
    return ContextualTextElementTypes.includes(
      element.tagName.toLowerCase() as ContextualTextElement["type"]
    );
  }

  private isValidContextualText(text: string): boolean {
    if (!text || text.trim().length === 0) {
      return false;
    }

    const normalizedText = text.toLowerCase().trim();

    // Check if the text matches any of the invalid patterns
    return !InvalidContextualTextElementText.some(
      (invalidText) =>
        normalizedText === invalidText.toLowerCase() ||
        normalizedText.includes(invalidText.toLowerCase())
    );
  }

  private isElementVisible(element: HTMLElement): boolean {
    // Check if element is hidden via CSS
    const style = window.getComputedStyle(element);

    // Element is not visible if:
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0" ||
      parseFloat(style.opacity) === 0
    ) {
      return false;
    }

    // Check if element has zero dimensions
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return false;
    }

    // Check if element is positioned off-screen
    if (
      rect.bottom < 0 ||
      rect.right < 0 ||
      rect.left > window.innerWidth ||
      rect.top > window.innerHeight
    ) {
      return false;
    }

    return true;
  }

  private hasInvalidSelector(element: HTMLElement): boolean {
    return InvalidContextualTextElementSelectors.some((selector) => {
      switch (selector.type) {
        case "class":
          return element.classList.contains(selector.value);
        case "id":
          return element.id === selector.value;
        default:
          return false;
      }
    });
  }

  private sanitizeInvalidElementsValues(text: string) {
    return text
      .replace(/[\n\r\t]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private convertToContextualTextElement(
    element: HTMLElement
  ): ContextualTextElement {
    return {
      id: shortUUID.generate(), // this would be useed by the llm to suggest element for page anchoring
      type: element.tagName.toLowerCase() as ContextualTextElement["type"],
      text: this.sanitizeInvalidElementsValues(
        element?.innerText ?? element?.textContent ?? ""
      ),
      position: {
        x: element.getBoundingClientRect().x,
        y: element.getBoundingClientRect().y,
        width: element.getBoundingClientRect().width,
        height: element.getBoundingClientRect().height,
      },
      selectors: this.generateSelectorsArray(element),
    };
  }
}

const pageExtractionService = new PageExtractionService();

export default pageExtractionService;
