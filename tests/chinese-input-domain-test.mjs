import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { appendInputKey, codePoints, normaliseCode } from "../src/features/chinese-input/domain/code-normalisation.js";
import { evaluateAnswer, shouldAutoSubmitAnswer } from "../src/features/chinese-input/domain/answer-evaluator.js";
import { createSeededRandom } from "../src/features/chinese-input/domain/random.js";
import { generateSessionPlan } from "../src/features/chinese-input/domain/question-generator.js";
import { resolveKeyState } from "../src/features/chinese-input/domain/key-state.js";
import { updateCharacterMastery } from "../src/features/chinese-input/domain/mastery-engine.js";
import { scheduleNextReview } from "../src/features/chinese-input/domain/review-scheduler.js";
import { createChineseInputProgress, migrateChineseInputState } from "../src/features/chinese-input/domain/progress-migration.js";
import { validateChineseInputDataset } from "../src/features/chinese-input/domain/schemas.js";

const dataset = JSON.parse(readFileSync(resolve("src/features/chinese-input/data/seed-dataset.json"), "utf8"));

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

const lesson = dataset.lessons.find((entry) => entry.id === "cj-challenge-05");
const planA = generateSessionPlan({ dataset, lesson, seed: 42, questionCount: 8 });
const planB = generateSessionPlan({ dataset, lesson, seed: 42, questionCount: 8 });
assert.deepEqual(planA, planB);
const orderedReview = {
  ...lesson,
  id: "adaptive-review-test",
  characterIds: ["u6797", "u65e5"],
  preserveCharacterOrder: true,
};
const reviewPlan = generateSessionPlan({ dataset, lesson: orderedReview, seed: 42, questionCount: 2 });
assert.deepEqual(reviewPlan.questions.map((question) => question.characterId), ["u6797", "u65e5"]);
const analysisLesson = dataset.lessons.find((entry) => entry.id === "cj-analysis-04");
const analysisPlan = generateSessionPlan({ dataset, lesson: analysisLesson, seed: 42, questionCount: 6 });
const rootQuestion = analysisPlan.questions.find((question) => question.type === "root-recognition");
assert.equal(rootQuestion.expectedCodes[0].length, 1);
assert.equal(rootQuestion.expectedKeys.length, 1);

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

const validation = validateChineseInputDataset(dataset);
assert.equal(validation.valid, true, validation.errors.join("\n"));
const invalidDataset = structuredClone(dataset);
invalidDataset.characters[0].cangjie.acceptedCodes = [];
const invalidValidation = validateChineseInputDataset(invalidDataset);
assert.equal(invalidValidation.valid, false);
assert.ok(invalidValidation.errors.some((error) => error.includes("acceptedCodes is empty")));

console.log("Chinese Input domain tests passed.");
