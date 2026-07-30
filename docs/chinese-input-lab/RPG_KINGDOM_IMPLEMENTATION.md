# Chinese Input Kingdom implementation map

Status: implementation checklist for the RPG knowledge-world pilot  
Source: `FoxChild_Chinese_Input_RPG_UI_Codex_Master_Prompt_v4.md`  
Visual reference: `ChatGPT Image Jul 30, 2026, 11_57_32 PM.png`

## Superseding navigation decision

Section 26 of the master prompt supersedes the earlier fixed-building map. The learner remains in one current knowledge world. Functional modes open from the Floating Flower as overlays or existing learning sessions; they are not permanent destinations or a locked route chain.

## Existing components retained

| Capability | Existing implementation retained |
|---|---|
| Curriculum loading and validation | `generated-curriculum-adapter.js`, `dataset.js` |
| Lesson/session engine | `LessonPlayer.jsx`, question generator and evaluator |
| Football challenge | `ChineseFootballGame.jsx`, deterministic football adapter |
| Root keyboard | `VirtualCangjieKeyboard.jsx`, verified keyboard layout |
| Review and collection | `CharacterCollection.jsx`, review scheduler |
| Character detail | `CharacterDecomposition.jsx`, pronunciation control |
| Learner history | `useChineseInputProgress.js`, existing local storage migration |
| Rewards | shared mini-game profile and reward engine |

## New reusable platform pieces

- `kingdom/kingdom-model.js`: deterministic journey, readiness, mastery-dimension and companion adapter.
- `kingdom/ChineseInputKingdom.jsx`: current-world composition and contextual panels.
- `kingdom/FloatingFlower.jsx`: authoritative module navigator with focus management and keyboard support.
- `kingdom/KingdomOverlay.jsx`: accessible shared dialog/bottom-sheet frame for Explore, Review, Collection, Keyboard, Progress, Search and challenge content.
- `kingdom/kingdom.css`: responsive world layout, drawers, bottom sheets and reduced-motion behavior.
- `public/images/chinese-input/kingdom-world.webp`: optimized, text-free scenic artwork. All functional content remains HTML.

## Page and menu relationship

| Platform or module control | Destination/behavior |
|---|---|
| Existing FoxChild top navigation | Switches between platform modules; remains compact and scrollable |
| Flower centre | Returns to the Chinese Input Kingdom current-world home |
| Continue Journey | Launches the existing recommended lesson/session |
| Explore | Opens root/character discovery without leaving the current world |
| Review | Opens the existing due/weak-character experience |
| Football Challenge | Opens challenge-pool choices, then launches the existing football engine |
| Collection | Opens the existing character archive |
| Keyboard | Opens the full verified 26-key keyboard and root focus |
| Progress | Opens multi-dimensional mastery and an interactive knowledge constellation |
| Search | Opens discovery with search focused |

No permanent secondary sidebar or duplicate bottom navigation is introduced.

## Compatibility and migration risks

- Existing lesson IDs, mastery records, sessions, review records, achievements and coins remain unchanged.
- New world preferences are merged through the Chinese Input preference migration; old `lastView` values are retained but no longer control the primary navigation.
- Readiness is derived at render time and never written into mastery records.
- Adventure rank derives only from cosmetic mini-game XP and is labelled separately from learning mastery.
- Generated preview evidence warnings remain available through a compact disclosure rather than developer-facing dominant copy.
- The old page remains recoverable through Git history until the replacement passes unit, browser, responsive and production-build gates.

## Verification evidence

| Gate | Evidence |
|---|---|
| Navigation and interaction | Flower pointer/keyboard/Escape tests; focus trapping in Flower and overlays |
| Journey model | Unit coverage for readiness, one deterministic recommendation and nine football pools |
| Open access | Browser coverage confirms all Flower actions and challenge pools remain enabled |
| Compatibility | Migration tests preserve prior records while adding world context and discovered nodes |
| Responsive behavior | Desktop and Pixel-size mobile suites pass with horizontal-overflow checks |
| Speech | Mocked Cantonese speech synthesis confirms football’s Pronounce Target control invokes speech |
| Visual review | Desktop/mobile screenshots in `artifacts/`; mobile backdrop stacking and desktop radial overflow fixed during review |
| Production | Vite production bundle passes and uses the 232 KB text-free WebP with explicit intrinsic dimensions |

The full site’s existing large JavaScript chunk warning remains outside this feature’s scope; the Kingdom adds no new runtime dependency.
