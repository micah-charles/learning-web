# Chinese Input dataset pipeline

This offline pipeline refreshes the committed Chinese Input Lab seed. It never runs a live scrape during normal app builds.

Inputs:

- pinned Rime Cangjie `cangjie5.base.dict.yaml`;
- pinned Rime Quick schema for the documented first/last-key Quick rule;
- Unicode Unihan 17.0.0 readings, dictionary-like data and variants;
- pinned CHISE IDS decomposition data.

Example:

```bash
node scripts/chinese-input/build-dataset.mjs \
  --cangjie=/permitted/local/rime-cangjie/cangjie5.base.dict.yaml \
  --unihan=/permitted/local/Unihan_Readings.txt
npm run validate:chinese-input-data
```

The generator normalises ASCII codes to uppercase, removes unsupported special `Z` records, keeps all accepted Cangjie alternatives, generates verified Quick codes from the pinned Quick 5 rule, attaches definitions/Jyutping, writes source commits into every record, and produces stable JSON plus a checksum. Review source licences and update pinned metadata before changing any source version.

## Canonical character and word pipeline

The production-scale pipeline is in `scripts/chinese-input/canonical/`. It keeps live acquisition separate from deterministic offline generation:

```bash
npm run fetch:chinese-canonical
npm run build:chinese-canonical
```

It produces 3,000 canonical characters, 10,000 canonical words, source-backed
decompositions with repeated components preserved, display-safe component
metadata, character-family memberships, a Cangjie reference audit, detailed
Hong Kong anchor diagnostics and a human-review dashboard under
`learning-data/chinese-input/canonical/`.

Approved learner meanings are kept in
`learning-data/chinese-input/canonical/learner_meaning_review.csv` and applied
to both canonical JSON and CSV exports with:

```bash
npm run apply:chinese-learner-meanings
```

The importer fails closed unless all 3,000 character rows and 10,000 word rows
are present, unique, non-empty, and explicitly marked `approved`.

Curriculum is a separate, fail-closed compilation step:

```bash
npm run test:chinese-curriculum
npm run build:chinese-curriculum
```

The production compiler reads `learning-data/chinese-input/reviewed/character_reviews.csv`
and will not publish until the policy's minimum number of Hong Kong learner
reviews has been reached from a policy-approved Hong Kong corpus source. See
`docs/chinese-input-lab/CANONICAL_DATASET.md` and
`docs/chinese-input-lab/HK_CORPUS_SOURCE_REVIEW.md` for the source policy,
schemas, validation gates and human-review boundary.

## Complete curriculum generator

The re-runnable curriculum system consumes canonical JSON, reviewed CSV inputs
and versioned policy files under `learning-data/chinese-input/curriculum-policy/`.

```bash
npm run build:chinese-curriculum:preview
npm run validate:chinese-curriculum
npm run audit:chinese-curriculum
npm run test:chinese-curriculum
npm run check:chinese-curriculum-determinism
npm run qa:chinese-curriculum
```

Preview output covers the complete canonical character set but is explicitly
provisional. Production generation intentionally fails until an approved,
pinned HK corpus and the required human reviews exist. Generated files under
`learning-data/chinese-input/generated-curriculum/` are disposable and must not
be edited.
