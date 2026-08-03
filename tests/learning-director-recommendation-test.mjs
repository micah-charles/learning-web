import assert from "node:assert/strict";
import test from "node:test";
import { buildLearnerSignals, buildRecommendation } from "../src/learning-director/domain/recommendation.js";
import { buildSessionPlan, digestPlan, isCompatibleSessionPlan, isValidSessionPlan } from "../src/learning-director/domain/session-plan.js";

test("Director prefers an explicit unfinished journey and explains it", () => {
  const candidates = [
    { id: "chapter-a", kind: "chapter", title: { en: "Roots A" }, focusLabel: "Roots A", estimatedMinutes: 5 },
    { id: "chapter-b", kind: "chapter", title: { en: "Roots B" }, focusLabel: "Roots B", estimatedMinutes: 7 },
  ];
  const result = buildRecommendation({ candidates, learner: { completedById: {}, dueCount: 0 }, preferredId: "chapter-b", now: Date.parse("2026-08-03T12:00:00Z"), seed: "fixture" });
  assert.equal(result.selected.id, "chapter-b");
  assert.ok(result.reasonCodes.includes("CONTINUE_CHAPTER"));
  assert.match(result.summary, /Roots B/);
  assert.equal(result.seed, "fixture");
});

test("Review intent prefers review content without hiding alternatives", () => {
  const result = buildRecommendation({
    intent: "review",
    candidates: [
      { id: "chapter-a", kind: "chapter", title: { en: "New roots" } },
      { id: "review-a", kind: "review", title: { en: "Strengthen recall" }, focusLabel: "4 characters" },
    ],
    learner: { completedById: {}, dueCount: 4 },
    now: Date.parse("2026-08-03T12:00:00Z"),
  });
  assert.equal(result.selected.id, "review-a");
  assert.ok(result.reasonCodes.includes("REVIEW_DUE"));
  assert.equal(result.alternatives[0].id, "chapter-a");
});

test("Learner signals stay method-specific", () => {
  const signals = buildLearnerSignals({
    method: "quick",
    now: Date.parse("2026-08-03T12:00:00Z"),
    moduleProgress: {
      lessons: { "lesson-a": { status: "completed" } },
      attemptEvents: [{ method: "cangjie", correct: false }],
      characters: {
        charA: { quick: { attempts: 1, masteryScore: 40 }, cangjie: { attempts: 1, masteryScore: 90 } },
      },
    },
  });
  assert.equal(signals.weakCount, 1);
  assert.equal(signals.recentAttempts.length, 0);
});

test("Session plans are deterministic, mixed when review is due, and frozen", () => {
  const request = { requestId: "req-1", worldId: "chinese-input", learnerSnapshotId: "snap-1", intent: "journey", method: "cangjie", now: "2026-08-03T12:00:00.000Z", seed: "fixture" };
  const candidate = { id: "chapter-a", kind: "chapter", title: { en: "Roots A" }, activeKeys: ["A", "M"], characterIds: ["char-1"], passCriteria: { minimumAccuracy: 0.8 } };
  const review = { id: "review-a", kind: "review", characterIds: ["char-2"] };
  const args = { request, candidate, reviewCandidate: review, learnerSnapshot: { dueCount: 2 }, contentRevision: "0.1.0", recommendation: { title: "Roots A", reasonCodes: ["NEW_FOUNDATION"] } };
  const first = buildSessionPlan(args);
  const second = buildSessionPlan(args);
  assert.equal(first.planDigest, second.planDigest);
  assert.equal(digestPlan({ ...first, planDigest: undefined }), digestPlan({ ...second, planDigest: undefined }));
  assert.equal(first.blocks.length, 2);
  assert.equal(first.blocks[1].purpose, "retention");
  assert.ok(Object.isFrozen(first));
  assert.ok(isCompatibleSessionPlan(first, { worldId: "chinese-input", contentRevision: "0.1.0", method: "cangjie" }));
  assert.ok(isValidSessionPlan(first, { worldId: "chinese-input", contentRevision: "0.1.0", method: "cangjie" }));
});
