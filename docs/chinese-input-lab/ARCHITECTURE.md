# Architecture

The feature boundary is `src/features/chinese-input/`.

- `data/` contains the keyboard map, lesson catalogue and committed seed.
- `domain/` contains pure normalisation, validation, evaluation, generation, mastery, review and migration logic.
- `hooks/` bridges physical keyboard events, speech and `ProgressContext`.
- `components/` renders dashboard, keyboard, lessons, roots, decomposition and collection.
- `ChineseInputPage.jsx` owns internal views; the global app owns routing and overlays.

`src/config/chineseInputLabConfig.js` centralises `disabled`, `preview` and `public` availability. App routing allows direct preview access; nav, home, onboarding and SEO only discover a public rollout.

No backend or runtime LLM is used. The dataset is bundled by Vite. Progress uses the existing `learningGermanWeb.v1` storage key through `ProgressContext`.
