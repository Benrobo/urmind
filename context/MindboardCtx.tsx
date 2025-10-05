import useCustomNodesState from "@/hooks/mindboard-hooks/useCustomNodesState";
import { CombinedNodes, SelectedContext } from "@/types/mindboard";
import { applyNodeChanges, Edge, NodeChange, Viewport } from "@xyflow/react";
import React, { createContext, useContext, useState } from "react";
import useContextsByCategory from "@/hooks/useContextsByCategory";
import { mindboardStore } from "@/store/mindboard.store";
import useStorageStore from "@/hooks/useStorageStore";
import { Context, SavedContext } from "@/types/context";
import useDeleteContext from "@/hooks/useDeleteContext";
import DeleteConfirmationModal from "@/components/mindboard/DeleteConfirmationModal";

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
  isRightSidebarOpen: boolean;
  selectedContext: SelectedContext | null;
  openRightSidebar: (context: SelectedContext) => void;
  closeRightSidebar: () => void;
  isDeleteModalOpen: boolean;
  contextToDelete: SavedContext | null;
  openDeleteModal: (context: SavedContext) => void;
  closeDeleteModal: () => void;
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
  const [selectedContext, setSelectedContext] =
    useState<SelectedContext | null>(null);

  // Delete context state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contextToDelete, setContextToDelete] = useState<SavedContext | null>(
    null
  );

  const { value: mindboardState } = useStorageStore(mindboardStore);
  const selectedCategory = mindboardState?.selectedCategory || null;
  const contextPositions = mindboardState?.contextPositions || {};

  const {
    contexts,
    loading: contextsLoading,
    error: contextsError,
  } = useContextsByCategory({
    categorySlug: selectedCategory,
    mounted: true,
  });

  // Delete context functionality
  const { deleteContext, isDeleting } = useDeleteContext({
    onSuccess: () => {
      setIsDeleteModalOpen(false);
      setContextToDelete(null);
      // Close right sidebar if it was open for the deleted context
      if (selectedContext?.data?.context?.id === contextToDelete?.id) {
        closeRightSidebar();
      }
    },
    onError: (error) => {
      console.error("Failed to delete context:", error);
      alert("Failed to delete context. Please try again.");
    },
  });

  // Right sidebar functions
  const openRightSidebar = (context: SelectedContext) => {
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

  // Delete context functions
  const openDeleteModal = (context: SavedContext) => {
    setContextToDelete(context);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setContextToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (contextToDelete?.id) {
      deleteContext(contextToDelete.id);
    }
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
    isDeleteModalOpen,
    contextToDelete,
    openDeleteModal,
    closeDeleteModal,
  };

  return (
    <MindboardCtx.Provider value={providerValues}>
      {children}

      {/* Global Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        contextTitle={contextToDelete?.title}
        isDeleting={isDeleting}
      />
    </MindboardCtx.Provider>
  );
}

export function useMindboardContext() {
  return useContext(MindboardCtx);
}
