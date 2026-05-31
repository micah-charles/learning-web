/**
 * useGameLoop.js — a requestAnimationFrame loop with delta timing + discrete steps.
 *
 * The loop accumulates real elapsed time and fires `onStep` once per
 * `stepIntervalMs`. This keeps React state updates to a few per second (one per
 * grid step) rather than one per animation frame — smooth CSS-transitioned
 * movement, but no per-frame React tree rebuilds.
 *
 * StrictMode-safe: the rAF is started/stopped inside an effect with cleanup.
 * `onStep` and `stepIntervalMs` are read from refs so a changing callback does
 * not restart the loop or go stale.
 */
import { useEffect, useRef } from "react";

export function useGameLoop({ running, stepIntervalMs, onStep }) {
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  const intervalRef = useRef(stepIntervalMs);
  intervalRef.current = stepIntervalMs;

  useEffect(() => {
    if (!running) return undefined;

    let rafId = 0;
    let last = performance.now();
    let acc = 0;

    const tick = (now) => {
      const dt = now - last;
      last = now;
      acc += dt;
      const iv = Math.max(40, intervalRef.current || 160);
      // Fire at most a few steps per frame so a tab-switch lag spike can't
      // trigger a death spiral of catch-up steps.
      let steps = 0;
      while (acc >= iv && steps < 3) {
        acc -= iv;
        steps += 1;
        onStepRef.current(iv);
      }
      if (acc > iv) acc = 0; // drop excess backlog
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [running]);
}
