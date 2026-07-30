import { unlockAchievements } from "./achievementEngine.js";

export const DEFAULT_MINI_GAME_PROFILE = {
  schemaVersion: 1,
  xp: 0,
  coins: 0,
  skillRating: 0,
  skillTier: "Rookie",
  totalPlays: 0,
  totalAnswered: 0,
  totalCorrect: 0,
  gamesCompleted: 0,
  perfectGames: 0,
  longestStreak: 0,
  fastestReactionMs: 0,
  averageReactionMs: 0,
  bestScore: 0,
  bestGame: null,
  achievements: [],
  inventory: ["gloves_classic", "ball_classic"],
  equipped: { gloves: "gloves_classic", ball: "ball_classic" },
  byGame: {},
  recentResults: [],
};

export function mergeMiniGameResult(profile, result) {
  const previousAnswered = profile.totalAnswered || 0;
  profile.xp += result.xp || 0;
  profile.coins += result.coins || 0;
  profile.skillRating = result.skillRating ?? profile.skillRating;
  profile.skillTier = result.skillTier || profile.skillTier;
  profile.totalPlays += 1;
  profile.totalAnswered += result.answered || 0;
  profile.totalCorrect += result.correct || 0;
  profile.gamesCompleted += result.completed ? 1 : 0;
  profile.perfectGames += result.perfect ? 1 : 0;
  profile.longestStreak = Math.max(profile.longestStreak, result.longestStreak || 0);
  profile.fastestReactionMs = !profile.fastestReactionMs
    ? result.fastestReactionMs || 0
    : Math.min(profile.fastestReactionMs, result.fastestReactionMs || profile.fastestReactionMs);
  const combinedAnswered = previousAnswered + (result.answered || 0);
  profile.averageReactionMs = combinedAnswered
    ? Math.round(((profile.averageReactionMs * previousAnswered) + ((result.averageReactionMs || 0) * (result.answered || 0))) / combinedAnswered)
    : 0;
  profile.bestScore = Math.max(profile.bestScore, result.score || 0);
  if (!profile.bestGame || (result.score || 0) > (profile.bestGame.score || 0)) {
    profile.bestGame = { gameId: result.gameId, score: result.score || 0, at: result.completedAt };
  }
  const game = profile.byGame[result.gameId] || { plays: 0, bestScore: 0, bestAccuracy: 0 };
  profile.byGame[result.gameId] = {
    plays: game.plays + 1,
    bestScore: Math.max(game.bestScore, result.score || 0),
    bestAccuracy: Math.max(game.bestAccuracy, result.accuracy || 0),
    lastPlayedAt: result.completedAt,
  };
  profile.recentResults = [result, ...(profile.recentResults || [])].slice(0, 20);
  const achievementResult = unlockAchievements(profile, profile.achievements);
  profile.achievements = achievementResult.ids;
  return achievementResult.newlyUnlocked;
}
