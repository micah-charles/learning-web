import type {
  DirectorCandidate,
  DirectorIntent,
  DirectorRecommendation,
  LearnerEvidenceSnapshot,
} from "../types";

const VALID_INTENTS: readonly DirectorIntent[] = ["journey", "training", "review", "arena", "explore", "collection"];

function safeTime(value?: string, fallback = 0): number {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : fallback;
}

function scoreCandidate(
  candidate: DirectorCandidate,
  evidence: LearnerEvidenceSnapshot,
  intent: DirectorIntent,
  preferredId: string,
  now: number,
): { score: number; reasons: string[] } {
  const completed = evidence.completedById[candidate.id]?.status === "completed";
  const reasons: string[] = [];
  let score = 0;

  if (candidate.intent === intent) score += 90;
  if (candidate.id === preferredId) {
    score += 42;
    reasons.push("LEARNER_SELECTED_NODE");
  }
  if (candidate.id === evidence.preferredChapterId) {
    score += 34;
    reasons.push("CONTINUE_CHAPTER");
  }
  if (evidence.activeSessionId && candidate.id === evidence.preferredChapterId) {
    score += 120;
    reasons.push("RESUME_SESSION");
  }
  if (candidate.kind === "review" && evidence.dueCount > 0) {
    score += 55 + Math.min(35, candidate.dueValue || evidence.dueCount);
    reasons.push("REVIEW_DUE");
  }
  if ((candidate.weaknessValue || 0) > 0) {
    score += Math.min(38, candidate.weaknessValue || 0);
    reasons.push("WEAK_KNOWLEDGE");
  }
  if (candidate.supportsArena && intent === "arena") {
    score += 35;
    reasons.push("ARENA_READY");
  }
  if (candidate.kind === "chapter" && !completed) {
    score += 22;
    reasons.push("NEW_FOUNDATION");
  }
  if (candidate.expeditionPriority) {
    score += Math.min(25, candidate.expeditionPriority);
    reasons.push("EXPEDITION_PRIORITY");
  }
  if (candidate.recentlyUsed && intent !== "review") score -= 12;
  if (candidate.lastAttemptAt && now - safeTime(candidate.lastAttemptAt, now) > 7 * 86_400_000) score += 5;
  return { score, reasons: [...new Set(reasons)] };
}

export function buildRecommendation({
  candidates,
  evidence,
  intent = "journey",
  preferredId = "",
  now,
  seed,
}: {
  candidates: readonly DirectorCandidate[];
  evidence: LearnerEvidenceSnapshot;
  intent?: DirectorIntent;
  preferredId?: string;
  now: string;
  seed: string;
}): DirectorRecommendation {
  const safeIntent = VALID_INTENTS.includes(intent) ? intent : "journey";
  const nowValue = safeTime(now, 0);
  const scored = candidates
    .map((candidate) => ({ candidate, ...scoreCandidate(candidate, evidence, safeIntent, preferredId, nowValue) }))
    .sort((left, right) => right.score - left.score || left.candidate.id.localeCompare(right.candidate.id));
  const selected = scored[0];
  if (!selected) {
    return {
      intent: safeIntent,
      selected: null,
      alternatives: [],
      reasonCodes: [],
      title: "Choose your next adventure",
      summary: "Every available activity remains open to explore.",
      score: 0,
      seed,
      estimatedMinutes: 0,
    };
  }
  const reasonCodes = selected.reasons.length ? selected.reasons : ["DIRECTOR_RECOMMENDATION"];
  const focus = selected.candidate.focusLabel;
  const summary = reasonCodes.includes("RESUME_SESSION")
    ? `Resume ${focus} where you left off.`
    : reasonCodes.includes("REVIEW_DUE")
      ? `Revisit ${focus} while it is ready to strengthen.`
      : reasonCodes.includes("CONTINUE_CHAPTER")
        ? `Continue building on ${focus}.`
        : `A good next adventure for ${focus}.`;
  return {
    intent: safeIntent,
    selected: selected.candidate,
    alternatives: scored.slice(1, 4).map(({ candidate }) => ({ id: candidate.id, intent: candidate.intent, label: candidate.label })),
    reasonCodes,
    title: selected.candidate.label.en,
    summary,
    score: selected.score,
    seed,
    estimatedMinutes: selected.candidate.estimatedMinutes,
  };
}
