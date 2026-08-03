export const WORD_PROJECTION_SCHEMA_VERSION = 1;

export const WORD_LEARNING_STATES = Object.freeze([
  "hidden",
  "discoverable",
  "discovered",
  "introduced",
  "learning",
  "ready-to-review",
  "secure",
]);

export function createLearnerWordState(wordId) {
  return {
    wordId,
    state: "hidden",
    attempts: 0,
    correct: 0,
    hintCount: 0,
    meaningMastery: 0,
    readingMastery: 0,
    typingMastery: 0,
    contextMastery: 0,
  };
}

export function isVisibleWord(word, { allowPreview = false } = {}) {
  if (!word || word.reviewStatus === "blocked") return false;
  return word.reviewStatus === "approved" || allowPreview;
}

export function wordDisplayStatus(word, { allowPreview = false } = {}) {
  if (!word || word.reviewStatus === "blocked") return "hidden";
  if (word.reviewStatus === "approved") return "approved";
  return allowPreview ? "provisional" : "hidden";
}
