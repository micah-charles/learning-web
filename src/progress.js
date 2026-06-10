const MAX_ATTEMPT_EVENTS = 1000;

export const EMPTY_WORD_PROGRESS = {
  correct: 0,
  wrong: 0,
  streak: 0,
  lastSeenAt: null,
};

function bucket(state) {
  return state && state.progress ? state.progress : state || {};
}

function ensureBucket(state) {
  if (!state.progress) {
    state.progress = {};
  }
  if (!state.progress.words) state.progress.words = {};
  if (!Array.isArray(state.progress.sessions)) state.progress.sessions = [];
  if (!Array.isArray(state.progress.attemptEvents)) state.progress.attemptEvents = [];
  if (!state.progress.builderStats) state.progress.builderStats = {};
  if (!state.progress.passageStats) state.progress.passageStats = {};
  return state.progress;
}

function attemptsOf(progress = EMPTY_WORD_PROGRESS) {
  return (Number(progress.correct) || 0) + (Number(progress.wrong) || 0);
}

function accuracyOf(progress = EMPTY_WORD_PROGRESS) {
  const attempts = attemptsOf(progress);
  return attempts ? (Number(progress.correct) || 0) / attempts : 0;
}

function toDateKey(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function formatAgoDays(dateString) {
  if (!dateString) return "not practised yet";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "not practised yet";
  const diffDays = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  return `${diffDays} days ago`;
}

function fallback(value, alternative = "") {
  return value === undefined || value === null || value === "" ? alternative : value;
}

function eventMode(questionMode) {
  const value = String(questionMode || "").toLowerCase();
  if (value.includes("passage")) return "reading";
  if (value.includes("type")) return "typing";
  if (value.includes("choose") || value.includes("choice")) return "multipleChoice";
  if (value.includes("sentence") || value.includes("build")) return "sentenceBuilder";
  return "quiz";
}

export function makeAttemptEvent({
  sessionId,
  packId,
  packTitle,
  itemId,
  questionText,
  expectedAnswer,
  selectedAnswer,
  correct,
  modeId,
  kind,
  timeSpentMs = 0,
}) {
  const timestamp = new Date().toISOString();
  return {
    id: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp,
    sessionId: fallback(sessionId, ""),
    packId: fallback(packId, ""),
    packTitle: fallback(packTitle, ""),
    itemId: fallback(itemId, ""),
    questionText: fallback(questionText, ""),
    expectedAnswer: fallback(expectedAnswer, ""),
    selectedAnswer: fallback(selectedAnswer, ""),
    correct: Boolean(correct),
    mode: eventMode(modeId || kind),
    timeSpentMs: Math.max(0, Number(timeSpentMs) || 0),
  };
}

export function recordAttempt(state, event) {
  const progress = ensureBucket(state);
  const cleanEvent = {
    id: event.id || `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: event.timestamp || new Date().toISOString(),
    sessionId: fallback(event.sessionId, ""),
    packId: fallback(event.packId, ""),
    packTitle: fallback(event.packTitle, ""),
    itemId: fallback(event.itemId, ""),
    questionText: fallback(event.questionText, ""),
    expectedAnswer: fallback(event.expectedAnswer, ""),
    selectedAnswer: fallback(event.selectedAnswer, ""),
    correct: Boolean(event.correct),
    mode: fallback(event.mode, "quiz"),
    timeSpentMs: Math.max(0, Number(event.timeSpentMs) || 0),
  };
  progress.attemptEvents = [cleanEvent, ...progress.attemptEvents].slice(0, MAX_ATTEMPT_EVENTS);
  return cleanEvent;
}

export function getWordProgress(state, wordId) {
  return bucket(state).words?.[wordId] || { ...EMPTY_WORD_PROGRESS };
}

export function getAllProgress(state) {
  return bucket(state);
}

export function getLearningState(itemProgress = EMPTY_WORD_PROGRESS) {
  const attempts = attemptsOf(itemProgress);
  if (attempts === 0) return "New";
  const accuracy = accuracyOf(itemProgress);
  if ((Number(itemProgress.wrong) || 0) >= 2 && accuracy < 0.6) return "Struggling";
  if ((Number(itemProgress.streak) || 0) >= 3 || (accuracy >= 0.85 && attempts >= 3)) return "Mastered";
  if ((Number(itemProgress.correct) || 0) > 0) return "Reviewing";
  return "Learning";
}

export function getStruggledItems(state, limit = 20, catalog = {}) {
  const progress = bucket(state);
  const itemsById = catalog.itemsById || {};
  const eventsByItemId = Object.fromEntries(
    (progress.attemptEvents || [])
      .filter((event) => event.itemId)
      .map((event) => [event.itemId, event]),
  );

  return Object.entries(progress.words || {})
    .map(([id, itemProgress]) => {
      const item = itemsById[id] || {};
      const event = eventsByItemId[id] || {};
      const attempts = attemptsOf(itemProgress);
      const accuracy = accuracyOf(itemProgress);
      return {
        id,
        itemId: id,
        questionText: fallback(item.questionText, fallback(event.questionText, "Unknown item")),
        expectedAnswer: fallback(item.expectedAnswer, event.expectedAnswer),
        packId: fallback(item.packId, event.packId),
        packTitle: fallback(item.packTitle, fallback(event.packTitle, "Unknown pack")),
        correct: Number(itemProgress.correct) || 0,
        wrong: Number(itemProgress.wrong) || 0,
        streak: Number(itemProgress.streak) || 0,
        lastSeenAt: itemProgress.lastSeenAt || event.timestamp || null,
        attempts,
        accuracy,
        state: getLearningState(itemProgress),
      };
    })
    .filter((item) => item.attempts > 0)
    .sort((a, b) =>
      (b.wrong - b.correct) - (a.wrong - a.correct)
      || b.wrong - a.wrong
      || a.accuracy - b.accuracy,
    )
    .slice(0, limit);
}

export function getPackageProgress(state, catalog = {}) {
  const progress = bucket(state);
  const packages = catalog.packages || [];
  const packItems = catalog.packItems || {};
  const events = progress.attemptEvents || [];

  return packages.map((pack) => {
    const items = packItems[pack.id] || [];
    const itemIds = new Set(items.map((item) => item.id));
    const eventRows = events.filter((event) => event.packId === pack.id);
    const stats = items.reduce((acc, item) => {
      const itemProgress = progress.words?.[item.id] || EMPTY_WORD_PROGRESS;
      const attempts = attemptsOf(itemProgress);
      if (attempts > 0) {
        acc.attemptedItems += 1;
        acc.correct += Number(itemProgress.correct) || 0;
        acc.wrong += Number(itemProgress.wrong) || 0;
      }
      const stateLabel = getLearningState(itemProgress);
      if (stateLabel === "Mastered") acc.masteredItems += 1;
      if (stateLabel === "Struggling") acc.strugglingItems += 1;
      if (itemProgress.lastSeenAt && (!acc.lastPractisedAt || itemProgress.lastSeenAt > acc.lastPractisedAt)) {
        acc.lastPractisedAt = itemProgress.lastSeenAt;
      }
      return acc;
    }, {
      attemptedItems: 0,
      masteredItems: 0,
      strugglingItems: 0,
      correct: 0,
      wrong: 0,
      lastPractisedAt: null,
    });

    for (const event of eventRows) {
      if (event.itemId && !itemIds.has(event.itemId)) {
        itemIds.add(event.itemId);
      }
      if (event.timestamp && (!stats.lastPractisedAt || event.timestamp > stats.lastPractisedAt)) {
        stats.lastPractisedAt = event.timestamp;
      }
    }

    const totalAttempts = stats.correct + stats.wrong;
    const totalItems = Math.max(Number(pack.totalItems) || 0, itemIds.size);
    return {
      ...pack,
      totalItems,
      attemptedItems: stats.attemptedItems,
      masteredItems: stats.masteredItems,
      strugglingItems: stats.strugglingItems,
      averageAccuracy: totalAttempts ? stats.correct / totalAttempts : 0,
      lastPractisedAt: stats.lastPractisedAt,
      lastPractisedLabel: formatAgoDays(stats.lastPractisedAt),
      progressPercentage: totalItems ? stats.masteredItems / totalItems : 0,
      totalAttempts,
    };
  });
}

export function getRecentActivity(state, days = 5) {
  const progress = bucket(state);
  const now = new Date();
  const dayKeys = Array.from({ length: days }, (_value, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - index);
    return date.toISOString().slice(0, 10);
  });

  const rows = Object.fromEntries(dayKeys.map((key) => [key, {
    dateKey: key,
    date: key,
    quizSessions: 0,
    questionsAttempted: 0,
    correct: 0,
    wrong: 0,
    packs: new Set(),
  }]));

  // Pass 1: accumulate per-question events (new format — written by recordAttempt).
  const sessionsByDay = {};
  for (const event of progress.attemptEvents || []) {
    const key = toDateKey(event.timestamp);
    if (!key || !rows[key]) continue;
    rows[key].questionsAttempted += 1;
    if (event.correct) rows[key].correct += 1;
    else rows[key].wrong += 1;
    if (event.packTitle || event.packId) rows[key].packs.add(event.packTitle || event.packId);
    if (event.sessionId) {
      if (!sessionsByDay[key]) sessionsByDay[key] = new Set();
      sessionsByDay[key].add(event.sessionId);
    }
  }
  for (const [key, sessions] of Object.entries(sessionsByDay)) {
    rows[key].quizSessions = sessions.size;
  }

  // Pass 2: for days that have NO event coverage, fall back to session summaries
  // (old format — written by recordQuizSession). This handles sessions recorded
  // before recordAttempt was wired up, and sessions with no timestamp (toDateKey
  // treats undefined/null as "today" so they still appear in the right bucket).
  for (const session of progress.sessions || []) {
    const key = toDateKey(session.timestamp);
    if (!key || !rows[key]) continue;
    if (rows[key].questionsAttempted > 0) continue; // event data already covers this day
    rows[key].quizSessions += 1;
    rows[key].questionsAttempted += Number(session.totalQuestions) || 0;
    rows[key].correct += Number(session.score) || 0;
    rows[key].wrong += Math.max(0, (Number(session.totalQuestions) || 0) - (Number(session.score) || 0));
    if (session.label || session.datasetId) rows[key].packs.add(session.label || session.datasetId);
  }

  return dayKeys.map((key) => {
    const row = rows[key];
    const attempts = row.correct + row.wrong;
    return {
      ...row,
      packs: [...row.packs],
      averageAccuracy: attempts ? row.correct / attempts : 0,
    };
  });
}

export function getDashboardSummary(state, catalog = {}, days = 5) {
  const progress = bucket(state);
  const words = progress.words || {};
  const packageRows = getPackageProgress(state, catalog);
  const totalItems = packageRows.reduce((sum, pack) => sum + pack.totalItems, 0);
  const wordRows = Object.values(words);
  const attemptedItems = wordRows.filter((item) => attemptsOf(item) > 0).length;
  const masteredItems = wordRows.filter((item) => getLearningState(item) === "Mastered").length;
  const strugglingItems = wordRows.filter((item) => getLearningState(item) === "Struggling").length;
  const totalCorrect = wordRows.reduce((sum, item) => sum + (Number(item.correct) || 0), 0);
  const totalWrong = wordRows.reduce((sum, item) => sum + (Number(item.wrong) || 0), 0);
  const recentActivity = getRecentActivity(state, days);
  const recentQuestions = recentActivity.reduce((sum, day) => sum + day.questionsAttempted, 0);
  const activeDays = recentActivity.filter((day) => day.questionsAttempted > 0).map((day) => day.dateKey);
  let streak = 0;
  for (const key of activeDays) {
    const expected = new Date();
    expected.setDate(expected.getDate() - streak);
    if (key === expected.toISOString().slice(0, 10)) streak += 1;
    else break;
  }

  return {
    totalItems,
    attemptedItems,
    masteredItems,
    strugglingItems,
    recentQuestions,
    averageAccuracy: totalCorrect + totalWrong ? totalCorrect / (totalCorrect + totalWrong) : 0,
    studyStreakDays: streak,
  };
}

export function getRecommendedPractice(state, catalog = {}, limit = 5) {
  const packages = getPackageProgress(state, catalog);
  const struggledItems = getStruggledItems(state, 8, catalog);
  const recommendations = [];

  packages
    .filter((pack) => pack.strugglingItems > 0)
    .sort((a, b) => b.strugglingItems - a.strugglingItems || (a.lastPractisedAt || "").localeCompare(b.lastPractisedAt || ""))
    .slice(0, 3)
    .forEach((pack) => {
      recommendations.push({
        type: "pack",
        tone: "coral",
        title: pack.title,
        body: `Focus on ${pack.title} — ${pack.strugglingItems} struggling ${pack.strugglingItems === 1 ? "item" : "items"} and last practised ${pack.lastPractisedLabel}.`,
      });
    });

  struggledItems.slice(0, 3).forEach((item) => {
    recommendations.push({
      type: "item",
      tone: "amber",
      title: item.questionText,
      body: `Review "${item.questionText}" — ${Math.round(item.accuracy * 100)}% accuracy after ${item.attempts} attempts.`,
    });
  });

  packages
    .filter((pack) => pack.totalItems > 0 && (!pack.lastPractisedAt || Date.now() - new Date(pack.lastPractisedAt).getTime() > 3 * 86400000))
    .sort((a, b) => (a.lastPractisedAt || "").localeCompare(b.lastPractisedAt || ""))
    .slice(0, 3)
    .forEach((pack) => {
      recommendations.push({
        type: "pack",
        tone: "blue",
        title: pack.title,
        body: `${pack.title} has ${pack.totalItems} items and was ${pack.lastPractisedLabel}. A short refresh would keep it warm.`,
      });
    });

  return recommendations.slice(0, limit);
}

export function resetWordProgress(state, wordId) {
  const progress = ensureBucket(state);
  delete progress.words[wordId];
}

export function resetAllProgress(state) {
  const progress = ensureBucket(state);
  progress.words = {};
  progress.sessions = [];
  progress.attemptEvents = [];
  progress.builderStats = {};
  progress.passageStats = {};
}

export function exportProgress(state) {
  const progress = bucket(state);
  return {
    schemaVersion: "learning-web-progress.v1",
    exportedAt: new Date().toISOString(),
    progress,
  };
}

export function importProgress(state, json) {
  const payload = typeof json === "string" ? JSON.parse(json) : json;
  const incoming = payload && payload.progress ? payload.progress : payload;
  if (!incoming || typeof incoming !== "object") {
    throw new Error("Progress backup is not valid JSON progress data.");
  }
  const progress = ensureBucket(state);
  progress.words = incoming.words && typeof incoming.words === "object" ? incoming.words : {};
  progress.sessions = Array.isArray(incoming.sessions) ? incoming.sessions : [];
  progress.attemptEvents = Array.isArray(incoming.attemptEvents) ? incoming.attemptEvents.slice(0, MAX_ATTEMPT_EVENTS) : [];
  progress.builderStats = incoming.builderStats && typeof incoming.builderStats === "object" ? incoming.builderStats : {};
  progress.passageStats = incoming.passageStats && typeof incoming.passageStats === "object" ? incoming.passageStats : {};
  return progress;
}
