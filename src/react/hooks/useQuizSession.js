import { useState, useCallback } from "react";
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

      setSession({ ...newSession });
    } catch (err) {
      setError(err.message || "Failed to start quiz");
    } finally {
      setLoading(false);
    }
  }, []);

  const answerQuestion = useCallback((response, { progress, updateProgress, extra = null } = {}) => {
    setSession(prev => {
      if (!prev || prev.awaitingNext) return prev;
      const question = prev.questions[prev.index];
      const result = gradeQuestion(question, response, extra);
      const newAnswers = [...prev.answers, {
        questionId: question.id, prompt: question.prompt,
        expected: question.answer, userAnswer: response,
        correct: result.correct, wordId: question.wordId,
      }];

      if (question.wordId && updateProgress) {
        updateProgress(state => { recordWordAnswer(state, question.wordId, result.correct); });
      }

      return {
        ...prev,
        awaitingNext: true,
        feedback: result,
        answers: newAnswers,
        score: result.correct ? prev.score + 1 : prev.score,
        missedWords: !result.correct && question.wordId
          ? [...(prev.missedWords || []), { id: question.wordId, de: question.speechText, en: question.answer }]
          : prev.missedWords,
      };
    });
  }, []);

  const nextQuestion = useCallback(({ updateProgress } = {}) => {
    setSession(prev => {
      if (!prev) return prev;
      const nextIndex = prev.index + 1;
      const completed = nextIndex >= prev.questions.length;
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
      return {
        ...prev,
        index: nextIndex,
        awaitingNext: false,
        feedback: null,
        buildState: nextQ ? makeInitialBuildState(nextQ) : null,
        completed,
      };
    });
  }, []);

  const updateBuildState = useCallback((updater) => {
    setSession(prev => prev ? { ...prev, buildState: updater(prev.buildState) } : prev);
  }, []);

  const resetQuiz = useCallback(() => setSession(null), []);

  return { session, loading, error, startQuiz, answerQuestion, nextQuestion, updateBuildState, resetQuiz };
}
