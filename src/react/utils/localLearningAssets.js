function asDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

export function formatLocalDate(value, fallback = "Not practised yet") {
  const date = asDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatLocalDateTime(value, fallback = "Not practised yet") {
  const date = asDate(value);
  if (!date) return fallback;
  return date.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function getSpeakShadowSessions(state) {
  const store = state?.speakShadow || {};
  const sessionsById = store.sessions || {};
  const recentIds = Array.isArray(store.recentSessionIds) ? store.recentSessionIds : [];
  const seen = new Set();
  const ordered = [];

  recentIds.forEach((id) => {
    const session = sessionsById[id];
    if (session) {
      ordered.push(session);
      seen.add(id);
    }
  });

  Object.values(sessionsById)
    .filter((session) => session?.sessionId && !seen.has(session.sessionId))
    .sort((a, b) => String(b.lastOpenedAt || b.createdAt || "").localeCompare(String(a.lastOpenedAt || a.createdAt || "")))
    .forEach((session) => ordered.push(session));

  return ordered;
}

export function summarizeSpeakShadowSession(session) {
  const phrases = Array.isArray(session?.phrases) ? session.phrases : [];
  const attempts = phrases.flatMap((phrase) => Array.isArray(phrase.attempts) ? phrase.attempts : []);
  const passedPhrases = phrases.filter((phrase) => phrase.status === "passed").length;
  const skippedPhrases = phrases.filter((phrase) => phrase.status === "skipped").length;
  const weakPhrases = phrases.filter((phrase) => (phrase.attempts || []).some((attempt) => !attempt.passed)).length;
  const averageScore = attempts.length
    ? Math.round((attempts.reduce((sum, attempt) => sum + (Number(attempt.overallScore ?? attempt.similarity) || 0), 0) / attempts.length) * 100)
    : null;
  const lastPractisedAt = session?.lastOpenedAt || session?.createdAt || "";
  return {
    id: session?.sessionId || "",
    title: session?.title || "Speak Lab practice",
    language: session?.language || "",
    mode: session?.settings?.mode || (session?.settings?.tutorMode === false ? "challenge" : "tutor"),
    phraseCount: phrases.length,
    passedPhrases,
    skippedPhrases,
    weakPhrases,
    attempts: attempts.length,
    averageScore,
    lastPractisedAt,
    lastPractisedLabel: formatLocalDate(lastPractisedAt),
    createdAt: session?.createdAt || "",
    sourceType: session?.sourceType || "saved_practice",
  };
}

export function getSpeakShadowSummary(state) {
  const rows = getSpeakShadowSessions(state).map(summarizeSpeakShadowSession);
  const totalAttempts = rows.reduce((sum, row) => sum + row.attempts, 0);
  const totalPhrases = rows.reduce((sum, row) => sum + row.phraseCount, 0);
  const passedPhrases = rows.reduce((sum, row) => sum + row.passedPhrases, 0);
  const scores = rows.map((row) => row.averageScore).filter((score) => Number.isFinite(score));
  return {
    rows,
    practiceCount: rows.length,
    totalAttempts,
    totalPhrases,
    passedPhrases,
    averageScore: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null,
    lastPractisedAt: rows[0]?.lastPractisedAt || "",
  };
}

export function getLanguageLadderRows(state) {
  const ladder = state?.prefs?.languageLadder || {};
  const langs = ladder.langs || {};
  const rows = [];
  for (const [targetLang, info] of Object.entries(langs)) {
    const lessonStatus = info?.lessonStatus || {};
    for (const [lessonId, status] of Object.entries(lessonStatus)) {
      const practisedAt = status.completedAt || status.startedAt || info.lastOpenedAt || "";
      rows.push({
        id: `${targetLang}:${lessonId}`,
        targetLang,
        lessonId,
        status: status.status || "in_progress",
        attempts: Number(status.attempts) || 0,
        lastScore: Number.isFinite(Number(status.lastScore)) ? Number(status.lastScore) : null,
        practisedAt,
        practisedLabel: formatLocalDate(practisedAt),
      });
    }
  }
  return rows.sort((a, b) => String(b.practisedAt).localeCompare(String(a.practisedAt)));
}

export function getLanguageLadderSummary(state) {
  const rows = getLanguageLadderRows(state);
  const completed = rows.filter((row) => row.status === "completed").length;
  const needsReview = rows.filter((row) => row.status === "needs_review").length;
  const inProgress = rows.filter((row) => row.status === "in_progress").length;
  const attempts = rows.reduce((sum, row) => sum + row.attempts, 0);
  const scores = rows.map((row) => row.lastScore).filter((score) => Number.isFinite(score));
  return {
    rows,
    completed,
    needsReview,
    inProgress,
    attempts,
    averageScore: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null,
    lastPractisedAt: rows[0]?.practisedAt || "",
  };
}
