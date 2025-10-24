import { useEffect } from "react";

/**
 * Simple hook to add/remove overflow-hidden class
 * @param isLocked - Whether to hide overflow (true) or show (false)
 */
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isLocked]);
}
