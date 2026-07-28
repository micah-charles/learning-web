import { useEffect } from "react";

function isEditableTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

export function physicalKeyFromEvent(event) {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.repeat) return null;
  if (isEditableTarget(event.target)) return null;
  if (event.target instanceof Element && event.target.closest("button") && ["Enter", " "].includes(event.key)) return null;
  if (/^[a-z]$/i.test(event.key)) return event.key.toUpperCase();
  if (["Enter", "Backspace", "Escape"].includes(event.key)) return event.key;
  return null;
}

export default function usePhysicalKeyboard({ enabled = true, onKey }) {
  useEffect(() => {
    if (!enabled || typeof onKey !== "function") return undefined;
    function handleKeyDown(event) {
      const key = physicalKeyFromEvent(event);
      if (!key) return;
      event.preventDefault();
      onKey(key, { source: "physical" });
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onKey]);
}
