# Chinese Input generated curriculum schema

Generated schema version 1 uses stable entity IDs:

- roots: `cj-A` through `cj-Z`;
- characters: lowercase Unicode IDs such as `u8aaa`;
- words: deterministic `word-<digest>` IDs;
- lessons: stable stage/cluster IDs plus `lessonIdentityKey`, `lessonVersion` and `contentDigest`.

The manifest distinguishes `provisional-preview` from `production-approved`. Preview documents always have `productionEligible: false` and list unresolved evidence.

`lessons.json` contains objectives, prerequisites, new/review entities, safe components, structured teaching blocks, exercise/assessment/game references, review opportunities, explanations and warnings. Raw CHISE entity syntax is forbidden in learner-visible fields.

Graph references are validated against canonical or generated IDs. Word pronunciation remains `contextual-lexical-source-required` until an approved lexical review exists. Unreviewed definitions and registers use pending/hidden display policies.

The runtime adapter rejects unknown schema versions, disagreeing input digests and preview/production status mismatches before rendering.
