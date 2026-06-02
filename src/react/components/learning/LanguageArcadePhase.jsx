/**
 * LanguageArcadePhase.jsx
 *
 * Intercepts the Language Ladder "review" phase and runs the 4-round Arcade
 * challenge before showing the lesson summary:
 *
 *   🦊 Quiz Hunt   × 2 rounds (all vocab words, Full Set goal)
 *   🐍 Snake       × 2 rounds (all sentence builders, Full Set goal)
 *
 * Reuses QuizHuntGame and SnakeBuilderGame exactly as the standalone Arcade
 * does — the same components, engine, and ArcadeSound hook.
 *
 * Props:
 *   pack         - progressive lesson pack
 *   targetLang   - e.g. "de"
 *   SPEECH_LANG_MAP - { de: "de-DE", … }
 *   prefs        - prefs.arcade (for sound/speech settings)
 *   updateProgress - from ProgressContext
 *   onComplete   - called when all 4 rounds are won → LanguagePage advances to review
 */
import { useRef, useMemo } from "react";
import { useLanguageArcadeSession } from "../../hooks/useLanguageArcadeSession.js";
import { useArcadeSound } from "../../games/arcade/hooks/useArcadeSound.js";
import QuizHuntGame from "../../games/arcade/QuizHuntGame.jsx";
import SnakeBuilderGame from "../../games/arcade/SnakeBuilderGame.jsx";
import { recordWordAnswer, recordArcadeResult } from "@/storage.js";

const FULL_SET_GOAL = { mode: "fullset", target: 0 };
const REDUCED_MOTION =
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

// Round progress dots
function RoundStepper({ totalRounds, roundIndex, done }) {
  const labels = ["🦊 Hunt 1", "🦊 Hunt 2", "🐍 Snake 1", "🐍 Snake 2"];
  return (
    <div className="lap-stepper">
      {labels.slice(0, totalRounds).map((label, i) => {
        const completed = i < roundIndex || done;
        const active    = i === roundIndex && !done;
        return (
          <div key={i} className={`lap-step${completed ? " lap-step--done" : active ? " lap-step--active" : ""}`}>
            <span className="lap-step-dot">{completed ? "✓" : i + 1}</span>
            <span className="lap-step-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function LanguageArcadePhase({ pack, targetLang, SPEECH_LANG_MAP, prefs, updateProgress, onComplete }) {
  const {
    round, roundIndex, totalRounds,
    questions, hasContent,
    wins, done,
    onRoundEnd, restart, SEQUENCE,
  } = useLanguageArcadeSession(pack, targetLang, SPEECH_LANG_MAP);

  // Guard: pack not yet loaded (should not happen normally since LanguagePage
  // checks pack before rendering, but handles any React batching edge case).
  if (!pack) {
    return <div className="lw-page"><div className="lw-card"><p style={{ color: "var(--lw-muted)" }}>Loading arcade…</p></div></div>;
  }

  // Sound — reuse the shared arcade sound hook with the same prefs
  const mutedRef         = useRef(!prefs?.sound);
  mutedRef.current       = !prefs?.sound;
  const speechEnabledRef = useRef(!!prefs?.speech);
  speechEnabledRef.current = !!prefs?.speech;
  const audio = useArcadeSound(mutedRef, speechEnabledRef);
  const sound = useMemo(() => ({
    play: audio.play,
    speakWord: audio.speakWord,
    stop: audio.stop,
    muted: !prefs?.sound,
    speech: !!prefs?.speech,
    toggleMute: () => {}, // prefs toggling lives in the parent setup screen
    toggleSpeech: () => {},
  }), [audio, prefs?.sound, prefs?.speech]);

  // Progress recording — same helpers as standalone Arcade
  function handleRecord(kind, payload) {
    if (kind === "answer" && payload?.wordId && updateProgress) {
      updateProgress((state) => recordWordAnswer(state, payload.wordId, !!payload.correct));
    } else if (kind === "over" && payload && updateProgress) {
      updateProgress((state) => recordArcadeResult(state, `ladder-${round.mode}`, payload));
      onRoundEnd(payload);
    }
  }

  // All done — show celebration and let parent advance to review
  if (done) {
    return (
      <div className="lw-page">
        <div className="lw-card lap-complete">
          <div className="lap-complete-hero">
            <span className="lap-complete-trophy">🏆</span>
            <div>
              <h2 className="lw-section-title">Arcade challenge complete!</h2>
              <p style={{ color: "var(--lw-muted)", fontSize: "0.9rem" }}>
                You won all 4 rounds — the vocabulary and sentences are locked in.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <button className="lw-btn lw-btn-primary" type="button" onClick={onComplete}>
              See lesson summary →
            </button>
            <button className="lw-btn lw-btn-ghost" type="button" onClick={restart}>
              Play again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No content guard — log to help diagnose, skip this round rather than blocking.
  if (!hasContent) {
    // eslint-disable-next-line no-console
    console.warn("[LanguageArcade] no questions for round", roundIndex, round.mode,
      "| vocab:", pack?.vocabulary?.length, "| builders:", pack?.sentenceBuilders?.length,
      "| targetLang:", targetLang);
    const reason = round.mode === "quiz-hunt"
      ? `No vocabulary words found for this lesson (vocab: ${pack?.vocabulary?.length ?? 0}, lang: ${targetLang}).`
      : `No sentence builders found for this lesson (builders: ${pack?.sentenceBuilders?.length ?? 0}).`;
    return (
      <div className="lw-page">
        <div className="lw-card">
          <p style={{ color: "var(--lw-muted)", fontSize: "0.88rem" }}>{reason}</p>
          <button className="lw-btn lw-btn-primary" type="button" onClick={onRoundEnd.bind(null, { correct: 1, lives: 1 })} style={{ marginTop: 12 }}>
            Skip this round →
          </button>
        </div>
      </div>
    );
  }

  const mapType = round.mode === "quiz-hunt" ? "pillars" : "open";

  return (
    <div className="lw-page arc-page">
      {/* Progress tracker above the game */}
      <div className="lw-card lap-header">
        <div className="lap-header-inner">
          <div>
            <div className="arc-hud-label">Language Ladder — Arcade Challenge</div>
            <strong style={{ fontSize: "0.95rem" }}>{round.label}</strong>
          </div>
          <button className="lw-btn lw-btn-ghost" type="button" onClick={onComplete}
            style={{ fontSize: "0.8rem" }}>
            Skip →
          </button>
        </div>
        <RoundStepper totalRounds={totalRounds} roundIndex={roundIndex} done={done} />
      </div>

      {/* The actual game — full reuse, no duplication */}
      {round.mode === "quiz-hunt"
        ? <QuizHuntGame
            key={`qh-${roundIndex}`}
            questions={questions}
            mapType={mapType}
            goal={FULL_SET_GOAL}
            sound={sound}
            reducedMotion={REDUCED_MOTION}
            onExit={onComplete}
            onRecord={handleRecord}
          />
        : <SnakeBuilderGame
            key={`sb-${roundIndex}`}
            questions={questions}
            mapType={mapType}
            goal={FULL_SET_GOAL}
            sound={sound}
            reducedMotion={REDUCED_MOTION}
            onExit={onComplete}
            onRecord={handleRecord}
          />
      }
    </div>
  );
}
