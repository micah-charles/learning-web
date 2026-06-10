# Progressive Language QClaw Stage 1 Validation

Generated source folder:

- `/Volumes/ExtremePro/project/study/qclaw`

Imported Learning Web folder:

- `data/ProgressiveLanguagePacks/qclaw/stage1/<lesson>/pack.json`

Catalog:

- `data/ProgressiveLanguagePacks/manifest.json`

## Import Summary

- Files checked: 100
- Files imported: 100
- Total vocabulary concepts: 598
- Total phrase chains: 270
- Total phrase steps: 670
- Total sentence builders: 200
- Blocking schema errors: 0

## Structural Checks Passed

All 100 generated packs passed these checks:

- Valid JSON.
- `supportedLanguages` is exactly `["en", "de", "fr", "es", "zh", "ja"]`.
- Required top-level arrays exist: `vocabulary`, `grammarTokens`, `phraseProgressionChains`, `sentenceBuilders`.
- Phrase steps use numeric `step`.
- Phrase steps do not use old `stepId`.
- Phrase chains use `linkedConcepts`, not `conceptLinks`.
- Sentence builders use `sentenceId`.
- Sentence builders do not use old `builderId`, `targetStepId`, `correctSentence`, `shuffledTiles`, or `conceptLinks`.
- `conceptSentenceIndex` references known sentence builder IDs.
- All catalog lesson paths resolve to real `pack.json` files.

## Non-Blocking Quality Warnings

The generated QClaw Stage 1 packs are playable, but they are not grammar-enriched.

Missing grammar analysis counts:

- Missing phrase-step target-language `translation.analysis`: 3000
- Missing builder target-language `translation.analysis`: 1000
- Files with missing phrase-step analysis: 100
- Files with missing builder analysis: 100

Current app behavior:

- Lessons still load.
- Listen, Vocabulary, Builder, and Review still work.
- Grammar help icons are hidden where `translation.analysis` is missing.
- Token hover hints and grammar panels will not appear for QClaw items until analysis is added.

## Concept-Label Leakage Audit

A second validation pass checks whether internal concept IDs leaked into learner-facing strings by being lowercased and converted from underscores to spaces.

Example invalid output:

```text
彼女は place airportの中にいます。
```

Why this fails:

- `PLACE_AIRPORT` is an internal concept ID.
- `place airport` is the generated alias of that concept ID.
- Learners should see Japanese, not an English placeholder inside a Japanese sentence.

The audit computes this forbidden alias for every `vocabulary[].conceptId`:

```js
conceptId.toLowerCase().replace(/_/g, " ")
```

It checks these learner-facing fields:

- `vocabulary[].translations[lang].text`
- `phraseProgressionChains[].steps[].translations[lang].text`
- `phraseProgressionChains[].steps[].translations[lang].tiles[]`
- `phraseProgressionChains[].steps[].translations[lang].analysis`
- `sentenceBuilders[].translations[lang].text`
- `sentenceBuilders[].translations[lang].tiles[]`
- `sentenceBuilders[].translations[lang].analysis`

Audit command:

```bash
node scripts/progressive_language_placeholder_audit.mjs --fix --csv=docs/progressive_language_placeholder_corrections.csv
```

Latest audit result:

- CSV rows exported: 9,855
- Automatic safe corrections applied: 2,115
- Manual review rows remaining: 7,740
- Files still containing one or more unresolved concept-label aliases: 98
- Remaining `place airport` aliases in QClaw Stage 1 pack data: 0

The exported CSV is:

- `docs/progressive_language_placeholder_corrections.csv`

The CSV includes:

```csv
file,packId,section,jsonPath,language,conceptId,issueType,originalValue,correctedValue,confidence,action
```

Safe automatic corrections were applied where the intended replacement was clear from a curated term or a usable vocabulary translation.

Example correction:

```csv
originalValue,correctedValue
"彼女は place airportの中にいます。","彼女は空港の中にいます。"
```

Rows marked `needs_manual_review` were not changed because the pack still has placeholder vocabulary translations such as `nature river`, `person pilot`, or `object photo` in target languages. Those require a richer bilingual correction dictionary or regeneration.

## Recommendation

Use the QClaw Stage 1 import for broad playable lesson coverage.

For grammar-help completeness, regenerate or enrich these packs so every target-language phrase and builder translation includes:

```json
{
  "analysis": {
    "sentencePattern": "",
    "grammarExplanation": [],
    "tokens": []
  }
}
```

The generation prompt in `docs/ProgressiveLanguage.md` already requires this structure.
