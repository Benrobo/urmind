import { useState, useEffect, useCallback } from "react";

const usePaste = () => {
  const [pastedText, setPastedText] = useState("");

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      const pastedData = event.clipboardData.getData("text");
      setPastedText(pastedData);
    },
    [pastedText]
  );

  useEffect(() => {
    // global paste listener
    document.addEventListener("paste", handlePaste as any);
    return () => {
      document.removeEventListener("paste", handlePaste as any);
    };
  }, [handlePaste]);

  const clearPastedText = useCallback(() => {
    setPastedText("");
  }, []);

  return { pastedText, handlePaste, clearPastedText };
};

export default usePaste;
