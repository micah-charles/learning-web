/**
 * useArcadeControls.js — unified directional input for desktop + touch.
 *
 * Desktop: Arrow keys + WASD (keydown on window).
 * Touch:   swipe gestures through handlers placed on the board.
 * Also exposes `press(dir)` for on-screen D-pad buttons.
 *
 * `directionRef` is the current moving direction. `queuedDirectionRef` is the
 * latest requested turn; game loops consume it at grid-step boundaries so a
 * player can swipe just before a junction, Pac-Man style.
 */
import { useEffect, useRef, useCallback } from "react";

const KEY_MAP = {
  ArrowUp: "up", KeyW: "up",
  ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
};

const SWIPE_THRESHOLD = 24;
const SCROLL_GUARD_THRESHOLD = 10;

function directionFromDelta(dx, dy, threshold = SWIPE_THRESHOLD) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

export function useArcadeControls({ enabled = true, onDirection, onPause } = {}) {
  const directionRef = useRef("none");
  const queuedDirectionRef = useRef("none");
  const touchRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
  });
  const cbRef = useRef(onDirection);
  cbRef.current = onDirection;
  const pauseRef = useRef(onPause);
  pauseRef.current = onPause;

  const queueDirection = useCallback((dir) => {
    if (!dir) return;
    queuedDirectionRef.current = dir;
    cbRef.current?.(dir);
  }, []);

  const resetDirections = useCallback(() => {
    directionRef.current = "none";
    queuedDirectionRef.current = "none";
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
        queueDirection(dir);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, queueDirection]);

  const onTouchStart = useCallback((event) => {
    if (!enabled) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    touchRef.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
    };
  }, [enabled]);

  const onTouchMove = useCallback((event) => {
    if (!enabled || !touchRef.current.active) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    const dx = touch.clientX - touchRef.current.startX;
    const dy = touch.clientY - touchRef.current.startY;
    const clearIntent = Math.max(Math.abs(dx), Math.abs(dy)) >= SCROLL_GUARD_THRESHOLD;
    if (!clearIntent) return;
    // CSS `touch-action: none` on the board prevents page scrolling without
    // triggering passive-listener warnings in React's synthetic touch events.
  }, [enabled]);

  const onTouchEnd = useCallback((event) => {
    if (!enabled || !touchRef.current.active) return;
    const touch = event.changedTouches?.[0];
    const { startX, startY } = touchRef.current;
    touchRef.current.active = false;
    if (!touch) return;

    const dir = directionFromDelta(touch.clientX - startX, touch.clientY - startY);
    if (dir) queueDirection(dir);
  }, [enabled, queueDirection]);

  const onTouchCancel = useCallback(() => {
    touchRef.current.active = false;
  }, []);

  return {
    directionRef,
    queuedDirectionRef,
    press: queueDirection,
    resetDirections,
    boardControlHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
    },
  };
}
