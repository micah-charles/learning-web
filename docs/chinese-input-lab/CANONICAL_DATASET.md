# FoxChild Chinese canonical dataset

The canonical pipeline builds a deterministic Hong Kong-focused Traditional Chinese character and word dataset without using runtime AI or live web requests during normal application builds.

## Outputs

Generated artifacts live in `learning-data/chinese-input/canonical/`:

- `canonical_characters.csv` and `canonical_characters.json` — 3,000 characters;
- `canonical_character_readings.csv` and `canonical_character_readings.json` — relational, multi-valued Cantonese and Mandarin readings;
- `canonical_words.csv` and `canonical_words.json` — 10,000 words;
- `canonical_statistics.json`;
- `validation_report.md`;
- `coverage_report.md`;
- `semantic_audit.json` and `semantic_audit_report.md`;
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

EDB order is never used as lesson order. The generator filters to records with verified Cangjie, source-attested Cantonese and Mandarin readings, and a Unihan definition. It rejects simplified-only records only when OpenCC and Unihan variant evidence agree, orders eligible records by the pinned MOE corpus, and then selects the requested 2,500–3,500 range. Requiring both simplified-variant sources avoids falsely excluding context-dependent Traditional characters such as `了`, `干` and `只`.

MOE rank remains `moe_frequency_rank`. The current sources do not provide `hk_frequency_rank`, `edb_grade_level`, `usage_level`, `curriculum_priority`, `literacy_level` or `curriculum_stage`, so those fields remain blank. `foxchild_selection_rank` records deterministic inclusion order only. `frequency_bucket` and `foxchild_frequency_tier` are descriptive corpus calculations with explicit methods; neither is a lesson recommendation.

Quick codes are derived only from the pinned Rime Quick first/last-key rule. Cangjie alternatives remain in JSON as `accepted_cangjie_codes`; preferred codes are used in the flat CSV.

## Commands

Refresh source snapshots deliberately:

```bash
npm run fetch:chinese-canonical
```

Generate and validate offline:

```bash
npm run build:chinese-canonical
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

Schema version 2 deliberately separates sourced facts, calculations and unresolved educational review:

- `structure` is `unknown`, and `left_right`, `top_bottom`, `surround` and `single` remain blank. Cangjie code length never determines visual layout.
- Unihan `kDefinition` is stored as `unihan_definition`; `learner_definition_en` remains blank with `learner_definition_status=unreviewed`.
- Definition-keyword categories are retained only as `suggested_category`, with an explicit weak method, low confidence and pending review.
- Code length produces `simple_code_candidate` and `cangjie_difficulty`; it does not produce a beginner, literacy or school claim.
- Stroke count produces only a low-confidence `visual_complexity` proxy with its method recorded.
- Review priority, mastery weight, unlock order and lesson assignment are not canonical-source outputs.

Character pronunciation is relational. `canonical_character_readings` retains distinct readings from pinned Unihan properties and records property-level provenance. No row is automatically marked as the pedagogical display default. Word pronunciation is `contextual-lexical-source-required`; character readings are never concatenated into a supposed word pronunciation.

The 300-character fixture at `scripts/chinese-input/canonical/fixtures/semantic-anchor-review.json` checks anchor presence and the unknown/unreviewed safety rules. It is not a curriculum order. The semantic audit separately flags polyphony loss, weak category proposals, complex simple-code candidates, unsafe structure flags, unavailable lesson-root load, Taiwan-high-frequency records without Hong Kong rank, and missing Hong Kong Cantonese character/word anchors.

These unresolved values remain blank or explicitly pending instead of being invented by AI. Adding an enrichment source requires documenting its version, licence, checksum, parser and conflict policy before regeneration.

## Licensing

The source manifest records source-specific terms. Rime and Unicode attribution already belongs in `THIRD_PARTY_NOTICES.md`. EDB and MOE redistribution terms must be reviewed before publishing raw source snapshots or generated datasets outside this repository.
