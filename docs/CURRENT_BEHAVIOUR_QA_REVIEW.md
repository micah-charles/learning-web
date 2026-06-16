# Current Behaviour QA Review

This note records where Learning Web behaviour is currently defined so the QA
engine can validate the real product instead of relying on stale assumptions.

| Feature | Current Behaviour | Where Defined | QA-Aware? | Recommendation |
|---|---|---|---|---|
| Onboarding gate | First-time users see wizard; returning users default to guided or everything depending on stored progress | `src/react/App.jsx`, `src/react/pages/OnboardingPage.jsx`, `src/react/utils/personalisation.js`, `src/storage.js` | Partly | Mirror the flow in central behaviour config and add deterministic onboarding tests with storage reset. |
| Quiz defaults | Default question count is `18`; options are `18`, `30`, or `all`; exclude mastered defaults to `true` | `src/storage.js`, `src/react/pages/QuizPage.jsx` | No | Centralise the defaults in shared behaviour config and validate QA config before Playwright runs. |
| Quiz mode resolution | Question modes depend on subject, direction, answer mode, and available item types | `src/quiz.js`, `src/react/hooks/useQuizSession.js`, `src/quiz-helpers.js` | No | Keep generator logic in place, but expose QA-relevant defaults and expectations via config. |
| Vocabulary audio | Vocabulary cards always expose a speak button; voice practice is optional and language-only | `src/react/pages/VocabPage.jsx`, `src/react/components/learning/VoicePracticeButton.jsx` | No | Add stable selectors and test for button presence rather than browser audio playback success. |
| Reading defaults | Translation is off by default; autoplay voice is on by default; evidence links appear only when `sourceRef` exists | `src/storage.js`, `src/react/pages/ReadingPage.jsx` | No | Capture defaults in shared behaviour config and keep question-answer checks data-driven. |
| Standalone Sentence Builder | Builder page is a continuous shuffled deck with no fixed completion screen; cards advance one at a time | `src/react/hooks/useBuilderSession.js`, `src/react/pages/BuilderPage.jsx` | No | Use config to declare the deterministic number of cards QA should exercise per run, and document that this is a QA session expectation, not a product round cap. |
| Progressive lesson order | Lesson flow is `listen -> vocab -> builder -> arcade -> review` in the React stepper | `src/react/components/languageLadder/LessonStepper.jsx`, `src/react/pages/LanguagePage.jsx`, `src/progressive-language-lesson.js` | No | Move the expected step order into shared config and make Playwright fail clearly when it changes. |
| Language Arcade pass rule | Two-round sequence: `quiz-hunt`, then `snake-builder`; each round requires 100% accuracy to advance | `src/react/hooks/useLanguageArcadeSession.js`, `src/react/components/learning/LanguageArcadePhase.jsx` | No | Expose sequence and required accuracy in central config so QA can verify the rule without hardcoding it in specs. |
| Voice practice retry rules | Speech recognition retries unclear answers; max attempts `3`; unclear and wrong-language states are distinct | `src/react/hooks/useVoicePractice.js`, `src/react/services/speechRecognitionService.js` | No | Mirror these thresholds in shared config and prefer mocked recognition in tests instead of real microphone input. |
| Study Book behaviour | Drawer opens from dataset-aware buttons, supports split mode, anchor navigation, image lightbox, and file switching | `src/react/components/learning/StudyBookDrawer.jsx`, `src/react/context/StudyBookContext.jsx`, `src/study-book.js` | No | Add stable selectors for open/drawer state and verify correct pack content rather than relying on layout screenshots. |
| Mobile arcade controls | Arcade games use overlay D-pad controls on small screens and below-board controls otherwise | `src/react/games/arcade/QuizHuntGame.jsx`, `src/react/games/arcade/SnakeBuilderGame.jsx`, `src/react/games/arcade/ui/DpadControls.jsx` | No | Capture the intended control mode in config and add a mobile Playwright check for control visibility. |
| Smart Test structure | Smart Test dynamically builds sections from available pack content: MCQ, builder or flashcard fallback, fill-blank, reading, argument | `src/react/hooks/useSmartTestSession.js`, `src/react/pages/SmartTestPage.jsx` | Partly | Keep as a follow-up for dedicated data-driven QA coverage; current baseline focuses on the core modules named in the QA prompt. |

## Behaviours Not Fully Centralised Yet

- Standalone Builder does not have a native fixed-round completion rule. The new
  behaviour config therefore records the deterministic number of cards that QA
  should exercise in a baseline run, while the product itself remains a
  continuous deck.
- Smart Test builds sections dynamically from pack content. It is documented
  here, but this baseline QA engine does not yet include a dedicated Smart Test
  spec because the current prompt deliverables focus on the core study flows.
- Tutor layout already has its own Playwright coverage in `tests/playwright/`.
  The new QA engine leaves that specialist suite intact and focuses on the main
  learning modules.
