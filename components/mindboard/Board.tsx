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
import TextNode from "./nodes/TextNode";
import usePaste from "@/hooks/usePaste";
import saveToUrMindJob from "@/triggers/save-to-urmind";
import { sendMessageToBackgroundScript } from "@/helpers/messaging";

const nodeTypes = {
  "artifact:web-page": WebPageNode,
  text: TextNode,
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

  const { handlePaste, pastedText, clearPastedText } = usePaste();

  useEffect(() => {
    console.log({ pastedText, selectedCategory });
    if (pastedText && pastedText.trim() !== "") {
      const activeCategory = selectedCategory;
      sendMessageToBackgroundScript({
        action: "save-to-urmind",
        payload: {
          tabId: 0,
          type: "text",
          categorySlug: activeCategory!,
          url: location.href,
          selectedText: pastedText,
        },
      });

      // dont clear the pasted text for now as this would prevent pasting same text multiple times.
      // clearPastedText();

      // TODO: After pasting, show a promise toast inside the mindboard with loading animation
      // which tells the user that the content is being processed.
    }
  }, [pastedText, selectedCategory, clearPastedText]);

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
      <div className="w-[calc(100%-250px)] h-screen" onPaste={handlePaste}>
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
