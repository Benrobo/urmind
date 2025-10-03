import { CombinedNodes } from "@/types/mindboard";
import { useNodesState, type NodeChange, type Node } from "@xyflow/react";
import React, { useCallback } from "react";

export default function useCustomNodesState(
  initialNodes: CombinedNodes[] = []
) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialNodes);

  const typedSetNodes = useCallback(
    (updater: React.SetStateAction<CombinedNodes[]>) => {
      setNodes(updater as React.SetStateAction<Node[]>);
    },
    [setNodes]
  );

  const typedOnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  return [nodes as CombinedNodes[], typedSetNodes, typedOnNodesChange] as const;
}
