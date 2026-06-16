# Learning Web QA Engine

This folder contains deterministic Playwright tests for Learning Web / FoxChild.

The QA engine uses three layers:

1. Product behaviour config in `src/config/learningBehaviourConfig.js`
2. QA behaviour config in `qa/config/qa-behaviour.config.json`
3. Real pack JSON from `data/`

## Key Commands

`npm run qa:config-check`

`npm run qa:smoke`

`npm run qa:data-sample`

`npm run qa:full`

`npm run qa:report`

## Sample vs Full Mode

Sample mode runs a deterministic subset per category.

Full mode runs all supported records:

```bash
QA_FULL_DATA=true npm run qa:full
```

## Notes

- No AI, OCR, or screenshot-only judgement is used.
- Tests prefer `data-testid`, semantic roles, and real JSON-derived answers.
- Standalone Builder is a continuous deck, so `sentenceBuilder.expectedRounds`
  represents how many cards the QA engine exercises in a baseline run.
