import React, { useCallback, useEffect, useState } from "react";
import DraggableElement from "./DraggableElement";
import { ReactFlow, applyNodeChanges } from "@xyflow/react";
// @ts-expect-error
import { Background } from "@xyflow/react";
// @ts-expect-error
import { Controls } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import WebPageNode from "./nodes/WebPageNode";
import ImageNode from "./nodes/ImageNode";
import ContextInfoSidebar from "./ContextInfoSidebar";
import DropMediaModal from "./DropMediaModal";
import { ContextType } from "@/types/context";
import { CombinedNodes, NodeProps } from "@/types/mindboard";
import { useMindboardContext } from "@/context/MindboardCtx";
import TextNode from "./nodes/TextNode";
import usePaste from "@/hooks/usePaste";
import saveToUrMindJob from "@/triggers/save-to-urmind";
import { sendMessageToBackgroundScript } from "@/helpers/messaging";
import { motion } from "motion/react";

const nodeTypes = {
  "artifact:web-page": WebPageNode,
  "artifact:image": ImageNode,
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
    refetchContexts,
  } = useMindboardContext();

  const { pastedText, clearPastedText } = usePaste();

  // Drag and drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showDropModal, setShowDropModal] = useState(false);

  useEffect(() => {
    if (pastedText && pastedText.trim() !== "" && selectedCategory) {
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
        responseRequired: false,
      });

      clearPastedText();

      // refetch contexts
      refetchContexts();
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

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if dragging files
    if (e.dataTransfer.types.includes("Files")) {
      setIsDraggingOver(true);
      setShowDropModal(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only hide if leaving the main container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingOver(false);
      setShowDropModal(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDraggingOver(false);
      setShowDropModal(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));

      if (imageFiles.length > 0 && selectedCategory) {
        for (const file of imageFiles) {
          // Convert file to base64 data URL before sending
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
          });

          await sendMessageToBackgroundScript({
            action: "save-to-urmind",
            payload: {
              type: "image",
              dataUrl,
              filename: file.name,
              mimeType: file.type,
              size: file.size,
              categorySlug: selectedCategory,
              source: "local-upload",
              url: location.href,
              tabId: 0,
            },
            responseRequired: false,
          });
        }

        // Refetch contexts to show new images
        refetchContexts();
      }
    },
    [selectedCategory, refetchContexts]
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
  // if (selectedCategory && contexts && contexts.length === 0) {
  //   return (
  //     <div className="w-[calc(100%-250px)] h-screen flex items-center justify-center">
  //       <div className="text-white/50">No contexts found for this category</div>
  //     </div>
  //   );
  // }

  return (
    <>
      <motion.div
        className="w-[calc(100%-250px)] h-screen"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
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

        {showDropModal && <DropMediaModal isDraggingOver={isDraggingOver} />}
      </motion.div>

      <ContextInfoSidebar
        isOpen={isRightSidebarOpen}
        onClose={closeRightSidebar}
        selectedContext={selectedContext}
      />
    </>
  );
}
