# FoxChild Chinese canonical dataset

The canonical pipeline builds a deterministic Hong Kong-focused Traditional Chinese character and word dataset without using runtime AI or live web requests during normal application builds.

## Outputs

Generated artifacts live in `learning-data/chinese-input/canonical/`:

- `canonical_characters.csv` and `canonical_characters.json` — 3,000 characters;
- `canonical_words.csv` and `canonical_words.json` — 10,000 words;
- `canonical_statistics.json`;
- `validation_report.md`;
- `coverage_report.md`;
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

EDB order is never used as lesson order. The generator filters to records with verified Cangjie, Jyutping, Mandarin and definitions, rejects simplified-only records only when OpenCC and Unihan variant evidence agree, ranks by the pinned MOE corpus and then selects the requested 2,500–3,500 range. Requiring both sources avoids falsely excluding context-dependent traditional characters such as `了`, `干` and `只`.

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

## Current enrichment boundary

Core validation passes with complete input codes, readings, definitions, frequency, difficulty, curriculum and provenance. The validation report intentionally keeps four warnings:

- structural layout/components remain unclassified until a pinned IDS source is approved;
- character example sentences have no approved corpus;
- the MOE word-frequency source does not provide English word meanings;
- word example sentences have no approved redistributable corpus.

These values remain blank instead of being invented by AI. Adding an enrichment source requires documenting its version, licence, checksum, parser and conflict policy before regenerating the dataset.

The current word Jyutping and Mandarin fields are deterministic sequences of the canonical character readings. They are useful fallbacks, not context-sensitive lexical pronunciations.

## Licensing

The source manifest records source-specific terms. Rime and Unicode attribution already belongs in `THIRD_PARTY_NOTICES.md`. EDB and MOE redistribution terms must be reviewed before publishing raw source snapshots or generated datasets outside this repository.
