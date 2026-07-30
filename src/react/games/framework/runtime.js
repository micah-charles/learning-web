import { evaluateChallenge } from "./challengeAdapter.js";
import { calculatePerformance } from "./performanceEngine.js";

export function createMiniGameSession({
  gameId,
  challenges,
  playMode = "lesson",
  goal = 10,
  profile,
  boss = false,
  seed = Date.now(),
}) {
  return {
    id: `${gameId}_${seed}`,
    gameId,
    playMode,
    boss,
    status: "playing",
    goal,
    challengeIndex: 0,
    challenges,
    attempts: [],
    startedAt: new Date().toISOString(),
    previousSkillRating: profile?.skillRating || 0,
  };
}

export function submitMiniGameAnswer(session, response, reactionMs, timedOut = false) {
  if (!session || session.status !== "playing" || !session.challenges.length) return null;
  const challenge = session.challenges[session.challengeIndex % session.challenges.length];
  const correct = !timedOut && evaluateChallenge(challenge, response);
  const attempt = {
    challengeId: challenge.id,
    sourceId: challenge.sourceId,
    response: timedOut ? "" : response,
    expected: challenge.correctAnswer,
    correct,
    timedOut,
    reactionMs: Math.max(0, Math.round(reactionMs || 0)),
  };
  session.attempts.push(attempt);
  session.challengeIndex += 1;
  const reachedGoal = session.playMode !== "endless" && session.attempts.length >= session.goal;
  if (reachedGoal) session.status = "complete";
  return { attempt, challenge, reachedGoal };
}

export function finishMiniGameSession(session) {
  if (!session) return null;
  session.status = "complete";
  return {
    ...calculatePerformance({
      attempts: session.attempts,
      previousSkillRating: session.previousSkillRating,
      boss: session.boss,
      hardcore: session.playMode === "hardcore",
    }),
    id: session.id,
    gameId: session.gameId,
    playMode: session.playMode,
    boss: session.boss,
    completed: true,
    startedAt: session.startedAt,
    completedAt: new Date().toISOString(),
  };
}
