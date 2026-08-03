export const DIRECTOR_INTENTS = ["journey", "training", "review", "explore", "arena", "reading", "story", "boss"];

function safeDate(value, fallback = Date.now()) {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : fallback;
}

function candidateStatus(candidate, learner) {
  const record = learner.completedById?.[candidate.id];
  return { completed: record?.status === "completed", attempts: Number(record?.attempts) || 0 };
}

function scoreCandidate(candidate, { intent, learner, preferredId = "", now = Date.now() }) {
  const status = candidateStatus(candidate, learner);
  const isPreferred = candidate.id === preferredId;
  const isReview = candidate.kind === "review";
  const isChapter = candidate.kind === "chapter";
  let score = 0;
  const reasons = [];
  if (intent === "review") {
    score += isReview ? 100 : 10;
    if (isReview) reasons.push("REVIEW_DUE");
  } else if (intent === "training") {
    score += candidate.kind === "training" ? 100 : 40;
    if (isPreferred) reasons.push("LEARNER_SELECTED_NODE");
  } else if (intent === "arena") {
    score += candidate.supportsArena ? 100 : 0;
    if (candidate.supportsArena) reasons.push("ARENA_READY");
  } else {
    score += isChapter ? 50 : 20;
    if (isReview && learner.dueCount > 0) { score += 45; reasons.push("REVIEW_DUE"); }
    if (isPreferred) { score += 35; reasons.push("CONTINUE_CHAPTER"); }
    if (isChapter && !status.completed) { score += 22; reasons.push("NEW_FOUNDATION"); }
  }
  if (candidate.weaknessValue) { score += Math.min(30, Number(candidate.weaknessValue) || 0); if (candidate.weaknessValue >= 10) reasons.push("WEAK_KNOWLEDGE"); }
  if (candidate.expeditionPriority) { score += Math.min(25, Number(candidate.expeditionPriority) || 0); reasons.push("EXPEDITION_PRIORITY"); }
  if (candidate.recentlyUsed && intent !== "review") score -= 12;
  if (now - safeDate(candidate.lastAttemptAt, now) > 7 * 24 * 60 * 60 * 1000) score += 5;
  return { score, reasons: [...new Set(reasons)] };
}

export function buildRecommendation({ candidates = [], learner = {}, intent = "journey", preferredId = "", now = Date.now(), seed = "default" } = {}) {
  const safeIntent = DIRECTOR_INTENTS.includes(intent) ? intent : "journey";
  const scored = candidates.filter(Boolean).map((candidate) => ({ candidate, ...scoreCandidate(candidate, { intent: safeIntent, learner, preferredId, now }) }))
    .sort((left, right) => right.score - left.score || left.candidate.id.localeCompare(right.candidate.id));
  const selected = scored[0] || null;
  if (!selected) return { intent: safeIntent, selected: null, alternatives: [], reasonCodes: [], seed, estimatedMinutes: 0, summary: "Choose any available learning activity." };
  const reasonCodes = selected.reasons.length ? selected.reasons : ["LEARNER_SELECTED_NODE"];
  const alternatives = scored.slice(1, 4).map(({ candidate }) => ({ id: candidate.id, title: candidate.title?.en || candidate.title || candidate.id, intent: candidate.intent || safeIntent }));
  const focus = selected.candidate.focusLabel || selected.candidate.outcomeLabel || "the next useful step";
  const summary = reasonCodes.includes("REVIEW_DUE") ? `Revisit ${focus} while it is ready to strengthen.` : reasonCodes.includes("CONTINUE_CHAPTER") ? `Continue building on ${focus}.` : `A good next step for ${focus}.`;
  return { intent: safeIntent, selected: selected.candidate, alternatives, reasonCodes, seed, estimatedMinutes: selected.candidate.estimatedMinutes || 5, title: selected.candidate.title?.en || selected.candidate.title || "Recommended practice", summary, score: selected.score };
}

export function buildLearnerSignals({ moduleProgress = {}, method = "cangjie", now = Date.now() } = {}) {
  const events = (moduleProgress.attemptEvents || []).filter((event) => event.method === method);
  const completedById = moduleProgress.lessons || {};
  const dueCount = Object.values(moduleProgress.characters || {}).filter((record) => {
    const methodRecord = record?.[method];
    return methodRecord?.nextReviewAt && safeDate(methodRecord.nextReviewAt, now) <= now;
  }).length;
  const weakCount = Object.values(moduleProgress.characters || {}).filter((record) => {
    const methodRecord = record?.[method];
    return methodRecord?.attempts && (methodRecord.masteryScore || 0) < 60;
  }).length;
  return { completedById, dueCount, weakCount, recentAttempts: events.slice(-30), lastAttemptAt: events.at(-1)?.occurredAt || "" };
}
