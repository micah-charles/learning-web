import { clone } from "./utils.js";

const STORAGE_KEY = "learningGermanWeb.v1";

export const DEFAULT_STATE = {
  activeTab: "home",
  prefs: {
    vocab: {
      datasetId: "core",
      year: "ALL",
      stages: [],
      search: "",
      partOfSpeech: "",
      category: "",
    },
    quiz: {
      // Subject First selections (added in the Subject First refactor)
      subject: "language",                    // language | history | geography | science
      direction: "studyToTarget",             // studyToTarget | targetToStudy (language packs only)
      answerMode: "mixed",                    // mcq | typed | mixed
      // Existing fields
      datasetId: "core",
      year: "Y7",
      stages: [],
      excludeMastered: true,
      questionCount: 18,
      // Legacy mode IDs are kept internally for the question engine; they are
      // derived from (subject, direction, answerMode) via the adapter at
      // session-build time. Persisted here only as a safety net.
      modes: [
        "englishWordChooseGerman",
        "englishSentenceBuildGerman",
        "germanSentenceBuildEnglish",
      ],
    },
    builder: {
      packId: "",
      filter: "all",
    },
    passages: {
      groupId: "",
      packId: "",
      category: "all",
      difficulty: "all",
      showGerman: false,
      voiceEnabled: true,
    },
    review: {
      datasetId: "core",
      sort: "needsReview",
    },
  },
  progress: {
    words: {},
    sessions: [],
    builderStats: {},
    passageStats: {},
  },
};

function mergeState(base, incoming) {
  if (Array.isArray(base)) {
    return Array.isArray(incoming) ? [...incoming] : [...base];
  }
  if (base && typeof base === "object") {
    const result = { ...base };
    for (const [key, value] of Object.entries(base)) {
      result[key] = mergeState(value, incoming && typeof incoming === "object" ? incoming[key] : undefined);
    }
    if (incoming && typeof incoming === "object") {
      for (const [key, value] of Object.entries(incoming)) {
        if (!(key in result)) {
          result[key] = clone(value);
        }
      }
    }
    return result;
  }
  return incoming === undefined || incoming === null ? base : incoming;
}

export function loadStoredState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return clone(DEFAULT_STATE);
    }
    const parsed = JSON.parse(raw);
    const merged = mergeState(DEFAULT_STATE, parsed);
    if (!Array.isArray(merged.prefs.quiz.modes) || merged.prefs.quiz.modes.length === 0) {
      merged.prefs.quiz.modes = [...DEFAULT_STATE.prefs.quiz.modes];
    }
    return merged;
  } catch (_error) {
    return clone(DEFAULT_STATE);
  }
}

export function saveStoredState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getWordProgress(state, wordId) {
  return state.progress.words[wordId] || {
    correct: 0,
    wrong: 0,
    streak: 0,
    lastSeenAt: null,
  };
}

export function isMasteredProgress(progress) {
  return progress.correct >= 3 && progress.streak >= 2;
}

export function isWordMastered(state, wordId) {
  return isMasteredProgress(getWordProgress(state, wordId));
}

export function countMasteredWords(state, words) {
  return words.filter((word) => isWordMastered(state, word.id)).length;
}

export function recordWordAnswer(state, wordId, wasCorrect) {
  const progress = {
    ...getWordProgress(state, wordId),
    lastSeenAt: new Date().toISOString(),
  };
  if (wasCorrect) {
    progress.correct += 1;
    progress.streak += 1;
  } else {
    progress.wrong += 1;
    progress.streak = 0;
  }
  state.progress.words[wordId] = progress;
}

export function recordQuizSession(state, sessionRecord) {
  state.progress.sessions = [sessionRecord, ...state.progress.sessions].slice(0, 24);
}

function ensureBuilderStats(state, packId) {
  if (!state.progress.builderStats[packId]) {
    state.progress.builderStats[packId] = {
      totalAttempted: 0,
      totalCorrect: 0,
      streak: 0,
      perCardAttempts: {},
    };
  }
  return state.progress.builderStats[packId];
}

export function getBuilderStats(state, packId) {
  return ensureBuilderStats(state, packId);
}

export function noteBuilderCardAttempt(state, packId, cardId) {
  const stats = ensureBuilderStats(state, packId);
  stats.perCardAttempts[cardId] = (stats.perCardAttempts[cardId] || 0) + 1;
}

export function markBuilderCorrect(state, packId) {
  const stats = ensureBuilderStats(state, packId);
  stats.totalAttempted += 1;
  stats.totalCorrect += 1;
  stats.streak += 1;
}

export function markBuilderSkip(state, packId) {
  const stats = ensureBuilderStats(state, packId);
  stats.totalAttempted += 1;
  stats.streak = 0;
}

function ensurePassageStats(state, packId) {
  if (!state.progress.passageStats[packId]) {
    state.progress.passageStats[packId] = {
      passagesCompleted: 0,
    };
  }
  return state.progress.passageStats[packId];
}

export function getPassageStats(state, packId) {
  return ensurePassageStats(state, packId);
}

export function recordPassageCompletion(state, packId) {
  const stats = ensurePassageStats(state, packId);
  stats.passagesCompleted += 1;
}
