import { useEffect, useRef, useState } from "react";

function isTypingTarget(target) { return target instanceof HTMLElement && (target.matches("input, textarea, select, button") || target.isContentEditable); }

export default function FloatingFlower({ actions = [], activePanel = "", onAction }) {
  const [open, setOpen] = useState(false);
  const flowerRef = useRef(null);
  useEffect(() => {
    function onKeyDown(event) {
      if ((event.key === "f" || event.key === "F") && !isTypingTarget(event.target)) { event.preventDefault(); setOpen((value) => !value); }
      else if (event.key === "Escape" && open) { event.preventDefault(); setOpen(false); }
    }
    window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);
  useEffect(() => { if (open) flowerRef.current?.querySelector(".lw-flower-action")?.focus(); }, [open]);
  function choose(action) { onAction(action.id); setOpen(false); }
  return <div className={`lw-flower${open ? " is-open" : ""}`} ref={flowerRef} data-testid="learning-flower">
    {open && <button className="lw-flower-backdrop" type="button" aria-label="Close learning navigation" onClick={() => setOpen(false)} />}
    <div className="lw-flower-actions" role="menu" aria-label="Learning actions">
      {actions.map((action, index) => <button className={`lw-flower-action${action.recommended ? " is-recommended" : ""}`} style={{ "--flower-index": index }} type="button" role="menuitem" key={action.id} onClick={() => choose(action)} title={action.description}><span aria-hidden="true">{action.icon}</span><span>{action.shortLabel || action.label}</span>{action.status && <small>{action.status}</small>}</button>)}
    </div>
    <button className="lw-flower-centre" type="button" aria-expanded={open} aria-label={activePanel ? "Return to learning world" : "Open learning navigation"} onClick={() => activePanel ? onAction("world") : setOpen((value) => !value)}><span aria-hidden="true">{activePanel ? "⌂" : "✿"}</span><span>{activePanel ? "World" : "Explore"}</span></button>
    <span className="lw-flower-shortcut" aria-hidden="true">F</span>
  </div>;
}
