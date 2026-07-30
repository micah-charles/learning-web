import { evaluateAnswer } from "./answer-evaluator.js";
import { createSeededRandom, deterministicShuffle } from "./random.js";
import { eligibleCharacters, generateSessionPlan } from "./question-generator.js";

function seedFromText(value) {
  return Array.from(String(value)).reduce(
    (seed, character) => Math.imul(seed ^ character.codePointAt(0), 16777619) >>> 0,
    2166136261,
  );
}

export function createFootballSessionPlan({
  dataset,
  lesson,
  method = lesson?.method || "cangjie",
  seed = 1,
  questionCount = 10,
  createdAt = new Date(0).toISOString(),
}) {
  return generateSessionPlan({
    dataset,
    lesson: {
      ...lesson,
      stage: Math.max(5, lesson.stage || 1),
      activityMix: { rootRecognition: 0, guidedTyping: 1 },
    },
    method,
    seed,
    questionCount,
    createdAt,
  });
}

export function createGoalTargets({
  dataset,
  lesson,
  method,
  question,
  maximumTargets = 9,
}) {
  const target = dataset.characters.find((character) => character.id === question.characterId);
  if (!target) throw new Error(`Football target ${question.characterId} was not found.`);
  const pool = eligibleCharacters(dataset, lesson, method);
  const random = createSeededRandom(seedFromText(question.id));
  const distractors = deterministicShuffle(
    pool.filter((character) => character.id !== target.id),
    random,
  ).slice(0, Math.max(0, maximumTargets - 1));
  return deterministicShuffle([target, ...distractors], random);
}

export function evaluateGoalkeeperInput({
  input,
  question,
  method,
  startedAt,
  answeredAt,
  timedOut = false,
}) {
  const evaluation = evaluateAnswer({
    input: timedOut ? "" : input,
    expectedCodes: question.expectedCodes,
    method,
    questionMethod: question.method,
    startedAt,
    answeredAt,
  });
  return {
    ...evaluation,
    correct: !timedOut && evaluation.correct,
    errorType: timedOut ? "timeout" : evaluation.errorType,
    timedOut,
  };
}

export function footballTargetPosition(zoneIndex) {
  const safeIndex = Math.min(8, Math.max(0, Number(zoneIndex) || 0));
  const column = safeIndex % 3;
  const row = Math.floor(safeIndex / 3);
  return {
    zone: safeIndex + 1,
    column,
    row,
    x: 26 + column * 24,
    y: 20 + row * 14,
  };
}

export function scoreFootballSave({ correct, reactionMs = 0, streak = 0 }) {
  if (!correct || reactionMs > 3000) {
    return { score: 0, coins: 0, xp: 0, rating: "Goal", multiplier: 1 };
  }
  const band = reactionMs <= 800
    ? { score: 100, coins: 50, xp: 30, rating: "Lightning" }
    : reactionMs <= 1200
      ? { score: 70, coins: 35, xp: 20, rating: "Perfect" }
      : reactionMs <= 2000
        ? { score: 50, coins: 25, xp: 15, rating: "Great" }
        : { score: 30, coins: 15, xp: 10, rating: "Save" };
  const multiplier = 1 + Math.min(10, Math.max(0, streak)) * .05;
  return {
    ...band,
    score: Math.round(band.score * multiplier),
    coins: Math.round(band.coins * multiplier),
    multiplier,
  };
}
