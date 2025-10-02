import {
  Ellipsis,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Brain,
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { cn, shortenText } from "@/lib/utils";
import useClickOutside from "@/hooks/useClickOutside";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { ContextType } from "@/types/context";

dayjs.extend(relativeTime);

type NodeWrapperProps = {
  children: React.ReactNode;
  type: ContextType;
  header: {
    createdAt: string;
    favicon: string;
  };
};

export default function NodeWrapper({
  children,
  header,
  type,
}: NodeWrapperProps) {
  return (
    <div className="w-auto min-w-[250px] max-w-[300px] min-h-4 bg-gray-100 border-1 border-white/20 rounded-md">
      <div className="w-full px-2 pb-2 py-2">
        <div className="w-full flex items-center justify-between">
          <Brain size={15} className="text-white/50" />
          <MoreMenu />
        </div>

        {/* actual content  */}
        <>{type !== "url" && children}</>

        <div className="w-full flex items-center justify-between mt-2">
          <div className="max-w-[20px] rounded-full mr-2">
            <ImageWithFallback
              src={header.favicon}
              className="object-contain min-w-[20px] min-h-[20px] rounded-full"
            />
          </div>

          <div className="min-w-0 flex flex-col items-start justify-start">
            <p className="text-[10px] text-white/50">
              {dayjs(header.createdAt).fromNow()}
            </p>
          </div>
        </div>
      </div>
      {type === "url" && children}
    </div>
  );
}

function MoreMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuContainerRef = useClickOutside(() => setIsOpen(false));

  const menuItems = [
    // { icon: Edit, label: "Edit", onClick: () => console.log("Edit clicked") },
    { icon: Copy, label: "Copy", onClick: () => console.log("Copy clicked") },
    {
      icon: ExternalLink,
      label: "Open",
      onClick: () => console.log("Open clicked"),
    },
    {
      icon: Trash2,
      label: "Delete",
      onClick: () => console.log("Delete clicked"),
      className: "text-red-305",
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-white p-1 hover:bg-white/10 rounded transition-colors"
      >
        <Ellipsis className="w-4 h-4 text-white-100" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-0 mt-8 w-40 bg-gray-100 border border-white/20 rounded-md shadow-lg z-50"
          ref={menuContainerRef}
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-[10px] text-white hover:bg-white/10 first:rounded-t-md last:rounded-b-md transition-colors",
                item.className
              )}
            >
              <item.icon className="w-3 h-3" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
