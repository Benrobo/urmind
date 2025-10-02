import { NodeTypes } from "@xyflow/react";
import { ContextType } from "./context";

export interface WebPageNodeData extends Node {
  type: ContextType;
  data: NodeTypes & {
    id: string;
    nodeId: string | null; // used in DB
  };
}

export type InitialNode = {
  id: string;
  position: { x: number; y: number };
  data: WebPageNodeData;
  type: ContextType;
};
