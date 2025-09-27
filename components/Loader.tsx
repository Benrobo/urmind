import React from "react";
import { Loader as LoaderIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type LoaderSize = "sm" | "md" | "lg" | "xl";

interface LoaderProps {
  size?: LoaderSize;
  className?: string;
  text?: string;
}

const sizeMap: Record<LoaderSize, string> = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

export default function CustomLoader({
  size = "md",
  className,
  text,
}: LoaderProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex flex-col items-center space-y-2">
        <LoaderIcon
          className={cn("animate-spin text-white/80", sizeMap[size])}
        />
        {text && <p className="text-xs text-white-100 animate-pulse">{text}</p>}
      </div>
    </div>
  );
}

// Predefined loader variants for common use cases
export const LoadingSpinner = ({ className }: { className?: string }) => (
  <CustomLoader size="sm" className={className} />
);

export const LoadingDots = ({ className }: { className?: string }) => (
  <div className={cn("flex space-x-1", className)}>
    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
  </div>
);

export const LoadingPulse = ({ className }: { className?: string }) => (
  <div
    className={cn("w-4 h-4 bg-white/60 rounded-full animate-pulse", className)}
  />
);

export const LoadingBar = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "w-full h-1 bg-white/20 rounded-full overflow-hidden",
      className
    )}
  >
    <div className="h-full bg-white/60 rounded-full animate-pulse" />
  </div>
);
