import { clone } from "./utils.js";

const STORAGE_KEY = "learningGermanWeb.v1";

export const DEFAULT_STATE = {
  activeTab: "home",
  prefs: {
    vocab: {
      datasetId: "core",
      subject: "language",                      // language | history | geography | science
      curriculum: "all",                        // ks3 | gcse | other | all
      year: "ALL",
      stages: [],
      search: "",
      partOfSpeech: "",
      category: "",       // used by Literature "Type" dropdown only
      categories: [],     // used by language-pack category checkboxes ([] = all selected)
    },
    quiz: {
      // Subject First selections (added in the Subject First refactor)
      subject: "language",                    // language | history | geography | science
      curriculum: "all",                      // ks3 | gcse | other | all
      direction: "studyToTarget",             // studyToTarget | targetToStudy (language packs only)
      answerMode: "mcq",                      // mcq | typed | mixed
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
    crossword: {
      subject: "language",
      curriculum: "all",
      datasetId: "core",
      year: "ALL",
      stages: [],
      excludeMastered: true,
      wordCount: 10,
    },
    builder: {
      packId: "",
      filter: "all",
      subject: "history",                       // history | language | geography | science
      curriculum: "all",                        // ks3 | gcse | other | all
    },
    passages: {
      subject: "",
      curriculum: "all",                      // ks3 | gcse | other | all
      groupId: "",
      packId: "",
      category: "all",
      difficulty: "all",
      showGerman: false,
      voiceEnabled: true,
      voiceName: "",          // preferred TTS voice name (empty = browser default)
    },
    review: {
      datasetId: "core",
      sort: "needsReview",
    },
    promptBuilder: {
      subject: "geography",
      topic: "",
      level: "KS3",
      curriculum: "",
      locale: "en-GB",
      itemTypes: ["vocab"],
      sourceMode: "paste",        // "url" | "ai-upload" | "paste"
      sourceUrl: "",
      sourceMaterial: "",
      additionalInstructions: "",
      generateMode: "template",   // Pack Creator currently uses structured template mode only
      promptTemplate: "standard", // "standard" | "lit-11plus"
      tourSeen: false,            // guided tour completed at least once (UI hint only)
    },
    arcade: {
      mode: "quiz-hunt",          // "quiz-hunt" | "snake-builder"
      subject: "language",
      curriculum: "all",
      datasetId: "core",          // quiz-hunt source (revision dataset)
      packId: "",                 // snake-builder source (sentenceBuilder pack)
      goal: "fullset",            // round goal: fullset | q20 | q40 | q60 | time5 | endless
      sound: true,                // WebAudio blip sound effects
      speech: false,              // speak the correct word/answer aloud via TTS
    },
    languageLadder: {
      // Language-specific lesson progress. Keyed by targetLang code (e.g. "de", "ja").
      // lastLang: the most-recently-used language code — restored on next open.
      // langs[code].completedLessons: ordered list of completed lesson IDs.
      // langs[code].currentLessonId: the lesson to resume next time.
      // langs[code].lastOpenedAt: ISO timestamp for "most recently used" ordering.
      lastLang: "",
      langs: {},
    },
    tutor: {
      enabled: true,
      speechMode: "toggle", // "none" | "toggle" | "always"
      openOnLoad: false,
    },
    voice: {
      voicePracticeEnabled: false,
      speakInsteadOfClick: false,
      voicePracticeMode: false,
      readingVoicePractice: false,
      vocabVoicePractice: false,
    },
  },
  progress: {
    words: {},
    sessions: [],
    attemptEvents: [],
    builderStats: {},
    passageStats: {},
    arcadeStats: {},              // keyed by game mode: { plays, bestScore, bestStreak }
    voicePractice: {},            // keyed by lesson/activity: { attempts, successes, lastScore }
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
  // Cap answers at 60 entries to keep localStorage lean; degrade gracefully on old records
  const answers = Array.isArray(sessionRecord.answers)
    ? sessionRecord.answers.slice(0, 60).map(({ prompt, expected, userAnswer, correct, speechText, speechLanguage, wordId, itemId }) => ({
        prompt, expected, userAnswer, correct,
        ...(wordId ? { wordId } : {}),
        ...(itemId ? { itemId } : {}),
        ...(speechText ? { speechText } : {}),
        ...(speechLanguage ? { speechLanguage } : {}),
      }))
    : null;
  state.progress.sessions = [
    { ...sessionRecord, ...(answers !== null ? { answers } : {}) },
    ...state.progress.sessions,
  ].slice(0, 50);
}

export function deleteSession(state, sessionId) {
  state.progress.sessions = state.progress.sessions.filter((s) => s.id !== sessionId);
}

export function clearAllSessions(state) {
  state.progress.sessions = [];
  state.progress.attemptEvents = [];
}

export function resetWordProgress(state, wordId) {
  delete state.progress.words[wordId];
}

export function clearAllWordProgress(state) {
  state.progress.words = {};
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

/**
 * Record the result of an arcade round. Kept in its own progress bucket so it
 * never disturbs quiz session analytics. `result` = { score, bestStreak, accuracy }.
 */
export function recordArcadeResult(state, mode, result = {}) {
  if (!state.progress.arcadeStats) state.progress.arcadeStats = {};
  const key = mode || "quiz-hunt";
  const prev = state.progress.arcadeStats[key] || { plays: 0, bestScore: 0, bestStreak: 0 };
  state.progress.arcadeStats[key] = {
    plays: prev.plays + 1,
    bestScore: Math.max(prev.bestScore, result.score || 0),
    bestStreak: Math.max(prev.bestStreak, result.bestStreak || 0),
    lastPlayedAt: new Date().toISOString(),
  };
}
