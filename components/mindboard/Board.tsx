import React, { useCallback, useState } from "react";
import DraggableElement from "./DraggableElement";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  Controls,
  NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import WebPageNode from "./nodes/WebPageNode";
import { ContextType } from "@/types/context";
import { InitialNode } from "@/types/mindboard";

const initialNodes = [
  {
    id: "1",
    position: { x: 0, y: 0 },
    data: { label: "1" },
    type: "artifact:web-page",
  },
  // {
  //   id: "2",
  //   position: { x: 0, y: 100 },
  //   data: { label: "2" },
  //   type: "webPage",
  // },
] satisfies InitialNode[];

const initialEdges = [];

const nodeTypes = {
  "artifact:web-page": WebPageNode,
  // todos: TodoNode,
  // brainstorm: BrainstormNode,
} as Record<ContextType, any>;

export default function MindboardCanvas() {
  const [nodes, setNodes] = useState(initialNodes);
  // const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes: any) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    []
  );

  return (
    <div className="w-[calc(100%-250px)] h-screen">
      <ReactFlow
        nodes={nodes}
        // edges={edges}
        onNodesChange={onNodesChange}
        onConnect={(params) => {
          console.log(params);
        }}
        onLoad={(params) => {
          console.log(params);
        }}
        defaultViewport={{
          x: 200,
          y: 300,
          zoom: 1.5,
        }}
        // fitView={true}
        // minZoom={0.01}
        colorMode="dark"
        nodeTypes={nodeTypes}
      >
        {/* @ts-ignore */}
        <Background variant="dots" gap={15} size={1} color="#3d3f48" />
        <Controls />
      </ReactFlow>
    </div>
  );
}
