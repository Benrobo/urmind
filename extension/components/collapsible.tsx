import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CollapsibleProps {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
  duration?: number;
  contentClassName?: string;
}

export const Collapsible = ({
  isOpen,
  children,
  className,
  duration = 200,
  contentClassName,
}: CollapsibleProps) => {
  return (
    <div
      className={cn(
        "grid transition-all",
        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        `duration-${duration}`,
        className
      )}
    >
      <div className="overflow-hidden">
        <div className={cn(contentClassName)}>{children}</div>
      </div>
    </div>
  );
};
