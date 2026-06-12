/**
 * TutorButton.jsx
 *
 * Floating action button for the FoxChild Tutor.
 * Bottom-right corner, non-intrusive, accessible.
 */

import { useTutor } from "./TutorProvider.jsx";
import { useStudyBook } from "../../react/context/StudyBookContext.jsx";

export function TutorButton() {
  const { open, openPanel, closePanel, enabled } = useTutor();
  const { open: studyBookOpen } = useStudyBook();

  if (!enabled) return null;

  function handleClick() {
    if (open) {
      closePanel();
      return;
    }
    if (
      studyBookOpen
      && typeof window !== "undefined"
      && window.matchMedia("(max-width: 960px)").matches
    ) {
      return;
    }
    openPanel();
  }

  return (
    <button
      className={`tutor-fab ${open ? "tutor-fab--open" : ""}`}
      type="button"
      aria-label={open ? "Close FoxChild Tutor" : "Open FoxChild Tutor"}
      aria-expanded={open}
      onClick={handleClick}
    >
      <img className="tutor-fab__icon" src="/images/foxchild-fox.png" alt="" aria-hidden="true" />
      <span className="tutor-fab__tooltip">FoxChild Tutor</span>
    </button>
  );
}
