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
