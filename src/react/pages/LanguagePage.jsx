/**
 * LanguagePage.jsx — Language Ladder
 *
 * Phases: Listen → Vocabulary → Builder → Arcade → Review
 *
 * Session memory (Features 1 & 2):
 *   - On mount, restores the most-progressed language's next lesson.
 *   - When Arcade completes, marks the lesson done and auto-advances.
 */
import { useState, useCallback, useEffect } from "react";
import { useProgress } from "../context/ProgressContext.jsx";
import { loadStoredState } from "@/storage.js";
import { useLessonSession } from "../hooks/useLessonSession.js";
import { useVoicePractice } from "../hooks/useVoicePractice.js";
import { SPEECH_LANG_MAP } from "@/progressive-language-lesson.js";
import { isSpeechSynthesisSupported } from "@/utils.js";
import { isSpeechRecognitionSupported } from "../services/speechRecognitionService.js";

import LessonHeader   from "../components/languageLadder/LessonHeader.jsx";
import LessonStepper  from "../components/languageLadder/LessonStepper.jsx";
import ListenPhase    from "../components/languageLadder/ListenPhase.jsx";
import VocabPhase     from "../components/languageLadder/VocabPhase.jsx";
import BuilderPhase   from "../components/languageLadder/BuilderPhase.jsx";
import ReviewPhase    from "../components/languageLadder/ReviewPhase.jsx";
import LanguageArcadePhase from "../components/learning/LanguageArcadePhase.jsx";

export default function LanguagePage() {
  const { progress, updateProgress } = useProgress();
  const [showArcade, setShowArcade] = useState(false);
  const [voicePracticeMode, setVoicePracticeMode] = useState(
    progress?.prefs?.voice?.voicePracticeMode ?? false
  );
  const [speakInstead, setSpeakInstead] = useState(
    progress?.prefs?.voice?.speakInsteadOfClick ?? false
  );
  const [nextLesson, setNextLesson]   = useState(null);

  const {
    catalog, pack, session, loadError,
    dispatch, speakCurrentCue,
    setPackSelection, setStageSelection, setLessonSelection, setLanguageSelection,
    markLessonComplete, goToLesson, advanceToReview,
  } = useLessonSession();

  const targetLang = session?.targetLang || "de";
  const speechLang = SPEECH_LANG_MAP[targetLang] || "de-DE";
  const speechPlaybackSupported = isSpeechSynthesisSupported();
  const voicePracticeSupported = isSpeechRecognitionSupported();

  const voice = useVoicePractice({
    languageCode: speechLang,
    onResult: () => {},
  });

  useEffect(() => {
    if (session?.phase !== "listen" && session?.phase !== "builder") {
      voice.reset();
    }
  }, [session?.phase, voice.reset]);

  useEffect(() => {
    if (!speechPlaybackSupported && session?.phase === "listen") {
      dispatch("pl-jump-phase", { phase: "vocab" });
    }
  }, [dispatch, session?.phase, speechPlaybackSupported]);

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
  const effectivePhase = !speechPlaybackSupported && activePhase === "listen" ? "vocab" : activePhase;

  // ── Arcade challenge ───────────────────────────────────────────────────────
  if (showArcade && pack) {
    return (
      <div className="lw-page section-stack pl-shell">
        <LessonHeader
          catalog={catalog} session={session} pack={pack}
          onPackChange={setPackSelection} onStageChange={setStageSelection}
          onLessonChange={setLessonSelection} onLanguageChange={setLanguageSelection}
        />
        <LessonStepper currentPhase="arcade" onJump={handleJump} showListen={speechPlaybackSupported} />
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
  const phase = !speechPlaybackSupported && session.phase === "listen"
    ? "vocab"
    : (session.phase || "listen");

  return (
    <div className="lw-page section-stack pl-shell">
      <LessonHeader
        catalog={catalog} session={session} pack={pack}
        onPackChange={setPackSelection} onStageChange={setStageSelection}
        onLessonChange={setLessonSelection} onLanguageChange={setLanguageSelection}
      />
      <LessonStepper currentPhase={effectivePhase} onJump={handleJump} showListen={speechPlaybackSupported} />

      {voicePracticeSupported && (
        <label
          className="lw-check-row"
          data-testid="progressive-voice-practice-toggle"
          style={{ padding: "6px 16px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <input
            type="checkbox"
            checked={voicePracticeMode}
            onChange={(e) => {
              setVoicePracticeMode(e.target.checked);
              updateProgress(state => {
                if (!state.prefs.voice) state.prefs.voice = {};
                state.prefs.voice.voicePracticeMode = e.target.checked;
              });
              if (!e.target.checked) voice.cancel();
            }}
          />
          🎤 Voice Practice Mode
        </label>
      )}

      {!pack && (
        <div className="section-card pl-lesson-card">
          <p className="muted" style={{ fontStyle: "italic" }}>Loading lesson content…</p>
        </div>
      )}

      {pack && phase === "listen"  && (
        <ListenPhase
          session={session}
          pack={pack}
          onDispatch={dispatch}
          onSpeak={speakCurrentCue}
          voicePractice={voicePracticeSupported && voicePracticeMode ? voice : null}
          speechLang={speechLang}
        />
      )}
      {pack && phase === "vocab"   && (
        <VocabPhase session={session} pack={pack} onDispatch={dispatch} canGoBack={speechPlaybackSupported} />
      )}
      {pack && phase === "builder" && (
        <BuilderPhase
          session={session}
          pack={pack}
          onDispatch={handleDispatch}
          voicePractice={voicePracticeSupported && voicePracticeMode ? voice : null}
          speechLang={speechLang}
          speakInstead={speechPlaybackSupported && speakInstead}
          onToggleSpeakInstead={(checked) => {
            setSpeakInstead(checked);
            updateProgress((state) => {
              if (!state.prefs.voice) state.prefs.voice = {};
              state.prefs.voice.speakInsteadOfClick = checked;
            });
          }}
        />
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
