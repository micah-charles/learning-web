/**
 * useLanguageArcadeSession.js
 *
 * Converts a progressive-language-lesson pack into Arcade game questions,
 * and tracks the Language Ladder arcade sequence.
 *
 * We keep the full two-round sequence exported for future reuse, but the
 * current Language Ladder flow uses only the first round (Quiz Hunt). If the
 * learner scores below 100%, the same round remounts immediately and repeats
 * until they clear it perfectly.
 */
import { useMemo, useState } from "react";
import { buildQuizHuntQuestions, buildSnakeBuilderQuestions } from "../games/arcade/utils/gameQuestionAdapter.js";
import { SPEECH_LANG_MAP } from "@/progressive-language-lesson.js";

export const FULL_LANGUAGE_ARCADE_SEQUENCE = [
  { mode: "quiz-hunt",     label: "Quiz Hunt"      },
  { mode: "snake-builder", label: "Sentence Snake" },
];

export const LANGUAGE_LADDER_ARCADE_SEQUENCE = [FULL_LANGUAGE_ARCADE_SEQUENCE[0]];

export function resolveLanguageArcadeRoundState(previousState, result, sequence = LANGUAGE_LADDER_ARCADE_SEQUENCE) {
  const accuracy = result?.accuracy ?? 0;
  const nextState = {
    ...previousState,
    lastAccuracy: accuracy,
  };

  if (accuracy < 100) {
    return {
      ...nextState,
      retryNonce: (previousState?.retryNonce || 0) + 1,
      done: false,
    };
  }

  const nextIdx = (previousState?.roundIndex || 0) + 1;
  if (nextIdx >= sequence.length) {
    return {
      ...nextState,
      done: true,
    };
  }

  return {
    ...nextState,
    roundIndex: nextIdx,
  };
}

export function useLanguageArcadeSession(pack, targetLang) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [done, setDone]             = useState(false);
  const [lastAccuracy, setLastAccuracy] = useState(null);
  const [retryNonce, setRetryNonce] = useState(0);

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

  const round = LANGUAGE_LADDER_ARCADE_SEQUENCE[roundIndex]
    ?? LANGUAGE_LADDER_ARCADE_SEQUENCE[LANGUAGE_LADDER_ARCADE_SEQUENCE.length - 1];
  const questions = round.mode === "quiz-hunt" ? quizQuestions : snakeQuestions;
  const hasContent = questions.length > 0;

  function onRoundEnd(result) {
    const next = resolveLanguageArcadeRoundState(
      { roundIndex, done, lastAccuracy, retryNonce },
      result,
      LANGUAGE_LADDER_ARCADE_SEQUENCE,
    );
    setLastAccuracy(next.lastAccuracy);
    setRetryNonce(next.retryNonce || 0);
    setDone(!!next.done);
    setRoundIndex(next.roundIndex || 0);
  }

  function restart() {
    setRoundIndex(0);
    setDone(false);
    setLastAccuracy(null);
    setRetryNonce(0);
  }

  return {
    round,
    roundIndex,
    totalRounds: LANGUAGE_LADDER_ARCADE_SEQUENCE.length,
    questions,
    hasContent,
    done,
    lastAccuracy, // the accuracy value from the last round attempt
    retryNonce,
    onRoundEnd,
    restart,
  };
}
