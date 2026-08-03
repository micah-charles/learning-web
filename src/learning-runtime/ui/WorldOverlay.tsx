import { useEffect, useId, useRef, type ReactNode } from "react";

export default function WorldOverlay({
  title,
  eyebrow,
  onClose,
  children,
  wide = false,
  immersive = false,
}: {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  immersive?: boolean;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const controls = [...dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex='0']")];
      if (!controls.length) event.preventDefault();
      else if (event.shiftKey && document.activeElement === controls[0]) {
        event.preventDefault();
        controls.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === controls.at(-1)) {
        event.preventDefault();
        controls[0].focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, []);
  return (
    <div className={`flr-overlay-layer${immersive ? " is-immersive" : ""}`}>
      <button className="flr-overlay-scrim" type="button" aria-label={`Dismiss ${title} backdrop`} onClick={onClose} />
      <section className={`flr-overlay${wide ? " is-wide" : ""}${immersive ? " is-immersive" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={dialogRef}>
        <header className="flr-overlay-header">
          <div>{eyebrow && <p className="flr-eyebrow">{eyebrow}</p>}<h2 id={titleId}>{title}</h2></div>
          <button className="flr-close" type="button" onClick={onClose} aria-label={`Close ${title}`}><span aria-hidden="true">×</span><small>Close</small></button>
        </header>
        <div className="flr-overlay-body">{children}</div>
      </section>
    </div>
  );
}
