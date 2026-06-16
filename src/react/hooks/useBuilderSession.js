import { useState, useEffect, useCallback, useRef } from "react";
import { loadSentenceBuilderPack } from "@/data.js";
import { getBuilderStats, markBuilderCorrect, markBuilderSkip, noteBuilderCardAttempt } from "@/storage.js";
import { shuffle, normalizeForCompare } from "@/utils.js";

function makeTiles(card) {
  return {
    answerTiles: [],
    bankTiles: shuffle((card.tiles || []).map((text, i) => ({ id: `${card.id}-t${i}`, text }))),
  };
}

export function useBuilderSession({ manifest, packId, filter, progress, updateProgress }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [tiles, setTiles] = useState({ answerTiles: [], bankTiles: [] });
  const [feedback, setFeedback] = useState(null);
  const tilesRef = useRef(tiles);

  const commitTiles = useCallback((nextValueOrUpdater) => {
    setTiles((prev) => {
      const next = typeof nextValueOrUpdater === "function"
        ? nextValueOrUpdater(prev)
        : nextValueOrUpdater;
      tilesRef.current = next;
      return next;
    });
  }, []);

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
        if (deck[0]) commitTiles(makeTiles(deck[0]));
      })
      .finally(() => setLoading(false));
  }, [manifest, packId, filter, commitTiles]);

  const currentCard = cards[index] || null;

  const pickTile = useCallback((tileId) => {
    commitTiles(prev => {
      const tile = prev.bankTiles.find(t => t.id === tileId);
      if (!tile) return prev;
      return {
        answerTiles: [...prev.answerTiles, tile],
        bankTiles: prev.bankTiles.filter(t => t.id !== tileId),
      };
    });
  }, [commitTiles]);

  const returnTile = useCallback((tileId) => {
    commitTiles(prev => {
      const tile = prev.answerTiles.find(t => t.id === tileId);
      if (!tile) return prev;
      return {
        answerTiles: prev.answerTiles.filter(t => t.id !== tileId),
        bankTiles: [...prev.bankTiles, tile],
      };
    });
  }, [commitTiles]);

  const clearTiles = useCallback(() => {
    if (!currentCard) return;
    commitTiles(makeTiles(currentCard));
  }, [currentCard, commitTiles]);

  const hintTile = useCallback(() => {
    if (!currentCard) return;
    const answer = (currentCard.answer || "").split(/\s+/);
    commitTiles(prev => {
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
  }, [currentCard, commitTiles]);

  const checkAnswer = useCallback((spokenAnswer) => {
    if (!currentCard) return;
    const latestTiles = tilesRef.current.answerTiles;
    const userAnswer = spokenAnswer || latestTiles.map(t => t.text).join(" ");
    const expectedTiles = Array.isArray(currentCard.tiles)
      ? currentCard.tiles.map((token) => normalizeForCompare(token))
      : [];
    const actualTiles = latestTiles.map((tile) => normalizeForCompare(tile.text));
    const tilesMatch = expectedTiles.length > 0
      && expectedTiles.length === actualTiles.length
      && expectedTiles.every((token, index) => token === actualTiles[index]);
    const correct = tilesMatch || normalizeForCompare(userAnswer) === normalizeForCompare(currentCard.answer || "");
    if (updateProgress) {
      updateProgress(state => {
        noteBuilderCardAttempt(state, packId, currentCard.id);
        if (correct) markBuilderCorrect(state, packId);
      });
    }
    setFeedback({ correct, expected: currentCard.answer, actual: userAnswer });
  }, [currentCard, packId, updateProgress]);

  const nextCard = useCallback(() => {
    if (updateProgress && currentCard) {
      updateProgress(state => { markBuilderSkip(state, packId); });
    }
    const nextIdx = index + 1 < cards.length ? index + 1 : 0;
    setIndex(nextIdx);
    setFeedback(null);
    if (cards[nextIdx]) commitTiles(makeTiles(cards[nextIdx]));
  }, [index, cards, currentCard, packId, updateProgress, commitTiles]);

  const jumpToCard = useCallback((idx) => {
    if (idx < 0 || idx >= cards.length) return;
    setIndex(idx);
    setFeedback(null);
    if (cards[idx]) commitTiles(makeTiles(cards[idx]));
  }, [cards, commitTiles]);

  const stats = progress ? getBuilderStats(progress, packId) : { totalAttempted: 0, totalCorrect: 0, streak: 0 };

  return { currentCard, cards, index, tiles, feedback, loading, stats, pickTile, returnTile, clearTiles, hintTile, checkAnswer, nextCard, jumpToCard };
}
