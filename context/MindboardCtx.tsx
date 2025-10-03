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
  // Right sidebar state
  isRightSidebarOpen: boolean;
  selectedContext: any;
  openRightSidebar: (context: any) => void;
  closeRightSidebar: () => void;
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

  // Right sidebar state
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<any>(null);
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

  // Right sidebar functions
  const openRightSidebar = (context: any) => {
    // First close if already open to trigger slide-out animation
    if (isRightSidebarOpen) {
      setIsRightSidebarOpen(false);
      setSelectedContext(null);

      // Wait for slide-out animation, then slide in with new context
      setTimeout(() => {
        setSelectedContext(context);
        setIsRightSidebarOpen(true);
      }, 300);
    } else {
      setSelectedContext(context);
      setIsRightSidebarOpen(true);
    }
  };

  const closeRightSidebar = () => {
    setIsRightSidebarOpen(false);
    setSelectedContext(null);
  };

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
    isRightSidebarOpen,
    selectedContext,
    openRightSidebar,
    closeRightSidebar,
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
