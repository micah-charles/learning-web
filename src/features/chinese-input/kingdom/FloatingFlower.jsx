import { useEffect, useRef, useState } from "react";
import { FLOWER_ACTIONS } from "./kingdom-model.js";

function isTypingTarget(target) {
  return target instanceof HTMLElement
    && (target.matches("input, textarea, select") || target.isContentEditable);
}

export default function FloatingFlower({ activePanel, onAction }) {
  const [open, setOpen] = useState(false);
  const flowerRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.key === "f" || event.key === "F") && !isTypingTarget(event.target)) {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
      } else if (event.key === "Tab" && open && flowerRef.current) {
        const controls = [...flowerRef.current.querySelectorAll("button:not([disabled])")];
        if (!controls.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) flowerRef.current?.querySelector(".cik-flower-petal")?.focus();
  }, [open]);

  function choose(action) {
    onAction(action);
    setOpen(false);
  }

  return (
    <div
      className={`cik-flower ${open ? "is-open" : ""}`}
      ref={flowerRef}
      data-testid="chinese-input-flower"
      aria-label="Floating Flower navigation"
    >
      {open && <button className="cik-flower-backdrop" type="button" aria-label="Close Floating Flower" onClick={() => setOpen(false)} />}
      <div className="cik-flower-petals" role="menu" aria-label="Chinese Input Kingdom actions">
        {FLOWER_ACTIONS.map((action, index) => (
          <button
            className="cik-flower-petal"
            style={{ "--petal-index": index }}
            type="button"
            role="menuitem"
            key={action.id}
            onClick={() => choose(action.id)}
          >
            <span aria-hidden="true">{action.icon}</span>
            <span>{action.shortLabel}</span>
          </button>
        ))}
      </div>
      <button
        className="cik-flower-centre"
        type="button"
        aria-expanded={open}
        aria-label={activePanel ? "Return to Kingdom" : "Open Floating Flower navigation"}
        onClick={() => activePanel ? choose("kingdom") : setOpen((value) => !value)}
      >
        <span aria-hidden="true">{activePanel ? "⌂" : "✿"}</span>
        <span>{activePanel ? "Kingdom" : "Explore"}</span>
      </button>
      <span className="cik-flower-shortcut" aria-hidden="true">F</span>
    </div>
  );
}
