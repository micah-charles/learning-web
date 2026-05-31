/**
 * useArcadeControls.js — unified directional input for desktop + touch.
 *
 * Desktop: Arrow keys + WASD (keydown on window).
 * Touch:   swipe gestures on the supplied element ref.
 * Also exposes `press(dir)` for on-screen D-pad buttons.
 *
 * The latest requested direction is written into a ref (`directionRef`) so the
 * game loop can read it each step without causing re-renders. An optional
 * `onDirection` callback fires on each input (for "first move starts the game"
 * and sound).
 */
import { useEffect, useRef, useCallback } from "react";

const KEY_MAP = {
  ArrowUp: "up", KeyW: "up",
  ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
};

export function useArcadeControls({ surfaceRef, enabled = true, onDirection, onPause }) {
  const directionRef = useRef("none");
  const cbRef = useRef(onDirection);
  cbRef.current = onDirection;
  const pauseRef = useRef(onPause);
  pauseRef.current = onPause;

  const setDirection = useCallback((dir) => {
    if (!dir) return;
    directionRef.current = dir;
    cbRef.current?.(dir);
  }, []);

  // Keyboard
  useEffect(() => {
    if (!enabled) return undefined;
    function onKey(e) {
      if (e.code === "Escape" || e.code === "KeyP") {
        pauseRef.current?.();
        return;
      }
      const dir = KEY_MAP[e.code];
      if (dir) {
        e.preventDefault();
        setDirection(dir);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, setDirection]);

  // Touch swipe on the game surface
  useEffect(() => {
    if (!enabled) return undefined;
    const el = surfaceRef?.current;
    if (!el) return undefined;

    let startX = 0, startY = 0, tracking = false;
    const THRESHOLD = 24; // px before a swipe registers

    function onStart(e) {
      const t = e.touches ? e.touches[0] : e;
      startX = t.clientX; startY = t.clientY; tracking = true;
    }
    function onMove(e) {
      if (!tracking) return;
      const t = e.touches ? e.touches[0] : e;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) return;
      if (Math.abs(dx) > Math.abs(dy)) setDirection(dx > 0 ? "right" : "left");
      else setDirection(dy > 0 ? "down" : "up");
      tracking = false; // one swipe per touch; lift to swipe again
      if (e.cancelable) e.preventDefault();
    }
    function onEnd() { tracking = false; }

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, [enabled, surfaceRef, setDirection]);

  return { directionRef, press: setDirection };
}
