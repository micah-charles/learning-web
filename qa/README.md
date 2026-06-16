# Learning Web QA Engine

This folder contains deterministic Playwright tests for Learning Web / FoxChild.

Playwright QA is kept in the repo for local manual use by default.

GitHub Actions automatic Playwright QA on `push`, `pull_request`, and nightly
schedule has been disabled to avoid unnecessary Actions usage. The workflow is
still available as a manual `workflow_dispatch` run if someone explicitly wants
to trigger it from GitHub.

The QA engine uses three layers:

1. Product behaviour config in `src/config/learningBehaviourConfig.js`
2. QA behaviour config in `qa/config/qa-behaviour.config.json`
3. Real pack JSON from `data/`

## Local QA Commands

```bash
npm ci
npx playwright install
npm run qa:config-check
npm run qa:smoke
npm run qa:data-sample
```

Use these locally before merging important UI, data, or behaviour changes.

## Local Build Check

If you want to test the local production build:

```bash
npm run build
npm run qa:smoke
```

## Production Smoke Check

If you want to point Playwright at production manually:

```bash
QA_USE_LOCAL_SERVER=false QA_BASE_URL=https://www.foxchildidea.com npm run qa:smoke
```

## Additional Commands

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
- Keep `playwright.config.ts`, `qa/`, fixtures, configs, and scripts in place
  even though automatic GitHub Actions execution is disabled.
