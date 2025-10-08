import React from "react";
import NodeWrapper from "./NodeWrapper";
import { shortenText } from "@/lib/utils";
import { TextNodeData } from "@/types/mindboard";
import { useMindboardContext } from "@/context/MindboardCtx";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
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
        favicon: context?.og?.favicon,
      }}
    >
      <button
        onClick={handleClick}
        className="w-full flex flex-col min-h-4 cursor-pointer border-none outline-none text-start hover:bg-white/5 rounded transition-colors"
      >
        <p className="text-xs text-white-100">
          {shortenText(context?.summary, 45)}
        </p>
      </button>
    </NodeWrapper>
  );
}
