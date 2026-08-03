# Project Lore Index

## Chinese Input Lab

- [Canonical codes are pinned static data](chinese-input/business-rules.md#canonical-codes-are-pinned-static-data) - active - Never use runtime AI or mixed Cangjie versions for correctness.
- [X-prefixed Rime shortcuts are not educational canonical codes](chinese-input/business-rules.md#x-prefixed-rime-shortcuts-are-not-educational-canonical-codes) - active - Prefer standard non-X codes before deriving Quick.
- [Lesson Hint controls only next-key highlighting](chinese-input/business-rules.md#lesson-hint-controls-only-next-key-highlighting) - active - Hint off means no yellow cue; Hint on advances one yellow key at a time.
- [Canonical source acquisition is explicit and offline at build time](chinese-input/business-rules.md#canonical-source-acquisition-is-explicit-and-offline-at-build-time) - active - Live source refresh and deterministic generation are separate commands.
- [Canonical source facts are not curriculum facts](chinese-input/business-rules.md#canonical-source-facts-are-not-curriculum-facts) - active - Keep corpus, Hong Kong, calculated and reviewed educational concepts separate.
- [Decomposition and families require pinned relationships](chinese-input/business-rules.md#decomposition-and-families-require-pinned-relationships) - active - Keep component, phonetic and semantic relationships typed and sourced.
- [Curriculum compilation is fail-closed on human review](chinese-input/business-rules.md#curriculum-compilation-is-fail-closed-on-human-review) - active - Reviewed inputs, not heuristics, control lesson output.
- [Cross-source glyph reconciliation is explicit](chinese-input/business-rules.md#cross-source-glyph-reconciliation-is-explicit) - active - Reviewed aliases preserve source glyphs and prevent silent anchor loss.
- [Generated curriculum is disposable and entity-stable](chinese-input/business-rules.md#generated-curriculum-is-disposable-and-entity-stable) - active - Policy and reviewed inputs regenerate lessons while progress remains attached to stable entities.
- [Render selects committed curriculum at Vite build time](chinese-input/business-rules.md#render-selects-committed-curriculum-at-vite-build-time) - active - The Blueprint selects committed preview artifacts; Render never regenerates lessons.
- [Chinese Input Lab is not a Language Ladder pack](chinese-input/business-rules.md#chinese-input-lab-is-not-a-language-ladder-pack) - active - Share infrastructure while keeping input-method rules isolated.
- [Mini-games use lesson characters and canonical grading](chinese-input/business-rules.md#mini-games-use-lesson-characters-and-canonical-grading) - active - Generate and grade from canonical Chinese Input contracts; never embed a game answer map.
- [The Floating Flower owns Chinese Input module navigation](chinese-input/business-rules.md#the-floating-flower-owns-chinese-input-module-navigation) - active - Keep one knowledge world; open learning modes as sessions or overlays while global navigation remains in the platform menu.
- [The FoxChild Learning Runtime must remain domain-neutral](chinese-input/business-rules.md#the-foxchild-learning-runtime-must-remain-domain-neutral) - active - Module adapters, never the Director, own subject nouns, evaluators and challenge construction.
- [Knowledge regions are gateways, not lesson links](chinese-input/business-rules.md#knowledge-regions-are-gateways-not-lesson-links) - active - Selecting a root opens reusable region actions; the Director remains the only session generator.
- [Runtime curriculum has no legacy seed fallback](chinese-input/business-rules.md#runtime-curriculum-has-no-legacy-seed-fallback) - active - Runtime and QA use the committed 3,000-character generated curriculum or fail visibly.

## Mini-game framework

- [One profile and one challenge contract](mini-game-framework.md#one-profile-and-one-challenge-contract) - active - Games share scoring, rewards, achievements, adaptive difficulty, persistence and content adapters.
