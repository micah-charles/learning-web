# Chinese Input curriculum migration

Learner progress attaches primarily to stable root, Unicode-character and word IDs, not lesson positions.

`learner_progress_migration.json` maps legacy lesson characters to their regenerated lessons and declares preservation rules for mastery, achievements, review state and answer history.

`migrateChineseInputCurriculumProgress`:

- preserves existing root, character and word records;
- preserves achievements, sessions and attempt history;
- recalculates generated lesson status from stable mastered entities;
- marks a moved lesson partial when only some entities were mastered;
- never grants mastery for newly added content.

Migration is intentionally additive. Previously earned achievements are retained unless a future, explicitly versioned policy says otherwise.
