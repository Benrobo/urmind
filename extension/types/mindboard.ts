import type { NodeTypes, Node } from "@xyflow/react";
import { SavedContext } from "./context";

export interface WebPageNodeData extends Node {
  id: string;
  position: { x: number; y: number };
  type: "artifact:web-page";
  data: {
    context: SavedContext;
    metadata: {};
  };
}

export interface TextNodeData extends Node {
  id: string;
  position: { x: number; y: number };
  type: "text";
  data: {
    context: SavedContext;
    metadata: {};
  };
}

export type CombinedNodes = WebPageNodeData;

export type NodeProps = WebPageNodeData;

export type SelectedContext = {
  id: string;
  type: string;
  data: { context: SavedContext };
};
