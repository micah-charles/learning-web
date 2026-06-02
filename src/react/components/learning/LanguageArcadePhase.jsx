/**
 * LanguageArcadePhase.jsx
 *
 * Runs the 4-round Arcade challenge seamlessly between rounds:
 *   🦊 Quiz Hunt × 2  →  🐍 Sentence Snake × 2
 *
 * No round-list, no Skip button, no "Round complete!" overlay — rounds flow
 * automatically. When all 4 are won, onComplete() fires immediately.
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
    done, onRoundEnd,
  } = useLanguageArcadeSession(pack, targetLang);

  // Sound
  const mutedRef         = useRef(!prefs?.sound);
  mutedRef.current       = !prefs?.sound;
  const speechEnabledRef = useRef(!!prefs?.speech);
  speechEnabledRef.current = !!prefs?.speech;
  const audio = useArcadeSound(mutedRef, speechEnabledRef);
  const sound = useMemo(() => ({
    play: audio.play, speakWord: audio.speakWord, stop: audio.stop,
    muted: !prefs?.sound, speech: !!prefs?.speech,
    toggleMute: () => {}, toggleSpeech: () => {},
  }), [audio, prefs?.sound, prefs?.speech]);

  // When all 4 rounds are won → proceed to lesson review immediately.
  useEffect(() => { if (done) onComplete(); }, [done, onComplete]);

  // Progress recording
  function handleRecord(kind, payload) {
    if (kind === "answer" && payload?.wordId && updateProgress) {
      updateProgress((state) => recordWordAnswer(state, payload.wordId, !!payload.correct));
    } else if (kind === "over" && payload && updateProgress) {
      updateProgress((state) => recordArcadeResult(state, `ladder-${round.mode}`, payload));
      onRoundEnd(payload);
    }
  }

  if (!pack) return null;

  // No content for this round — skip it automatically.
  if (!hasContent) {
    onRoundEnd({ correct: 1, lives: 1 }); // advance without penalty
    return null;
  }

  const mapType = round.mode === "quiz-hunt" ? "pillars" : "open";
  const commonProps = {
    questions, mapType, goal: FULL_SET_GOAL, sound,
    reducedMotion: REDUCED_MOTION,
    onExit: onComplete,      // only reachable via pause → exit (escape hatch)
    onRecord: handleRecord,
    hideEndOverlay: true,    // no "Round complete!" card — rounds flow seamlessly
  };

  return (
    <div className="lw-page arc-page">
      {round.mode === "quiz-hunt"
        ? <QuizHuntGame    key={`qh-${roundIndex}`} {...commonProps} />
        : <SnakeBuilderGame key={`sb-${roundIndex}`} {...commonProps} />
      }
    </div>
  );
}
