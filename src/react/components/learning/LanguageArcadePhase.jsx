/**
 * LanguageArcadePhase.jsx
 *
 * Runs the 2-round Arcade challenge:
 *   🦊 Quiz Hunt  → 🐍 Sentence Snake
 *
 * Pass rule (Feature 3):
 *   - 100% accuracy → advance to next round automatically.
 *   - <100% accuracy → show "Please retry" overlay. Player must replay
 *     until they achieve 100%.
 *
 * On all rounds complete → marks the lesson done and calls onComplete
 * (which triggers goToLesson for auto-advance to the next lesson).
 */
import { useRef, useMemo, useEffect } from "react";
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

export default function LanguageArcadePhase({ pack, targetLang, prefs, updateProgress, onComplete }) {
  const {
    round, roundIndex,
    questions, hasContent,
    done, needsRetry, lastAccuracy,
    onRoundEnd, clearRetry,
  } = useLanguageArcadeSession(pack, targetLang);

  // retryKey forces a game remount when the player clicks "Try again".
  const retryKeyRef = useRef(0);

  // Sound
  const mutedRef = useRef(!prefs?.sound);
  mutedRef.current = !prefs?.sound;
  const speechEnabledRef = useRef(!!prefs?.speech);
  speechEnabledRef.current = !!prefs?.speech;
  const audio = useArcadeSound(mutedRef, speechEnabledRef);
  const sound = useMemo(() => ({
    play: audio.play, speakWord: audio.speakWord, stop: audio.stop,
    muted: !prefs?.sound, speech: !!prefs?.speech,
    toggleMute: () => {}, toggleSpeech: () => {},
  }), [audio, prefs?.sound, prefs?.speech]);

  // All rounds passed → notify parent (which marks lesson complete + advances).
  useEffect(() => { if (done) onComplete(); }, [done, onComplete]);

  function handleRecord(kind, payload) {
    if (kind === "answer" && payload?.wordId && updateProgress) {
      updateProgress((state) => recordWordAnswer(state, payload.wordId, !!payload.correct));
    } else if (kind === "over" && payload && updateProgress) {
      updateProgress((state) => recordArcadeResult(state, `ladder-${round.mode}`, payload));
      onRoundEnd(payload);
    }
  }

  function handleRetryAgain() {
    retryKeyRef.current += 1;
    clearRetry();
  }

  if (!pack) return null;

  // Auto-skip rounds with no content.
  if (!hasContent) {
    onRoundEnd({ accuracy: 100, correct: 1, lives: 3 });
    return null;
  }

  const mapType = round.mode === "quiz-hunt" ? "pillars" : "open";
  const gameKey = `${round.mode}-${roundIndex}-${retryKeyRef.current}`;

  const commonProps = {
    questions, mapType, goal: FULL_SET_GOAL, sound,
    reducedMotion: REDUCED_MOTION,
    onExit: onComplete,
    onRecord: handleRecord,
    hideEndOverlay: true,
  };

  return (
    <div className="lw-page arc-page">
      {/* Retry overlay — shown when last attempt was <100% */}
      {needsRetry && (
        <div className="lap-retry-overlay">
          <div className="lap-retry-card">
            <div className="lap-retry-icon">🎯</div>
            <h3 className="lap-retry-title">Almost there!</h3>
            <p className="lap-retry-msg">
              You scored <strong>{lastAccuracy}%</strong> — please reach{" "}
              <strong>100%</strong> to move on.
            </p>
            <button
              type="button"
              className="lw-btn lw-btn-primary"
              onClick={handleRetryAgain}
            >
              Try again →
            </button>
          </div>
        </div>
      )}

      {round.mode === "quiz-hunt"
        ? <QuizHuntGame    key={gameKey} {...commonProps} />
        : <SnakeBuilderGame key={gameKey} {...commonProps} />
      }
    </div>
  );
}
