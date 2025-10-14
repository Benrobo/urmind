import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { DraggableProps, Position } from "@/types/draggable.types";
import Draggable from "react-draggable";

export default function UrmindDraggable({
  children,
  className,
  storageKey,
  initialPosition = { x: 497, y: 284 },
  handleSelector,
  indicator,
  scale,
  shouldPersistInChromeStorage = false,
}: DraggableProps) {
  const [isReady, setIsReady] = useState(false);
  const [hydratedPosition, setHydratedPosition] = useState<Position | null>(
    null
  );
  const [mountKey, setMountKey] = useState<string>(`${storageKey}:init`);
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (shouldPersistInChromeStorage) {
          const saved = await chrome.storage.local.get(storageKey);
          if (saved?.[storageKey]) {
            const { x, y } = saved[storageKey] as Position;
            if (!cancelled) setHydratedPosition({ x, y });
          } else {
            if (!cancelled) setHydratedPosition(null);
          }
        } else {
          if (!cancelled) setHydratedPosition(null);
        }
      } catch (_e) {
        if (!cancelled) setHydratedPosition(null);
      } finally {
        if (!cancelled) {
          setIsReady(true);
          setMountKey(`${storageKey}:ready`);
        }
      }
    };
    const t = setTimeout(load, 10);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [storageKey, initialPosition, shouldPersistInChromeStorage]);

  const handleClass = useMemo(() => {
    return handleSelector || ".wm-draggable-handle";
  }, [handleSelector]);

  const numericScale = useMemo(() => {
    if (typeof scale === "number") return scale;
    if (scale && typeof scale === "object") return scale.x || 1;
    return 1;
  }, [scale]);

  if (!isReady) return null;

  const positionToUse = hydratedPosition ?? initialPosition;

  return (
    <Draggable
      key={mountKey}
      handle={handleClass}
      defaultPosition={{ x: positionToUse.x, y: positionToUse.y }}
      nodeRef={nodeRef}
      scale={numericScale}
      onStop={(_e, data) => {
        if (shouldPersistInChromeStorage) {
          try {
            // do not await to comply with the required return type (void)
            chrome.storage.local.set({
              [storageKey]: { x: data.x, y: data.y },
            });
          } catch (_e) {
            // ignore
          }
        }
      }}
    >
      <div
        ref={nodeRef}
        className={cn("fixed left-0 top-0 z-[9999999999]", className)}
      >
        {children}
        {indicator ? (
          <div
            className="wm-draggable-handle"
            style={{ pointerEvents: "auto" }}
          >
            {indicator}
          </div>
        ) : null}
      </div>
    </Draggable>
  );
}
