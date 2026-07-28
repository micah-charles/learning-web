export const REVIEW_INTERVALS_MS = [
  10 * 60 * 1000,
  24 * 60 * 60 * 1000,
  3 * 24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
  14 * 24 * 60 * 60 * 1000,
  30 * 24 * 60 * 60 * 1000,
];

export function scheduleNextReview({
  correct,
  streak = 0,
  errorType = null,
  now = Date.now(),
}) {
  if (!correct) {
    const penalty = errorType === "wrong-order" ? 5 * 60 * 1000 : 60 * 1000;
    return new Date(now + penalty).toISOString();
  }
  const interval = REVIEW_INTERVALS_MS[Math.min(Math.max(0, streak - 1), REVIEW_INTERVALS_MS.length - 1)];
  return new Date(now + interval).toISOString();
}

export function isReviewDue(entry, now = Date.now()) {
  if (!entry?.nextReviewAt) return false;
  return Date.parse(entry.nextReviewAt) <= now;
}
