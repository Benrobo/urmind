import { useState, useEffect, useCallback } from "react";
import { StorageStore } from "@/helpers/storage-store";

interface DraggablePositionState {
  y: number;
}

export class DraggablePositionStore extends StorageStore<DraggablePositionState> {
  constructor() {
    super("local:draggable_position", {
      y: 20, // Default bottom position (20px from bottom)
    });
  }

  async getYPosition(): Promise<number> {
    const state = await this.get();
    return state.y;
  }

  async setYPosition(y: number): Promise<void> {
    await this.set({ y });
  }
}

export const draggablePositionStore = new DraggablePositionStore();

interface UseDraggablePositionOptions {
  minY?: number;
  maxY?: number;
  rightOffset?: number;
}

export function useDraggablePosition(
  options: UseDraggablePositionOptions = {}
) {
  const {
    minY = 20,
    maxY = window.innerHeight - 100,
    rightOffset = 20,
  } = options;

  const [y, setY] = useState(20);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ y: 0, clientY: 0 });

  // Load saved position on mount
  useEffect(() => {
    const loadPosition = async () => {
      const savedY = await draggablePositionStore.getYPosition();
      setY(savedY);
    };
    loadPosition();
  }, []);

  // Save position when it changes
  useEffect(() => {
    if (y !== 20) {
      // Don't save default position
      draggablePositionStore.setYPosition(y);
    }
  }, [y]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        y: y,
        clientY: e.clientY,
      });
    },
    [y]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaY = e.clientY - dragStart.clientY;
      const newY = Math.max(minY, Math.min(maxY, dragStart.y - deltaY));
      setY(newY);
    },
    [isDragging, dragStart, minY, maxY]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return {
    y,
    isDragging,
    rightOffset,
    handleMouseDown,
  };
}
