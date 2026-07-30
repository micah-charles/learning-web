# Mini-game framework

## One profile and one challenge contract
code: `src/react/games/framework/`, `src/storage.js` | updated: 2026-07-30 | status: active

### Context
FoxChild games span vocabulary challenges, sentence building and Chinese input. Their visuals and controls differ, but performance, progression and rewards must behave consistently.

### Why it matters
Per-game scoring or storage creates incompatible progress and makes new games expensive to add. Copying learning content into a game creates an unreviewed answer source.

### Guidance for future agents
Register games in `gameRegistry.js`. Adapt ordinary quiz content to the generic challenge contract through `challengeAdapter.js`; specialised domains such as Chinese Input may retain their canonical question/evaluator contract. Record completed games through `MiniGameProvider`, calculate outcomes with `performanceEngine.js`, and keep cosmetic rewards non-competitive. Persistent profile state belongs at `progress.miniGames`; replays may use `saveStore.js`. Never let a game bypass its source domain's evaluator.
