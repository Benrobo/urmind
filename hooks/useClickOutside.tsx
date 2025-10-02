import logger from "@/lib/logger";
import { useEffect, useRef } from "react";

interface UseClickOutsideOptions {
  enabled?: boolean;
  excludeSelectors?: string[]; // CSS selectors to exclude from outside clicks
  log?: boolean;
}

/**
 * Using position-based click detection because shadow DOM blocks normal click events
 * from reaching the main document. Position detection uses mouse coordinates instead
 * of relying on event bubbling, which doesn't work reliably in shadow DOM.
 */
export default function useClickOutside<T extends HTMLElement = HTMLDivElement>(
  callback: () => void,
  options?: UseClickOutsideOptions
) {
  const { enabled = true, excludeSelectors = [], log = false } = options || {};
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleGlobalClick = (event: MouseEvent) => {
      if (!ref.current) return;

      const target = event.target as Node;
      const rect = ref.current.getBoundingClientRect();
      const { clientX, clientY } = event;

      if (log)
        logger.log("Position-based click detection:", {
          clickX: clientX,
          clickY: clientY,
          elementRect: rect,
          isInside:
            clientX >= rect.left &&
            clientX <= rect.right &&
            clientY >= rect.top &&
            clientY <= rect.bottom,
        });

      const defaultExcludes = ["#delete-category-btn"];

      const allExcludes = [...defaultExcludes, ...excludeSelectors];

      for (const selector of allExcludes) {
        const excludedElement = document.querySelector(selector);
        if (excludedElement && excludedElement.contains(target)) {
          if (log)
            logger.log("Click on excluded element, not closing:", selector);
          return;
        }
      }

      // Check if click coordinates are outside our element
      if (
        !(
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        )
      ) {
        if (log) logger.log("Click outside detected (position-based)");
        callback();
      }
    };

    // Listen on multiple targets
    document.addEventListener("mousedown", handleGlobalClick, true);
    window.addEventListener("mousedown", handleGlobalClick, true);

    return () => {
      document.removeEventListener("mousedown", handleGlobalClick, true);
      window.removeEventListener("mousedown", handleGlobalClick, true);
    };
  }, [callback, enabled, excludeSelectors]);

  return ref;
}
