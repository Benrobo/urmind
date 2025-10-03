import React, { useCallback, useEffect, useState } from "react";
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
import ContextInfoSidebar from "./ContextInfoSidebar";
import { ContextType } from "@/types/context";
import { CombinedNodes, NodeProps } from "@/types/mindboard";
import { useMindboardContext } from "@/context/MindboardCtx";

const initialNodes = [
  {
    id: "1",
    position: { x: 0, y: 0 },
    type: "artifact:web-page" as const,
    data: {
      title: "React Hooks Best Practices",
      subtitle:
        "Overview of the react markdown library rendering text and components",
    },
  },
  {
    id: "2",
    position: { x: 200, y: 100 },
    type: "artifact:web-page" as const,
    data: {
      title: "TypeScript Documentation",
      subtitle: "Comprehensive guide to TypeScript features and best practices",
    },
  },
];

const initialEdges = [];

const nodeTypes = {
  "artifact:web-page": WebPageNode,
  // todos: TodoNode,
  // brainstorm: BrainstormNode,
} as Record<ContextType, any>;

export default function MindboardCanvas() {
  const {
    nodes,
    setNodes,
    selectedCategory,
    contexts,
    contextsLoading,
    contextsError,
    contextPositions,
    setContextPosition,
    viewPort,
    setViewPort,
    isRightSidebarOpen,
    selectedContext,
    closeRightSidebar,
  } = useMindboardContext();

  useEffect(() => {
    if (contexts && contexts.length > 0) {
      const contextNodes = contexts.map((context, index) => {
        const savedPosition = contextPositions[context.id];

        return {
          id: context.id,
          position: savedPosition || {
            x: (index % 3) * 300, // 3 columns
            y: Math.floor(index / 3) * 200, // rows
          },
          // @ts-expect-error
          type: context.type,
          data: {
            context,
            metadata: {},
          },
        } satisfies CombinedNodes;
      });

      setNodes(contextNodes as unknown as CombinedNodes[]);
    } else if (selectedCategory && !contextsLoading) {
      // No contexts found for this category
      setNodes([]);
    }
  }, [contexts, selectedCategory, contextsLoading, setNodes]);

  const onNodesChange = useCallback(
    (changes: any) => {
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot));

      changes.forEach((change: any) => {
        if (change.type === "position" && change.position) {
          setContextPosition(change.id, change.position);
        }
      });
    },
    [setContextPosition]
  );

  // Show loading state
  if (contextsLoading) {
    return (
      <div className="w-[calc(100%-250px)] h-screen flex items-center justify-center">
        <div className="text-white/50">Loading contexts...</div>
      </div>
    );
  }

  // Show error state
  if (contextsError) {
    return (
      <div className="w-[calc(100%-250px)] h-screen flex items-center justify-center">
        <div className="text-red-400">Error: {contextsError}</div>
      </div>
    );
  }

  // Show empty state when no category is selected
  if (!selectedCategory) {
    return (
      <div className="w-[calc(100%-250px)] h-screen flex items-center justify-center">
        <div className="text-white/50">Select a category to view contexts</div>
      </div>
    );
  }

  // Show empty state when no contexts found
  if (selectedCategory && contexts && contexts.length === 0) {
    return (
      <div className="w-[calc(100%-250px)] h-screen flex items-center justify-center">
        <div className="text-white/50">No contexts found for this category</div>
      </div>
    );
  }

  return (
    <>
      <div className="w-[calc(100%-250px)] h-screen">
        <ReactFlow
          nodes={nodes}
          // edges={edges}
          onNodesChange={onNodesChange}
          defaultViewport={{
            x: viewPort.x,
            y: viewPort.y,
            zoom: viewPort.zoom,
          }}
          onViewportChange={setViewPort}
          // fitView={true}
          // minZoom={0.01}
          colorMode="dark"
          nodeTypes={nodeTypes}
        >
          <Background
            // @ts-ignore
            variant="dots"
            gap={10}
            size={1}
            color="#3d3f48"
            bgColor="#1b1b1b"
          />
          <Controls />
        </ReactFlow>
      </div>

      <ContextInfoSidebar
        isOpen={isRightSidebarOpen}
        onClose={closeRightSidebar}
        selectedContext={selectedContext}
      />
    </>
  );
}
