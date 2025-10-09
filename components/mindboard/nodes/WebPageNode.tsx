import React from "react";
import NodeWrapper from "./NodeWrapper";
import { shortenText } from "@/lib/utils";
import { WebPageNodeData } from "@/types/mindboard";
import { useMindboardContext } from "@/context/MindboardCtx";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

type WebPageNodeProps = {
  id: string;
  data: WebPageNodeData["data"];
  position: { x: number; y: number };
  type: string;
};

export default function WebPageNode(props: WebPageNodeProps) {
  const { data, id, type } = props;
  const { context } = data;
  const { openRightSidebar } = useMindboardContext();

  const handleClick = () => {
    openRightSidebar({ id, type, data });
  };

  return (
    <NodeWrapper
      type="artifact:web-page"
      context={context}
      header={{
        title: context?.title,
        subtitle: context?.summary,
        createdAt: dayjs(context?.createdAt).fromNow(),
        favicon: context?.og?.favicon ?? null,
      }}
    >
      <button
        onClick={handleClick}
        className="w-full flex flex-col min-h-4 cursor-pointer border-none outline-none text-start hover:bg-white/5 rounded transition-colors"
      >
        <p className="text-xs text-white-100">{context?.title}</p>
        <p className="text-[10px] text-white/50">
          {shortenText(context?.summary, 45)}
        </p>
      </button>
    </NodeWrapper>
  );
}
