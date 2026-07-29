# Chinese Input curriculum QA

`npm run qa:chinese-curriculum` runs:

1. canonical validation;
2. independent Cangjie/Quick audit;
3. preview generation;
4. graph, coverage, dependency and cognitive-load validation;
5. semantic safety and golden regression audit;
6. curriculum and migration tests;
7. byte-identical determinism verification;
8. Chinese Input domain tests;
9. configuration validation;
10. application production build.

Golden regressions cover the 26-root introduction, repeated `多 = 夕|夕` structure, `說` with EDB source glyph `説`, polyphony, a four/five-key code, the written-Cantonese placeholder, Quick collisions and moved-lesson migration.

CI additionally performs a generated-output drift check. Production output is not expected to exist until every production evidence gate succeeds.
