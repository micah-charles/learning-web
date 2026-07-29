# Data schema

The dataset has `manifest`, `roots`, `characters` and `lessons`.

Every character declares:

- one Unicode code point and matching `U+` value;
- Traditional script and `zh-HK` locale;
- English definition and Jyutping pronunciation;
- independent `cangjie` and `quick` objects;
- preferred and accepted codes;
- key and root sequences;
- code-sequence decomposition nodes;
- lesson eligibility;
- verified, versioned provenance.

`scripts/validate-chinese-input-data.mjs` rejects duplicate IDs, invalid keys, empty accepted codes, mismatched preferred/key sequences, Cangjie codes beyond five keys, Quick codes beyond two, unknown lesson references, code-point mismatches, missing pronunciation/provenance, unresolved licences and mixed Cangjie versions.

Runtime validation uses the same pure validator before the page renders.

## Production-scale canonical research schema

The separate production-scale research dataset under `learning-data/chinese-input/canonical/` uses schema version 3. It is not yet the runtime lesson catalogue.

Its character table distinguishes:

- source facts: EDB presence, MOE corpus rank, Cangjie/Quick codes, Unihan definition and stroke/radical data;
- transparent calculations: FoxChild selection rank/score, frequency bucket, Cangjie difficulty, simple-code candidacy, visual-complexity proxy and code uniqueness;
- unknown educational fields: Hong Kong frequency rank, EDB grade, literacy level, curriculum stage and curriculum priority;
- pending proposals: suggested category plus method, confidence and review status.

Layout and component data live in the decomposition relation. They are sourced from pinned CHISE IDS; top-level layout flags are derived only from the IDS operator. A one-key Cangjie code never means that a glyph is visually single-component.

Character readings live in `canonical_character_readings.csv/json` with one row per character, language and source-attested reading. They do not select a pedagogical default. Words do not concatenate character readings; word pronunciation remains pending a context-sensitive lexical source.

Character families live in `canonical_character_families.csv/json`. Each membership states `family_type`, `basis`, source, confidence and review status. Component sharing, Unihan phonetic classes and Unihan semantic variants are distinct relationship types.

Human-reviewed educational fields are external inputs under `learning-data/chinese-input/reviewed/`. The curriculum compiler consumes those approvals plus canonical IDs and emits separate lesson, assessment and game graphs.
