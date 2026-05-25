import { useState, useEffect, useCallback } from "react";
import { loadPassagePack } from "@/data.js";
import { recordPassageCompletion } from "@/storage.js";
import { shuffle, normalizeForCompare } from "@/utils.js";

function shufflePassageQuestion(q) {
  if (!Array.isArray(q.options) || q.options.length < 2) return { ...q };
  const correctAnswer = q.correct_answer || (q.options[q.correct_option_index] ?? "");
  const options = shuffle(q.options);
  const correct_option_index = options.findIndex(o => normalizeForCompare(o) === normalizeForCompare(correctAnswer));
  return { ...q, options, correct_option_index, correct_answer: correctAnswer };
}

function preparePassage(p) {
  return { ...p, questions: (p.questions || []).map(shufflePassageQuestion) };
}

export function useReadingSession({ manifest, groupId, packId, prefs, updateProgress }) {
  const [passages, setPassages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!manifest || !groupId) return;
    setStarted(false);
    setLoading(true);
    loadPassagePack(manifest, groupId, packId)
      .then(setPassages)
      .catch(() => setPassages([]))
      .finally(() => setLoading(false));
  }, [manifest, groupId, packId]);

  const categoryOptions = [...new Set(passages.map(p => p.topic).filter(Boolean))].sort();

  const getPlayable = useCallback(() => {
    return passages.filter(p => {
      if (prefs.category && prefs.category !== "all" && p.topic !== prefs.category) return false;
      const qs = (p.questions || []).filter(q => prefs.difficulty === "all" || (q.difficulty || "medium") === prefs.difficulty);
      return qs.length > 0;
    });
  }, [passages, prefs]);

  const startSession = useCallback(() => {
    const playable = shuffle(getPlayable()).map(preparePassage);
    if (!playable.length) { setMessage("No passages match the current filters."); return; }
    setMessage("");
    setDeck(playable);
    setCurrentIndex(0);
    setAnswers({});
    setRevealed(false);
    setCompletedCount(0);
    setStarted(true);
  }, [getPlayable]);

  const answerQuestion = useCallback((questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  }, []);

  const revealPassage = useCallback(() => setRevealed(true), []);

  const nextPassage = useCallback(() => {
    if (updateProgress && packId) {
      updateProgress(state => { recordPassageCompletion(state, packId); });
    }
    setCompletedCount(c => c + 1);
    if (currentIndex + 1 >= deck.length) {
      setStarted(false);
    } else {
      setCurrentIndex(i => i + 1);
      setAnswers({});
      setRevealed(false);
    }
  }, [currentIndex, deck.length, updateProgress, packId]);

  const resetSession = useCallback(() => setStarted(false), []);

  const jumpToPassage = useCallback((index) => {
    if (index < 0 || index >= deck.length) return;
    setCurrentIndex(index);
    setAnswers({});
    setRevealed(false);
  }, [deck.length]);

  const current = deck[currentIndex] || null;

  return {
    passages, loading, started, current, deck, currentIndex, answers,
    revealed, completedCount, message, categoryOptions,
    startSession, answerQuestion, revealPassage, nextPassage, resetSession, jumpToPassage,
  };
}
