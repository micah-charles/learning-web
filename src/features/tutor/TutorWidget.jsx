/**
 * TutorWidget.jsx
 *
 * Main widget component combining the floating button and chat panel.
 * Mounted once at App level like StudyBookDrawer.
 */

import { TutorButton } from "./TutorButton.jsx";
import { TutorPanel } from "./TutorPanel.jsx";
import { useTutor } from "./TutorProvider.jsx";

export function TutorWidget() {
  const { enabled } = useTutor();

  if (!enabled) return null;

  return (
    <>
      <TutorButton />
      <TutorPanel />
    </>
  );
}