/**
 * LanguageArcadePhase.jsx
 *
 * Runs the current Language Ladder arcade challenge.
 *
 * Each arcade game starts with every playable item once. If anything is missed,
 * the same game remounts with only those missed items until that round is clear.
 */
import { useRef, useMemo, useEffect } from "react";
import { useLanguageArcadeSession } from "../../hooks/useLanguageArcadeSession.js";
import { useArcadeSound } from "../../games/arcade/hooks/useArcadeSound.js";
import QuizHuntGame from "../../games/arcade/QuizHuntGame.jsx";
import SnakeBuilderGame from "../../games/arcade/SnakeBuilderGame.jsx";
import { recordWordAnswer, recordArcadeResult } from "@/storage.js";

const FULL_SET_GOAL = { mode: "fullset", target: 0, retryWrongInRound: false };
const REDUCED_MOTION =
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

export default function LanguageArcadePhase({ pack, targetLang, prefs, updateProgress, onComplete }) {
  const {
    round, roundIndex,
    questions, hasContent,
    done, retryNonce,
    onRoundEnd,
  } = useLanguageArcadeSession(pack, targetLang);
  const missedItemIdsRef = useRef(new Set());

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

  useEffect(() => {
    missedItemIdsRef.current = new Set();
  }, [round.mode, roundIndex, retryNonce]);

  // All rounds passed → notify parent (which marks lesson complete + advances).
  useEffect(() => { if (done) onComplete(); }, [done, onComplete]);

  function markMissIfNeeded(payload) {
    if (payload?.correct) return;
    const itemId = payload?.wordId || payload?.itemId || payload?.questionId;
    if (itemId) missedItemIdsRef.current.add(itemId);
  }

  function handleRecord(kind, payload) {
    if (kind === "answer" && payload?.wordId && updateProgress) {
      markMissIfNeeded(payload);
      updateProgress((state) => recordWordAnswer(state, payload.wordId, !!payload.correct));
    } else if (kind === "builderComplete") {
      markMissIfNeeded(payload);
    } else if (kind === "over" && payload && updateProgress) {
      const result = {
        ...payload,
        missedItemIds: [...missedItemIdsRef.current],
      };
      updateProgress((state) => recordArcadeResult(state, `ladder-${round.mode}`, result));
      onRoundEnd(result);
    }
  }

  if (!pack) return null;

  // Auto-skip rounds with no content.
  if (!hasContent) {
    onRoundEnd({ accuracy: 100, correct: 1, lives: 3 });
    return null;
  }

  const mapType = round.mode === "quiz-hunt" ? "pillars" : "open";
  const gameKey = `${round.mode}-${roundIndex}-${retryNonce}`;

  const commonProps = {
    questions, mapType, goal: FULL_SET_GOAL, sound,
    reducedMotion: REDUCED_MOTION,
    onExit: onComplete,
    onRecord: handleRecord,
    hideEndOverlay: true,
  };

  return (
    <div className="lw-page arc-page" data-testid="progressive-phase-arcade">
      {round.mode === "quiz-hunt"
        ? <QuizHuntGame    key={gameKey} {...commonProps} />
        : <SnakeBuilderGame key={gameKey} {...commonProps} />
      }
    </div>
  );
}
