import React, { useState, useEffect } from "react";
import NodeWrapper from "./NodeWrapper";
import { shortenText } from "@/lib/utils";
import { TextNodeData } from "@/types/mindboard";
import { useMindboardContext } from "@/context/MindboardCtx";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { contextViewsStore } from "@/store/context-views.store";
import useStorageStore from "@/hooks/useStorageStore";
import { motion } from "motion/react";
dayjs.extend(relativeTime);

type TextNodeProps = {
  id: string;
  data: TextNodeData["data"];
  position: { x: number; y: number };
  type: string;
};

export default function TextNode(props: TextNodeProps) {
  const { data, id, type } = props;
  const { context } = data;
  const { openRightSidebar } = useMindboardContext();
  const { value: viewState } = useStorageStore(contextViewsStore);

  const [isViewed, setIsViewed] = useState(false);

  useEffect(() => {
    const checkViewed = async () => {
      const viewed = await contextViewsStore.isViewed(context?.id);
      setIsViewed(viewed);
    };
    checkViewed();
  }, [context?.id, viewState]);

  const handleClick = () => {
    openRightSidebar({ id, type, data });
  };

  return (
    <NodeWrapper
      type="text"
      context={context}
      header={{
        title: context?.title,
        subtitle: context?.summary,
        createdAt: dayjs(context?.createdAt).fromNow(),
        favicon: context?.og?.favicon!,
      }}
      badge={
        !isViewed && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="bg-red-305 text-white text-[7px] font-bold px-2 py-0.5 rounded-full"
          >
            NEW
          </motion.div>
        )
      }
    >
      <button
        onClick={handleClick}
        className="w-full flex flex-col min-h-4 cursor-pointer border-none outline-none text-start hover:bg-white/5 rounded transition-colors"
      >
        <p className="text-[10px] font-geistmono text-white-100/70">
          {context?.summary.slice(0, 500)}
          {context?.summary.length > 500 && "..."}
        </p>
      </button>
    </NodeWrapper>
  );
}
