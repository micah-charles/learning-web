import { clone } from "./utils.js";

const STORAGE_KEY = "learningGermanWeb.v1";

export const DEFAULT_STATE = {
  activeTab: "home",
  prefs: {
    onboardingCompleted: false,
    learningMode: "guided", // "guided" | "everything"
    selectedInterests: [],
    selectedModules: [],
    selectedCurriculums: [],
    selectedSubjects: [],
    onboardingVersion: 1,
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
      // currentLessonId: denormalized global current lesson (e.g. "de-semantic_pack_l1_004").
      // lessonOrder: user's preferred language order for dashboard display.
      // langs[code].completedLessons: ordered list of completed lesson IDs.
      // langs[code].currentLessonId: the lesson to resume next time.
      // langs[code].lastOpenedAt: ISO timestamp for "most recently used" ordering.
      // langs[code].lessonStatus: detailed per-lesson state keyed by lessonId.
      //   status: "not_started" | "in_progress" | "completed" | "needs_review" | "skipped"
      //   startedAt, completedAt, lastScore, attempts
      // langs[code].weakLessons: lessonIds with score < 70% (need review)
      // langs[code].studyStreak: { current, longest, lastStudyDate }
      lastLang: "",
      currentLessonId: "",
      lessonOrder: [],
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

function migrateLanguageLadder(parsed) {
  const ll = parsed.languageLadder;
  if (!ll || ll.lessonStatus !== undefined) return; // already migrated

  // MIGRATE: Convert old completedLessons to lessonStatus
  for (const [lang, info] of Object.entries(ll.langs ?? {})) {
    if (!info) continue;
    info.lessonStatus = {};
    info.weakLessons = [];
    info.currentLessonId = info.currentLessonId || "";

    // Mark completed lessons
    (info.completedLessons || []).forEach(lessonId => {
      info.lessonStatus[lessonId] = {
        status: "completed",
        completedAt: info.lastOpenedAt || new Date().toISOString(),
        attempts: 1,
        lastScore: 100, // unknown, assume passing
      };
    });

    // Determine current lesson from lastOpenedAt or first uncompleted
    if (!info.currentLessonId && info.completedLessons?.length) {
      // Will be determined by resume logic based on catalog
    }
  }

  // Set denormalized currentLessonId
  ll.currentLessonId = ll.lastLang
    ? `${ll.lastLang}-${ll.langs[ll.lastLang]?.currentLessonId || ""}`
    : "";
  ll.lessonOrder = Object.keys(ll.langs ?? {}); // preserve existing order
}

export function loadStoredState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return clone(DEFAULT_STATE);
    }
    const parsed = JSON.parse(raw);
    migrateLanguageLadder(parsed);
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

// ── Language Ladder Helpers ────────────────────────────────────────────────

/**
 * Get all lessons for a target language in catalog order.
 * Returns array of { id, label, packId, stageId, packPath }.
 */
export function getAllLessonsInOrder(catalog, targetLang) {
  if (!catalog?.packs) return [];
  const lessons = [];
  for (const catPack of catalog.packs) {
    for (const stage of catPack.stages) {
      for (const lesson of stage.lessons) {
        lessons.push({
          id: lesson.id,
          label: lesson.label,
          packId: catPack.id,
          stageId: stage.id,
          packPath: lesson.path,
        });
      }
    }
  }
  return lessons;
}

/**
 * Find a lesson by ID across all packs/stages.
 */
export function findLessonById(catalog, lessonId) {
  if (!catalog?.packs) return null;
  for (const catPack of catalog.packs) {
    for (const stage of catPack.stages) {
      const lesson = stage.lessons.find(l => l.id === lessonId);
      if (lesson) return { ...lesson, packId: catPack.id, stageId: stage.id, packPath: lesson.path };
    }
  }
  return null;
}

/**
 * Find the first lesson not in completedSet.
 */
export function findFirstUncompletedLesson(catalog, targetLang, completedSet) {
  const lessons = getAllLessonsInOrder(catalog, targetLang);
  const completed = completedSet || new Set();
  for (const lesson of lessons) {
    if (!completed.has(lesson.id)) return lesson;
  }
  return null;
}

/**
 * Count total lessons for a language.
 */
export function countTotalLessons(catalog, targetLang) {
  return getAllLessonsInOrder(catalog, targetLang).length;
}

/**
 * Record when a lesson is started (or resumed).
 */
export function recordLessonStart(state, lessonId, targetLang) {
  const ll = state.languageLadder;
  if (!ll.langs[targetLang]) {
    ll.langs[targetLang] = {
      completedLessons: [],
      currentLessonId: "",
      lastOpenedAt: "",
      lessonStatus: {},
      weakLessons: [],
      studyStreak: { current: 0, longest: 0, lastStudyDate: "" },
    };
  }
  const lang = ll.langs[targetLang];
  if (!lang.lessonStatus[lessonId]) {
    lang.lessonStatus[lessonId] = { status: "in_progress", startedAt: new Date().toISOString(), attempts: 0 };
  } else if (lang.lessonStatus[lessonId].status === "not_started") {
    lang.lessonStatus[lessonId].status = "in_progress";
    lang.lessonStatus[lessonId].startedAt = new Date().toISOString();
  }
  lang.lessonStatus[lessonId].attempts = (lang.lessonStatus[lessonId].attempts || 0) + 1;
  lang.currentLessonId = lessonId;
  lang.lastOpenedAt = new Date().toISOString();
  ll.lastLang = targetLang;
  ll.currentLessonId = `${targetLang}-${lessonId}`;
  if (!ll.lessonOrder.includes(targetLang)) ll.lessonOrder.push(targetLang);
}

/**
 * Record lesson completion with score.
 * Auto-sets "needs_review" if score < 70.
 */
export function recordLessonCompletion(state, lessonId, targetLang, score) {
  const ll = state.languageLadder;
  if (!ll.langs[targetLang]) return;

  const lang = ll.langs[targetLang];
  const status = lang.lessonStatus[lessonId] || { attempts: 0 };

  if (score < 70) {
    status.status = "needs_review";
    if (!lang.weakLessons.includes(lessonId)) lang.weakLessons.push(lessonId);
  } else {
    status.status = "completed";
    lang.weakLessons = lang.weakLessons.filter(id => id !== lessonId);
    if (!lang.completedLessons.includes(lessonId)) lang.completedLessons.push(lessonId);
  }

  status.completedAt = new Date().toISOString();
  status.lastScore = score;
  status.attempts = (status.attempts || 0) + 1;
  lang.lessonStatus[lessonId] = status;
  lang.lastOpenedAt = new Date().toISOString();
}

/**
 * Detect skipped lessons when user jumps ahead.
 * Returns array of { id, label } for lessons before current that aren't completed.
 * Also marks them as "skipped" in lessonStatus.
 */
export function detectSkippedLessons(catalog, targetLang, currentLessonId, completedSet) {
  const allLessons = getAllLessonsInOrder(catalog, targetLang);
  const currentIndex = allLessons.findIndex(l => l.id === currentLessonId);
  if (currentIndex <= 0) return [];

  const completed = completedSet || new Set();
  const skipped = allLessons
    .slice(0, currentIndex)
    .filter(l => !completed.has(l.id))
    .map(l => ({ id: l.id, label: l.label }));

  // Mark as skipped in storage (will be applied by caller)
  return skipped;
}

/**
 * Get resume recommendation with skipped/weak lesson info.
 * Returns { lesson, targetLang, skippedLessons, weakLessons, source } or null.
 */
export function getResumeRecommendation(state, catalog) {
  const ll = state.languageLadder;
  const langs = ll.langs ?? {};
  const lastLang = ll.lastLang;

  // Priority 1: lastLang with currentLessonId
  if (lastLang && langs[lastLang]?.currentLessonId) {
    const lesson = findLessonById(catalog, langs[lastLang].currentLessonId);
    if (lesson) {
      const completed = new Set(langs[lastLang].completedLessons ?? []);
      const skipped = detectSkippedLessons(catalog, lastLang, lesson.id, completed);
      const weak = langs[lastLang].weakLessons ?? [];
      return { lesson, targetLang: lastLang, skippedLessons: skipped, weakLessons: weak, source: "last_lang" };
    }
  }

  // Priority 2: most recently opened language with incomplete lesson
  const sortedLangs = Object.entries(langs)
    .filter(([_, v]) => v.currentLessonId)
    .sort((a, b) => new Date(b[1].lastOpenedAt) - new Date(a[1].lastOpenedAt));

  for (const [langCode, info] of sortedLangs) {
    const lesson = findLessonById(catalog, info.currentLessonId);
    if (lesson) {
      const completed = new Set(info.completedLessons ?? []);
      const skipped = detectSkippedLessons(catalog, langCode, lesson.id, completed);
      const weak = info.weakLessons ?? [];
      return { lesson, targetLang: langCode, skippedLessons: skipped, weakLessons: weak, source: "recent_lang" };
    }
  }

  // Priority 3: most completed language, first uncompleted
  let bestLang = null, bestCount = -1;
  for (const [langCode, info] of Object.entries(langs)) {
    const count = info.completedLessons?.length ?? 0;
    if (count > bestCount) { bestCount = count; bestLang = langCode; }
  }
  if (bestLang) {
    const lesson = findFirstUncompletedLesson(catalog, bestLang, langs[bestLang].completedLessons);
    if (lesson) {
      const completed = new Set(langs[bestLang].completedLessons ?? []);
      const skipped = detectSkippedLessons(catalog, bestLang, lesson.id, completed);
      const weak = langs[bestLang].weakLessons ?? [];
      return { lesson, targetLang: bestLang, skippedLessons: skipped, weakLessons: weak, source: "most_progress" };
    }
  }

  // Fallback
  return null;
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