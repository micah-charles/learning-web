/**
 * LanguagePage.jsx — Language Ladder
 *
 * Phases: Listen → Vocabulary → Builder → Arcade → Review
 *
 * Session memory (Features 1 & 2):
 *   - On mount, restores the most-progressed language's next lesson.
 *   - When Arcade completes, marks the lesson done and auto-advances.
 */
import { useState, useCallback } from "react";
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
  // nextLesson is set when Arcade completes; shown in ReviewPhase as an action.
  const [nextLesson, setNextLesson]   = useState(null);

  const {
    catalog, pack, session, loadError,
    dispatch, speakCurrentCue,
    setPackSelection, setStageSelection, setLessonSelection, setLanguageSelection,
    markLessonComplete, goToLesson, advanceToReview,
  } = useLessonSession();

  // Intercept builder → review: show Arcade first.
  function handleDispatch(action, data) {
    if (action === "pl-builder-next") {
      const builders = pack?.sentenceBuilders || [];
      const isLastSentence = session.sentenceIndex >= builders.length - 1;
      const sid = builders[session.sentenceIndex]?.sentenceId;
      const alreadyAnswered = sid && session.answered?.builder?.[sid];
      if (isLastSentence && alreadyAnswered) {
        setShowArcade(true);
        return;
      }
    }
    dispatch(action, data);
  }

  // Called when Arcade completes all rounds at 100%.
  const handleArcadeComplete = useCallback(() => {
    const lessonId   = session?.catalogLessonId;
    const targetLang = session?.targetLang;
    const next = markLessonComplete(lessonId, targetLang);
    setNextLesson(next);   // may be null (last lesson)
    setShowArcade(false);
    advanceToReview();
  }, [session?.catalogLessonId, session?.targetLang, markLessonComplete, advanceToReview]);

  // Called from ReviewPhase "Next Lesson" button.
  const handleNextLesson = useCallback(() => {
    setNextLesson(null);
    goToLesson(nextLesson, session?.targetLang);
  }, [nextLesson, session?.targetLang, goToLesson]);

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

  function handleJump(phase) {
    setShowArcade(false);
    dispatch("pl-jump-phase", { phase });
  }

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
          onComplete={handleArcadeComplete}
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
        <ReviewPhase
          session={session}
          pack={pack}
          onDispatch={dispatch}
          nextLesson={nextLesson}
          onNextLesson={handleNextLesson}
        />
      )}
    </div>
  );
}
