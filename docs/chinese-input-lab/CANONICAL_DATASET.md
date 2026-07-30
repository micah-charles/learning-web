# FoxChild Chinese canonical dataset

The canonical pipeline builds a deterministic Hong Kong-aware Traditional Chinese research dataset without using runtime AI or live web requests during normal application builds. Its current ordering is EDB-filtered and Taiwan-MOE-ranked; it is not yet Hong Kong-frequency-ranked.

## Outputs

Generated artifacts live in `learning-data/chinese-input/canonical/`:

- `canonical_characters.csv` and `canonical_characters.json` — 3,000 characters;
- `canonical_character_readings.csv` and `canonical_character_readings.json` — relational, multi-valued Cantonese and Mandarin readings;
- `canonical_character_decompositions.csv` and `.json` — pinned CHISE IDS structure and leaf components for every selected character;
- `canonical_component_metadata.csv` and `.json` — display-safe component resolution and unresolved-fallback status;
- `canonical_character_families.csv` and `.json` — component, Unihan phonetic-class and semantic-variant family memberships;
- `canonical_words.csv` and `canonical_words.json` — 10,000 words;
- `canonical_statistics.json`;
- `validation_report.md`;
- `coverage_report.md`;
- `semantic_audit.json` and `semantic_audit_report.md`;
- `cangjie_reference_audit.json` and `cangjie_reference_audit_report.md`;
- `character_review_queue.csv/json` and `review_dashboard.html/json`;
- `source_manifest.json`;
- `dataset_version.json`;
- `rejected_characters.json`.

Generated files must not be edited by hand.

## Source model

The explicit acquisition step pins local snapshots under `data-source/authoritative/`:

- Hong Kong Education Bureau online character inventory for Hong Kong coverage;
- Taiwan Ministry of Education Traditional Chinese character and word frequency tables for ranking;
- Rime Cangjie 5 commit `52d90a1b1312e74042b38c1cbc8142defbc53171`;
- Rime Quick 5 commit `5dcdb9e353d314239e9c8cddc0f42d52da4837bb`;
- Unicode Unihan 17.0.0 readings, IRG radical/stroke data and variants.
- OpenCC commit `2904aa4dd06df17c538fbeae9f1efa14e25bb4a5` for independent Simplified-to-Traditional verification.
- CHISE IDS commit `352e13378e411c322cfa16bfd7a6d21d670d7eca` for source-backed decomposition (GPL-2.0-or-later).

EDB order is never used as lesson order. The generator filters to records with verified Cangjie, source-attested Cantonese and Mandarin readings, and a Unihan definition. It rejects simplified-only records only when OpenCC and Unihan variant evidence agree, orders eligible records by the pinned MOE corpus, and then selects the requested 2,500–3,500 range. Requiring both simplified-variant sources avoids falsely excluding context-dependent Traditional characters such as `了`, `干` and `只`.

Cross-source glyph aliases are reviewed constants, not broad automatic variant conversion. The current alias reconciles EDB `説` with the common Traditional `說`, backed by Unihan `kZVariant`, MOE and Rime evidence. The original EDB glyph remains in `edb_source_glyph`.

MOE rank remains `moe_frequency_rank`. The current sources do not provide `hk_frequency_rank`, `edb_grade_level`, `usage_level`, `curriculum_priority`, `literacy_level` or `curriculum_stage`, so those fields remain blank. `foxchild_selection_rank` records deterministic inclusion order only. `frequency_bucket` and `foxchild_frequency_tier` are descriptive corpus calculations with explicit methods; neither is a lesson recommendation.

Quick codes are derived only from the pinned Rime Quick first/last-key rule. Rime's X-prefixed shortcut rows are not educational canonical codes when the same character has a standard non-X code. The generator removes those shortcuts before selecting the preferred Cangjie code or deriving Quick. For example, `的` is taught as Cangjie `HAPI` and Quick `HI`, not the Rime shortcut `X`. Policy-approved Cangjie alternatives remain in JSON as `accepted_cangjie_codes`; preferred codes are used in the flat CSV.

The build runs a second Cangjie audit after generation. That script reparses the pinned Rime table independently, applies the same X-shortcut exclusion policy, and compares every character's policy-approved Cangjie set, preferred Cangjie code, Quick set and preferred Quick code. Any mismatch fails the build.

CI acquires only this pinned audit table with `npm run fetch:chinese-cangjie-reference`. The command verifies the expected SHA-256 before writing the ignored local snapshot; it does not refresh or mutate the canonical dataset.

## Commands

Refresh source snapshots deliberately:

```bash
npm run fetch:chinese-canonical
```

Generate and validate offline:

```bash
npm run build:chinese-canonical
npm run audit:chinese-cangjie
```

Validate existing outputs:

```bash
npm run validate:chinese-canonical
```

To choose another supported character count:

```bash
node scripts/chinese-input/canonical/generate.mjs --count=2500
node scripts/chinese-input/canonical/validate.mjs
```

The count must stay between 2,500 and 3,500.

## Determinism and safety

- Source versions, commits, checksums and acquisition URLs are code-reviewed constants.
- EDB and MOE imports check published row counts and known leading characters.
- A Unicode-ordered placeholder list cannot pass the source checks.
- `generatedAt` and dataset version are pinned for byte-stable output.
- Application production builds do not contact source websites.
- Source snapshots and reports retain hashes and provenance.
- Lessons and games should reference canonical character IDs; they must not copy character metadata into lesson files.

## Semantic-correctness boundary

Schema version 4 deliberately separates sourced facts, calculations and unresolved educational review:

- Structure and components come only from pinned CHISE IDS. Layout flags are derived from the top-level IDS operator, never from Cangjie length. The source records are complete but remain educationally unreviewed.
- Unihan `kDefinition` is stored as `unihan_definition`; `learner_definition_en` remains blank with `learner_definition_status=unreviewed`.
- Definition-keyword categories are retained only as `suggested_category`, with an explicit weak method, low confidence and pending review.
- Code length produces `simple_code_candidate` and `cangjie_difficulty`; it does not produce a beginner, literacy or school claim.
- Stroke count produces only a low-confidence `visual_complexity` proxy with its method recorded.
- Review priority, mastery weight, unlock order and lesson assignment are not canonical-source outputs.
- Register fields remain blank and unreviewed; formal Chinese, written Cantonese and typing-extension decisions belong to human review.

Character pronunciation is relational. `canonical_character_readings` retains distinct readings from pinned Unihan properties and records property-level provenance. No row is automatically marked as the pedagogical display default. Word pronunciation is `contextual-lexical-source-required`; character readings are never concatenated into a supposed word pronunciation.

The 300-character fixture at `scripts/chinese-input/canonical/fixtures/semantic-anchor-review.json` checks anchor presence, pinned codes/readings/decomposition, and unreviewed educational-field safety. It is not a curriculum order. The semantic audit separately flags polyphony loss, weak category proposals, complex simple-code candidates, structure/flag mismatches, missing decomposition, unavailable lesson-root load, Taiwan-high-frequency records without Hong Kong rank, and Hong Kong character/word anchors. Every HK anchor now includes gate-by-gate evidence and a precise exclusion reason.

IDS leaf order and repetition are retained. `多 = ⿱夕夕` therefore has two ordered component occurrences but one unique component. Component-family generation uses the unique set; teaching displays use the ordered occurrence IDs.

Family membership is a separate relation:

- `component-shared` comes from common CHISE IDS components;
- `phonetic-class` comes from provisional Unihan `kPhonetic`;
- `semantic-variant` comes from provisional Unihan semantic-variant properties.

These relations support search and review, but `review_status=unreviewed` prevents them from becoming teaching claims automatically.

## Human review and curriculum compilation

The generated review dashboard is the release workbench. It shows top characters and words, polyphony, pending categories, missing Cantonese readings/Cangjie codes, decomposition coverage, rejected candidates and Hong Kong anchor gaps.

Human approvals belong in `learning-data/chinese-input/reviewed/character_reviews.csv`. The production curriculum compiler requires at least 2,500 approved included characters by default and validates learner definitions, HK selection, language register, curriculum priority/stage, reviewer/date, supporting words, an approved source-attested Cantonese reading, and evidence from a policy-approved Hong Kong corpus.

The production policy currently contains no approved Hong Kong corpus source, so approval remains blocked even if someone manually fills the CSV. See `HK_CORPUS_SOURCE_REVIEW.md`.

```bash
npm run build:chinese-curriculum
```

This command intentionally fails while the review table is incomplete. Once approved, it emits separate lesson, assessment and game graphs. The canonical tables remain reusable and contain no embedded lesson order.

These unresolved values remain blank or explicitly pending instead of being invented by AI. Adding an enrichment source requires documenting its version, licence, checksum, parser and conflict policy before regeneration.

## Licensing

The source manifest records source-specific terms. Rime and Unicode attribution already belongs in `THIRD_PARTY_NOTICES.md`. EDB and MOE redistribution terms must be reviewed before publishing raw source snapshots or generated datasets outside this repository.
