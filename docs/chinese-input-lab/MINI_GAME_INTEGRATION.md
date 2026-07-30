# Mini-game integration

Future games must consume the canonical dataset and pure evaluator. They must not embed answer maps.

Adapter contract:

```js
{
  getQuestion(options),
  evaluate(question, input),
  record(result)
}
```

Suitable future modes include Forest Root Hunt, Railway Code Sequence, timed typing and root matching. The adapter should call `generateSessionPlan`, `evaluateAnswer` and the Chinese Input progress hook, while keeping arcade round statistics separate from quiz analytics.

## Chinese football

Chinese football is the first implementation of this contract:

- Every lesson card exposes its own football game.
- The lesson's eligible character list is the only target pool.
- The goal always has nine numbered zones. Up to nine lesson characters occupy distinct zones; larger pools rotate deterministic subsets between shots.
- One lesson character is highlighted for 0.8 seconds, followed by a three-second typing window.
- The learner is the goalkeeper and enters that character's canonical Cangjie or Quick code. The answer auto-submits as soon as it can be graded.
- The ball always travels to the highlighted zone. Correct input sends the keeper to the same zone for a save; wrong input or timeout sends the keeper to a different zone and awards the shooter a goal.
- `createFootballSessionPlan()` delegates question creation to `generateSessionPlan()`.
- `evaluateGoalkeeperInput()` delegates code grading to `evaluateAnswer()` so accepted-code and method rules stay identical to normal lessons.
- Save rewards follow the reference speed bands, with a 5% combo bonus per consecutive save up to 50%.
- Learning attempts update character mastery through `recordAttempt()`. Finished matches also update the shared mini-game profile; passed matches use normal lesson completion so unlocks remain consistent.

The game UI must never infer or embed a separate answer table. Goal characters and accepted codes always come from the active validated dataset.
