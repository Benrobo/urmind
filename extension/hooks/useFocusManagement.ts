import { useEffect, useRef, RefObject } from "react";

interface UseFocusManagementOptions {
  isActive: boolean;
  preventEventBubbling?: boolean;
  refocusDelay?: number;
  excludeElements?: string[];
}

/**
 * Custom hook for managing focus in Chrome extensions to prevent host page interference
 *
 * @param options - Configuration options for focus management
 * @returns Object containing ref and event handlers
 */
export function useFocusManagement({
  isActive,
  preventEventBubbling = true,
  refocusDelay = 10,
  excludeElements = [],
}: UseFocusManagementOptions) {
  const elementRef = useRef<HTMLElement>(null);

  // Event handlers for preventing event bubbling
  const createEventHandlers = () => {
    if (!preventEventBubbling) return {};

    const stopPropagation = (e: React.SyntheticEvent) => {
      e.stopPropagation();
    };

    // Allow hotkey events and important keys to pass through
    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Allow hotkey combinations to bubble up
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return; // Don't stop propagation for hotkeys
      }

      // Allow important keys to bubble up
      const allowedKeys = [
        "Enter",
        "Escape",
        "Tab",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ];
      if (allowedKeys.includes(e.key)) {
        return; // Don't stop propagation for important keys
      }

      e.stopPropagation();
    };

    return {
      onKeyDown: handleKeyDown,
      onKeyUp: stopPropagation,
      onFocus: stopPropagation,
      onBlur: stopPropagation,
      onClick: stopPropagation,
      onMouseDown: stopPropagation,
      onMouseUp: stopPropagation,
    };
  };

  // Focus management effect
  useEffect(() => {
    if (!isActive || !elementRef.current) return;

    // Focus the element when active
    elementRef.current.focus();

    // Set up focus loss detection
    const handleFocusLoss = () => {
      if (!isActive || !elementRef.current) return;

      const activeElement = document.activeElement;

      // Check if focus moved away from our element
      if (activeElement && activeElement !== elementRef.current) {
        // Check if focus moved to excluded elements (like our own components)
        const isExcluded = excludeElements.some((selector) => {
          try {
            return activeElement.closest(selector);
          } catch {
            return false;
          }
        });

        // Only refocus if not moved to excluded elements
        if (!isExcluded) {
          setTimeout(() => {
            if (elementRef.current && isActive) {
              elementRef.current.focus();
            }
          }, refocusDelay);
        }
      }
    };

    // Listen for focus changes
    document.addEventListener("focusin", handleFocusLoss);

    return () => {
      document.removeEventListener("focusin", handleFocusLoss);
    };
  }, [isActive, refocusDelay, excludeElements]);

  return {
    ref: elementRef,
    eventHandlers: createEventHandlers(),
  };
}

/**
 *
 * @param isActive - Whether the input should maintain focus
 * @param options - Additional options
 * @returns Object with ref and event handlers for input elements
 */
export function useInputFocusManagement(
  isActive: boolean,
  options: Omit<UseFocusManagementOptions, "isActive"> = {}
) {
  const result = useFocusManagement({
    isActive,
    ...options,
  });

  return {
    ...result,
    ref: result.ref as RefObject<HTMLInputElement>,
  };
}

/**
 * Hook for container focus management (prevents host page keyboard listeners)
 *
 * @param isActive - Whether the container should prevent event bubbling
 * @returns Object with event handlers for container elements
 */
export function useContainerFocusManagement(isActive: boolean) {
  const createEventHandlers = () => {
    if (!isActive) return {};

    const stopPropagation = (e: React.SyntheticEvent) => {
      e.stopPropagation();
    };

    // Allow hotkey events and important keys to pass through
    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Allow hotkey combinations to bubble up
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return; // Don't stop propagation for hotkeys
      }

      // Allow important keys to bubble up
      const allowedKeys = [
        "Enter",
        "Escape",
        "Tab",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ];
      if (allowedKeys.includes(e.key)) {
        return; // Don't stop propagation for important keys
      }

      e.stopPropagation();
    };

    return {
      onKeyDown: handleKeyDown,
      onKeyUp: stopPropagation,
      onClick: stopPropagation,
      onMouseDown: stopPropagation,
      onMouseUp: stopPropagation,
    };
  };

  return {
    eventHandlers: createEventHandlers(),
  };
}
