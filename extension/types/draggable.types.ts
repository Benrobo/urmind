export interface Position {
  x: number;
  y: number;
}

export interface DraggableProps {
  children: React.ReactNode;
  className?: string;
  storageKey: string;
  initialPosition?: Position;
  /** Optional handle element; when provided, only this element initiates drag */
  handleRef?: React.RefObject<HTMLElement | null>;
  /** Optional visual indicator rendered inside the draggable; can act as a handle */
  indicator?: React.ReactNode;
  /** Optional CSS selector for react-draggable handle */
  handleSelector?: string;
  /** Optional scale factor of the positioned element (for offset normalization). */
  scale?: number | { x: number; y: number };
  /** Whether to persist position in Chrome storage automatically */
  shouldPersistInChromeStorage?: boolean;
}

export interface DragState {
  isDragging: boolean;
  offset: Position;
}
