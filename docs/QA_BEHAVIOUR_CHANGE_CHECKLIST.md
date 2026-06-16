# QA Behaviour Change Checklist

Any developer or AI coding agent who changes Learning Web behaviour should
check whether the QA expectations need updating too.

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

1. Update product behaviour config:

   `src/config/learningBehaviourConfig.js`

2. Update QA behaviour config:

   `qa/config/qa-behaviour.config.json`

3. Run:

   `npm run qa:config-check`

4. Run smoke test:

   `npm run qa:smoke`

5. If the change affects data-driven questions, run:

   `npm run qa:data-sample`

6. Before release, run:

   `npm run qa:full`

Important:

- Do not change hardcoded UI behaviour without updating the shared behaviour config.
- The QA engine reads expectations from QA config and local pack JSON.
- If behaviour changes but QA config is not updated, scheduled verification may
  give false failures or false passes.
