export const DIFFICULTY_PRESETS = {
  assist: { id: "assist", deadlineMs: 6000, label: "New player assist" },
  standard: { id: "standard", deadlineMs: 3000, label: "Standard" },
  expert: { id: "expert", deadlineMs: 2200, label: "Expert" },
  hardcore: { id: "hardcore", deadlineMs: 1700, label: "Hardcore" },
};

export function estimateChallengeComplexity(challenge) {
  const answerLength = String(challenge?.correctAnswer || "").length;
  const optionCount = challenge?.answers?.length || 2;
  const promptLength = String(challenge?.prompt || "").length;
  return Math.min(1, (answerLength / 18) * .5 + (optionCount / 4) * .3 + (promptLength / 120) * .2);
}

export function getAdaptiveDeadline({
  challenge,
  playMode = "lesson",
  skillRating = 0,
  averageReactionMs = 0,
  attempts = 0,
} = {}) {
  if (playMode === "hardcore") return DIFFICULTY_PRESETS.hardcore.deadlineMs;
  if (attempts < 5) return DIFFICULTY_PRESETS.assist.deadlineMs;
  const complexityAssist = Math.round(estimateChallengeComplexity(challenge) * 900);
  const historyAssist = averageReactionMs > 0 ? Math.max(-400, Math.min(1200, averageReactionMs - 2600)) : 0;
  const masteryPressure = Math.min(650, Math.max(0, skillRating) * 4);
  return Math.max(1500, Math.min(6500, 3000 + complexityAssist + historyAssist + (playMode === "lesson" ? 700 : 0) - masteryPressure));
}
