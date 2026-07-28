# Chinese Input Lab Business Rules

## Canonical codes are pinned static data
code: `src/features/chinese-input/data/seed-dataset.json`, `scripts/chinese-input/build-dataset.mjs`, `docs/chinese-input-lab/DATA_PROVENANCE.md` | updated: 2026-07-28 | status: active

### Context
Chinese Input correctness comes from pinned Rime Cangjie 5 and Quick sources. Unihan supplies language metadata. Runtime AI is not authoritative.

### Why it matters
Mixing input-method versions or generating codes dynamically can teach wrong answers and corrupt mastery.

### Guidance for future agents
Keep the build offline, validate every record, retain per-record provenance, and evaluate Cangjie and Quick independently.

## Chinese Input Lab is not a Language Ladder pack
code: `src/features/chinese-input/`, `src/react/App.jsx`, `src/storage.js` | updated: 2026-07-28 | status: active

### Context
The module shares app infrastructure but owns keyboard, code, lesson and mastery rules.

### Why it matters
Forcing it into Progressive Language packs would couple character input codes to vocabulary assumptions.

### Guidance for future agents
Share shell, storage, speech and design primitives. Keep input-method domain logic inside the feature boundary.
