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
