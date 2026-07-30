const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function skillTier(rating = 0) {
  if (rating >= 2400) return "Legend";
  if (rating >= 1800) return "S+";
  if (rating >= 1400) return "S";
  if (rating >= 1050) return "A";
  if (rating >= 750) return "B";
  if (rating >= 450) return "C";
  return "Rookie";
}

export function calculatePerformance({
  attempts = [],
  previousSkillRating = 0,
  boss = false,
  hardcore = false,
} = {}) {
  const answered = attempts.length;
  const correct = attempts.filter((attempt) => attempt.correct).length;
  const accuracyRatio = answered ? correct / answered : 0;
  const correctTimes = attempts.filter((attempt) => attempt.correct).map((attempt) => attempt.reactionMs);
  const averageReactionMs = correctTimes.length
    ? Math.round(correctTimes.reduce((sum, value) => sum + value, 0) / correctTimes.length)
    : 0;
  const fastestReactionMs = correctTimes.length ? Math.min(...correctTimes) : 0;
  let streak = 0;
  let longestStreak = 0;
  attempts.forEach((attempt) => {
    streak = attempt.correct ? streak + 1 : 0;
    longestStreak = Math.max(longestStreak, streak);
  });
  const reactionScore = averageReactionMs ? clamp(1 - ((averageReactionMs - 900) / 5100), 0, 1) : 0;
  const comboScore = answered ? clamp(longestStreak / Math.max(5, answered), 0, 1) : 0;
  const speedBonus = Math.round(correct * reactionScore * 12);
  const comboBonus = Math.round(longestStreak * longestStreak * 5);
  const multiplier = (boss ? 1.25 : 1) * (hardcore ? 1.4 : 1);
  const perfect = answered > 0 && correct === answered;
  const stars = perfect ? 3 : accuracyRatio >= 0.8 ? 2 : accuracyRatio >= 0.6 ? 1 : 0;
  const score = Math.round((correct * 100 + speedBonus + comboBonus) * multiplier);
  const xp = Math.round((correct * 12 + speedBonus * .4 + stars * 15 + (perfect ? 30 : 0)) * multiplier);
  const coins = Math.max(0, Math.round((correct * 2 + longestStreak + stars * 4 + (perfect ? 10 : 0)) * multiplier));
  const performanceIndex = accuracyRatio * .65 + reactionScore * .25 + comboScore * .1;
  const skillDelta = Math.round((performanceIndex - .55) * 42 + (boss && perfect ? 12 : 0));
  const skillRating = clamp(previousSkillRating + skillDelta, 0, 3000);
  return {
    answered,
    correct,
    accuracy: Math.round(accuracyRatio * 100),
    averageReactionMs,
    fastestReactionMs,
    longestStreak,
    speedBonus,
    comboBonus,
    score,
    stars,
    perfect,
    xp,
    coins,
    skillDelta,
    skillRating,
    skillTier: skillTier(skillRating),
  };
}
