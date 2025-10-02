import * as React from "react";
import Draggable, {
  DraggableEventHandler,
  DraggableProps,
} from "react-draggable";

interface DraggableElementProps {
  children: React.ReactNode;
  axis?: "x" | "y" | "both" | "none";
  handle?: string;
  defaultPosition?: { x: number; y: number };
  position?: { x: number; y: number } | undefined;
  grid?: [number, number];
  scale?: number;
  onStart?: DraggableEventHandler;
  onDrag?: DraggableEventHandler;
  onStop?: DraggableEventHandler;
  disabled?: boolean;
  bounds?:
    | string
    | { left?: number; top?: number; right?: number; bottom?: number };
  className?: string;
}

export default function DraggableElement({
  children,
  axis = "both",
  handle,
  defaultPosition = { x: 0, y: 0 },
  position = undefined,
  grid = [25, 25],
  scale = 1,
  onStart,
  onDrag,
  onStop,
  disabled = false,
  bounds,
  className,
  ...props
}: DraggableElementProps) {
  return <div className="relative p-5 bg-blue-101">{children}</div>;
}
