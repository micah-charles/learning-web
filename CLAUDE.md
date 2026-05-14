# CLAUDE.md — Learning Web Project Guide

Key facts, rules, and patterns for any AI agent working in this repo.
Read this before touching any file.

---

## 1. What this project is

A browser-only vocabulary and revision app (no backend, no framework) for KS3–KS4 students.
Built with vanilla JS ES modules + Vite. All state lives in `localStorage`. All data is static JSON files served from `data/`.

**Subjects**: `language` · `history` · `geography` · `science` · `literature`

---

## 2. Repo layout

```
src/
  main.js          — entire UI: render functions, event handlers, app shell
  data.js          — manifest loading, pack loading, vocabFromItem mapping
  quiz.js          — question generation (makeWordChoiceQuestions etc.)
  storage.js       — DEFAULT_STATE, loadStoredState, saveStoredState, mergeState
  lang-utils.js    — language code normalisation, packSrcLang, packTgtLang
  utils.js         — escapeHtml, shuffle, humanizeLabel, normalizeForCompare…
  admin-storage.js — uploaded pack handling (admin tab only)

data/
  generated/manifest.json          — THE source of truth for what the app serves
  Packs/<curriculum>/<subject>/<id>/pack_unified.json   — vocab/fillBlank/sequence/categorySort
  PassagePacks/<curriculum>/<subject>/<id>/pack_unified.json — passage items
  SentenceBuilderPacks/…           — sentence builder card packs
  core_unified.json                — legacy core German pack

generated_packs/                   — ⚠ GITIGNORED — AI-generated drafts, never served
styles.css
index.html
vite.config.js
```

---

## 3. The manifest — critical rules

`data/generated/manifest.json` controls **everything the app sees**.
A pack file that exists on disk but is NOT in the manifest is invisible to the app.

```json
{
  "revisionPacks": [ … ],    // vocab/quiz/fillBlank/sequence/categorySort packs
  "passageGroups":  [ … ],   // reading/passage packs
  "sentenceBuilderPacks": [ … ]
}
```

### Required fields per `revisionPacks` entry

| Field | Purpose |
|---|---|
| `id` | Unique key — used in prefs, URLs, everywhere |
| `subject` | `language` / `history` / `geography` / `science` / `literature` |
| `curriculum` | `ks3` / `gcse` / `other` |
| `displayName` | Shown in the UI dropdown |
| `unifiedPath` | Path from repo root to `pack_unified.json` |
| `sourceLanguageCode` | e.g. `de-DE`, `la`, `en-GB` |
| `targetLanguageCode` | e.g. `en-GB` |
| `wordCount` | Integer — shown in the UI |

Non-language packs have `sourceLanguageCode === targetLanguageCode === "en-GB"`.
Language packs have different src/tgt codes (German: `de-DE → en-GB`, Latin: `la → en-GB`).

**After adding or removing a pack from the manifest, always verify `id` is unique.**

---

## 4. Pack JSON schema (v1.1)

Every pack file has this top-level shape:

```json
{
  "schemaVersion": "1.1",
  "packId": "unique_snake_case_id",
  "subject": "geography",
  "sourceLanguageCode": "en-GB",
  "targetLanguageCode": "en-GB",
  "speechLanguage": "en-GB",
  "items": [ … ]
}
```

### Item types and their required `data` fields

**`vocab`** — a term + definition card
```json
{
  "id": "unique_item_id",
  "type": "vocab",
  "level": "KS3 / Year 7-9",
  "topics": ["Biology: Organisation"],
  "tags": ["KS3", "science"],
  "data": {
    "partOfSpeech": "keyword",
    "sourceWord": "cell",
    "targetWord": "the smallest living unit of an organism",
    "examples": { "en-GB": "A red blood cell is a specialised living unit." }
  }
}
```
- `targetWord` must be a **definition**, never a repeat of `sourceWord`
- `partOfSpeech` for non-language packs: use `"keyword"`
- `partOfSpeech` for language packs: use **full English words** — `noun`, `verb`, `adjective`, `adverb`, `preposition`, `pronoun`, `conjunction`, `interjection`. Single-letter abbreviations (`n`, `v`, `a`…) are legacy data — never write new packs with abbreviations.

**Language packs** use `translations` instead of `sourceWord`/`targetWord`:
```json
"data": {
  "partOfSpeech": "noun",
  "gender": "m",
  "plural": "die Geburtstage",
  "translations": { "de-DE": "der Geburtstag", "en-GB": "birthday" }
}
```

**`fillBlank`**, **`sequence`**, **`categorySort`**, **`passage`** — see existing packs for examples.

---

## 5. The `vocabFromItem` mapping (data.js)

`loadVocabItems()` maps raw pack items into the flat word object that the rest of the app uses.

Key mappings to know:

| Word field | Source |
|---|---|
| `de` | `translations[srcCode]` → `sourceWord` → `d.de` |
| `en` | `translations[tgtCode]` → `targetWord` → `d.en` |
| `pos` / `part_of_speech` | `d.partOfSpeech` |
| `exampleDe` | `d.examples[srcCode]` — **only when srcCode ≠ tgtCode** |
| `exampleEn` | `d.examples[tgtCode]` |
| `topic` | `item.topics[0]` |
| `categories` | `item.topics[]` (the full array) |
| `stage` | parsed from `item.level` e.g. `"Stage 1"` → `1` |

⚠ **Duplicate example bug pattern**: If `srcCode === tgtCode` (all non-language packs), setting both `exampleDe` and `exampleEn` from the same `examples["en-GB"]` entry causes the example to render twice. The fix (already applied): only populate `exampleDe` when `srcCode !== tgtCode`.

---

## 6. Persisted state — `storage.js` rules

**The single most important rule:**
> **Every new `prefs.*` key read anywhere in the codebase must have a matching entry in `DEFAULT_STATE` in `storage.js`.**

`mergeState` deep-merges `DEFAULT_STATE` with stored JSON. Keys missing from `DEFAULT_STATE` will be `undefined` for users with old stored state who haven't cleared localStorage.

### Current `DEFAULT_STATE.prefs` shape

```
vocab:   { datasetId, subject, curriculum, year, stages[], search,
           partOfSpeech, category, categories[] }
quiz:    { subject, curriculum, direction, answerMode, datasetId, year,
           stages[], excludeMastered, questionCount, modes[] }
builder: { packId, filter, subject, curriculum }
passages:{ subject, curriculum, groupId, packId, category, difficulty,
           showGerman, voiceEnabled }
review:  { datasetId, sort }
```

### Reset checklist when a dataset/subject changes

Whenever a user switches pack, subject, or curriculum, reset all filter state for that section.
Search for `persisted.prefs.vocab.category = ""` to find the three places that do this — mirror any new field there too.

`applyDatasetDefaults(sectionKey, options)` handles stage and quiz-mode resets — extend it for any dataset-dependent defaults.

---

## 7. Subject-aware UI rules

The UI behaves differently per subject. Always derive `isLanguage` / `isLiterature` from the dataset, not from a hardcoded check:

```javascript
const subject = getDatasetSubject(dataset);
const isLanguage  = subject === "language";
const isLiterature = subject === "literature";
```

| Subject | Part-of-speech filter | Category filter | Example label |
|---|---|---|---|
| `language` (German) | ✓ dropdown | ✓ **checkboxes** (categories from `word.categories`) | exampleDe + exampleEn |
| `language` (Latin) | ✓ dropdown | ✗ (uses stage checkboxes instead) | exampleDe + exampleEn |
| `literature` | ✗ | ✓ dropdown (from `cat:*` tags) | exampleEn only |
| `geography` / `history` / `science` | ✗ | ✗ | exampleEn only |

Latin has `stageOptions` in its manifest entry → `usesStageSelection(dataset)` returns `true` → stage checkboxes replace category checkboxes.

---

## 8. Quiz question objects

Questions are built in `quiz.js` and consumed in `main.js → renderQuizSession()`.

Standard fields on every question object:

```javascript
{
  id, modeId, modeTitle, kind,   // "choice" | "typed" | "build" | "sequence" | "sort"
  prompt, answer,
  topic,     // word.topic — shown as amber badge in quiz question box
  pos,       // word.part_of_speech || word.pos — shown as blue badge (language packs)
  subtitle,  // [stage_label, topic].join(" · ") — shown as muted small text
  speechText, speechLanguage,
}
```

`pos` and `topic` are rendered as coloured badges in `renderQuestionBox({ meta: [...] })`.
Non-language packs have empty `pos` → no badge renders automatically.

---

## 9. POS_LABELS — abbreviation expansion

A safety-net map in `main.js` (near `SUBJECT_LABELS`):

```javascript
const POS_LABELS = {
  n: "Noun", v: "Verb", a: "Adjective", d: "Adverb",
  r: "Preposition", p: "Pronoun", c: "Conjunction", i: "Interjection",
};
```

Used in the Part-of-speech dropdown and the quiz badge. All new Latin data should already use full words; this map handles any legacy pack that still has abbreviations.

---

## 10. Adding a new pack — checklist

1. **Create** `data/Packs/<curriculum>/<subject>/<id>/pack_unified.json`
2. **Register** in `data/generated/manifest.json` under `revisionPacks` with all required fields
3. **Verify** `id` is unique across all packs in the manifest
4. **Check** `sourceLanguageCode` and `targetLanguageCode`:
   - Non-language: both `"en-GB"`
   - Language: correct language codes
5. **Confirm** no `targetWord === sourceWord` in vocab items (broken definition)
6. **Confirm** `partOfSpeech` uses full words for language packs, `"keyword"` for non-language
7. **Do NOT** leave the pack only in `generated_packs/` — it is gitignored and the app will not see it

---

## 11. Removing a pack — checklist

1. Remove the entry from `manifest.json`
2. `git rm` the pack directory from `data/Packs/` (or `PassagePacks/`)
3. Verify no other pack in the manifest references the removed `id`
4. If the removed pack was the default `datasetId` in `DEFAULT_STATE`, update that too

---

## 12. CSS conventions

- Utility classes: `muted`, `tiny`, `badge`, `badge-row`, `chip-row`, `count-pill`, `mode-chip`
- Badge colours: `blue` (neutral info), `amber` (topic/category), `green` (correct/mastered), `coral` (gender)
- Stage/category checkboxes use: `stage-field`, `fieldset-title`, `stage-check-list`, `mode-check stage-check`
- Question UI: `question-box`, `question-box-top`, `question-box-copy`, `question-prompt`

---

## 13. Common bugs to watch for

| Bug | Cause | Fix |
|---|---|---|
| Pack not showing in app | Not in `manifest.json` | Add to `revisionPacks` |
| `undefined` on first load for new prefs key | Missing from `DEFAULT_STATE` | Add to `storage.js` |
| Example sentence renders twice | `srcCode === tgtCode` but both `exampleDe` + `exampleEn` set | Only set `exampleDe` when `srcCode !== tgtCode` |
| PoS dropdown shows `a, c, d…` | Abbreviations in pack data | Update pack JSON to use full words; `POS_LABELS` is the fallback |
| `targetWord` equals `sourceWord` in vocab | Schema mismatch / bad AI generation | Write a proper definition |
| Category filter broken after pack switch | Reset not added to all three switch points | Add `prefs.vocab.categories = []` alongside `category = ""` |
| Pack committed to `generated_packs/` | gitignored — app never loads it | Copy to `data/Packs/` and register in manifest |

---

## 14. Dev commands

```bash
npm run dev        # Vite dev server (hot reload) — use for UI work
npm run build      # Production build to dist/
npm run preview    # Serve dist/ locally
npm run build:data # Regenerate manifest.json from scripts/generate_manifest.py
```

The manifest is **not** auto-generated on `npm run dev`. After adding/removing packs, run `npm run build:data` or edit `manifest.json` by hand.

---

## 15. Branch and PR conventions

- Branch names from Codex: `codex/<description>`
- One logical change per PR; keep PRs small
- Always push to `origin` and open PR against `main` via `gh pr create`
- After a PR is **merged**, the branch is closed — new work on that branch needs a fresh PR
- **Never auto-merge** — always wait for the repo owner to review and approve

---

## 16. Files that are safe to edit vs. generated

| File | Status |
|---|---|
| `src/main.js` | Hand-maintained — edit freely |
| `src/data.js` | Hand-maintained — edit carefully (affects all pack loading) |
| `src/quiz.js` | Hand-maintained |
| `src/storage.js` | Hand-maintained — always update `DEFAULT_STATE` when adding prefs |
| `data/generated/manifest.json` | Hand-maintained (generator script exists but is rarely run) |
| `data/Packs/**/pack_unified.json` | Hand-maintained JSON — schema v1.1 |
| `generated_packs/` | AI draft output — **gitignored**, never committed |
| `dist/` | Vite build output — **gitignored** |
