# FoxChild Learning Runtime and Chinese Input world

Status: implemented on the Chinese Input Kingdom pilot
UI specification: `FoxChild_Chinese_Input_UI_Implementation_Prompt_v2.md`

## Architecture boundary

`src/learning-runtime/` is the reusable, subject-neutral platform layer. It owns the Learning Director, recommendation and immutable session planning, checkpoint control, activity registry, and reusable world UI. It does not know about Chinese characters, roots, Cangjie, Quick, or football grading.

`src/features/chinese-input/runtime/chinese-input-world-adapter.ts` is the domain adapter. It maps the verified Chinese dataset and learner evidence into generic world nodes, chapters, candidates, activity blocks, and challenges. Existing lesson and game components continue to perform domain-specific presentation and grading.

## Runtime curriculum

The browser loads only committed generated curriculum through `generated-curriculum-adapter.js` and `adapt-generated-curriculum.js`. Runtime fallback to the former seed dataset has been removed. The build validator requires exactly 3,000 canonical characters and at least 500 adapted lessons; the current preview produces 560 runtime lessons.

Preview and production bundles are distinguished by manifest status. An invalid or missing bundle fails visibly instead of silently serving reduced content. `learning-data/chinese-input/migrations/legacy-lesson-migration.json` contains only stable migration identifiers and is not a lesson source or curriculum-policy input.

## World navigation

The Floating Flower is the module navigator and exposes exactly six destinations:

1. Journey
2. Training
3. Review
4. Arena
5. Explore
6. Collection

Settings remains in the world HUD. The Flower can be dragged with pointer or touch input, is clamped to the visible viewport, persists its position through `ProgressContext`, and expands into a mobile grid. The `F` key toggles it for keyboard users.

## Preserved learning capabilities

| Capability | Implementation |
|---|---|
| Lesson generation and grading | `LessonPlayer.jsx`, question generator, answer evaluator |
| Root recognition | Explicit one-key root contract and root-to-key feedback |
| Guided typing | Complete accepted code; no first-key completion for multi-key characters |
| Keyboard hints | Toggleable expected-key highlight; inactive grey, lesson keys green, hint yellow |
| Football | Nine goal zones, lesson character pools, typed canonical grading, pronunciation |
| Review and collection | Existing mastery, scheduler, character collection, and detail views |
| Progress | Existing Chinese progress plus schema-versioned generic runtime checkpoint |

## Environment map

| Flower destination | Environment |
|---|---|
| Journey | Illustrated chapter path generated from all runtime lessons |
| Training | Root focus and verified 26-key keyboard |
| Review | Review Library shelves for due, weak, recent, and mastered knowledge |
| Arena | Activity hall; Goalkeeper Challenge is playable and other plugins are represented honestly |
| Explore | Five-region Knowledge World built from verified root nodes |
| Collection | Museum wings; Characters & Roots opens the full existing collection |

No destination uses hard locks. Readiness and recommendations are advisory.

## Accessibility and sensory controls

- Dialog focus, Escape closing, labelled controls, keyboard activation, and touch-sized targets are retained.
- Reduced-motion disables decorative animation.
- Pronunciation follows the existing Cantonese/Mandarin, speech-enabled, and auto-pronounce preferences.
- World sound effects use short Web Audio cues only after direct user interaction and can be disabled.

## Verification gates

- `npm run typecheck`
- `npm run test:learning-runtime`
- `npm run test:chinese-input`
- `npm run validate:chinese-input-data`
- `npm run qa:config-check`
- desktop and mobile Playwright coverage in `qa/tests/chinese-input-lab.spec.ts`
- `npm run build`

Generated Study Book or search artifacts that change incidentally during build are not part of this feature commit.
