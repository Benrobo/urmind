import {
  Ellipsis,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Brain,
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
    title: string;
    subtitle: string;
    createdAt: string;
    favicon: string | null;
  };
};

export default function NodeWrapper({
  children,
  type,
  header,
}: NodeWrapperProps) {
  return (
    <motion.div
      className="w-auto min-w-[250px] max-w-[300px] min-h-4 bg-gray-100 border-1 border-white/20 rounded-md"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{
        scale: 1.02,
        y: -2,
        boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="w-full px-2 pb-2 py-2">
        <div className="w-full flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div>
              <Brain size={15} className="text-white/50" />
            </div>
            <span className="text-[9px] text-white/60 bg-white/5 px-1.5 py-0.3 rounded-sm border border-white/10">
              {type.split(":")[1]?.toUpperCase() || type.toUpperCase()}
            </span>
          </div>
          <MoreMenu />
        </div>

        {/* actual content  */}
        {/* only show  */}
        <>{type !== "url" && children}</>

        <div className="w-full flex items-center justify-between mt-2">
          <div className="max-w-[20px] rounded-full mr-2">
            <ImageWithFallback
              src={header?.favicon ?? chrome.runtime.getURL("icons/icon32.png")}
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
    </motion.div>
  );
}

function MoreMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuContainerRef = useClickOutside(() => setIsOpen(false), {
    excludeSelectors: ["#more-menu-toggle"],
  });

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
      <motion.button
        id="more-menu-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-white p-1 hover:bg-white/10 rounded transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 90 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <Ellipsis className="w-4 h-4 text-white-100" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-0 mt-8 w-40 bg-gray-100 border border-white/20 rounded-md shadow-lg z-50"
            ref={menuContainerRef}
          >
            {menuItems.map((item, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.1, delay: index * 0.05 }}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-[10px] text-white hover:bg-white/10 first:rounded-t-md last:rounded-b-md transition-colors",
                  item.className
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className="w-3 h-3" />
                {item.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
