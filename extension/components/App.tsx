import React, { useState, useEffect } from "react";
import Spotlight from "./spotlight";
import ManualIndexButton from "./ManualIndexButton";
import { preferencesStore } from "@/store/preferences.store";
import useStorageStore from "@/hooks/useStorageStore";

export default function App() {
  const { value: preferences } = useStorageStore(preferencesStore);
  const [showManualButton, setShowManualButton] = useState(false);

  useEffect(() => {
    // Show manual button only when indexing mode is manual
    setShowManualButton(preferences.indexingMode === "manual");
  }, [preferences.indexingMode]);

  return (
    <div>
      <Spotlight />
      {showManualButton && <ManualIndexButton />}
    </div>
  );
}
