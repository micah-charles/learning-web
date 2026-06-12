/**
 * TutorWidget.jsx
 *
 * Main widget component combining the floating button and chat panel.
 * Mounted once at App level like StudyBookDrawer.
 */

import { TutorButton } from "./TutorButton.jsx";
import { TutorPanel } from "./TutorPanel.jsx";
import { useTutor } from "./TutorProvider.jsx";
import { useStudyBook } from "../../react/context/StudyBookContext.jsx";

export function TutorWidget() {
  const { enabled } = useTutor();
  const { open: studyBookOpen } = useStudyBook();

  if (!enabled) return null;

  return (
    <div className={`tutor-widget${studyBookOpen ? " tutor-widget--studybook-open" : ""}`}>
      <TutorButton />
      <TutorPanel />
    </div>
  );
}
