# Progressive Language Beta 1 Validation

Corrected Learning Web folder:

- `data/ProgressiveLanguagePacks/beta1/stage1/<lesson>/pack.json`

Original generated source folder:

- `/Volumes/ExtremePro/project/study/qclaw2`

Previous generated pack archive:

- `/Volumes/ExtremePro/project/study/learning-web-previous-progressive-packs-20260523-170759`

Validation date:

- 2026-05-23

## Summary

The original Beta 1 data had good schema shape but serious multilingual quality issues. The checked-in Beta 1 data has now been regenerated from curated topic templates and should be used instead of the raw generated source.

The Progressive Language catalog now exposes:

- `beta1`

The old `qclaw` collection was removed from the Learning Web served data folder and moved to the archive path above.

## Corrected Data Result

- Files checked: 100
- Parse errors: 0
- Schema version: `prototype-0.3`
- Missing grammar analysis: 0
- Missing literal order explanations: 0
- Internal concept-label alias leaks: 0
- ASCII in Chinese/Japanese text, tiles, or token text: 0
- Bad target vocabulary flags: 0
- Chinese/Japanese vocabulary identical flags: 0
- Chinese/Japanese sentence identical flags: 0
- Japanese text/tiles with spaces: 0
- Old builder keys: 0
- Missing translations: 0
- Concept reference errors: 0
- Concept index errors: 0
- Top-level count range errors: 0

## Generation Strategy

The raw QClaw2 files were not patched directly because their source vocabulary included corrupted English and mixed Chinese/Japanese values. Instead, the corrected import keeps the 100 Beta 1 pack IDs and topic ordering, but regenerates lesson content from curated templates for the 10 topic families:

- Airport and Airplane
- Family and Home
- Kitchen and Cooking
- Market and Shopping
- Park and Playground
- Restaurant and Dinner
- River and Bridge
- School and Classroom
- Train and Station
- Weather and Seasons

Each corrected pack contains:

- 3-8 vocabulary concepts
- 2 phrase progression chains
- 2 sentence builders
- Full grammar analysis
- Full `literalOrderExplanation`
- Valid `conceptSentenceIndex`
- Natural target-language text/tiles for German, French, Spanish, Chinese, and Japanese

## Important Language Fixes

The corrected data avoids these original QClaw2 failure patterns:

- Chinese copied directly into Japanese vocabulary.
- Chinese words combined with Japanese particles.
- ASCII words leaking into Chinese/Japanese learner-facing fields.
- Corrupted English source terms such as partial mixed-script words.
- Unknown concept references such as pluralized IDs not present in `vocabulary[]`.

## Validation CSV

The current validation CSV is:

- `docs/progressive_language_beta1_validation_issues.csv`

It intentionally contains only the header row because the corrected dataset has no findings under the strict validation pass.
