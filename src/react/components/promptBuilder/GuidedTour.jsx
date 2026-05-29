/**
 * GuidedTour.jsx
 *
 * Lightweight, dependency-free guided tour overlay.
 *
 * Why custom (not driver.js)? The project is intentionally dependency-light
 * (see CLAUDE.md §1). This component is ~150 lines, has no runtime deps, and
 * reuses the existing design tokens.
 *
 * Behaviour:
 *  - Highlights a target element by id with a spotlight + tooltip card.
 *  - Steps with no target (or a missing, non-skip target) render centered.
 *  - Steps marked skipIfMissing are dropped when their target is absent.
 *  - Keyboard: Esc closes, ←/→ navigate, Enter advances. Focus is trapped
 *    inside the card; closing restores focus to the launcher.
 *  - Respects prefers-reduced-motion for scrolling/animation.
 */
import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";

export default function GuidedTour({ steps, open, onClose }) {
  const [activeSteps, setActiveSteps] = useState([]);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const cardRef = useRef(null);
  const launcherRef = useRef(null);
  const reducedMotion = useRef(false);

  // Resolve which steps are shown each time the tour opens.
  useEffect(() => {
    if (!open) return;
    reducedMotion.current =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    launcherRef.current = document.activeElement;
    const resolved = steps.filter((s) => {
      if (!s.target) return true; // centered step
      if (document.getElementById(s.target)) return true;
      return !s.skipIfMissing; // keep as centered fallback unless skipIfMissing
    });
    setActiveSteps(resolved.length ? resolved : steps);
    setIndex(0);
  }, [open, steps]);

  const step = activeSteps[index];

  // Measure (and scroll to) the current target.
  const measure = useCallback(() => {
    if (!step || !step.target) { setRect(null); return; }
    const el = document.getElementById(step.target);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  // Scroll target into view when the step changes, then measure.
  useLayoutEffect(() => {
    if (!open || !step) return;
    const el = step.target ? document.getElementById(step.target) : null;
    if (el) {
      el.scrollIntoView({
        behavior: reducedMotion.current ? "auto" : "smooth",
        block: "center",
      });
    }
    // Re-measure after the scroll settles.
    const t = setTimeout(measure, reducedMotion.current ? 0 : 260);
    return () => clearTimeout(t);
  }, [open, step, measure]);

  // Keep the spotlight aligned while scrolling/resizing.
  useEffect(() => {
    if (!open) return;
    const onMove = () => measure();
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, measure]);

  const close = useCallback(() => {
    onClose?.();
    // Restore focus to whatever launched the tour.
    if (launcherRef.current && typeof launcherRef.current.focus === "function") {
      launcherRef.current.focus();
    }
  }, [onClose]);

  const next = useCallback(() => {
    setIndex((i) => (i < activeSteps.length - 1 ? i + 1 : i));
  }, [activeSteps.length]);

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  const isLast = index === activeSteps.length - 1;

  // Move focus into the card on each step.
  useEffect(() => {
    if (open && cardRef.current) cardRef.current.focus();
  }, [open, index]);

  // Keyboard handling + simple focus trap.
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        isLast ? close() : next();
        return;
      }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); return; }
      if (e.key === "Tab" && cardRef.current) {
        const focusables = cardRef.current.querySelectorAll(
          'button, [href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, isLast, next, prev, close]);

  if (!open || !step) return null;

  // Tooltip placement: below the target if there's room, otherwise above.
  let cardStyle;
  let spotlight = null;
  if (rect) {
    const pad = 6;
    const vh = window.innerHeight;
    const below = rect.top + rect.height + 12;
    const placeAbove = below + 200 > vh && rect.top > 220;
    cardStyle = {
      position: "fixed",
      left: Math.max(12, Math.min(rect.left, window.innerWidth - 360)),
      ...(placeAbove
        ? { bottom: vh - rect.top + 12 }
        : { top: below }),
    };
    spotlight = (
      <div
        className="lw-tour-spotlight"
        style={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
        }}
      />
    );
  } else {
    cardStyle = {
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  return createPortal(
    <div
      className={`lw-tour-overlay${reducedMotion.current ? " lw-tour-overlay--no-motion" : ""}`}
      // Clicking the dimmed area closes the tour.
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      {spotlight}
      <div
        ref={cardRef}
        className="lw-tour-card"
        style={cardStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lw-tour-title"
        aria-describedby="lw-tour-desc"
        tabIndex={-1}
      >
        <div className="lw-tour-card-head">
          <span className="lw-tour-progress">
            Step {index + 1} of {activeSteps.length}
          </span>
          <button
            type="button"
            className="lw-tour-close"
            onClick={close}
            aria-label="Close tour"
          >
            ✕
          </button>
        </div>
        <h3 id="lw-tour-title" className="lw-tour-title">{step.title}</h3>
        <p id="lw-tour-desc" className="lw-tour-desc">{step.description}</p>
        <div className="lw-tour-actions">
          <button
            type="button"
            className="lw-btn lw-btn-ghost"
            onClick={close}
          >
            Skip
          </button>
          <div className="lw-tour-actions-right">
            <button
              type="button"
              className="lw-btn"
              onClick={prev}
              disabled={index === 0}
            >
              Back
            </button>
            <button
              type="button"
              className="lw-btn lw-btn-primary"
              onClick={isLast ? close : next}
            >
              {isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
