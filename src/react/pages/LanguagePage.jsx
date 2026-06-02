/**
 * LanguagePage.jsx — Language Ladder (Progressive Language Lesson)
 *
 * Full React implementation. The vanilla progressive-language-lesson.js is
 * kept only for its pure logic functions (state machine, data loaders, helpers).
 * All rendering is React JSX — no dangerouslySetInnerHTML, no event delegation.
 *
 * Phases: Listen → Vocabulary → Builder → Arcade Challenge → Review
 */
import { useState } from "react";
import { useProgress } from "../context/ProgressContext.jsx";
import { loadStoredState } from "@/storage.js";
import { useLessonSession } from "../hooks/useLessonSession.js";

import LessonHeader   from "../components/languageLadder/LessonHeader.jsx";
import LessonStepper  from "../components/languageLadder/LessonStepper.jsx";
import ListenPhase    from "../components/languageLadder/ListenPhase.jsx";
import VocabPhase     from "../components/languageLadder/VocabPhase.jsx";
import BuilderPhase   from "../components/languageLadder/BuilderPhase.jsx";
import ReviewPhase    from "../components/languageLadder/ReviewPhase.jsx";
import LanguageArcadePhase from "../components/learning/LanguageArcadePhase.jsx";

export default function LanguagePage() {
  const { updateProgress } = useProgress();
  const [showArcade, setShowArcade] = useState(false);

  const {
    catalog, pack, session, loadError,
    dispatch, speakCurrentCue,
    setPackSelection, setStageSelection, setLessonSelection, setLanguageSelection,
    advanceToReview,
  } = useLessonSession();

  // Intercept the builder → review transition: play Arcade first.
  function handleDispatch(action, data) {
    if (action === "pl-builder-next") {
      const builders = pack?.sentenceBuilders || [];
      const isLastSentence = session.sentenceIndex >= builders.length - 1;
      const alreadyAnswered = session.answered?.builder?.[builders[session.sentenceIndex]?.sentenceId];
      if (isLastSentence && alreadyAnswered) {
        // Show Arcade instead of going straight to review.
        setShowArcade(true);
        return;
      }
    }
    dispatch(action, data);
  }

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="lw-page">
        <div className="lw-card">
          <p style={{ color: "var(--lw-coral)" }}>Failed to load lesson: {loadError}</p>
        </div>
      </div>
    );
  }

  if (!catalog || !session) {
    return (
      <div className="lw-page">
        <div className="lw-card">
          <p style={{ color: "var(--lw-muted)", fontStyle: "italic" }}>Loading lessons…</p>
        </div>
      </div>
    );
  }

  // ── Stepper jump handler (only for listen/vocab/builder) ───────────────────
  function handleJump(phase) {
    setShowArcade(false);
    dispatch("pl-jump-phase", { phase });
  }

  // Active phase: when Arcade is showing, highlight "arcade" in the stepper.
  const activePhase = showArcade ? "arcade" : (session.phase || "listen");

  // ── Arcade challenge ───────────────────────────────────────────────────────
  if (showArcade && pack) {
    return (
      <div className="lw-page section-stack pl-shell">
        <LessonHeader
          catalog={catalog} session={session} pack={pack}
          onPackChange={setPackSelection} onStageChange={setStageSelection}
          onLessonChange={setLessonSelection} onLanguageChange={setLanguageSelection}
        />
        <LessonStepper currentPhase="arcade" onJump={handleJump} />
        <LanguageArcadePhase
          pack={pack}
          targetLang={session.targetLang}
          prefs={loadStoredState().prefs.arcade}
          updateProgress={updateProgress}
          onComplete={() => {
            // After Arcade, advance session to review phase and hide Arcade.
            advanceToReview();
            setShowArcade(false);
          }}
        />
      </div>
    );
  }

  // ── Normal lesson phases ───────────────────────────────────────────────────
  const phase = session.phase || "listen";

  return (
    <div className="lw-page section-stack pl-shell">
      <LessonHeader
        catalog={catalog} session={session} pack={pack}
        onPackChange={setPackSelection} onStageChange={setStageSelection}
        onLessonChange={setLessonSelection} onLanguageChange={setLanguageSelection}
      />
      <LessonStepper currentPhase={activePhase} onJump={handleJump} />

      {!pack && (
        <div className="section-card pl-lesson-card">
          <p className="muted" style={{ fontStyle: "italic" }}>Loading lesson content…</p>
        </div>
      )}

      {pack && phase === "listen"  && (
        <ListenPhase  session={session} pack={pack} onDispatch={dispatch} onSpeak={speakCurrentCue} />
      )}
      {pack && phase === "vocab"   && (
        <VocabPhase   session={session} pack={pack} onDispatch={dispatch} />
      )}
      {pack && phase === "builder" && (
        <BuilderPhase session={session} pack={pack} onDispatch={handleDispatch} />
      )}
      {pack && (phase === "review" || phase === "arcade") && (
        <ReviewPhase  session={session} pack={pack} onDispatch={dispatch} />
      )}
    </div>
  );
}
