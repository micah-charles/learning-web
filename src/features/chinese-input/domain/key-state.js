export const KEY_STATE_PRIORITY = [
  "incorrect",
  "correct",
  "pressed",
  "expected",
  "review",
  "learned",
  "available",
  "inactive",
];

export function resolveKeyState(states = []) {
  const candidates = new Set((states || []).filter(Boolean));
  return KEY_STATE_PRIORITY.find((state) => candidates.has(state)) || "inactive";
}
