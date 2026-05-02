import { useState, useCallback, useMemo, useEffect } from "react";
import { isCorrectAnswer, calculateScore, getAccuracy } from "../utils/scoring.js";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initialBuildState(question) {
  if (!question) return null;

  if (question.type === "sequence") {
    return {
      selectedIndex: null,
      userOrder: [...(question.shuffledOrder || question.options || [])],
    };
  }

  if (question.type === "sort") {
    return {
      selectedItemIndex: null,
      selectedCategoryIndex: null,
      placedItems: [],
      unplacedItems: [...(question.sortItems || [])],
    };
  }

  return null;
}

export function useQuizEngine({
  questions: rawQuestions = [],
  mode = "mcq",
  count = 12,
  shuffleQ = true,
} = {}) {
  const questions = useMemo(() => {
    const all = shuffleQ ? shuffle(rawQuestions) : [...rawQuestions];
    return all.slice(0, count || Infinity);
  }, [rawQuestions, count, shuffleQ]);

  const [index, setIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [buildState, setBuildState] = useState(null);
  const [flipped, setFlipped] = useState(false);

  const currentQuestion = questions[index] || null;
  const totalQuestions = questions.length;
  const { score } = calculateScore(answers);

  useEffect(() => {
    setIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setAnswers([]);
    setIsFinished(false);
    setBuildState(initialBuildState(questions[0] || null));
    setFlipped(false);
  }, [questions, mode]);

  const answerQuestion = useCallback(
    (selected) => {
      if (!currentQuestion || showFeedback) return;
      setSelectedAnswer(selected);

      const correct = currentQuestion.acceptedAnswers?.length
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

    const nextIndex = index + 1;
    setShowFeedback(false);
    setSelectedAnswer(null);
    setFlipped(false);

    if (nextIndex >= totalQuestions) {
      setIsFinished(true);
      setBuildState(null);
    } else {
      setIndex(nextIndex);
      setBuildState(initialBuildState(questions[nextIndex] || null));
    }
  }, [currentQuestion, index, questions, totalQuestions]);

  const resetQuiz = useCallback(() => {
    setIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setAnswers([]);
    setIsFinished(false);
    setBuildState(initialBuildState(questions[0] || null));
    setFlipped(false);
  }, [questions]);

  const selectSequenceIndex = useCallback(
    (seqIdx) => {
      if (!currentQuestion) return;

      setBuildState((prev) => {
        const state = prev || initialBuildState(currentQuestion);
        const { selectedIndex, userOrder } = state;

        if (selectedIndex === null) {
          return { ...state, selectedIndex: seqIdx };
        }

        if (selectedIndex === seqIdx) {
          return { ...state, selectedIndex: null };
        }

        const next = [...userOrder];
        [next[selectedIndex], next[seqIdx]] = [next[seqIdx], next[selectedIndex]];
        return { ...state, selectedIndex: null, userOrder: next };
      });
    },
    [currentQuestion]
  );

  const shuffleSequence = useCallback(() => {
    if (!currentQuestion?.shuffledOrder) return;
    setBuildState({
      selectedIndex: null,
      userOrder: shuffle(currentQuestion.shuffledOrder),
    });
  }, [currentQuestion]);

  const checkSequenceAnswer = useCallback(
    (userOrder) => {
      const selected = (userOrder || []).join(" | ");
      answerQuestion(selected);
      return selected === (currentQuestion?.correctOrder || []).join(" | ");
    },
    [answerQuestion, currentQuestion]
  );

  const selectSortItem = useCallback((itemIndex) => {
    setBuildState((prev) => ({
      ...(prev || {}),
      selectedItemIndex: itemIndex,
      selectedCategoryIndex: null,
    }));
  }, []);

  const placeSortItem = useCallback(
    (categoryIndex) => {
      if (!currentQuestion) return;

      setBuildState((prev) => {
        const state = prev || initialBuildState(currentQuestion);
        if (state.selectedItemIndex === null) return state;

        const item = state.unplacedItems[state.selectedItemIndex];
        if (!item) return state;

        const placed = {
          text: item.text || String(item),
          categoryIndex,
          category: (currentQuestion.sortCategories || [])[categoryIndex] || "",
        };

        return {
          selectedItemIndex: null,
          selectedCategoryIndex: null,
          placedItems: [...state.placedItems, placed],
          unplacedItems: state.unplacedItems.filter((candidate) => candidate !== item),
        };
      });
    },
    [currentQuestion]
  );

  const removeSortItem = useCallback(
    (placedIndex) => {
      if (!currentQuestion) return;

      setBuildState((prev) => {
        const state = prev || initialBuildState(currentQuestion);
        const removed = state.placedItems[placedIndex];
        if (!removed) return state;

        const originalItem = (currentQuestion.sortItems || []).find(
          (item) => (item.text || String(item)) === removed.text
        );

        return {
          ...state,
          placedItems: state.placedItems.filter((_, i) => i !== placedIndex),
          unplacedItems: originalItem ? [...state.unplacedItems, originalItem] : state.unplacedItems,
        };
      });
    },
    [currentQuestion]
  );

  const resetSort = useCallback(() => {
    setBuildState(initialBuildState(currentQuestion));
  }, [currentQuestion]);

  const checkSortAnswer = useCallback(
    (placedItems) => {
      const correct =
        placedItems?.length === (currentQuestion?.sortItems || []).length &&
        placedItems.every((placed) => {
          const raw = (currentQuestion?.sortItems || []).find(
            (item) => (item.text || String(item)) === placed.text
          );
          return raw && (raw.category || "") === (placed.category || "");
        });

      answerQuestion((placedItems || []).map((p) => `${p.text}|${p.category}`).join(" || "));
      return correct;
    },
    [answerQuestion, currentQuestion]
  );

  const flipCard = useCallback(() => {
    setFlipped((value) => !value);
    setShowFeedback(false);
  }, []);

  const markFlashcardKnown = useCallback(
    (known) => {
      if (!currentQuestion) return;
      answerQuestion(known ? currentQuestion.correctAnswer : "__skip__");
    },
    [answerQuestion, currentQuestion]
  );

  return {
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
    answerQuestion,
    nextQuestion,
    resetQuiz,
    selectSequenceIndex,
    shuffleSequence,
    checkSequenceAnswer,
    selectSortItem,
    placeSortItem,
    removeSortItem,
    resetSort,
    checkSortAnswer,
    flipCard,
    markFlashcardKnown,
  };
}
