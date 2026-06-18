/**
 * useLanguageArcadeSession.js
 *
 * Converts a progressive-language-lesson pack into Arcade game questions,
 * and tracks the Language Ladder arcade sequence.
 *
 * Language Ladder runs Quiz Hunt, then Sentence Snake. Each round starts with
 * every playable item once; a correction pass remounts with only the missed
 * item ids until the learner clears that round.
 */
import { useMemo, useState } from "react";
import { buildQuizHuntQuestions, buildSnakeBuilderQuestions } from "../games/arcade/utils/gameQuestionAdapter.js";
import { SPEECH_LANG_MAP } from "@/progressive-language-lesson.js";

export const FULL_LANGUAGE_ARCADE_SEQUENCE = [
  { mode: "quiz-hunt",     label: "Quiz Hunt"      },
  { mode: "snake-builder", label: "Sentence Snake" },
];

export const LANGUAGE_LADDER_ARCADE_SEQUENCE = FULL_LANGUAGE_ARCADE_SEQUENCE;

function uniqueIds(ids) {
  return [...new Set((ids || []).map((id) => String(id || "").trim()).filter(Boolean))];
}

export function resolveLanguageArcadeRoundState(previousState, result, sequence = LANGUAGE_LADDER_ARCADE_SEQUENCE) {
  const accuracy = result?.accuracy ?? 0;
  const missedItemIds = uniqueIds(result?.missedItemIds || result?.missedQuestionIds);
  const nextState = {
    ...previousState,
    lastAccuracy: accuracy,
  };

  if (missedItemIds.length || accuracy < 100) {
    return {
      ...nextState,
      retryItemIds: missedItemIds,
      retryNonce: (previousState?.retryNonce || 0) + 1,
      done: false,
    };
  }

  const nextIdx = (previousState?.roundIndex || 0) + 1;
  if (nextIdx >= sequence.length) {
    return {
      ...nextState,
      retryItemIds: [],
      done: true,
    };
  }

  return {
    ...nextState,
    retryItemIds: [],
    roundIndex: nextIdx,
  };
}

export function useLanguageArcadeSession(pack, targetLang) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [done, setDone]             = useState(false);
  const [lastAccuracy, setLastAccuracy] = useState(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [retryItemIds, setRetryItemIds] = useState([]);

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
  const allRoundQuestions = round.mode === "quiz-hunt" ? quizQuestions : snakeQuestions;
  const questions = useMemo(() => {
    if (!retryItemIds.length) return allRoundQuestions;
    const retryIds = new Set(retryItemIds);
    const retryQuestions = allRoundQuestions.filter((question) => retryIds.has(question.wordId || question.itemId || question.id));
    return retryQuestions.length ? retryQuestions : allRoundQuestions;
  }, [allRoundQuestions, retryItemIds]);
  const hasContent = questions.length > 0;

  function onRoundEnd(result) {
    const next = resolveLanguageArcadeRoundState(
      { roundIndex, done, lastAccuracy, retryNonce, retryItemIds },
      result,
      LANGUAGE_LADDER_ARCADE_SEQUENCE,
    );
    setLastAccuracy(next.lastAccuracy);
    setRetryNonce(next.retryNonce || 0);
    setRetryItemIds(next.retryItemIds || []);
    setDone(!!next.done);
    setRoundIndex(next.roundIndex || 0);
  }

  function restart() {
    setRoundIndex(0);
    setDone(false);
    setLastAccuracy(null);
    setRetryNonce(0);
    setRetryItemIds([]);
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
