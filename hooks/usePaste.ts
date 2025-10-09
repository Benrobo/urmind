import { useState, useCallback, useEffect } from "react";

const usePaste = () => {
  const [pastedText, setPastedText] = useState("");

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;
      const isInputElement =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true" ||
        target.closest("input, textarea, [contenteditable='true']");

      if (isInputElement) return;

      const pastedData = event.clipboardData.getData("text");
      if (pastedData && pastedData.trim() !== "") {
        setPastedText(pastedData);
      }
    },
    []
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
