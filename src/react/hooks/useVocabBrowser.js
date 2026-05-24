import { useState, useEffect, useMemo } from "react";
import { loadVocabItems, findDataset, getDatasetSubject } from "@/data.js";
import { filterWordsForScope } from "@/quiz-helpers.js";

export function useVocabBrowser({ manifest, datasetId, prefs }) {
  const [allWords, setAllWords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!manifest || !datasetId) return;
    setLoading(true);
    loadVocabItems(manifest, datasetId)
      .then(setAllWords)
      .finally(() => setLoading(false));
  }, [manifest, datasetId]);

  const dataset = manifest ? findDataset(manifest, datasetId) : null;
  const subject = dataset ? getDatasetSubject(dataset) : "";

  const scopedWords = useMemo(() => {
    if (!dataset) return allWords;
    return filterWordsForScope(allWords, dataset, prefs);
  }, [allWords, dataset, prefs]);

  const filtered = useMemo(() => {
    // Multi-category filter (array): at least one of the word's categories must match.
    const activeCats = Array.isArray(prefs.categories) && prefs.categories.length > 0
      ? new Set(prefs.categories)
      : null;

    return scopedWords
      .filter((w) => !prefs.partOfSpeech || (w.pos || w.part_of_speech || "") === prefs.partOfSpeech)
      .filter((w) => {
        if (activeCats) {
          const wordCats = w.categories || [];
          return wordCats.some((c) => activeCats.has(c));
        }
        if (prefs.category) return (w.categories || []).includes(prefs.category);
        return true;
      })
      .filter((w) => {
        const q = (prefs.search || "").trim().toLowerCase();
        if (!q) return true;
        return [w.de, w.en, w.topic, ...(w.tags || [])].join(" ").toLowerCase().includes(q);
      });
  }, [scopedWords, prefs]);

  const posOptions = useMemo(
    () =>
      [...new Set(scopedWords.map((w) => (w.part_of_speech || w.pos || "").trim()).filter(Boolean))].sort(),
    [scopedWords],
  );

  const categoryOptions = useMemo(
    () => [...new Set(scopedWords.flatMap((w) => w.categories || []))].sort(),
    [scopedWords],
  );

  // Language packs (German, Latin) use checkbox-style multi-select for categories.
  const useCheckboxCategories = subject === "language" && categoryOptions.length > 0;

  return {
    dataset,
    subject,
    allWords,
    scopedWords,
    filtered,
    posOptions,
    categoryOptions,
    useCheckboxCategories,
    loading,
  };
}
