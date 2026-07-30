import { useEffect, useRef } from "react";

export default function KingdomOverlay({ title, eyebrow, onClose, children, wide = false }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialogRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = [...(dialogRef.current?.querySelectorAll(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]",
      ) || [])];
      if (!controls.length) {
        event.preventDefault();
        dialogRef.current?.focus();
      } else if (event.shiftKey && document.activeElement === controls[0]) {
        event.preventDefault();
        controls[controls.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === controls[controls.length - 1]) {
        event.preventDefault();
        controls[0].focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previous?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="cik-overlay-layer">
      <button className="cik-overlay-scrim" type="button" aria-label={`Close ${title}`} onClick={onClose} />
      <section
        className={`cik-overlay ${wide ? "cik-overlay-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cik-overlay-title"
        tabIndex="-1"
        ref={dialogRef}
      >
        <header className="cik-overlay-header">
          <div>
            {eyebrow && <p className="cik-eyebrow">{eyebrow}</p>}
            <h2 id="cik-overlay-title">{title}</h2>
          </div>
          <button className="cik-icon-button" type="button" onClick={onClose} aria-label={`Close ${title}`}>×</button>
        </header>
        <div className="cik-overlay-body">{children}</div>
      </section>
    </div>
  );
}
