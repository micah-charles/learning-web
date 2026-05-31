/**
 * useBoardMetrics.js — responsive grid sizing.
 *
 * Measures a wrapper element and returns the grid dimensions + cell pixel size
 * so the board fits the available space on phones, tablets, and desktop.
 * Orientation-aware: wider boxes get a landscape grid, tall boxes a portrait one.
 */
import { useState, useLayoutEffect, useRef } from "react";

const CELL_MIN = 30;
const CELL_MAX = 62;

function compute(box) {
  const w = box.width || 320;
  const h = box.height || 320;
  const landscape = w >= h;
  const cols = landscape ? 11 : 9;
  const rows = landscape ? 8 : 11;
  const cell = Math.max(
    CELL_MIN,
    Math.min(CELL_MAX, Math.floor(Math.min(w / cols, h / rows))),
  );
  return { cols, rows, cellPx: cell };
}

export function useBoardMetrics(wrapperRef) {
  const [metrics, setMetrics] = useState({ cols: 11, rows: 8, cellPx: 44 });
  const lastRef = useRef("");

  useLayoutEffect(() => {
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
  }, [wrapperRef]);

  return metrics;
}
