# Lesson model

Lessons are data-driven and specify method, stage, order, bilingual title, introduced/reviewed/active keys, eligible characters, activity mix, pass criterion, prerequisites, estimated duration and accessibility notes.

The session generator filters characters by active keys, uses an injected seeded random source, and creates the complete plan before play. The same dataset, lesson, method, seed and timestamp produce the same plan.

Question contracts include method, expected alternatives, preferred code, expected keys, guidance level, hints and dataset version. Root questions and guided typing use the same input path for pointer and physical keyboard events.
