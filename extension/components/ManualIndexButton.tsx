import React, { useState, useEffect, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { cn, md5Hash } from "@/lib/utils";
import ActivitySpinner from "./spinner";
import { manualIndexingStore } from "@/store/manual-indexing.store";
import { cleanUrlForFingerprint } from "@/lib/utils";
import {
  sendMessageToBackgroundScript,
  sendMessageToBackgroundScriptWithResponse,
} from "@/helpers/messaging";
import { useDraggablePosition } from "@/hooks/useDraggablePosition";
import pageExtractionService from "@/services/page-extraction/extraction";
import urmindLogo from "~/assets/urmind-logo.svg";
import { needsUIAdjustments } from "@/constant/ui-config";

type ButtonState = "default" | "indexing" | "indexed" | "failed";

interface ManualIndexButtonProps {
  className?: string;
}

export default function ManualIndexButton({
  className,
}: ManualIndexButtonProps) {
  const [buttonState, setButtonState] = useState<ButtonState>("default");
  const [tooltip, setTooltip] = useState("Watch this page with UrMind");
  const [hasDragged, setHasDragged] = useState(false);

  const currentUrl = window.location.href;
  const cleanUrl = cleanUrlForFingerprint(currentUrl);
  const { y, isDragging, rightOffset, handleMouseDown } =
    useDraggablePosition();

  const _needsUIAdjustments = needsUIAdjustments.find((adjustment) =>
    new URL(currentUrl).hostname.includes(adjustment.domain)
  );

  const manualIndexButtonAdjustments = _needsUIAdjustments?.adjustments;

  const checkPageStatus = useCallback(async () => {
    try {
      const existingContext = await sendMessageToBackgroundScriptWithResponse({
        action: "db-operation",
        payload: {
          operation: "getContextByFingerprint",
          data: {
            fingerprint: md5Hash(cleanUrl),
          },
        },
      });

      if (existingContext?.result) {
        setButtonState("indexed");
        setTooltip("Page already being watched");
        return;
      }

      // Fallback to checking manual indexing store for granular status
      const status = await manualIndexingStore.getStatus(cleanUrl);
      if (status) {
        switch (status) {
          case "processing":
            setButtonState("indexing");
            setTooltip("Indexing page...");
            break;
          case "completed":
            setButtonState("indexed");
            setTooltip("Page already being watched");
            break;
          case "failed":
            setButtonState("failed");
            setTooltip("Failed to index. Click to retry");
            break;
          case "pending":
            setButtonState("indexing");
            setTooltip("Indexing page...");
            break;
        }
      } else {
        setButtonState("default");
        setTooltip("Watch this page with UrMind");
      }
    } catch (error) {
      console.error("Error checking page status:", error);
      setButtonState("default");
      setTooltip("Watch this page with UrMind");
    }
  }, [cleanUrl]);

  useEffect(() => {
    if (buttonState === "indexing") {
      const maxStatusCheck = 5;
      let counter = 0;

      const interval = setInterval(() => {
        if (counter >= maxStatusCheck) {
          manualIndexingStore.setStatus(cleanUrl, "failed");
          counter = 0;
          checkPageStatus();
          clearInterval(interval);
          return;
        }
        checkPageStatus();
        counter += 1;
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [buttonState, checkPageStatus]);

  useEffect(() => {
    checkPageStatus();
  }, [checkPageStatus]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleCustomMouseMove);
      document.addEventListener("mouseup", handleCustomMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleCustomMouseMove);
        document.removeEventListener("mouseup", handleCustomMouseUp);
      };
    }
  }, [isDragging]);

  // Handle initial mouse down to begin drag and mark it as not dragged yet
  const handleCustomMouseDown = (e: React.MouseEvent) => {
    setHasDragged(false);
    handleMouseDown(e);
  };

  // If the mouse moves during drag, mark as dragged to distinguish from click
  const handleCustomMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setHasDragged(true);
    }
  };

  // Small delay to clear dragging state after mouse up
  const handleCustomMouseUp = () => {
    setTimeout(() => {
      setHasDragged(false);
    }, 100);
  };

  const handleClick = async () => {
    if (isDragging) return;
    if (hasDragged) return;
    if (buttonState === "indexing") return;
    if (buttonState === "indexed") return;

    try {
      setButtonState("indexing");
      setTooltip("Indexing page...");

      await manualIndexingStore.setStatus(cleanUrl, "processing");

      const pageMetadata = await pageExtractionService.extractPageMetadata();

      sendMessageToBackgroundScript({
        action: "manual-index-page",
        payload: {
          pageMetadata: pageMetadata,
        },
      });

      const pollInterval = setInterval(async () => {
        const status = await manualIndexingStore.getStatus(cleanUrl);
        if (status === "completed") {
          clearInterval(pollInterval);
          setButtonState("indexed");
          setTooltip("Page already being watched");
        } else if (status === "failed") {
          clearInterval(pollInterval);
          setButtonState("failed");
          setTooltip("Failed to index. Click to retry");
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(pollInterval);
      }, 30000);
    } catch (error) {
      console.error("Error triggering manual indexing:", error);
      setButtonState("failed");
      setTooltip("Failed to index. Click to retry");
    }
  };

  const getButtonContent = () => {
    switch (buttonState) {
      case "indexing":
        return <ActivitySpinner size="sm" color="bg-white-100" />;
      case "indexed":
        return (
          <img
            src={urmindLogo}
            alt="UrMind Logo"
            className={cn(
              "w-8 h-8 object-contain",
              isDragging && "cursor-grabbing"
            )}
          />
        );
      case "failed":
        return (
          <AlertTriangle
            size={20}
            className={cn("text-white-100", isDragging && "cursor-grabbing")}
          />
        );
      default:
        return (
          <img
            src={urmindLogo}
            alt="UrMind Logo"
            className={cn(
              "w-8 h-8 object-contain",
              isDragging && "cursor-grabbing"
            )}
          />
        );
    }
  };

  return (
    <div
      className={cn("fixed z-[2147483640] group", className)}
      style={{
        right: `${rightOffset}px`,
        bottom: `${y}px`,
      }}
    >
      <div
        className={cn(
          "w-14 h-14 flex flex-center p-1 group rounded-[200px] shadow-2xl shadow-black/20 cursor-grab active:cursor-grabbing  border border-white-100/10",
          buttonState === "failed" ? "bg-red-305/30" : "bg-purple-100/30",
          buttonState === "indexing" && "bg-gray-100/10",
          isDragging
            ? "scale-105 shadow-3xl cursor-grabbing"
            : "cursor-pointer",
          buttonState === "indexed" && "opacity-50 grayscale",
          manualIndexButtonAdjustments?.manualIndexButton?.zoomIn &&
            "scale-[1.2]"
        )}
      >
        <button
          onClick={handleClick}
          onMouseDown={handleCustomMouseDown}
          //   LEAVE THIS COMMENTED DONT TOUCH IT.
          //   disabled={buttonState === "indexed"}
          className={cn(
            "w-full h-full rounded-[200px] flex items-center justify-center transition-all duration-200",
            "focus:outline-none ring-0 focus:ring-0",
            "cursor-grab active:cursor-grabbing",
            buttonState === "indexing" && "bg-gray-100 hover:bg-gray-100/90",
            buttonState === "indexed" &&
              "bg-gray-100 cursor-not-allowed grayscale",
            buttonState === "failed" && "bg-red-305 hover:bg-red-305/90",
            buttonState === "default" && "bg-purple-100 hover:bg-purple-100/80"
          )}
          title={tooltip}
        >
          {getButtonContent()}
        </button>
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 shadow-2xl shadow-black/20 bg-gray-100/80 backdrop-blur-xl border border-gray-102/30 text-white-100 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        {tooltip}
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-100/80"></div>
      </div>
    </div>
  );
}
