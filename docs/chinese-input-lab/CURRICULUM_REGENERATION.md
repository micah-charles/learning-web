# Regenerating the Chinese Input curriculum

Run:

```bash
npm run build:chinese-canonical
npm run build:chinese-curriculum:preview
npm run qa:chinese-curriculum
```

Human-maintained inputs are canonical source pins, reviewed CSV files and curriculum-policy JSON. Generated files under `generated-curriculum/` must not be edited.

To change curriculum shape:

1. update the relevant versioned policy;
2. regenerate preview output;
3. inspect statistics, semantic warnings and migration metadata;
4. run determinism and the complete QA command;
5. commit source and matching generated output together.

The determinism gate generates two clean output trees and compares every byte. CI also regenerates committed output and fails on drift.

Production generation remains fail-closed because the repository does not yet contain an approved Hong Kong corpus source or 2,500 approved character reviews.
