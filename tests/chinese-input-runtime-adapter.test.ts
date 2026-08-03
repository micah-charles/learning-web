import assert from "node:assert/strict";
import test from "node:test";
import { buildRecommendation } from "../src/learning-runtime/director/recommendation";
import { chineseInputWorldAdapter, type ChineseInputDataset, type ChineseInputProgress } from "../src/features/chinese-input/runtime/chinese-input-world-adapter";

const dataset: ChineseInputDataset = {
  manifest: { datasetId: "test", datasetVersion: "1", checksum: "sha256:test", counts: { roots: 1, characters: 1, lessons: 1 } },
  roots: [{ id: "root-a", key: "A", primaryRoot: "日", labelEn: "sun", category: "nature" }],
  characters: [{ id: "u65e5", char: "日", meaning: { en: "sun" }, cangjie: { preferredCode: "A", acceptedCodes: ["A"], keySequence: ["A"] }, quick: { preferredCode: "A", acceptedCodes: ["A"], keySequence: ["A"] } }],
  lessons: [{ id: "lesson-1", method: "cangjie", stage: 1, order: 1, title: { en: "Sun Path", zhHant: "日之路" }, activeKeys: ["A"], introducedKeys: ["A"], reviewedKeys: [], characterIds: ["u65e5"], estimatedMinutes: 5 }],
};
const progress: ChineseInputProgress = { lessons: {}, roots: {}, characters: {}, attemptEvents: [], discoveredNodes: {} };
const context = { method: "cangjie" as const, currentRootKey: "A", preferredJourneyId: "lesson-1" };

test("Chinese Input adapter maps module data into generic world contracts", () => {
  const world = chineseInputWorldAdapter.buildWorld(dataset, progress, context);
  assert.equal(world.worldId, "foxchild.chinese-input");
  assert.equal(world.nodes[0].id, "root-a");
  assert.equal(world.chapters[0].id, "lesson-1");
  assert.equal(world.capabilities.includes("chinese-input.football"), true);
  assert.equal(Array.isArray(world.nodes[0].metadata?.relatedCharacters), true);
  assert.equal(world.nodes[0].metadata?.completion, 0);
});

test("Chinese Input adapter owns Chinese evaluator references outside the generic Director", () => {
  const now = "2026-08-03T12:00:00.000Z";
  const world = chineseInputWorldAdapter.buildWorld(dataset, progress, context);
  const evidence = chineseInputWorldAdapter.buildEvidence(dataset, progress, context, now);
  const candidates = chineseInputWorldAdapter.buildCandidates(world, evidence, context);
  const recommendation = buildRecommendation({ candidates, evidence, intent: "journey", preferredId: "lesson-1", now, seed: "seed" });
  const blocks = chineseInputWorldAdapter.buildActivityBlocks(recommendation, world, evidence, context);
  assert.equal(blocks[0].capabilityId, "chinese-input.lesson");
  assert.equal(JSON.stringify(blocks).includes("input-method:cangjie"), true);
});

test("Chinese Input adapter can assemble a mixed region block", () => {
  const world = chineseInputWorldAdapter.buildWorld(dataset, progress, context);
  const evidence = chineseInputWorldAdapter.buildEvidence(dataset, progress, context, "2026-08-03T12:00:00.000Z");
  const candidates = chineseInputWorldAdapter.buildCandidates(world, evidence, context);
  const candidate = { ...candidates[0], objectiveRefs: ["root-a"], metadata: { ...candidates[0].metadata, customNodeIds: ["root-a"] } };
  const recommendation = { selected: candidate, reasonCodes: [], title: "Custom", summary: "Custom", alternatives: [], intent: "journey" as const, score: 1, seed: "test", estimatedMinutes: 5 };
  const blocks = chineseInputWorldAdapter.buildActivityBlocks(recommendation, world, evidence, context);
  assert.equal(blocks[0].nodeIds[0], "root-a");
  assert.equal(blocks[0].challenges.length, 1);
});

test("Input Tools roots stay out of character regions and cumulative lesson links", () => {
  const inputToolsDataset: ChineseInputDataset = {
    manifest: { datasetId: "test", datasetVersion: "1", checksum: "sha256:test", counts: { roots: 2, characters: 1, lessons: 2 } },
    roots: [
      { id: "root-a", key: "A", primaryRoot: "日", labelEn: "sun", category: "nature" },
      { id: "root-z", key: "Z", primaryRoot: "符", labelEn: "special key", category: "special", inputTool: true },
    ],
    characters: [{ id: "u65e5", char: "日", meaning: { en: "sun" }, cangjie: { preferredCode: "A", acceptedCodes: ["A"], keySequence: ["A"] }, quick: { preferredCode: "A", acceptedCodes: ["A"], keySequence: ["A"] } }],
    lessons: [
      { id: "lesson-regular", method: "cangjie", stage: 1, order: 1, title: { en: "Regular lesson" }, activeKeys: ["A", "Z"], introducedKeys: ["A"], reviewedKeys: [], characterIds: ["u65e5"], estimatedMinutes: 5, category: "journey" },
      { id: "lesson-tools", method: "cangjie", stage: 0, order: 2, title: { en: "Input Tools: Z special key" }, activeKeys: ["A", "Z"], introducedKeys: ["A", "Z"], reviewedKeys: [], characterIds: ["u65e5"], estimatedMinutes: 5, category: "input-tools", inputToolKeys: ["Z"] },
    ],
  };
  const world = chineseInputWorldAdapter.buildWorld(inputToolsDataset, progress, context);
  const zNode = world.nodes.find((node) => node.id === "root-z");
  assert.equal(zNode?.metadata?.contentCategory, "input-tools");
  assert.deepEqual(zNode?.metadata?.characterIds, []);
  assert.deepEqual((zNode?.metadata?.relatedLessons as Array<{ id: string }>).map((lesson) => lesson.id), ["lesson-tools"]);
  assert.equal(world.chapters.find((chapter) => chapter.id === "lesson-regular")?.nodeIds.includes("root-z"), false);
  assert.equal(world.chapters.find((chapter) => chapter.id === "lesson-tools")?.metadata?.category, "input-tools");
});
