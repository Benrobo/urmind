import React from "react";
import NodeWrapper from "./NodeWrapper";
import { shortenText } from "@/lib/utils";

type WebPageNodeProps = {
  id: string;
  data: {
    title: string;
    subtitle: string;
  };
  position: { x: number; y: number };
  type: string;
};

export default function WebPageNode(props: WebPageNodeProps) {
  const { data } = props;
  const { title, subtitle } = data;

  return (
    <NodeWrapper
      type="artifact:web-page"
      header={{
        title,
        subtitle,
        createdAt: new Date().toISOString(),
      }}
    >
      <div className="w-full flex flex-col min-h-4 ">
        <p className="text-xs text-white-100">{title}</p>
        <p className="text-[10px] text-white/50">{shortenText(subtitle, 45)}</p>
      </div>
    </NodeWrapper>
  );
}
