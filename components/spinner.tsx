import React from "react";
import { cn } from "@/lib/utils";

const bars = [
  { rotate: 0, delay: "0s" },
  { rotate: 30, delay: "-1.1s" },
  { rotate: 60, delay: "-1s" },
  { rotate: 90, delay: "-0.9s" },
  { rotate: 120, delay: "-0.8s" },
  { rotate: 150, delay: "-0.7s" },
  { rotate: 180, delay: "-0.6s" },
  { rotate: 210, delay: "-0.5s" },
  { rotate: 240, delay: "-0.4s" },
  { rotate: 270, delay: "-0.3s" },
  { rotate: 300, delay: "-0.2s" },
  { rotate: 330, delay: "-0.1s" },
];

interface ActivitySpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: string;
  className?: string;
  speed?: "slow" | "normal";
}

const sizeMap = {
  sm: "w-5 h-5",
  md: "w-7 h-7",
  lg: "w-10 h-10",
  xl: "w-12 h-12",
};

const speedMap = {
  slow: "1.5s",
  normal: "1s",
};

export default function ActivitySpinner({
  size = "md",
  color = "bg-gray-400",
  className,
  speed = "normal",
}: ActivitySpinnerProps) {
  const sizeClass = sizeMap[size];
  const animationDuration = speedMap[speed];

  return (
    <div
      className={cn("relative rounded-[10px] ", sizeClass, className)}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {bars.map((bar, i) => (
        <div
          key={i}
          className={cn(
            "absolute left-[47%] top-[37%] w-[8%] h-[24%] rounded-full opacity-0 shadow-[0_0_3px_rgba(0,0,0,0.2)]",
            color
          )}
          style={{
            transform: `rotate(${bar.rotate}deg) translate(0, -130%)`,
            animation: `spinnerBar ${animationDuration} linear infinite`,
            animationDelay: bar.delay,
          }}
        />
      ))}
    </div>
  );
}
