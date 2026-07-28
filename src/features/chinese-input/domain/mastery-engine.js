import { scheduleNextReview } from "./review-scheduler.js";

export const MASTERY_CONFIG = {
  correctGain: 14,
  firstTryBonus: 6,
  hintPenalty: 3,
  incorrectLoss: 10,
  min: 0,
  max: 100,
};

function clamp(value) {
  return Math.min(MASTERY_CONFIG.max, Math.max(MASTERY_CONFIG.min, value));
}

export function updateCharacterMastery(previous = {}, result, {
  hintCount = 0,
  firstTry = true,
  now = Date.now(),
} = {}) {
  const attempts = (previous.attempts || 0) + 1;
  const correct = (previous.correct || 0) + (result.correct ? 1 : 0);
  const incorrect = (previous.incorrect || 0) + (result.correct ? 0 : 1);
  const streak = result.correct ? (previous.streak || 0) + 1 : 0;
  const delta = result.correct
    ? MASTERY_CONFIG.correctGain + (firstTry ? MASTERY_CONFIG.firstTryBonus : 0) - hintCount * MASTERY_CONFIG.hintPenalty
    : -MASTERY_CONFIG.incorrectLoss;
  return {
    ...previous,
    attempts,
    firstTryCorrect: (previous.firstTryCorrect || 0) + (result.correct && firstTry ? 1 : 0),
    correct,
    incorrect,
    streak,
    hintCount: (previous.hintCount || 0) + hintCount,
    lastCode: result.normalisedInput,
    masteryScore: clamp((previous.masteryScore || 0) + delta),
    lastSeenAt: new Date(now).toISOString(),
    nextReviewAt: scheduleNextReview({ correct: result.correct, streak, errorType: result.errorType, now }),
  };
}

export function updateRootMastery(previous = {}, result, { durationMs = 0, now = Date.now() } = {}) {
  const exposures = (previous.exposures || 0) + 1;
  const streak = result.correct ? (previous.streak || 0) + 1 : 0;
  const oldEma = previous.responseTimeEMA || durationMs;
  return {
    ...previous,
    exposures,
    correct: (previous.correct || 0) + (result.correct ? 1 : 0),
    incorrect: (previous.incorrect || 0) + (result.correct ? 0 : 1),
    streak,
    masteryScore: clamp((previous.masteryScore || 0) + (result.correct ? 12 : -8)),
    lastSeenAt: new Date(now).toISOString(),
    nextReviewAt: scheduleNextReview({ correct: result.correct, streak, errorType: result.errorType, now }),
    responseTimeEMA: Math.round(oldEma * 0.7 + durationMs * 0.3),
  };
}
