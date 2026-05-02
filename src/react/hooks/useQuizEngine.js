/**
 * useQuizEngine.js
 *
 * Reusable hook for quiz behaviour. Works with any question type that
 * has been normalised via packAdapters.js.
 *
 * Usage:
 *   const engine = useQuizEngine({ questions, mode: "mcq", count: 12 });
 *   // then use: engine.currentQuestion, engine.answerQuestion, etc.
 */

import { useState, useCallback, useMemo } from "react";
import { isCorrectAnswer, calculateScore, getAccuracy } from "../utils/scoring.js";

// ─── Helpers ────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Apply distractor injection for gap/choice questions.
 * Adds shuffled options if the question has none.
 */
function withDistractors(questions, distractorCount = 3) {
  return questions.map((q) => {
    if (q.options && q.options.length >= 2) return q;
    // Collect distractors from other questions of same type
    const pool = questions
      .filter((o) => o.id !== q.id && o.correctAnswer)
      .slice(0, distractorCount * 2)
      .map((o) => o.correctAnswer)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .slice(0, distractorCount);
    return { ...q, options: shuffle([q.correctAnswer, ...pool]) };
  });
}

// ─── Main hook ────────────────────────────────────────────────────

/**
 * @typedef {Object} UseQuizEngineOptions
 * @property {Array}    questions     - array of common-shape questions (from packAdapters)
 * @property {string}   [mode]        - "mcq"|"typing"|"flashcard"|"sequence"|"sort"|"gap"
 * @property {number}  [count]       - max questions (default: all)
 * @property {boolean} [shuffleQ]    - shuffle questions (default: true)
 */

/**
 * @returns {object} quiz engine state and actions
 */
export function useQuizEngine({ questions: rawQuestions = [], mode = "mcq", count = 12, shuffleQ = true } = {}) {
  // Questions are already normalised by usePackLoader; just shuffle and cap
  const questions = useMemo(() => {
    const all = shuffleQ ? shuffle(rawQuestions) : rawQuestions;
    return all.slice(0, count || Infinity);
  }, [rawQuestions, count, shuffleQ]);

  // State
  const [index, setIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  // For sequence/sort: custom user state per question
  const [buildState, setBuildState] = useState(null);
  // For flashcard flip
  const [flipped, setFlipped] = useState(false);

  const currentQuestion = questions[index] || null;
  const totalQuestions = questions.length;
  const { score, total } = calculateScore(answers);

  // ─── Actions ─────────────────────────────────────────────────────

  const answerQuestion = useCallback(
    (selected) => {
      if (!currentQuestion || showFeedback) return;
      setSelectedAnswer(selected);

      const correct =
        currentQuestion.acceptedAnswers?.length
          ? selected
              ? isCorrectAnswer(selected, currentQuestion.acceptedAnswers)
              : false
          : isCorrectAnswer(selected, currentQuestion.correctAnswer);

      setAnswers((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          question: currentQuestion.question,
          selected,
          correctAnswer: currentQuestion.correctAnswer,
          isCorrect: correct,
          type: currentQuestion.type,
          speechText: currentQuestion.speechText,
          wordId: currentQuestion.wordId,
          modeId: currentQuestion.modeId,
        },
      ]);
      setShowFeedback(true);
    },
    [currentQuestion, showFeedback]
  );

  const nextQuestion = useCallback(() => {
    if (!currentQuestion) return;
    setShowFeedback(false);
    setSelectedAnswer(null);
    setFlipped(false);

    // For sequence/sort: initialise buildState on new question
    if (currentQuestion.type === "sequence") {
      setBuildState({ selectedIndex: null, userOrder: [...currentQuestion.shuffledOrder] });
    } else if (currentQuestion.type === "sort") {
      setBuildState({
        selectedItemIndex: null,
        placedItems: [],
        unplacedItems: [...(currentQuestion.sortItems || [])],
      });
    } else {
      setBuildState(null);
    }

    if (index + 1 >= totalQuestions) {
      setIsFinished(true);
    } else {
      setIndex((i) => i + 1);
    }
  }, [currentQuestion, index, totalQuestions]);

  const resetQuiz = useCallback(() => {
    setIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setAnswers([]);
    setIsFinished(false);
    setBuildState(null);
    setFlipped(false);
  }, []);

  // ─── Sequence helpers ──────────────────────────────────────────

  const selectSequenceIndex = useCallback(
    (seqIdx) => {
      if (!buildState) {
        setBuildState({ selectedIndex: seqIdx, userOrder: currentQuestion?.shuffledOrder || [] });
        return;
      }
      const { selectedIndex, userOrder } = buildState;
      if (selectedIndex === null) {
        setBuildState({ ...buildState, selectedIndex: seqIdx });
      } else if (selectedIndex === seqIdx) {
        setBuildState({ ...buildState, selectedIndex: null });
      } else {
        // Swap
        const next = [...userOrder];
        [next[selectedIndex], next[seqIdx]] = [next[seqIdx], next[selectedIndex]];
        setBuildState({ selectedIndex: null, userOrder: next });
      }
    },
    [buildState, currentQuestion]
  );

  const shuffleSequence = useCallback(() => {
    if (!currentQuestion?.shuffledOrder) return;
    setBuildState({
      selectedIndex: null,
      userOrder: shuffle([...currentQuestion.shuffledOrder]),
    });
  }, [currentQuestion]);

  const checkSequenceAnswer = useCallback(
    (userOrder) => {
      const correct = currentQuestion?.correctOrder
        ? userOrder.join(" | ") === currentQuestion.correctOrder.join(" | ")
        : false;
      answerQuestion(userOrder.join(" | "));
      return correct;
    },
    [currentQuestion, answerQuestion]
  );

  // ─── Sort helpers ───────────────────────────────────────────────

  const selectSortItem = useCallback(
    (itemIndex) => {
      setBuildState((prev) => ({
        ...prev,
        selectedItemIndex: itemIndex,
        selectedCategoryIndex: null,
      }));
    },
    []
  );

  const placeSortItem = useCallback(
    (categoryIndex) => {
      if (!buildState || buildState.selectedItemIndex === null) return;
      const { selectedItemIndex, unplacedItems, placedItems } = buildState;
      const rawItems = currentQuestion?.sortItems || [];
      const item = rawItems[selectedItemIndex];
      if (!item) return;
      const itemText = item.text || String(item);
      const placed = {
        text: itemText,
        categoryIndex,
        category: (currentQuestion?.sortCategories || [])[categoryIndex] || "",
      };
      setBuildState({
        selectedItemIndex: null,
        selectedCategoryIndex: null,
        placedItems: [...placedItems, placed],
        unplacedItems: unplacedItems.filter(
          (_, i) => rawItems.indexOf(rawItems[i]) !== selectedItemIndex
        ),
      });
    },
    [buildState, currentQuestion]
  );

  const removeSortItem = useCallback(
    (placedIndex) => {
      setBuildState((prev) => {
        const removed = prev.placedItems[placedIndex];
        if (!removed) return prev;
        const rawItems = currentQuestion?.sortItems || [];
        const originalItem = rawItems.find(
          (i) => (i.text || String(i)) === removed.text
        );
        return {
          ...prev,
          placedItems: prev.placedItems.filter((_, i) => i !== placedIndex),
          unplacedItems: originalItem
            ? [...prev.unplacedItems, originalItem]
            : prev.unplacedItems,
        };
      });
    },
    [currentQuestion]
  );

  const resetSort = useCallback(() => {
    if (!currentQuestion?.sortItems) return;
    setBuildState({
      selectedItemIndex: null,
      placedItems: [],
      unplacedItems: [...currentQuestion.sortItems],
    });
  }, [currentQuestion]);

  const checkSortAnswer = useCallback(
    (placedItems) => {
      const correct =
        placedItems?.every((p) => {
          const raw = (currentQuestion?.sortItems || []).find(
            (i) => (i.text || String(i)) === p.text
          );
          return raw && (raw.category || "") === (p.category || "");
        }) && placedItems.length === (currentQuestion?.sortItems || []).length;
      answerQuestion(
        placedItems.map((p) => `${p.text}|${p.category}`).join(" || ")
      );
      return correct;
    },
    [currentQuestion, answerQuestion]
  );

  // ─── Flashcard helpers ──────────────────────────────────────────

  const flipCard = useCallback(() => {
    setFlipped((f) => !f);
    setShowFeedback(false);
  }, []);

  const markFlashcardKnown = useCallback(
    (known) => {
      if (!currentQuestion) return;
      answerQuestion(known ? currentQuestion.correctAnswer : "__skip__");
    },
    [currentQuestion, answerQuestion]
  );

  // ─── Return ────────────────────────────────────────────────────

  return {
    // State
    currentQuestion,
    currentQuestionIndex: index,
    totalQuestions,
    selectedAnswer,
    showFeedback,
    score,
    answers,
    isFinished,
    accuracy: getAccuracy(answers),
    buildState,
    flipped,
    // Actions
    answerQuestion,
    nextQuestion,
    resetQuiz,
    // Sequence
    selectSequenceIndex,
    shuffleSequence,
    checkSequenceAnswer,
    // Sort
    selectSortItem,
    placeSortItem,
    removeSortItem,
    resetSort,
    checkSortAnswer,
    // Flashcard
    flipCard,
    markFlashcardKnown,
  };
}