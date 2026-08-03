import assert from "node:assert/strict";
import test from "node:test";
import { buildRecommendation } from "../src/learning-runtime/director/recommendation";
import { buildSessionPlan, isValidSessionPlan } from "../src/learning-runtime/director/session-plan";
import { ActivityRegistry } from "../src/learning-runtime/runtime/activity-registry";
import { createCheckpoint, isCompatibleCheckpoint } from "../src/learning-runtime/runtime/checkpoint-store";
import { SessionController } from "../src/learning-runtime/runtime/session-controller";
import type { ActivityBlock, DirectorCandidate, LearnerEvidenceSnapshot, SessionRequest } from "../src/learning-runtime/types";

const evidence: LearnerEvidenceSnapshot = {
  id: "snapshot-1",
  worldId: "test-world",
  capturedAt: "2026-08-03T12:00:00.000Z",
  completedById: {},
  dueCount: 4,
  weakCount: 1,
  recentAccuracy: 75,
  hasEvidence: true,
  preferredChapterId: "chapter-1",
};

const candidates: DirectorCandidate[] = [
  { id: "chapter-1", kind: "chapter", intent: "journey", label: { en: "Forest Trail" }, focusLabel: "the forest roots", estimatedMinutes: 7 },
  { id: "review-1", kind: "review", intent: "review", label: { en: "Memory Grove" }, focusLabel: "four due ideas", estimatedMinutes: 4, dueValue: 4 },
];

test("Director recommendations are deterministic and intent-sensitive", () => {
  const input = { candidates, evidence, intent: "review" as const, now: evidence.capturedAt, seed: "seed-1" };
  const first = buildRecommendation(input);
  const second = buildRecommendation(input);
  assert.deepEqual(first, second);
  assert.equal(first.selected?.id, "review-1");
  assert.ok(first.reasonCodes.includes("REVIEW_DUE"));
});

test("session planner accepts adapter-built generic blocks and freezes its result", () => {
  const recommendation = buildRecommendation({ candidates, evidence, intent: "journey", now: evidence.capturedAt, seed: "seed-2" });
  const request: SessionRequest = {
    requestId: "request-1",
    worldId: "test-world",
    intent: "journey",
    now: evidence.capturedAt,
    seed: "seed-2",
    learnerSnapshotId: evidence.id,
  };
  const blocks: ActivityBlock[] = [{
    blockId: "new:chapter-1",
    purpose: "new",
    capabilityId: "example-practice",
    chapterId: "chapter-1",
    nodeIds: ["node-1"],
    skillIds: ["skill-1"],
    challenges: [],
    contentRevision: "revision-1",
  }];
  const plan = buildSessionPlan({ request, candidate: candidates[0], recommendation, blocks, contentRevision: "revision-1" });
  assert.equal(isValidSessionPlan(plan), true);
  assert.equal(Object.isFrozen(plan), true);
  assert.equal(Object.isFrozen(plan.blocks), true);
  assert.equal(JSON.stringify(plan).includes("chinese-input"), false);
  assert.equal(JSON.stringify(plan).includes("characterIds"), false);
});

test("activity registry rejects duplicate capabilities", () => {
  const registry = new ActivityRegistry();
  registry.register({ capabilityId: "example-practice", render: () => null });
  assert.equal(registry.has("example-practice"), true);
  assert.throws(() => registry.register({ capabilityId: "example-practice", render: () => null }), /already registered/);
});

test("checkpoints reject incompatible content revisions", () => {
  const recommendation = buildRecommendation({ candidates, evidence, intent: "journey", now: evidence.capturedAt, seed: "seed-3" });
  const plan = buildSessionPlan({
    request: { requestId: "request-2", worldId: "test-world", intent: "journey", now: evidence.capturedAt, seed: "seed-3", learnerSnapshotId: evidence.id },
    candidate: candidates[0],
    recommendation,
    blocks: [{ blockId: "new:chapter-1", purpose: "new", capabilityId: "example-practice", chapterId: "chapter-1", nodeIds: [], skillIds: [], challenges: [], contentRevision: "revision-1" }],
    contentRevision: "revision-1",
  });
  const checkpoint = createCheckpoint(plan, { blockIndex: 1 }, "2026-08-03T12:02:00.000Z");
  assert.equal(isCompatibleCheckpoint(checkpoint, "test-world", "revision-1"), true);
  assert.equal(isCompatibleCheckpoint(checkpoint, "test-world", "revision-2"), false);
});

test("session controller advances across challenges and blocks", () => {
  const recommendation = buildRecommendation({ candidates, evidence, intent: "journey", now: evidence.capturedAt, seed: "seed-4" });
  const plan = buildSessionPlan({
    request: { requestId: "request-3", worldId: "test-world", intent: "journey", now: evidence.capturedAt, seed: "seed-4", learnerSnapshotId: evidence.id },
    candidate: candidates[0],
    recommendation,
    blocks: [
      {
        blockId: "new:chapter-1",
        purpose: "new",
        capabilityId: "example-practice",
        chapterId: "chapter-1",
        nodeIds: [],
        skillIds: [],
        challenges: [
          { challengeId: "one", capabilityId: "example-practice", evaluatorRef: "example", prompt: {}, responseContract: {}, nodeIds: [], skillIds: [], contentRevision: "revision-1" },
          { challengeId: "two", capabilityId: "example-practice", evaluatorRef: "example", prompt: {}, responseContract: {}, nodeIds: [], skillIds: [], contentRevision: "revision-1" },
        ],
        contentRevision: "revision-1",
      },
      { blockId: "retention:review", purpose: "retention", capabilityId: "example-review", nodeIds: [], skillIds: [], challenges: [], contentRevision: "revision-1" },
    ],
    contentRevision: "revision-1",
  });
  const controller = new SessionController();
  assert.equal(controller.start(plan).position.challengeIndex, 0);
  assert.equal(controller.advance().position.challengeIndex, 1);
  assert.equal(controller.advance().position.blockIndex, 1);
  assert.equal(controller.advance().status, "completed");
});
