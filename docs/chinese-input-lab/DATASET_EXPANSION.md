# Dataset expansion

Before changing sources, document source name, pinned version/commit, Cangjie version, Quick rule, licence, redistribution permission, script/locale assumptions and known conflicts.

Refresh steps:

1. obtain permitted local source files;
2. update pinned source metadata deliberately;
3. run the offline build script;
4. inspect record-count and code-length changes;
5. run validation and domain tests;
6. review examples and glyphs manually;
7. update provenance and notices;
8. commit source-independent generated output.

Never import from a random live website during app build. Records without verified codes, pronunciation or provenance must not enter production.
