import { useState, useEffect } from "react";
import { contextSpotlightVisibilityStore } from "@/store/context.store";

export function useSpotlightVisibility() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(contextSpotlightVisibilityStore.getValue());
    };

    updateVisibility();

    const cleanup =
      contextSpotlightVisibilityStore.addStorageListener(updateVisibility);

    return cleanup;
  }, []);

  const show = async () => {
    await contextSpotlightVisibilityStore.show();
    setIsVisible(true);
  };

  const hide = async () => {
    await contextSpotlightVisibilityStore.hide();
    setIsVisible(false);
  };

  const toggle = async () => {
    const newState = await contextSpotlightVisibilityStore.toggle();
    setIsVisible(newState);
    return newState;
  };

  return {
    isVisible,
    show,
    hide,
    toggle,
  };
}
