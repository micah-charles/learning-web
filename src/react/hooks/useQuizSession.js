import { useState, useCallback, useRef } from "react";
import {
  createQuizSession, gradeQuestion, makeBuildState,
  resolveQuizModesForUI, getDefaultQuestionModes
} from "@/quiz.js";
import {
  loadVocabItems, loadSentencePools, loadUnifiedPack, findDataset,
  loadSequenceItems, loadCategorySortItems, loadFillBlankItems,
  getDatasetSubject
} from "@/data.js";
import {
  recordWordAnswer, recordQuizSession
} from "@/storage.js";
import { recordAttempt } from "@/progress.js";
import { filterWordsForScope, getSelectedStages, describeScope } from "@/quiz-helpers.js";
import { shuffle } from "@/utils.js";

function makeInitialBuildState(question) {
  if (!question) return null;
  if (question.kind === "build") return makeBuildState(question);
  if (question.kind === "sequence") return { selectedIndex: null, userOrder: [...(question.shuffledOrder || [])] };
  if (question.kind === "sort") return { selectedItemIndex: null, placedItems: [], unplacedItems: [...(question.items || [])] };
  return null;
}

export function useQuizSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Canonical session ref — always up-to-date, used by callbacks to avoid
  // reading stale closure values and to keep side effects OUT of React state
  // updater functions (which React 18 StrictMode calls twice in dev mode).
  const sessionRef = useRef(null);

  const startQuiz = useCallback(async ({ manifest, dataset, prefs, progress, customWords = null, label = null }) => {
    setLoading(true);
    setError(null);
    try {
      const allWords = await loadVocabItems(manifest, dataset.id);
      const words = filterWordsForScope(allWords, dataset, prefs);
      const sentencePools = await loadSentencePools(manifest, dataset.id);
      const sequenceItems = await loadSequenceItems(manifest, dataset.id).catch(() => []);
      const categorySortItems = await loadCategorySortItems(manifest, dataset.id).catch(() => []);
      const fillBlankItems = await loadFillBlankItems(manifest, dataset.id).catch(() => []);
      const unifiedPack = await loadUnifiedPack(manifest, dataset.id).catch(() => null);

      const resolvedModes = resolveQuizModesForUI({
        subject: getDatasetSubject(dataset),
        direction: prefs.direction || "studyToTarget",
        answerMode: prefs.answerMode || "mixed",
      });

      const newSession = createQuizSession({
        words,
        sentencePools,
        config: { ...prefs, modes: resolvedModes },
        persistedState: progress,
        customWords,
        label: label || dataset.displayName,
        dataset,
        sequenceItems,
        categorySortItems,
        fillBlankItems,
        unifiedPack,
      });

      newSession.sourceWords = customWords || words;
      newSession.missedWords = [];
      newSession.config.scopeLabel = describeScope(dataset, prefs);
      newSession.config.stages = getSelectedStages(prefs, dataset);

      const firstQ = newSession.questions[0];
      newSession.buildState = firstQ ? makeInitialBuildState(firstQ) : null;

      const snap = { ...newSession };
      sessionRef.current = snap;
      setSession(snap);
    } catch (err) {
      setError(err.message || "Failed to start quiz");
    } finally {
      setLoading(false);
    }
  }, []);

  const answerQuestion = useCallback((response, { progress, updateProgress, extra = null } = {}) => {
    // Read current session from ref (not from inside a state updater) so that
    // React 18 StrictMode's double-invocation of updater functions does NOT
    // cause recordAttempt / recordWordAnswer to fire twice per answer.
    const prev = sessionRef.current;
    if (!prev || prev.awaitingNext) return;

    const question = prev.questions[prev.index];
    const result = gradeQuestion(question, response, extra);
    const newAnswers = [...prev.answers, {
      questionId: question.id, prompt: question.prompt,
      expected: question.answer, userAnswer: response,
      correct: result.correct, wordId: question.wordId,
    }];

    const newSession = {
      ...prev,
      awaitingNext: true,
      feedback: result,
      answers: newAnswers,
      score: result.correct ? prev.score + 1 : prev.score,
      missedWords: !result.correct && question.wordId
        ? [...(prev.missedWords || []), { id: question.wordId, de: question.speechText, en: question.answer }]
        : prev.missedWords,
    };

    // Update ref first so re-entrant calls see awaitingNext immediately.
    sessionRef.current = newSession;
    setSession(newSession);

    // Progress recording is done OUTSIDE setSession to avoid StrictMode
    // double-invocation. Each updateProgress call enqueues exactly one
    // setState in ProgressContext; its internal updater starting from a
    // fresh structuredClone(prev) is harmless when doubled by StrictMode.
    if (updateProgress) {
      updateProgress(state => {
        // Word-level mastery tracking (streak, correct/wrong counts)
        if (question.wordId) {
          recordWordAnswer(state, question.wordId, result.correct);
        }
        // Per-question event for Recent Learning Activity chart.
        // recordAttempt writes to state.progress.attemptEvents which
        // getRecentActivity reads first (preferred over sessions fallback).
        recordAttempt(state, {
          sessionId:      prev.id || "",
          packId:         prev.config?.datasetId || "",
          packTitle:      prev.label || "",
          itemId:         question.wordId || question.id || "",
          questionText:   question.prompt || "",
          expectedAnswer: question.answer || "",
          selectedAnswer: Array.isArray(response) ? response.join(" ") : String(response ?? ""),
          correct:        result.correct,
          modeId:         question.modeId || question.kind || "",
        });
      });
    }
  }, []);

  const nextQuestion = useCallback(({ updateProgress } = {}) => {
    const prev = sessionRef.current;
    if (!prev) return;

    const nextIndex = prev.index + 1;
    const completed = nextIndex >= prev.questions.length;

    // Record session completion OUTSIDE the state updater for the same
    // StrictMode reason — one call here, one setState enqueued.
    if (completed && updateProgress) {
      updateProgress(state => {
        recordQuizSession(state, {
          id:             prev.id,
          label:          prev.label,
          datasetId:      prev.config?.datasetId,
          score:          prev.score,
          totalQuestions: prev.questions.length,
          scopeLabel:     prev.config?.scopeLabel,
          // timestamp is required by getRecentActivity's session fallback:
          // toDateKey(session.timestamp) → day bucket.  Without it every
          // session is silently skipped and Recent Activity shows empty.
          timestamp:      new Date().toISOString(),
        });
      });
    }

    const nextQ = !completed ? prev.questions[nextIndex] : null;
    const newSession = {
      ...prev,
      index: nextIndex,
      awaitingNext: false,
      feedback: null,
      buildState: nextQ ? makeInitialBuildState(nextQ) : null,
      completed,
    };

    sessionRef.current = newSession;
    setSession(newSession);
  }, []);

  const updateBuildState = useCallback((updater) => {
    setSession(prev => {
      if (!prev) return prev;
      const next = { ...prev, buildState: updater(prev.buildState) };
      sessionRef.current = next;
      return next;
    });
  }, []);

  const resetQuiz = useCallback(() => {
    sessionRef.current = null;
    setSession(null);
  }, []);

  return { session, loading, error, startQuiz, answerQuestion, nextQuestion, updateBuildState, resetQuiz };
}
