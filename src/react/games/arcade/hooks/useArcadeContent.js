/**
 * useArcadeContent.js — loads pack data and adapts it into game questions.
 *
 * Reuses the existing normalised loaders (loadVocabItems / loadSentenceBuilderPack)
 * and the gameQuestionAdapter — no parallel content system.
 *
 *   mode "quiz-hunt"     → vocab words from a revision dataset
 *   mode "snake-builder" → builder cards from a sentenceBuilder pack
 */
import { useState, useEffect } from "react";
import { loadVocabItems, loadSentenceBuilderPack, findDataset } from "@/data.js";
import { shuffle } from "@/utils.js";
import { buildQuizHuntQuestions, buildSnakeBuilderQuestions } from "../utils/gameQuestionAdapter.js";

export function useArcadeContent({ manifest, mode, datasetId, packId, builderPacks }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!manifest) return undefined;

    async function load() {
      setLoading(true);
      setError("");
      try {
        if (mode === "snake-builder") {
          if (!packId) { setQuestions([]); return; }
          const descriptor = (builderPacks || []).find((p) => p.id === packId);
          const speechLanguage = descriptor?.speechLanguage || descriptor?.sourceLanguageCode || "en-GB";
          const cards = await loadSentenceBuilderPack(manifest, packId);
          const qs = buildSnakeBuilderQuestions(cards, { speechLanguage });
          if (!cancelled) setQuestions(shuffle(qs));
        } else {
          if (!datasetId) { setQuestions([]); return; }
          const dataset = findDataset(manifest, datasetId);
          // Answer side = the source word; read it in the source language.
          const speechLanguage = dataset?.sourceLanguageCode || dataset?.speechLanguage || "en-GB";
          const words = await loadVocabItems(manifest, datasetId);
          const qs = buildQuizHuntQuestions(words, { direction: "prompt-en", speechLanguage });
          if (!cancelled) setQuestions(shuffle(qs));
        }
      } catch (e) {
        if (!cancelled) { setError(e.message || "Could not load pack."); setQuestions([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [manifest, mode, datasetId, packId, builderPacks]);

  return { questions, loading, error };
}
