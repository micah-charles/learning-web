import { useState, useEffect, useCallback } from "react";
import { loadSentenceBuilderPack } from "@/data.js";
import { getBuilderStats, markBuilderCorrect, markBuilderSkip, noteBuilderCardAttempt } from "@/storage.js";
import { shuffle, normalizeForCompare } from "@/utils.js";

function makeTiles(card) {
  return {
    answerTiles: [],
    bankTiles: shuffle((card.tiles || []).map((text, i) => ({ id: `${card.id}-t${i}`, text }))),
  };
}

export function useBuilderSession({ manifest, packId, filter, progress, updateProgress, onCorrectSpeak }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [tiles, setTiles] = useState({ answerTiles: [], bankTiles: [] });
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!manifest || !packId) return;
    setLoading(true);
    loadSentenceBuilderPack(manifest, packId)
      .then(all => {
        const filtered = filter && filter !== "all" ? all.filter(c => c.type === filter) : all;
        const deck = shuffle(filtered);
        setCards(deck);
        setIndex(0);
        setFeedback(null);
        if (deck[0]) setTiles(makeTiles(deck[0]));
      })
      .finally(() => setLoading(false));
  }, [manifest, packId, filter]);

  const currentCard = cards[index] || null;

  const pickTile = useCallback((tileId) => {
    setTiles(prev => {
      const tile = prev.bankTiles.find(t => t.id === tileId);
      if (!tile) return prev;
      return {
        answerTiles: [...prev.answerTiles, tile],
        bankTiles: prev.bankTiles.filter(t => t.id !== tileId),
      };
    });
  }, []);

  const returnTile = useCallback((tileId) => {
    setTiles(prev => {
      const tile = prev.answerTiles.find(t => t.id === tileId);
      if (!tile) return prev;
      return {
        answerTiles: prev.answerTiles.filter(t => t.id !== tileId),
        bankTiles: [...prev.bankTiles, tile],
      };
    });
  }, []);

  const clearTiles = useCallback(() => {
    if (!currentCard) return;
    setTiles(makeTiles(currentCard));
  }, [currentCard]);

  const hintTile = useCallback(() => {
    if (!currentCard) return;
    const answer = (currentCard.answer || "").split(/\s+/);
    setTiles(prev => {
      const nextIdx = prev.answerTiles.length;
      if (nextIdx >= answer.length) return prev;
      const hintText = answer[nextIdx];
      const fromBank = prev.bankTiles.find(t => normalizeForCompare(t.text) === normalizeForCompare(hintText));
      if (!fromBank) return prev;
      return {
        answerTiles: [...prev.answerTiles, fromBank],
        bankTiles: prev.bankTiles.filter(t => t.id !== fromBank.id),
      };
    });
  }, [currentCard]);

  const checkAnswer = useCallback(() => {
    if (!currentCard) return;
    const userAnswer = tiles.answerTiles.map(t => t.text).join(" ");
    const correct = normalizeForCompare(userAnswer) === normalizeForCompare(currentCard.answer || "");
    if (updateProgress) {
      updateProgress(state => {
        noteBuilderCardAttempt(state, packId, currentCard.id);
        if (correct) markBuilderCorrect(state, packId);
      });
    }
    setFeedback({ correct, expected: currentCard.answer, actual: userAnswer });
    // Speak the full sentence aloud on a correct answer.
    // Fired here (inside the click handler / user-gesture window) to satisfy
    // browser autoplay policies and avoid the RC11 cancel+speak-same-tick bug
    // (we call speak only on correct, never alongside a cancel).
    if (correct && onCorrectSpeak) {
      onCorrectSpeak(currentCard.answer, currentCard.speechLanguage);
    }
  }, [currentCard, tiles, packId, updateProgress, onCorrectSpeak]);

  const nextCard = useCallback(() => {
    if (updateProgress && currentCard) {
      updateProgress(state => { markBuilderSkip(state, packId); });
    }
    const nextIdx = index + 1 < cards.length ? index + 1 : 0;
    setIndex(nextIdx);
    setFeedback(null);
    if (cards[nextIdx]) setTiles(makeTiles(cards[nextIdx]));
  }, [index, cards, currentCard, packId, updateProgress]);

  const jumpToCard = useCallback((idx) => {
    if (idx < 0 || idx >= cards.length) return;
    setIndex(idx);
    setFeedback(null);
    if (cards[idx]) setTiles(makeTiles(cards[idx]));
  }, [cards]);

  const stats = progress ? getBuilderStats(progress, packId) : { totalAttempted: 0, totalCorrect: 0, streak: 0 };

  return { currentCard, cards, index, tiles, feedback, loading, stats, pickTile, returnTile, clearTiles, hintTile, checkAnswer, nextCard, jumpToCard };
}
