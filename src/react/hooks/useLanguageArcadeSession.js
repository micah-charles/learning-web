/**
 * useLanguageArcadeSession.js
 *
 * Converts a progressive-language-lesson pack (vocabulary + sentenceBuilders)
 * into Arcade game questions, and tracks the 4-round completion sequence:
 *
 *   Round 1 — Quiz Hunt  (vocab words,     must win once)
 *   Round 2 — Quiz Hunt  (vocab words,     must win twice total)
 *   Round 3 — Snake      (sentence builder, must win once)
 *   Round 4 — Snake      (sentence builder, must win twice total)
 *
 * "Win" = complete the Full Set goal (all questions correct, within 3 hearts).
 * Losing all hearts restarts the same round.
 *
 * Reuses the exact same question adapter functions used by the standalone
 * Arcade mode — no new data schema.
 *
 * @param {object|null} pack - The progressive lesson pack (pack.vocabulary, pack.sentenceBuilders)
 * @param {string}      targetLang - e.g. "de" (from plState.targetLang)
 * @param {object}      SPEECH_LANG_MAP - { de: "de-DE", fr: "fr-FR", … }
 */
import { useMemo, useState } from "react";
import { buildQuizHuntQuestions, buildSnakeBuilderQuestions } from "../games/arcade/utils/gameQuestionAdapter.js";
import { SPEECH_LANG_MAP } from "@/progressive-language-lesson.js";

// Each entry: { mode, label, winsNeeded }
const SEQUENCE = [
  { mode: "quiz-hunt",     label: "Quiz Hunt — round 1 / 2",  winsNeeded: 1 },
  { mode: "quiz-hunt",     label: "Quiz Hunt — round 2 / 2",  winsNeeded: 2 },
  { mode: "snake-builder", label: "Sentence Snake — round 1 / 2", winsNeeded: 1 },
  { mode: "snake-builder", label: "Sentence Snake — round 2 / 2", winsNeeded: 2 },
];

export function useLanguageArcadeSession(pack, targetLang) {
  const [roundIndex, setRoundIndex] = useState(0); // 0-3
  const [wins, setWins]             = useState({ "quiz-hunt": 0, "snake-builder": 0 });
  const [done, setDone]             = useState(false);

  // Convert pack vocabulary into Quiz Hunt questions.
  // PL pack vocabulary shape: v.translations[lang] = { text, article }
  // direction "prompt-en": show English definition, collect target-language word.
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
        de: tgtText,   // answer: the target-language word (used by answerKey "de")
        en: engText,   // prompt: English meaning  (used by promptKey "en")
        topic: v.conceptId || v.semanticCategory || "",
        tags: [],
      };
    });
    return buildQuizHuntQuestions(words, { direction: "prompt-en", speechLanguage });
  }, [pack, targetLang]);

  // Convert pack sentenceBuilders into Snake questions.
  // PL pack builder shape: s.translations[lang] = { text, tiles: [...] }
  const snakeQuestions = useMemo(() => {
    if (!pack?.sentenceBuilders?.length) return [];
    const speechLanguage = SPEECH_LANG_MAP?.[targetLang] || "de-DE";
    const cards = pack.sentenceBuilders.map((s, i) => {
      const tgtTrans = s.translations?.[targetLang];
      const engTrans = s.translations?.en;
      const answer = (typeof tgtTrans === "object" ? tgtTrans?.text : tgtTrans) || "";
      const prompt  = (typeof engTrans  === "object" ? engTrans?.text  : engTrans)  || "";
      // Tiles live at s.translations[lang].tiles; fall back to splitting the sentence.
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

  // Called when the current Arcade round ends.
  function onRoundEnd(result) {
    const won = result?.correct > 0 && result?.lives > 0; // completed the Full Set without losing all hearts
    if (!won) {
      // Lost all hearts — restart the same round (don't advance).
      return;
    }

    const mode = round.mode;
    const newWins = { ...wins, [mode]: wins[mode] + 1 };
    setWins(newWins);

    const nextRoundIndex = roundIndex + 1;
    if (nextRoundIndex >= SEQUENCE.length) {
      setDone(true);
    } else {
      setRoundIndex(nextRoundIndex);
    }
  }

  function restart() {
    setRoundIndex(0);
    setWins({ "quiz-hunt": 0, "snake-builder": 0 });
    setDone(false);
  }

  return {
    round,          // { mode, label, winsNeeded }
    roundIndex,     // 0-3
    totalRounds: SEQUENCE.length,
    questions,      // ready-to-use question objects for the current round
    hasContent,
    wins,           // { quiz-hunt: N, snake-builder: N }
    done,           // true when all 4 rounds won
    onRoundEnd,
    restart,
    SEQUENCE,
  };
}
