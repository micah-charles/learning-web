import type {
  ActivityBlock,
  DirectorCandidate,
  DirectorRecommendation,
  SessionPlan,
  SessionRequest,
} from "../types";

export const SESSION_PLAN_SCHEMA_VERSION = 1;
export const DIRECTOR_POLICY_VERSION = "foxchild-director-v1";

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value as Record<string, unknown>).sort().reduce<Record<string, unknown>>((result, key) => {
    result[key] = sortObject((value as Record<string, unknown>)[key]);
    return result;
  }, {});
}

export function canonicalSerialize(value: unknown): string {
  return JSON.stringify(sortObject(value));
}

export function digestPlan(value: unknown): string {
  let hash = 2166136261;
  for (const character of canonicalSerialize(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  return value;
}

export function buildSessionPlan({
  request,
  candidate,
  recommendation,
  blocks,
  contentRevision,
  minimumAccuracy = 0.8,
  policyVersion = DIRECTOR_POLICY_VERSION,
}: {
  request: SessionRequest;
  candidate: DirectorCandidate;
  recommendation: DirectorRecommendation;
  blocks: readonly ActivityBlock[];
  contentRevision: string;
  minimumAccuracy?: number;
  policyVersion?: string;
}): SessionPlan {
  if (!request.requestId || !request.worldId || !request.now || !request.seed) {
    throw new Error("Session request requires requestId, worldId, now and seed.");
  }
  if (!candidate?.id) throw new Error("A selected Director candidate is required.");
  if (!blocks.length) throw new Error("The world adapter must provide at least one activity block.");
  for (const block of blocks) {
    if (!block.blockId || !block.capabilityId || !block.contentRevision) {
      throw new Error("Every activity block requires blockId, capabilityId and contentRevision.");
    }
  }
  const core = {
    schemaVersion: SESSION_PLAN_SCHEMA_VERSION,
    sessionId: `session:${request.worldId}:${request.requestId}`,
    worldId: request.worldId,
    intent: request.intent,
    policyVersion,
    contentRevision,
    learnerSnapshotId: request.learnerSnapshotId,
    seed: request.seed,
    createdAt: request.now,
    estimatedMinutes: recommendation.estimatedMinutes,
    chapterRefs: blocks.filter((block) => block.chapterId).map((block) => ({ chapterId: block.chapterId as string, revision: contentRevision })),
    objectiveRefs: [...(candidate.objectiveRefs || [])],
    blocks: [...blocks],
    presentation: { ...(request.presentation || {}) },
    recommendation: {
      title: recommendation.title,
      summary: recommendation.summary,
      reasonCodes: [...recommendation.reasonCodes],
      alternatives: [...recommendation.alternatives],
    },
    completionPolicy: { minimumAccuracy, allowRetry: true, preserveAttempts: true },
  };
  return deepFreeze({ ...core, planDigest: digestPlan(core) });
}

export function isCompatibleSessionPlan(
  plan: SessionPlan | null | undefined,
  constraints: { worldId?: string; contentRevision?: string } = {},
): boolean {
  return Boolean(plan
    && plan.schemaVersion === SESSION_PLAN_SCHEMA_VERSION
    && (!constraints.worldId || plan.worldId === constraints.worldId)
    && (!constraints.contentRevision || plan.contentRevision === constraints.contentRevision));
}

export function isValidSessionPlan(plan: SessionPlan | null | undefined): boolean {
  if (!plan || !isCompatibleSessionPlan(plan) || typeof plan.planDigest !== "string") return false;
  const { planDigest, ...core } = plan;
  return digestPlan(core) === planDigest;
}
