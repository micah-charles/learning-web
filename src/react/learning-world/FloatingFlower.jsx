import { useEffect, useRef, useState } from "react";

function isTypingTarget(target) { return target instanceof HTMLElement && (target.matches("input, textarea, select, button") || target.isContentEditable); }

export default function FloatingFlower({ actions = [], activePanel = "", onAction }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const flowerRef = useRef(null);
  const triggerRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const close = () => setOpen(false);
  useEffect(() => {
    function onKeyDown(event) {
      if ((event.key === "f" || event.key === "F") && !isTypingTarget(event.target)) { event.preventDefault(); setOpen((value) => !value); }
      else if (event.key === "Escape" && open) { event.preventDefault(); close(); }
    }
    window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);
  useEffect(() => {
    if (open) {
      restoreFocusRef.current = document.activeElement;
      flowerRef.current?.querySelector(".lw-flower-action")?.focus();
    } else if (restoreFocusRef.current && restoreFocusRef.current instanceof HTMLElement) {
      restoreFocusRef.current.focus();
      restoreFocusRef.current = null;
    }
  }, [open]);
  function choose(action) { onAction(action.id); close(); }
  function beginDrag(event) {
    if (event.button !== 0) return;
    const rect = flowerRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, moved: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }
  function moveDrag(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const moved = Math.abs(event.clientX - drag.startX) > 3 || Math.abs(event.clientY - drag.startY) > 3;
    if (moved) drag.moved = true;
    if (!drag.moved) return;
    const rect = flowerRef.current?.getBoundingClientRect();
    const width = rect?.width || 96;
    const height = rect?.height || 96;
    const x = Math.max(0, Math.min(window.innerWidth - width, event.clientX - drag.offsetX));
    const y = Math.max(0, Math.min(window.innerHeight - height, event.clientY - drag.offsetY));
    setPosition({ x, y });
    event.preventDefault();
  }
  function endDrag(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) suppressClickRef.current = true;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    dragRef.current = null;
  }
  function activate(event) {
    if (suppressClickRef.current) { suppressClickRef.current = false; event.preventDefault(); return; }
    if (activePanel) onAction("world"); else setOpen((value) => !value);
  }
  const positionStyle = position ? { left: `${position.x}px`, top: `${position.y}px`, right: "auto", bottom: "auto" } : undefined;
  return <div className={`lw-flower${open ? " is-open" : ""}${position ? " is-positioned" : ""}`} style={positionStyle} ref={flowerRef} data-testid="learning-flower">
    {open && <button className="lw-flower-backdrop" type="button" aria-label="Close learning navigation" onClick={close} />}
    <div className="lw-flower-actions" role="menu" aria-label="Learning actions">
      {actions.map((action, index) => <button className={`lw-flower-action${action.recommended ? " is-recommended" : ""}`} style={{ "--flower-index": index }} type="button" role="menuitem" key={action.id} onClick={() => choose(action)} title={action.description}><span aria-hidden="true">{action.icon}</span><span>{action.shortLabel || action.label}</span>{action.status && <small>{action.status}</small>}</button>)}
    </div>
    <button ref={triggerRef} className="lw-flower-centre" type="button" aria-expanded={open} aria-label={activePanel ? "Return to learning world" : "Open learning navigation"} title="Drag to move · click to open" onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onClick={activate}><span aria-hidden="true">{activePanel ? "⌂" : "✿"}</span><span>{activePanel ? "World" : "Explore"}</span></button>
    <span className="lw-flower-shortcut" aria-hidden="true">F</span>
  </div>;
}
