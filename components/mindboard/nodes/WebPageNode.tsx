import React from "react";
import NodeWrapper from "./NodeWrapper";
import { shortenText } from "@/lib/utils";

type WebPageNodeProps = {
  title: string;
  subtitle: string;
};

export default function WebPageNode({ title, subtitle }: WebPageNodeProps) {
  return (
    <NodeWrapper
      type="artifact:web-page"
      header={{
        createdAt: new Date().toISOString(),
        favicon: "",
      }}
    >
      <div className="w-full flex flex-col min-h-4 ">
        <p className="text-xs text-white-100">{title}</p>
        <p className="text-[10px] text-white/50">{shortenText(subtitle, 45)}</p>
      </div>
    </NodeWrapper>
  );
}
