import { useEffect, useId, useRef } from "react";

export default function WorldOverlay({ title, eyebrow, onClose, children, wide = false }) {
  const dialogRef = useRef(null); const titleId = useId(); const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement;
    dialogRef.current?.focus();
    function onKeyDown(event) {
      if (event.key === "Escape") { event.preventDefault(); onCloseRef.current?.(); return; }
      if (event.key !== "Tab") return;
      const controls = [...(dialogRef.current?.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]") || [])];
      if (!controls.length) event.preventDefault();
      else if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
    }
    document.addEventListener("keydown", onKeyDown); return () => { document.removeEventListener("keydown", onKeyDown); previous?.focus?.(); };
  }, []);
  return <div className="lw-world-overlay-layer"><button className="lw-world-overlay-scrim" type="button" aria-label={`Close ${title}`} onClick={onClose} /><section className={`lw-world-overlay${wide ? " is-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex="-1" ref={dialogRef}><header className="lw-world-overlay-header"><div>{eyebrow && <p className="lw-eyebrow">{eyebrow}</p>}<h2 id={titleId}>{title}</h2></div><button className="lw-btn lw-btn-ghost" type="button" onClick={onClose} aria-label={`Close ${title}`}>Close</button></header><div className="lw-world-overlay-body">{children}</div></section></div>;
}
