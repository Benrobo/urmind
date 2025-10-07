import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

interface AccordionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function Accordion({
  title,
  subtitle,
  icon,
  isOpen,
  onToggle,
  children,
  className,
}: AccordionProps) {
  return (
    <div className={cn("border-b border-white-400/20", className)}>
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {icon}
          <div className="text-left">
            <div className="text-sm font-medium text-white">{title}</div>
            <div className="text-xs text-white/70">{subtitle}</div>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp size={16} className="text-white/60" />
        ) : (
          <ChevronDown size={16} className="text-white/60" />
        )}
      </button>

      {isOpen && <div className="px-4 pb-4 space-y-4">{children}</div>}
    </div>
  );
}
