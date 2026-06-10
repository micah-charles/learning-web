/**
 * useLanguageArcadeSession.js
 *
 * Converts a progressive-language-lesson pack into Arcade game questions,
 * and tracks the 2-round completion sequence:
 *
 *   Round 1 — Quiz Hunt     (vocab words)
 *   Round 2 — Sentence Snake (sentence builders)
 *
 * Pass condition (Feature 3):
 *   - accuracy === 100 → advance to next round / mark done
 *   - accuracy < 100   → stay on same round, return { needsRetry: true }
 *     so LanguageArcadePhase can show a "Please retry" message.
 */
import { useMemo, useState } from "react";
import { buildQuizHuntQuestions, buildSnakeBuilderQuestions } from "../games/arcade/utils/gameQuestionAdapter.js";
import { SPEECH_LANG_MAP } from "@/progressive-language-lesson.js";

const SEQUENCE = [
  { mode: "quiz-hunt",     label: "Quiz Hunt"      },
  { mode: "snake-builder", label: "Sentence Snake" },
];

export function useLanguageArcadeSession(pack, targetLang) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [done, setDone]             = useState(false);
  const [needsRetry, setNeedsRetry] = useState(false);
  const [lastAccuracy, setLastAccuracy] = useState(null);

  const quizQuestions = useMemo(() => {
    if (!pack?.vocabulary?.length) return [];
    const speechLanguage = SPEECH_LANG_MAP?.[targetLang] || "de-DE";
    const words = pack.vocabulary.map((v, i) => {
      const tgt = v.translations?.[targetLang];
      const eng = v.translations?.en;
      const tgtText = (typeof tgt === "object" ? tgt?.text : tgt) || "";
      const engText = (typeof eng === "object" ? eng?.text : eng) || "";
      return {
        id: `pl_v_${i}`,
        de: tgtText,
        en: engText,
        topic: v.conceptId || v.semanticCategory || "",
        tags: [],
      };
    });
    return buildQuizHuntQuestions(words, { direction: "prompt-en", speechLanguage });
  }, [pack, targetLang]);

  const snakeQuestions = useMemo(() => {
    if (!pack?.sentenceBuilders?.length) return [];
    const speechLanguage = SPEECH_LANG_MAP?.[targetLang] || "de-DE";
    const cards = pack.sentenceBuilders.map((s, i) => {
      const tgtTrans = s.translations?.[targetLang];
      const engTrans = s.translations?.en;
      const answer = (typeof tgtTrans === "object" ? tgtTrans?.text : tgtTrans) || "";
      const prompt  = (typeof engTrans  === "object" ? engTrans?.text  : engTrans)  || "";
      const tilesRaw = tgtTrans?.tiles;
      const tiles = Array.isArray(tilesRaw) && tilesRaw.length > 1
        ? tilesRaw
        : answer.split(/\s+/).filter(Boolean);
      return { id: `pl_s_${i}`, prompt, answer, tiles };
    });
    return buildSnakeBuilderQuestions(cards, { speechLanguage });
  }, [pack, targetLang]);

  const round = SEQUENCE[roundIndex] ?? SEQUENCE[SEQUENCE.length - 1];
  const questions = round.mode === "quiz-hunt" ? quizQuestions : snakeQuestions;
  const hasContent = questions.length > 0;

  /**
   * Called when a round ends.
   * accuracy === 100 → advance; otherwise → set needsRetry so the UI can
   * show a "Please retry" message before the player tries again.
   */
  function onRoundEnd(result) {
    const accuracy = result?.accuracy ?? 0;
    setLastAccuracy(accuracy);

    if (accuracy < 100) {
      setNeedsRetry(true);
      return;
    }

    // 100% — clear any previous retry state and advance.
    setNeedsRetry(false);
    const nextIdx = roundIndex + 1;
    if (nextIdx >= SEQUENCE.length) {
      setDone(true);
    } else {
      setRoundIndex(nextIdx);
    }
  }

  /** Called when the player acknowledges the retry message and plays again. */
  function clearRetry() {
    setNeedsRetry(false);
  }

  function restart() {
    setRoundIndex(0);
    setDone(false);
    setNeedsRetry(false);
    setLastAccuracy(null);
  }

  return {
    round,
    roundIndex,
    totalRounds: SEQUENCE.length,
    questions,
    hasContent,
    done,
    needsRetry,   // true when last round ended with accuracy < 100%
    lastAccuracy, // the accuracy value from the last round attempt
    onRoundEnd,
    clearRetry,
    restart,
  };
}
