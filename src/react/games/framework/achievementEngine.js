const MILESTONES = [1, 10, 25, 50, 100, 250, 500, 1000];

export const ACHIEVEMENTS = [
  ...MILESTONES.map((target) => ({
    id: `correct_${target}`,
    title: target === 1 ? "First Goal" : `${target} Correct Answers`,
    description: `Answer ${target} game challenges correctly.`,
    test: (stats) => stats.totalCorrect >= target,
  })),
  ...[1, 5, 10, 25, 50, 100].map((target) => ({
    id: `games_${target}`,
    title: target === 1 ? "Game Clear" : `${target} Games Cleared`,
    description: `Complete ${target} learning games.`,
    test: (stats) => stats.gamesCompleted >= target,
  })),
  ...[5, 10, 20, 35, 50].map((target) => ({
    id: `combo_${target}`,
    title: `${target} Answer Combo`,
    description: `Reach a ${target}-answer combo.`,
    test: (stats) => stats.longestStreak >= target,
  })),
  { id: "lightning_reflex", title: "Lightning Reflex", description: "Answer in under one second.", test: (stats) => stats.fastestReactionMs > 0 && stats.fastestReactionMs < 1000 },
  { id: "no_mistake", title: "No Mistake", description: "Finish a perfect game.", test: (stats) => stats.perfectGames >= 1 },
  { id: "legend", title: "FoxChild Legend", description: "Reach Legend rating.", test: (stats) => stats.skillRating >= 2400 },
];

export function unlockAchievements(stats, unlockedIds = []) {
  const unlocked = new Set(unlockedIds);
  const newlyUnlocked = ACHIEVEMENTS.filter((achievement) => !unlocked.has(achievement.id) && achievement.test(stats));
  return {
    ids: [...unlockedIds, ...newlyUnlocked.map((achievement) => achievement.id)],
    newlyUnlocked,
  };
}
