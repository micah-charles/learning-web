/**
 * TutorButton.jsx
 *
 * Floating action button for the FoxChild Tutor.
 * Bottom-right corner, non-intrusive, accessible.
 */

import { useTutor } from "./TutorProvider.jsx";

export function TutorButton() {
  const { open, openPanel, enabled } = useTutor();

  if (!enabled) return null;

  return (
    <button
      className={`tutor-fab ${open ? "tutor-fab--open" : ""}`}
      type="button"
      aria-label={open ? "Close FoxChild Tutor" : "Open FoxChild Tutor"}
      aria-expanded={open}
      onClick={openPanel}
    >
      <span className="tutor-fab__icon" aria-hidden="true">🦊</span>
      <span className="tutor-fab__tooltip">FoxChild Tutor</span>
    </button>
  );
}