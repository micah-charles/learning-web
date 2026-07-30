# Chinese Input Lab Business Rules

## Canonical codes are pinned static data
code: `src/features/chinese-input/data/seed-dataset.json`, `scripts/chinese-input/build-dataset.mjs`, `docs/chinese-input-lab/DATA_PROVENANCE.md` | updated: 2026-07-28 | status: active

### Context
Chinese Input correctness comes from pinned Rime Cangjie 5 and Quick sources. Unihan supplies language metadata. Runtime AI is not authoritative.

### Why it matters
Mixing input-method versions or generating codes dynamically can teach wrong answers and corrupt mastery.

### Guidance for future agents
Keep the build offline, validate every record, retain per-record provenance, and evaluate Cangjie and Quick independently.

## Chinese Input Lab is not a Language Ladder pack
code: `src/features/chinese-input/`, `src/react/App.jsx`, `src/storage.js` | updated: 2026-07-28 | status: active

### Context
The module shares app infrastructure but owns keyboard, code, lesson and mastery rules.

### Why it matters
Forcing it into Progressive Language packs would couple character input codes to vocabulary assumptions.

### Guidance for future agents
Share shell, storage, speech and design primitives. Keep input-method domain logic inside the feature boundary.

## Canonical source acquisition is explicit and offline at build time
code: `scripts/chinese-input/canonical/`, `learning-data/chinese-input/canonical/`, `docs/chinese-input-lab/CANONICAL_DATASET.md` | updated: 2026-07-28 | status: active

### Context
The canonical dataset uses authoritative EDB, MOE, Rime and Unihan inputs. Network acquisition is a deliberate refresh command; generation and application builds consume pinned local snapshots.

### Why it matters
Live website changes, Unicode-order placeholders, mixed source versions or AI-filled metadata can silently reorder the curriculum and teach incorrect codes.

### Guidance for future agents
Keep source row-count and anchor checks, hashes and deterministic timestamps. Do not weaken missing-enrichment warnings by inventing meanings, examples or structure. Add a new source only with a documented version, licence and conflict policy.

OpenCC mappings alone do not prove that a glyph is Simplified-only: valid Traditional characters such as `了`, `干` and `只` have context-dependent conversions. Reject a glyph only when OpenCC and Unihan `kTraditionalVariant` evidence agree.

## Canonical source facts are not curriculum facts
code: `scripts/chinese-input/canonical/`, `learning-data/chinese-input/canonical/`, `docs/chinese-input-lab/CANONICAL_DATASET.md` | updated: 2026-07-29 | status: active

### Context
The EDB inventory establishes Hong Kong presence, while the pinned Taiwan MOE tables provide corpus frequency. Neither source defines FoxChild lesson order, Hong Kong frequency rank, literacy stage, school grade or pedagogical difficulty.

### Why it matters
Renaming a corpus bucket as a lesson, treating code length as visual structure, or promoting a dictionary gloss/category heuristic into reviewed learning metadata creates false educational certainty.

### Guidance for future agents
Keep MOE, EDB, calculated selection and curriculum concepts in separate fields. Unknown values stay blank. Calculated proxies must name their method and confidence. Heuristic categories stay pending proposals. Character readings are relational and multi-valued; never concatenate them into context-sensitive word pronunciation or select a pedagogical primary reading without review.

## Decomposition and families require pinned relationships
code: `scripts/chinese-input/canonical/`, `learning-data/chinese-input/canonical/canonical_character_decompositions.*`, `learning-data/chinese-input/canonical/canonical_character_families.*` | updated: 2026-07-29 | status: active

### Context
CHISE IDS supplies complete source-backed decomposition for the selected set. Unicode Unihan supplies provisional phonetic classes and semantic-variant relationships.

### Why it matters
Component, phonetic and semantic relationships are different facts. Combining them into one invented “family” field would make hints and teaching explanations unreliable.

### Guidance for future agents
Keep family memberships relational and typed. Record basis, source, confidence and review status. Derive layout only from IDS, never from Cangjie length. CHISE-derived outputs carry GPL-2.0-or-later obligations and must retain attribution.

Preserve ordered IDS leaf occurrences separately from the unique component set. Repetition is structural data: `多` has `夕|夕`, occurrence count 2 and unique count 1. Learner UI must resolve component IDs through display metadata and must never render raw CHISE entity syntax.

## Curriculum compilation is fail-closed on human review
code: `scripts/chinese-input/curriculum/`, `learning-data/chinese-input/reviewed/`, `learning-data/chinese-input/curriculum/` | updated: 2026-07-29 | status: active

### Context
Learner definitions, Hong Kong suitability, display readings, curriculum priority and stage are human educational decisions.

### Why it matters
A deterministic compiler can preserve reviewed decisions but cannot replace them. Allowing an empty or heuristic review table to emit production lessons would recreate the schema-v1 error at another layer.

### Guidance for future agents
Keep the production threshold fail-closed. Test with explicitly labelled fixtures only. Canonical data feeds the compiler; reviewed input controls inclusion and order; lesson, assessment and game graphs remain separate outputs.

Production review also requires a policy-approved Hong Kong corpus source. An empty approved-source list is an intentional block, not a configuration omission. Formal written Chinese, written Cantonese and typing-extension status are separate reviewed fields.

## Cross-source glyph reconciliation is explicit
code: `scripts/chinese-input/canonical/constants.mjs`, `scripts/chinese-input/canonical/generate.mjs`, `learning-data/chinese-input/canonical/semantic_audit.json` | updated: 2026-07-29 | status: active

### Context
The EDB list represents the common formal character `說` with source glyph `説`, while MOE, Rime, Unihan and CHISE use `說`. Exact glyph joining silently excluded a top-frequency formal character.

### Why it matters
Broad variant normalisation can merge characters that have distinct Hong Kong educational or typing significance. Exact matching alone can also lose valid cross-source records.

### Guidance for future agents
Maintain a small reviewed alias table with source evidence. Preserve the original glyph in `edb_source_glyph`, validate every alias against pinned Unihan and ranking/code sources, and expose anchor gate diagnostics. Never apply every `kZVariant` automatically.

## Generated curriculum is disposable and entity-stable
code: `scripts/chinese-input/curriculum/`, `learning-data/chinese-input/curriculum-policy/`, `learning-data/chinese-input/generated-curriculum/`, `src/features/chinese-input/domain/curriculum-migration.js` | updated: 2026-07-29 | status: active

### Context
Curriculum shape changes whenever reviewed evidence or policy changes. Lesson position is therefore not a durable learner identity.

### Why it matters
Hand-edited generated lessons create drift, while lesson-number-only progress either erases mastery or falsely grants it after regeneration.

### Guidance for future agents
Edit canonical, reviewed or policy inputs and regenerate. Keep generated/do-not-edit headers and deterministic input digests. Attach mastery to `cj-<key>`, Unicode character IDs and deterministic word IDs; use lesson migration metadata only to reconstruct partial/completed lesson state. Preview and production status must remain impossible to confuse.

## Render selects committed curriculum at Vite build time
code: `render.yaml`, `src/features/chinese-input/data/generated-curriculum-adapter.js` | updated: 2026-07-30 | status: active

### Context
The adapter falls back to the legacy seed when `VITE_CHINESE_CURRICULUM_SOURCE` is absent. Render serves static Vite output, so this variable is resolved during `npm run build`, not when a browser requests the site.

### Why it matters
Uploading generated artifacts without selecting them still displays the legacy five-lesson seed. Conversely, asking Render to regenerate lessons would duplicate the deterministic compiler and create deployment drift.

### Guidance for future agents
Keep generated lesson artifacts committed and verified by CI. Set `VITE_CHINESE_CURRICULUM_SOURCE=generated-preview` in the Render Blueprint while preview is intended for deployment. Render must build and serve those files only; curriculum regeneration remains a deliberate local or CI command.
