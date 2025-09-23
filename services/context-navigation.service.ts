import logger from "@/lib/logger";
import urmindDb from "@/services/db";
import { Context } from "@/types/context";

/**
 * Service for handling context navigation and highlighting
 */
export class ContextNavigationService {
  /**
   * Handle context navigation by checking for ctx query parameter
   * and highlighting the corresponding elements
   */
  async handleContextNavigation(): Promise<void> {
    const urlParams = new URLSearchParams(location.search);
    const contextId = urlParams.get("ctx");

    if (!contextId) {
      logger.warn("🚨 No context ID found in URL: ", location.href);
      return;
    }

    logger.log("🎯 Context navigation detected:", contextId);

    try {
      // Get context from IndexedDB
      const context = await urmindDb.contexts?.getContext(contextId);

      if (!context) {
        logger.warn("⚠️ Context not found:", contextId);
        return;
      }

      logger.log("📄 Context found:", context);

      // Wait for DOM to be ready
      if (document.readyState === "loading") {
        await new Promise((resolve) => {
          document.addEventListener("DOMContentLoaded", resolve);
        });
      }

      // Highlight elements
      await this.highlightContextElements(context.highlightElements || []);
    } catch (error) {
      logger.error("❌ Error handling context navigation:", error);
    }
  }

  /**
   * Highlight context elements by scrolling to first and highlighting all
   */
  async highlightContextElements(
    highlightElements: Array<{
      xpath: string;
      position: { x: number; y: number; width: number; height: number };
    }>
  ): Promise<void> {
    if (!highlightElements || highlightElements.length === 0) {
      logger.log("📄 No highlight elements to process");
      return;
    }

    logger.log("🎨 Highlighting", highlightElements.length, "elements");

    // Remove any existing highlights
    document.querySelectorAll(".urmind-highlight").forEach((el) => {
      el.classList.remove("urmind-highlight");
    });

    let firstElement: Element | null = null;

    for (const highlight of highlightElements) {
      try {
        // Find element by XPath
        const element = document.evaluate(
          highlight.xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        ).singleNodeValue as Element;

        if (element) {
          logger.log(element);

          // Add highlight class
          element.classList.add("urmind-highlight");

          // Apply manual CSS styling for better control
          (element as HTMLElement).style.cssText += `
            background-color: rgba(33, 182, 162, 0.3) !important;
            border: 0.1px solid #17BEBB !important;
          `;

          // Store reference to first element for scrolling
          if (!firstElement) {
            firstElement = element;
          }

          logger.log("✅ Highlighted element:", highlight.xpath);
        } else {
          logger.warn("⚠️ Element not found for XPath:", highlight.xpath);
        }
      } catch (error) {
        logger.error("❌ Error highlighting element:", error);
      }
    }

    // Scroll to first element
    if (firstElement) {
      firstElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
      logger.log("📍 Scrolled to first element");
    }
  }

  /**
   * Clear all context highlights
   */
  clearHighlights(): void {
    document.querySelectorAll(".urmind-highlight").forEach((el) => {
      el.classList.remove("urmind-highlight");
      // Remove manual styling
      (el as HTMLElement).style.cssText = (el as HTMLElement).style.cssText
        .replace(
          /background-color:\s*rgba\(33,\s*182,\s*162,\s*0\.3\)\s*!important;?\s*/g,
          ""
        )
        .replace(/border:\s*0\.1px\s*solid\s*#17BEBB\s*!important;?\s*/g, "");
    });
    logger.log("🧹 Cleared all context highlights");
  }

  /**
   * Navigate to a context by opening URL with ctx query parameter
   */
  navigateToContext(context: Context): void {
    if (!context.url) {
      logger.warn("🚨 No URL available for context:", context.id);
      return;
    }

    const url = new URL(context.fullUrl || context.url);
    if (context?.highlightElements?.length > 0) {
      url.searchParams.set("ctx", context.id);
    }
    window.open(url.toString(), "_blank");
    logger.log("🎯 Navigating to context:", context.id, "at", url.toString());
  }
}

// Export singleton instance
export const contextNavigationService = new ContextNavigationService();
