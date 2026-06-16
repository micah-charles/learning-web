/**
 * useBoardMetrics.js — responsive grid sizing.
 *
 * Measures a wrapper element and returns the grid dimensions + cell pixel size
 * so the board fits the available space on phones, tablets, and desktop.
 * Orientation-aware: wider boxes get a landscape grid, tall boxes a portrait one.
 */
import { useState, useLayoutEffect, useRef } from "react";

const CELL_MIN = 34;
const CELL_MAX = 104;
const DESKTOP_METRICS = { cols: 11, rows: 8, cellPx: 44 };
const MOBILE_INITIAL_METRICS = { cols: 8, rows: 11, cellPx: 34 };
const RESPONSIVE_QUERY = "(max-width: 768px), (pointer: coarse)";

function prefersResponsiveBoard() {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia(RESPONSIVE_QUERY).matches;
}

function compute(box) {
  const w = box.width || 320;
  const h = box.height || 320;
  const landscape = w >= h;
  // Fewer rows/cols → larger cells, so multi-word answers fit horizontally
  // (and the board reads bigger) instead of everything rotating vertical.
  const cols = landscape ? 10 : 8;
  const rows = landscape ? 7 : 11;
  const cell = Math.max(
    CELL_MIN,
    Math.min(CELL_MAX, Math.floor(Math.min(w / cols, h / rows))),
  );
  return { cols, rows, cellPx: cell };
}

export function useBoardMetrics(wrapperRef, observeKey = true) {
  const [responsiveBoard, setResponsiveBoard] = useState(prefersResponsiveBoard);
  const [metrics, setMetrics] = useState(() => (
    prefersResponsiveBoard() ? MOBILE_INITIAL_METRICS : DESKTOP_METRICS
  ));
  const lastRef = useRef("");

  useLayoutEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const media = window.matchMedia(RESPONSIVE_QUERY);
    const update = () => setResponsiveBoard(media.matches);
    update();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  useLayoutEffect(() => {
    if (!responsiveBoard) {
      lastRef.current = `${DESKTOP_METRICS.cols}x${DESKTOP_METRICS.rows}x${DESKTOP_METRICS.cellPx}`;
      setMetrics(DESKTOP_METRICS);
      return undefined;
    }

    const el = wrapperRef.current;
    if (!el) return undefined;

    function measure() {
      const rect = el.getBoundingClientRect();
      const next = compute({ width: rect.width, height: rect.height });
      const key = `${next.cols}x${next.rows}x${next.cellPx}`;
      if (key !== lastRef.current) {
        lastRef.current = key;
        setMetrics(next);
      }
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("orientationchange", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", measure);
    };
  }, [wrapperRef, observeKey, responsiveBoard]);

  return metrics;
}
