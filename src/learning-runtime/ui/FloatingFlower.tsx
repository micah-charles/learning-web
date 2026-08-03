import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import type { DirectorIntent } from "../types";

export interface FlowerAction {
  id: DirectorIntent;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  recommended?: boolean;
  status?: string;
}

export interface FlowerPosition { x: number; y: number }

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    && (target.matches("input, textarea, select, [contenteditable='true']") || target.isContentEditable);
}

function clampPosition(position: FlowerPosition, width: number, height: number): FlowerPosition {
  return {
    x: Math.max(8, Math.min(window.innerWidth - width - 8, position.x)),
    y: Math.max(8, Math.min(window.innerHeight - height - 8, position.y)),
  };
}

export default function FloatingFlower({
  actions,
  activeIntent,
  position,
  onPositionChange,
  onAction,
}: {
  actions: readonly FlowerAction[];
  activeIntent?: DirectorIntent;
  position?: FlowerPosition | null;
  onPositionChange?: (position: FlowerPosition) => void;
  onAction: (action: FlowerAction) => void;
}) {
  const [open, setOpen] = useState(false);
  const [livePosition, setLivePosition] = useState<FlowerPosition | null>(position || null);
  const flowerRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<null | { pointerId: number; startX: number; startY: number; offsetX: number; offsetY: number; moved: boolean }>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => setLivePosition(position || null), [position]);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.key === "f" || event.key === "F") && !isTypingTarget(event.target)) {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);
  useEffect(() => {
    if (open) {
      restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      requestAnimationFrame(() => flowerRef.current?.querySelector<HTMLButtonElement>(".flr-flower-petal")?.focus());
    } else if (restoreFocusRef.current) {
      restoreFocusRef.current.focus();
      restoreFocusRef.current = null;
    }
  }, [open]);
  useEffect(() => {
    function onResize() {
      if (!livePosition || !flowerRef.current) return;
      const rect = flowerRef.current.getBoundingClientRect();
      const next = clampPosition(livePosition, rect.width, rect.height);
      setLivePosition(next);
      onPositionChange?.(next);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [livePosition, onPositionChange]);

  function beginDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    const rect = flowerRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      moved: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !flowerRef.current) return;
    if (Math.abs(event.clientX - drag.startX) > 4 || Math.abs(event.clientY - drag.startY) > 4) drag.moved = true;
    if (!drag.moved) return;
    const rect = flowerRef.current.getBoundingClientRect();
    const next = clampPosition({ x: event.clientX - drag.offsetX, y: event.clientY - drag.offsetY }, rect.width, rect.height);
    setLivePosition(next);
    event.preventDefault();
  }

  function endDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      suppressClickRef.current = true;
      if (livePosition) onPositionChange?.(livePosition);
    }
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragRef.current = null;
  }

  function activateCentre(event: React.MouseEvent<HTMLButtonElement>) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      event.preventDefault();
      return;
    }
    if (!open && flowerRef.current && window.innerWidth > 760) {
      const rect = flowerRef.current.getBoundingClientRect();
      const safe = {
        x: Math.max(142, Math.min(window.innerWidth - rect.width - 142, rect.left)),
        y: Math.max(142, Math.min(window.innerHeight - rect.height - 142, rect.top)),
      };
      if (Math.abs(safe.x - rect.left) > 1 || Math.abs(safe.y - rect.top) > 1) {
        setLivePosition(safe);
        onPositionChange?.(safe);
      }
    }
    setOpen((value) => !value);
  }

  function choose(action: FlowerAction) {
    onAction(action);
    setOpen(false);
  }

  const style = livePosition
    ? ({ left: `${livePosition.x}px`, top: `${livePosition.y}px`, right: "auto", bottom: "auto" } as CSSProperties)
    : undefined;
  return (
    <div className={`flr-flower${open ? " is-open" : ""}${livePosition ? " is-positioned" : ""}`} style={style} ref={flowerRef} data-testid="learning-flower">
      <div className="flr-flower-petals" role="menu" aria-label="Learning world destinations">
        {actions.map((action, index) => (
          <button
            className={`flr-flower-petal${action.recommended ? " is-recommended" : ""}${activeIntent === action.id ? " is-active" : ""}`}
            style={{ "--petal-index": index } as CSSProperties}
            type="button"
            role="menuitem"
            key={action.id}
            onClick={() => choose(action)}
            title={action.description}
          >
            <span className="flr-flower-icon" aria-hidden="true">{action.icon}</span>
            <span>{action.shortLabel}</span>
            {action.status && <small>{action.status}</small>}
          </button>
        ))}
      </div>
      <button
        className="flr-flower-centre"
        type="button"
        aria-expanded={open}
        aria-label="Open learning world destinations. Drag to move."
        title="Drag to move · click to bloom · F to toggle"
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={activateCentre}
      >
        <span aria-hidden="true">✿</span>
        <small>World</small>
      </button>
      <span className="flr-flower-key" aria-hidden="true">F</span>
    </div>
  );
}
