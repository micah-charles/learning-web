# QA Behaviour Change Checklist

Any developer or AI coding agent who changes Learning Web behaviour should
check whether the QA expectations need updating too.

Playwright QA is a local-first workflow in this repo.

- Automatic GitHub Actions Playwright QA on `push`, `pull_request`, and nightly
  schedule is disabled.
- The GitHub Actions workflow is manual-only if someone explicitly triggers it.
- By default, run Playwright QA on your local machine before merging important
  product, data, or behaviour changes.

Examples of behaviour changes:

- Number of cards or rounds exercised in Builder QA
- Quiz question count defaults
- New lesson step added
- Progressive lesson step order changed
- Voice practice enabled or disabled
- Study Book image or split-mode behaviour changed
- Onboarding preset or defaults changed
- Mobile game controls changed
- Data pack structure changed

Required steps:

1. Install dependencies and browsers if needed:

   `npm ci`

   `npx playwright install`

2. Update product behaviour config:

   `src/config/learningBehaviourConfig.js`

3. Update QA behaviour config:

   `qa/config/qa-behaviour.config.json`

4. Run:

   `npm run qa:config-check`

5. Run smoke test:

   `npm run qa:smoke`

6. If the change affects data-driven questions, run:

   `npm run qa:data-sample`

7. Before release, run:

   `npm run qa:full`

Useful manual variants:

- Local production build:

  `npm run build`

  `npm run qa:smoke`

- Production URL smoke check:

  `QA_USE_LOCAL_SERVER=false QA_BASE_URL=https://www.foxchildidea.com npm run qa:smoke`

Important:

- Do not change hardcoded UI behaviour without updating the shared behaviour config.
- The QA engine reads expectations from QA config and local pack JSON.
- If behaviour changes but QA config is not updated, local verification may
  give false failures or false passes.
