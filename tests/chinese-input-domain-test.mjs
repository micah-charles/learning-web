import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { appendInputKey, codePoints, normaliseCode } from "../src/features/chinese-input/domain/code-normalisation.js";
import { evaluateAnswer, shouldAutoSubmitAnswer } from "../src/features/chinese-input/domain/answer-evaluator.js";
import { createSeededRandom } from "../src/features/chinese-input/domain/random.js";
import { generateSessionPlan } from "../src/features/chinese-input/domain/question-generator.js";
import {
  createFootballSessionPlan,
  createGoalTargets,
  evaluateGoalkeeperInput,
  footballTargetPosition,
  scoreFootballSave,
} from "../src/features/chinese-input/domain/football-game.js";
import { resolveKeyState } from "../src/features/chinese-input/domain/key-state.js";
import { updateCharacterMastery } from "../src/features/chinese-input/domain/mastery-engine.js";
import { scheduleNextReview } from "../src/features/chinese-input/domain/review-scheduler.js";
import { createChineseInputProgress, migrateChineseInputState } from "../src/features/chinese-input/domain/progress-migration.js";
import { migrateChineseInputCurriculumProgress } from "../src/features/chinese-input/domain/curriculum-migration.js";
import { validateChineseInputDataset } from "../src/features/chinese-input/domain/schemas.js";
import { adaptGeneratedChineseInputDataset } from "../src/features/chinese-input/data/adapt-generated-curriculum.js";
import {
  FOOTBALL_CHALLENGES,
  buildFootballChallengeLesson,
  buildKingdomModel,
  readinessForLesson,
} from "../src/features/chinese-input/kingdom/kingdom-model.js";

const readJson = (path) => JSON.parse(readFileSync(resolve(path), "utf8"));
const generatedRoot = "learning-data/chinese-input/generated-curriculum/preview";
const dataset = adaptGeneratedChineseInputDataset({
  bundle: {
    manifest: readJson(`${generatedRoot}/curriculum_manifest.json`),
    stages: readJson(`${generatedRoot}/stages.json`),
    lessons: readJson(`${generatedRoot}/lessons.json`),
    assessments: readJson(`${generatedRoot}/assessment_graph.json`),
    games: readJson(`${generatedRoot}/game_graph.json`),
    migration: readJson(`${generatedRoot}/learner_progress_migration.json`),
    source: "generated-preview",
  },
  characterDocument: readJson("learning-data/chinese-input/canonical/canonical_characters.json"),
  readingDocument: readJson("learning-data/chinese-input/canonical/canonical_character_readings.json"),
});

assert.equal(normaliseCode(" d d "), "DD");
assert.equal(appendInputKey("D", "d", "cangjie"), "DD");
assert.equal(appendInputKey("A", "B", "quick"), "AB");
assert.equal(appendInputKey("AB", "C", "quick"), "AB");
assert.deepEqual(codePoints("𠀀林"), ["𠀀", "林"]);

assert.equal(evaluateAnswer({ input: "DD", expectedCodes: ["DD"], method: "cangjie" }).correct, true);
assert.equal(evaluateAnswer({ input: "DA", expectedCodes: ["AD"], method: "cangjie" }).errorType, "wrong-order");
assert.equal(evaluateAnswer({ input: "A", expectedCodes: ["AB"], method: "cangjie" }).errorType, "missing-key");
assert.equal(evaluateAnswer({ input: "AB", expectedCodes: ["AB", "AC"], method: "cangjie" }).matchedCode, "AB");
assert.equal(evaluateAnswer({ input: "DD", expectedCodes: ["D"], method: "quick", questionMethod: "cangjie" }).errorType, "wrong-method");
assert.equal(shouldAutoSubmitAnswer("D", ["DD"]), false);
assert.equal(shouldAutoSubmitAnswer("DD", ["DD"]), true);
assert.equal(shouldAutoSubmitAnswer("A", ["A", "AB"]), false);
assert.equal(shouldAutoSubmitAnswer("AB", ["A", "AB"]), true);
assert.equal(shouldAutoSubmitAnswer("ZZ", ["AB", "AC"]), true);

assert.equal(resolveKeyState(["available", "expected", "pressed"]), "pressed");
assert.equal(createSeededRandom(42)(), createSeededRandom(42)());

assert.equal(dataset.characters.length, 3000);
assert.ok(dataset.lessons.length >= 500);
assert.equal(dataset.characters.filter((character) => character.cangjie.keySequence.includes("Z") || character.quick.keySequence.includes("Z")).length, 0);
const inputToolsLesson = dataset.lessons.find((entry) => entry.id === "cj-stage-00-lesson-013");
assert.equal(inputToolsLesson.category, "input-tools");
assert.equal(inputToolsLesson.title.en, "Input Tools: Z special key");
assert.deepEqual(inputToolsLesson.inputToolKeys, ["Z"]);
const lesson = dataset.lessons.find((entry) => entry.method === "cangjie" && entry.characterIds.length >= 8);
const planA = generateSessionPlan({ dataset, lesson, seed: 42, questionCount: 8 });
const planB = generateSessionPlan({ dataset, lesson, seed: 42, questionCount: 8 });
assert.deepEqual(planA, planB);
const inputToolsPlan = generateSessionPlan({ dataset, lesson: inputToolsLesson, seed: 42, questionCount: 8 });
assert.ok(inputToolsPlan.questions.some((question) => question.metadata.inputToolKey === "Z"));
const orderedReview = {
  ...lesson,
  id: "adaptive-review-test",
  characterIds: ["u6797", "u65e5"],
  preserveCharacterOrder: true,
};
const reviewPlan = generateSessionPlan({ dataset, lesson: orderedReview, seed: 42, questionCount: 2 });
assert.deepEqual(reviewPlan.questions.map((question) => question.characterId), ["u6797", "u65e5"]);
const analysisLesson = dataset.lessons.find((entry) => entry.method === "cangjie" && entry.characterIds.length >= 6);
const analysisPlan = generateSessionPlan({ dataset, lesson: analysisLesson, seed: 42, questionCount: 6 });
const rootQuestion = analysisPlan.questions.find((question) => question.type === "root-recognition");
assert.equal(rootQuestion.expectedCodes[0].length, 1);
assert.equal(rootQuestion.expectedKeys.length, 1);

const footballLesson = dataset.lessons.find((entry) => entry.method === "cangjie" && entry.characterIds.length >= 9);
const footballPlan = createFootballSessionPlan({
  dataset,
  lesson: footballLesson,
  seed: 42,
  questionCount: 6,
});
assert.ok(footballPlan.questions.every((question) => question.type === "guided-typing"));
const footballTargets = createGoalTargets({
  dataset,
  lesson: footballLesson,
  method: "cangjie",
  question: footballPlan.questions[0],
});
assert.equal(footballTargets.length, 9);
assert.ok(footballTargets.some((character) => character.id === footballPlan.questions[0].characterId));
const footballTarget = dataset.characters.find((character) => character.id === footballPlan.questions[0].characterId);
const correctShot = evaluateGoalkeeperInput({
  input: footballPlan.questions[0].preferredCode,
  question: footballPlan.questions[0],
  method: "cangjie",
  startedAt: 1_000,
  answeredAt: 1_700,
});
assert.equal(correctShot.correct, true);
const wrongShot = evaluateGoalkeeperInput({
  input: "ZZZZZ",
  question: footballPlan.questions[0],
  method: "cangjie",
  startedAt: 1_000,
  answeredAt: 2_000,
});
assert.equal(wrongShot.correct, false);
const timedOutShot = evaluateGoalkeeperInput({
  input: "",
  question: footballPlan.questions[0],
  method: "cangjie",
  startedAt: 1_000,
  answeredAt: 4_000,
  timedOut: true,
});
assert.equal(timedOutShot.correct, false);
assert.equal(timedOutShot.errorType, "timeout");
assert.deepEqual(footballTargetPosition(0), { zone: 1, column: 0, row: 0, x: 26, y: 20 });
assert.deepEqual(footballTargetPosition(8), { zone: 9, column: 2, row: 2, x: 74, y: 48 });
assert.deepEqual(
  scoreFootballSave({ correct: true, reactionMs: 700, streak: 2 }),
  { score: 110, coins: 55, xp: 30, rating: "Lightning", multiplier: 1.1 },
);
assert.equal(scoreFootballSave({ correct: false, reactionMs: 500, streak: 5 }).score, 0);

const emptyModuleProgress = createChineseInputProgress();
const firstJourney = dataset.lessons.find((entry) => entry.method === "cangjie");
assert.equal(readinessForLesson(firstJourney, emptyModuleProgress).band, "ready");
const kingdomModel = buildKingdomModel({
  dataset,
  moduleProgress: emptyModuleProgress,
  miniGameProfile: { xp: 0, coins: 0 },
  method: "cangjie",
  currentRootKey: "A",
});
assert.equal(kingdomModel.currentRoot.key, "A");
assert.ok(kingdomModel.journey);
assert.equal(kingdomModel.dimensions.length, 9);
const toolOnlyProgress = createChineseInputProgress();
toolOnlyProgress.roots.Z = { exposures: 4, masteryScore: 100 };
assert.equal(buildKingdomModel({
  dataset,
  moduleProgress: toolOnlyProgress,
  miniGameProfile: { xp: 0, coins: 0 },
  method: "cangjie",
  currentRootKey: "A",
}).practisedRootCount, 0);
assert.equal(FOOTBALL_CHALLENGES.length, 9);
for (const challenge of FOOTBALL_CHALLENGES) {
  const challengeLesson = buildFootballChallengeLesson({
    challengeId: challenge.id,
    dataset,
    moduleProgress: emptyModuleProgress,
    method: "cangjie",
    journeyLesson: kingdomModel.journey.lesson,
    reviewLesson: null,
    currentRootKey: "A",
    now: new Date("2026-07-31T00:00:00Z"),
  });
  assert.ok(challengeLesson.characterIds.length > 0, `${challenge.id} should have a playable pool`);
  assert.ok(challengeLesson.activeKeys.length > 0, `${challenge.id} should expose its keyboard keys`);
}

const result = evaluateAnswer({ input: "DD", expectedCodes: ["DD"], method: "cangjie" });
const mastery = updateCharacterMastery({}, result, { now: 0 });
assert.equal(mastery.correct, 1);
assert.ok(mastery.masteryScore > 0);
assert.equal(scheduleNextReview({ correct: true, streak: 1, now: 0 }), "1970-01-01T00:10:00.000Z");

const oldState = { prefs: { quiz: { datasetId: "core" } }, progress: { words: { a: {} } } };
migrateChineseInputState(oldState);
migrateChineseInputState(oldState);
assert.equal(oldState.prefs.quiz.datasetId, "core");
assert.deepEqual(oldState.progress.chineseInputLab, createChineseInputProgress());
assert.equal(oldState.prefs.chineseInputLab.locale, "zh-HK");
assert.equal(oldState.prefs.chineseInputLab.autoPronounce, true);
const emptyLocaleState = {
  prefs: { chineseInputLab: { locale: "", autoPronounce: false } },
  progress: { chineseInputLab: createChineseInputProgress() },
};
migrateChineseInputState(emptyLocaleState);
assert.equal(emptyLocaleState.prefs.chineseInputLab.locale, "zh-HK");
assert.equal(emptyLocaleState.prefs.chineseInputLab.autoPronounce, false);
assert.equal(emptyLocaleState.prefs.chineseInputLab.currentRootKey, "A");
assert.deepEqual(emptyLocaleState.progress.chineseInputLab.discoveredNodes, {});

const validation = validateChineseInputDataset(dataset);
assert.equal(validation.valid, true, validation.errors.join("\n"));
const invalidDataset = structuredClone(dataset);
invalidDataset.characters[0].cangjie.acceptedCodes = [];
const invalidValidation = validateChineseInputDataset(invalidDataset);
assert.equal(invalidValidation.valid, false);
assert.ok(invalidValidation.errors.some((error) => error.includes("acceptedCodes is empty")));

const migrated = migrateChineseInputCurriculumProgress(
  createChineseInputProgress(),
  { migrationVersion: 1 },
  [{ lessonId: "cj-stage-00-lesson-013", newRoots: ["cj-A", "cj-Z"], newCharacters: [] }],
  "digest",
);
assert.deepEqual(migrated.lessons["cj-stage-00-lesson-013"].requiredEntityIds, ["cj-A"]);

console.log("Chinese Input domain tests passed.");
