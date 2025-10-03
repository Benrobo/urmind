import type { NodeTypes, Node } from "@xyflow/react";
import { Context, ContextType } from "./context";

export interface WebPageNodeData {
  id: string;
  position: { x: number; y: number };
  type: "artifact:web-page";
  data: {
    title: string;
    subtitle: string;
  };
}

export type CombinedNodes = WebPageNodeData;

export type NodeProps = WebPageNodeData;
