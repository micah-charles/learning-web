export const SESSION_PLAN_SCHEMA_VERSION = 1;
export const DIRECTOR_POLICY_VERSION = "director-v1";

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value).sort().reduce((result, key) => {
    result[key] = sortObject(value[key]);
    return result;
  }, {});
}

export function canonicalSerialize(value) {
  return JSON.stringify(sortObject(value));
}

export function digestPlan(value) {
  let hash = 2166136261;
  for (const character of canonicalSerialize(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

function candidateId(candidate) {
  return String(candidate?.id || candidate?.chapterId || "");
}

function blockForCandidate(candidate, { purpose, worldId, contentRevision, method }) {
  const id = candidateId(candidate);
  if (!id) return null;
  const isReview = purpose === "retention";
  const nodeIds = isReview
    ? (candidate.characterIds || []).map((characterId) => `character:${characterId}`)
    : (candidate.activeKeys || []).map((key) => `root:${key}`);
  return {
    blockId: `${purpose}:${id}`,
    purpose,
    capabilityRequired: isReview ? "guided-typing" : "keyboard-input",
    chapterId: isReview ? undefined : id,
    nodeIds,
    skillIds: method ? [`chinese-input:${method}`] : [],
    challengeRefs: (candidate.characterIds || []).map((characterId) => ({
      challengeId: `${id}:${characterId}`,
      worldId,
      chapterId: isReview ? undefined : id,
      nodeIds: [`character:${characterId}`],
      skillIds: method ? [`chinese-input:${method}`] : [],
      evaluatorRef: `chinese-input.${method || "default"}.canonical-evaluator`,
      contentRevision,
    })),
    contentRevision,
  };
}

/**
 * Build the immutable Director output consumed by world adapters.
 * This module deliberately knows nothing about React, storage, or Chinese data.
 */
export function buildSessionPlan({
  request,
  candidate,
  reviewCandidate = null,
  learnerSnapshot = {},
  recommendation = {},
  worldId = request?.worldId || "world",
  contentRevision = "unknown",
  policyVersion = DIRECTOR_POLICY_VERSION,
  estimatedMinutes = candidate?.estimatedMinutes || 5,
} = {}) {
  if (!request?.requestId) throw new Error("Session requestId is required.");
  if (!candidate?.id) throw new Error("A selected candidate is required.");
  if (!request.now || !request.seed) throw new Error("Session request must inject now and seed.");

  const blocks = [];
  const selectedPurpose = candidate.kind === "review" ? "retention" : "new";
  const selectedBlock = blockForCandidate(candidate, { purpose: selectedPurpose, worldId, contentRevision, method: request.method });
  if (selectedBlock) blocks.push(selectedBlock);
  if (selectedPurpose !== "retention" && reviewCandidate && learnerSnapshot.dueCount > 0) {
    const reviewBlock = blockForCandidate(reviewCandidate, { purpose: "retention", worldId, contentRevision, method: request.method });
    if (reviewBlock) blocks.push(reviewBlock);
  }
  const core = {
    schemaVersion: SESSION_PLAN_SCHEMA_VERSION,
    sessionId: `session:${worldId}:${request.requestId}`,
    worldId,
    intent: request.intent || "journey",
    policyVersion,
    contentRevision,
    learnerSnapshotId: request.learnerSnapshotId || "local-current",
    seed: request.seed,
    createdAt: request.now,
    estimatedMinutes,
    chapterRefs: blocks.filter((block) => block.chapterId).map((block) => ({ chapterId: block.chapterId, revision: contentRevision })),
    expeditionIds: Array.isArray(request.expeditionIds) ? [...request.expeditionIds] : [],
    objectiveRefs: Array.isArray(candidate.objectiveRefs) ? [...candidate.objectiveRefs] : [],
    blocks,
    presentation: { method: request.method || "", locale: request.locale || "en-GB", accessibility: request.accessibility || {} },
    recommendation: {
      title: recommendation.title || candidate.title?.en || candidate.title || candidate.id,
      summary: recommendation.summary || "A useful next step for your current practice.",
      reasonCodes: [...(recommendation.reasonCodes || [])],
      evidenceRefs: [...(recommendation.evidenceRefs || [])],
      alternatives: [...(recommendation.alternatives || [])],
    },
    completionPolicy: { minimumAccuracy: candidate.passCriteria?.minimumAccuracy ?? 0.8, allowRetry: true, preserveAttempts: true },
  };
  return deepFreeze({ ...core, planDigest: digestPlan(core) });
}

export function isCompatibleSessionPlan(plan, { worldId, contentRevision, method } = {}) {
  return Boolean(plan
    && plan.schemaVersion === SESSION_PLAN_SCHEMA_VERSION
    && (!worldId || plan.worldId === worldId)
    && (!contentRevision || plan.contentRevision === contentRevision)
    && (!method || plan.presentation?.method === method));
}
