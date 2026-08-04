import { createLearnerWordState } from "./word-contracts.js";

function characterHasCoverage(progress, characterId) {
  const record = progress?.characters?.[characterId] || {};
  return Object.values(record).some((method) => (method?.attempts || method?.exposures || 0) > 0)
    || Boolean(progress?.discoveredNodes?.[characterId]);
}

function characterHasRecognition(progress, characterId, { requireNoHint = false } = {}) {
  const events = (progress?.attemptEvents || []).filter((event) => event.characterId === characterId && event.correct);
  return events.some((event) => !requireNoHint || !event.hintLevel);
}

export function evaluateWordUnlock({ word, progress, policy = {}, previousState = {}, now = new Date().toISOString() }) {
  const requiredCharacterIds = word?.requiredCharacterIds || word?.characterIds || [];
  const covered = requiredCharacterIds.length > 0 && requiredCharacterIds.every((id) => characterHasCoverage(progress, id));
  const recognised = requiredCharacterIds.length > 0 && requiredCharacterIds.every((id) => characterHasRecognition(progress, id, policy));
  const eligible = word?.reviewStatus !== "blocked";
  const ready = eligible && covered;
  if (!ready) return { eligible, covered, recognised, state: previousState.state || "hidden", newlyDiscovered: false };
  const nextState = previousState.state === "hidden" ? "discovered" : previousState.state;
  return {
    eligible,
    covered,
    recognised,
    state: nextState,
    newlyDiscovered: previousState.state === "hidden",
    discoveredAt: previousState.discoveredAt || now,
  };
}

export function evaluateAffectedWords({ changedCharacterIds = [], dependencyIndex, progress, now = new Date().toISOString(), policy = {} }) {
  const affectedIds = new Set(changedCharacterIds.flatMap((id) => dependencyIndex?.wordIdsByCharacterId?.[id] || []));
  const updatedWords = [];
  const discoveries = [];
  for (const wordId of affectedIds) {
    const word = dependencyIndex.wordsById[wordId];
    if (!word) continue;
    const previousState = progress.words?.[wordId] || createLearnerWordState(wordId);
    const evaluation = evaluateWordUnlock({ word, progress, policy, previousState, now });
    if (evaluation.state !== previousState.state || evaluation.newlyDiscovered) {
      const next = { ...previousState, state: evaluation.state };
      if (evaluation.discoveredAt) next.discoveredAt = evaluation.discoveredAt;
      updatedWords.push(next);
    }
    if (evaluation.newlyDiscovered) {
      discoveries.push({
        eventVersion: 1,
        eventType: "word-discovered",
        occurredAt: now,
        wordId,
        trigger: "character-attempt",
        prerequisiteCharacterIds: [...(word.requiredCharacterIds || [])],
        datasetVersion: dependencyIndex.datasetVersion || "unknown",
      });
    }
  }
  return { updatedWords, discoveries };
}

/** @param {{ words?: Array<Record<string, any>>, wordGraph?: Record<string, any>, datasetVersion?: string }} input */
export function buildWordDependencyIndex({ words = [], wordGraph = {}, datasetVersion = "unknown" }) {
  const graphByText = new Map((wordGraph.words || []).filter((row) => row.text).map((row) => [row.text, row]));
  const wordsById = {};
  const wordIdsByCharacterId = {};
  const wordIdsByLessonId = {};
  const excludedWords = [];
  for (const row of words) {
    const graph = graphByText.get(row.word);
    const wordId = graph?.wordId || `word-canonical:${row.word}`;
    const word = {
      ...row,
      id: wordId,
      wordId,
      requiredCharacterIds: [...(graph?.characterPrerequisites || row.characterIds || [])],
      unlockLessonId: graph?.lessonId,
      unlockEligible: Boolean(graph),
      reviewStatus: row.reviewStatus || (row.learnerDefinitionStatus === "approved" ? "approved" : "provisional"),
      pronunciationStatus: graph?.pronunciationEligibility ? "approved" : "pending",
    };
    wordsById[wordId] = word;
    if (!graph) excludedWords.push({ wordId, text: row.word, reason: "not-placed-in-curriculum-capacity" });
    if (graph?.lessonId) (wordIdsByLessonId[graph.lessonId] ||= []).push(wordId);
    for (const characterId of word.requiredCharacterIds) (wordIdsByCharacterId[characterId] ||= []).push(wordId);
  }
  return { datasetVersion, wordsById, wordIdsByCharacterId, wordIdsByLessonId, wordCount: Object.keys(wordsById).length, mappedWordCount: (wordGraph.words || []).length, excludedWords };
}
