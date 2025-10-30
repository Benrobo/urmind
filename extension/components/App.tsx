import React, { useState, useEffect } from "react";
import Spotlight from "./spotlight";
import ManualIndexButton from "./ManualIndexButton";
import { preferencesStore } from "@/store/preferences.store";
import { domainBlacklistStore } from "@/store/domain-blacklist.store";
import useStorageStore from "@/hooks/useStorageStore";

export default function App() {
  const { value: preferences } = useStorageStore(preferencesStore);
  const [showManualButton, setShowManualButton] = useState(false);

  useEffect(() => {
    const checkVisibility = async () => {
      const isManualMode = preferences.indexingMode === "manual";
      const isBlacklisted = await domainBlacklistStore.isDomainBlacklisted(
        window.location.href
      );
      setShowManualButton(isManualMode && !isBlacklisted);
    };

    checkVisibility();

    const unsubscribe = domainBlacklistStore.subscribe(() => {
      checkVisibility();
    });

    return () => unsubscribe();
  }, [preferences.indexingMode]);

  return (
    <div>
      <Spotlight />
      {showManualButton && <ManualIndexButton />}
    </div>
  );
}
