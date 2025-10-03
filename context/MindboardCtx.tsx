import useCustomNodesState from "@/hooks/mindboard-hooks/useCustomNodesState";
import { CombinedNodes } from "@/types/mindboard";
import { applyNodeChanges, Edge, NodeChange, Viewport } from "@xyflow/react";
import React, { createContext, useContext, useState } from "react";
import useContextsByCategory from "@/hooks/useContextsByCategory";
import { mindboardStore } from "@/store/mindboard.store";
import useStorageStore from "@/hooks/useStorageStore";
import { Context, SavedContext } from "@/types/context";

interface BoardContextValuesProps {
  nodes: CombinedNodes[];
  // edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  setNodes: React.Dispatch<React.SetStateAction<CombinedNodes[]>>;
  selectedCategory: string | null;
  contexts: SavedContext[];
  contextsLoading: boolean;
  contextsError: string | null;
  contextPositions: Record<string, { x: number; y: number }>;
  setContextPosition: (
    contextId: string,
    position: { x: number; y: number }
  ) => Promise<void>;
  viewPort: Viewport;
  setViewPort: (viewPort: Viewport) => void;
}

export const MindboardCtx = createContext<BoardContextValuesProps>(
  {} as BoardContextValuesProps
);

export default function MindboardCtxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [viewPort, setViewPort] = useState<Viewport>({
    x: 100,
    y: 100,
    zoom: 0.9,
  });
  const [nodes, setNodes, onNodesChange] = useCustomNodesState([]);
  const { value: mindboardState } = useStorageStore(mindboardStore);
  const selectedCategory = mindboardState?.selectedCategory || null;
  const contextPositions = mindboardState?.contextPositions || {};

  const {
    contexts,
    loading: contextsLoading,
    error: contextsError,
  } = useContextsByCategory({
    categoryId: selectedCategory,
    mounted: true,
  });

  const providerValues: BoardContextValuesProps = {
    nodes,
    setNodes,
    onNodesChange,
    selectedCategory,
    contexts,
    contextsLoading,
    contextsError,
    contextPositions,
    setContextPosition: mindboardStore.setContextPosition.bind(mindboardStore),
    viewPort,
    setViewPort,
  };

  return (
    <MindboardCtx.Provider value={providerValues}>
      {children}
    </MindboardCtx.Provider>
  );
}

export function useMindboardContext() {
  return useContext(MindboardCtx);
}
