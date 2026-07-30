import assert from "node:assert/strict";
import { calculatePerformance, skillTier } from "../src/react/games/framework/performanceEngine.js";
import { getAdaptiveDeadline } from "../src/react/games/framework/difficultyEngine.js";
import { buyCosmetic, equipCosmetic } from "../src/react/games/framework/rewardEngine.js";
import { DEFAULT_MINI_GAME_PROFILE, mergeMiniGameResult } from "../src/react/games/framework/progressEngine.js";
import { createMiniGameSession, finishMiniGameSession, submitMiniGameAnswer } from "../src/react/games/framework/runtime.js";
import { GAME_REGISTRY, getGameDefinition } from "../src/react/games/framework/gameRegistry.js";

const performance = calculatePerformance({
  attempts: [
    { correct: true, reactionMs: 900 },
    { correct: true, reactionMs: 1200 },
    { correct: false, reactionMs: 2000 },
  ],
  previousSkillRating: 500,
});
assert.equal(performance.correct, 2);
assert.equal(performance.accuracy, 67);
assert.ok(performance.xp > 0);
assert.equal(skillTier(2400), "Legend");
assert.ok(getAdaptiveDeadline({ attempts: 0 }) > getAdaptiveDeadline({ attempts: 10, playMode: "hardcore" }));

const profile = structuredClone(DEFAULT_MINI_GAME_PROFILE);
profile.coins = 200;
assert.equal(buyCosmetic(profile, "ball_comet").ok, true);
assert.equal(equipCosmetic(profile, "ball_comet"), true);
assert.equal(profile.equipped.ball, "ball_comet");

const challenges = [{
  id: "one",
  prompt: "Choose one",
  answers: ["一", "二"],
  correctAnswer: "一",
  sourceId: "u4e00",
}];
const session = createMiniGameSession({ gameId: "test", challenges, goal: 1, profile, seed: 1 });
assert.equal(submitMiniGameAnswer(session, "一", 800).attempt.correct, true);
const result = finishMiniGameSession(session);
mergeMiniGameResult(profile, result);
assert.equal(profile.totalPlays, 1);
assert.equal(profile.totalCorrect, 1);
assert.ok(profile.achievements.includes("correct_1"));
assert.equal(getGameDefinition("chinese-football").status, "playable");
assert.ok(GAME_REGISTRY.length >= 10);

console.log("Mini-game framework tests passed.");
