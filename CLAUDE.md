# CLAUDE.md — Learning Web Project Guide

Key facts, rules, and patterns for any AI agent working in this repo.
Read this before touching any file.

---

## 0. Mandatory UI Context Loading

When working on **any frontend / UI-related task** for Learning Web:

1. **First read (in order) — these files are the authoritative UI reference; do not duplicate their content here:**
   - `docs/AI_UI_IMPLEMENTATION_CAUTIONS.md` — every production bug, caution code (RC*, CD*, CSS*, A*), and fix
   - `docs/REACT_ARCHITECTURE.md` — full map of every React context, hook, page, component, and data-flow pattern
2. **Summarise** the key constraints internally before making any changes.
3. **Validate** all proposed UI changes against:
   - React + vanilla JS hybrid architecture (React shell, vanilla JS engine)
   - `useProgress()` shape — always pass the full stored-state to storage helpers (RC1)
   - `ManifestContext` — must call `hydrateManifest` for uploaded packs to be visible (RC2)
   - Quiz answer mode labels: React uses `"choice"`/`"build"`, engine uses `"mcq"` — normalise at boundary (RC4)
   - `data/` directory must be in `viteStaticCopy` targets or it won't reach `dist/` (CD1)
   - mobile usability · pack compatibility · mode consistency · accessibility
4. **Avoid (caution code in parentheses — full details in AI_UI_IMPLEMENTATION_CAUTIONS.md):**
   - passing `progress?.progress` to storage helpers — pass the full stored-state (RC1)
   - side effects inside `setState()` updater functions — StrictMode fires them twice (RC9)
   - rendering `<StudyBookDrawer />` inside page components — belongs at App level (RC10)
   - `synth.cancel()` + `synth.speak()` in the same tick — drops the utterance in Chrome (RC11)
   - speech synthesis in `setTimeout` — outside user-gesture window, Chrome blocks it (RC11)
   - accessing `localStorage` directly — always use `loadStoredState()` / `saveStoredState()` (RC14)
   - placing runtime-fetched files under `src/` — they must live in `public/` at project root (CD5)
   - "Build" answer mode for non-language packs — no sentence pools exist (RC4)
   - BEM double-dash button modifiers (`lw-btn--primary`) — use single-hyphen (`lw-btn-primary`) (CSS3)
5. **Prefer:**
   - hooks for data + state; pure render functions for UI
   - `useMemo` for derived values; `useState` only for user-owned config
   - schema-driven rendering · offline-first · educational usability over visual novelty

> ⚠ **Do not add bug notes or implementation cautions to this file.**
> When you discover a new bug or rule, add it to `docs/AI_UI_IMPLEMENTATION_CAUTIONS.md`
> (Part A = vanilla JS, B = React, C = build/deploy, D = CSS). Update its "Last updated" line.

---

## 1. What this project is

A browser-only vocabulary and revision app for KS3–KS4 students.
**React 18 + Vite** shell over a **vanilla JS engine** (quiz.js, data.js, storage.js, etc.).
All state lives in `localStorage`. All data is static JSON files served from `data/`.
Deployed to Render.com as a static site — `render.yaml` at repo root controls the build.

**Subjects**: `language` · `history` · `geography` · `science` · `literature` · `computing` · `religion` · `other`

---

## 2. Repo layout

```
src/
  react/                       — React app shell (PR #110+)
    App.jsx                    — tab routing, NavBar
    main.jsx                   — React entry point
    context/
      ManifestContext.jsx      — loads manifest + calls hydrateManifest for uploads
      ProgressContext.jsx      — wraps loadStoredState/saveStoredState
      StudyBookContext.jsx     — Study Book drawer state (open/html/toc/search/splitMode)
    hooks/
      useVocabBrowser.js       — pack loading + filtering for Vocab/Review pages
      useQuizSession.js        — quiz state machine
      useReadingSession.js     — reading session state
      useBuilderSession.js     — sentence builder state
      useSpeech.js             — SpeechSynthesis wrapper
      usePackLoader.js         — generic pack loader hook
    pages/                     — one file per tab (10 tabs)
    components/
      layout/                  — Controls.jsx, Hero.jsx, NavBar.jsx, SubjectCardGrid.jsx
      learning/                — StudyBookDrawer, TileBuilder, FeedbackPanel, QuizCard, etc.
    styles/
      global.css               — React-specific design tokens and component CSS
    utils/
      packAdapters.js          — pack data shape adapters
      scoring.js               — answer normalisation

  main.js          — LEGACY vanilla UI (kept for reference; no longer the entry point)
  data.js          — manifest loading, pack loading, vocabFromItem mapping  ← SHARED
  quiz.js          — question generation                                    ← SHARED
  storage.js       — DEFAULT_STATE, loadStoredState, saveStoredState        ← SHARED
  admin-storage.js — uploaded pack handling (hydrateManifest)               ← SHARED
  progress.js      — analytics (getDashboardSummary etc.)                   ← SHARED
  lang-utils.js    — language code normalisation                            ← SHARED
  utils.js         — escapeHtml, shuffle, humanizeLabel, normalizeForCompare ← SHARED
  progressive-language-lesson.js — vanilla lesson engine (LanguagePage bridge) ← SHARED
  crossword.js     — crossword engine                                       ← SHARED

data/
  generated/manifest.json          — THE source of truth for what the app serves
  Packs/<curriculum>/<subject>/<id>/
    pack_unified.json              — REQUIRED: all revision items
    passages.json                  — OPTIONAL: reading content
    study_notes.md                 — OPTIONAL: study book content (needed for tutor + SEO)
  SentenceBuilderPacks/…
  core_unified.json

public/
  docs/                            — prompt template markdown files (fetched at runtime)
generated_packs/                   — ⚠ GITIGNORED — AI-generated drafts, never served
dist/                              — ⚠ GITIGNORED — Vite build output, built on Render
render.yaml                        — Render.com deployment config (build + serve dist/)
vite.config.js                     — Vite config; viteStaticCopy copies data/ → dist/
styles.css                         — shared design tokens (linked in index.html)
index.html                         — React mount point (<div id="root">)
```

---

## 3. The manifest — critical rules

`data/generated/manifest.json` controls **everything the app sees**.
A pack file that exists on disk but is NOT in the manifest is invisible to the app.

```json
{
  "generatedAt": "…",       // ISO timestamp
  "schemaVersion": "1.0",
  "coreUnifiedPath": "data/core_unified.json",
  "core": { … },           // Core language pack entry
  "packs": [ … ],          // ALL content packs (revision + passages) — unified list
  "sentenceBuilderPacks": [ … ]
}
```

> ⚠ `revisionPacks` and `passageGroups` are **removed**. All content uses the
> single `packs[]` array with `capabilities` field declaring what each pack supports.

### Required fields per `packs[]` entry

| Field | Purpose |
|---|---|
| `id` | Unique key — used in prefs, URLs, everywhere |
| `subject` | `language` / `history` / `geography` / `science` / `literature` / `computing` / `religion` / `other` |
| `curriculum` | `ks3` / `us-middle-school` / `other` |
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

**`multipleChoice`** — a standalone authored MCQ question. Use this when the prompt is a full question, not a cloze sentence:
```json
{
  "id": "grammar_case_001",
  "type": "multipleChoice",
  "level": "Stage 1",
  "topics": ["Latin grammar", "cases"],
  "data": {
    "question": "What case is 'servus' in 'servus dormit'?",
    "answer": "nominative",
    "options": ["nominative", "accusative", "dative", "ablative"]
  }
}
```
- `data.question`, `data.answer`, and `data.options` are required.
- `data.options` must include `data.answer`.
- Do not use `fillBlank` for grammar MCQs unless the prompt genuinely contains a `____` blank.
- Quiz renders this as `modeId: "multipleChoice"` / `kind: "choice"`; Arcade Quiz Hunt can read it too.

**`fillBlank`**, **`sequence`**, **`categorySort`**, **`sentenceBuilder`**, **`passage`** — see existing packs for examples.

- `sentenceBuilder` items go into a `sentenceBuilderPack` — loaded by `loadSentenceBuilderPack()` which calls `filterUnifiedItems(pack, "sentenceBuilder")`. Using the string `"sentence"` instead will cause silent no-match.

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

⚠ If `srcCode === tgtCode` (all non-language packs), only populate `exampleDe` when `srcCode !== tgtCode` — otherwise the example sentence renders twice.

---

## 6. Persisted state — `storage.js` rules

**The single most important rule:**
> **Every new `prefs.*` key read anywhere in the codebase must have a matching entry in `DEFAULT_STATE` in `storage.js`.**

`mergeState` deep-merges `DEFAULT_STATE` with stored JSON. Keys missing from `DEFAULT_STATE` will be `undefined` for users with old stored state who haven't cleared localStorage.

### Current `DEFAULT_STATE.prefs` shape

```
vocab:         { datasetId, subject, curriculum, year, stages[], search,
                 partOfSpeech, category, categories[] }
quiz:          { subject, curriculum, direction, answerMode, datasetId, year,
                 stages[], excludeMastered, questionCount, modes[] }
crossword:     { subject, curriculum, datasetId, year, stages[],
                 excludeMastered, wordCount }
builder:       { packId, filter, subject, curriculum }
passages:      { subject, curriculum, groupId, packId, category, difficulty,
                 showGerman, voiceEnabled, voiceName }
review:        { datasetId, sort }
promptBuilder: { subject, topic, level, curriculum, locale, itemTypes[],
                 sourceMode, sourceUrl, sourceMaterial, additionalInstructions,
                 generateMode, promptTemplate }
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

Questions are built in `quiz.js` and consumed in React via `useQuizSession`.

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

1. **Create** `data/Packs/<curriculum>/<subject>/<id>/pack_unified.json` (and `study_notes.md` if applicable)
2. **Register** in `data/generated/manifest.json` under `packs[]` with all required fields
3. **Set `contentMdPath`** if the pack has a `study_notes.md` — this enables the Study Book drawer, FoxChild Tutor search indexing, and SEO page generation
4. **Verify** `id` is unique across all packs in the manifest
4. **Check** `sourceLanguageCode` and `targetLanguageCode`:
   - Non-language: both `"en-GB"`
   - Language: correct language codes
5. **Confirm** no `targetWord === sourceWord` in vocab items (broken definition)
6. **Confirm** `partOfSpeech` uses full words for language packs, `"keyword"` for non-language
7. **Do NOT** leave the pack only in `generated_packs/` — it is gitignored and the app will not see it

---

## 11. Removing a pack — checklist

1. Remove the entry from `manifest.json`
2. `git rm -r` the pack directory from `data/Packs/`
3. Verify no other pack in the manifest references the removed `id`
4. If the removed pack was the default `datasetId` in `DEFAULT_STATE`, update that too

---

## 12. CSS quick reference

- Utility classes (vanilla JS UI): `muted`, `tiny`, `badge`, `badge-row`, `chip-row`, `count-pill`, `mode-chip`
- Badge colours: `blue` (neutral info), `amber` (topic/category), `green` (correct/mastered), `coral` (gender)
- Stage/category checkboxes: `stage-field`, `fieldset-title`, `stage-check-list`, `mode-check stage-check`
- Question UI: `question-box`, `question-box-top`, `question-box-copy`, `question-prompt`
- React nav tones: `lw-nav-pill.tone-orange` (Language Ladder), `lw-nav-pill.tone-blue` (Quiz)
- Mobile nav: `lw-nav-mobile`, `lw-mobile-nav-pill`, `lw-mobile-more`, `lw-mobile-more-menu`
- Button modifiers: single-hyphen only — `lw-btn-primary`, `lw-btn-ghost`, `lw-btn-secondary` (full rule: CSS3 in `docs/AI_UI_IMPLEMENTATION_CAUTIONS.md`)
- For the full React `lw-*` class system and design tokens, see `docs/REACT_ARCHITECTURE.md` §9

---

## 13. Dev commands

```bash
npm run dev        # Vite dev server (hot reload) — use for UI work
npm run build      # Production build to dist/
npm run preview    # Serve dist/ locally
npm run build:data # Regenerate manifest.json from scripts/generate_manifest.py
```

The manifest is **not** auto-generated on `npm run dev`. After adding/removing packs, run `npm run build:data` or edit `manifest.json` by hand.

---

## 14. Branch and PR conventions

- Branch names from Codex: `codex/<description>`
- One logical change per PR; keep PRs small
- Always push to `origin` and open PR against `main` via `gh pr create`
- After a PR is **merged**, the branch is closed — new work on that branch needs a fresh PR
- **Never auto-merge** — always wait for the repo owner to review and approve

### ⚠️ Mandatory branch pre-flight — run BEFORE the FIRST `git push` in any session

This check must happen **before pushing any commit**, not just before opening a PR.
At the start of every work session, before touching `git push`, run:

```bash
# 1. Fetch latest main
git fetch origin main

# 2. Check the current branch's existing PR state
gh pr view --json state,url 2>/dev/null

# 3. Confirm only the intended commits are ahead of main
git log --oneline origin/main..HEAD
```

**Rules:**
- If `gh pr view` returns `"state": "MERGED"` → the branch's PR is already merged. **Do NOT push more commits to it.** Create a new branch (`git checkout -b codex/<new-description>`) and open a fresh PR.
- If `gh pr view` returns `"state": "OPEN"` → push new commits to the same branch; the PR updates automatically. Do not create a duplicate.
- If `git log origin/main..HEAD` shows commits that belong to a previous merged PR → fetch main first (`git fetch origin main`) and verify. Those commits are already in main; only the new work should appear.
- **Never push to a branch whose PR has already merged** — commits land in a limbo state (not in main, tied to a closed PR).

> **Why "before the first push", not "before `gh pr create`"?**
> Commits pushed to a merged branch are orphaned even if a new PR is later opened from a different branch.
> The check must happen before the first `git push` so no commits ever land on a dead branch.

---

## 15. Files that are safe to edit vs. generated

| File | Status |
|---|---|
| `src/main.js` | Hand-maintained — edit freely |
| `src/data.js` | Hand-maintained — edit carefully (affects all pack loading) |
| `src/quiz.js` | Hand-maintained |
| `src/storage.js` | Hand-maintained — always update `DEFAULT_STATE` when adding prefs |
| `data/generated/manifest.json` | Hand-maintained (generator script exists but is rarely run) |
| `data/generated/consolidated_*_student_model_answers.json` | Tracked — ChatGPT enrichment output, can't be regenerated automatically |
| `data/generated/*.md`, `data/generated/*.json` (non-enriched) | **gitignored** — intermediate pipeline artifacts, regeneratable |
| `data/Packs/**/pack_unified.json` | Hand-maintained JSON — schema v1.1 |
| `public/docs/*.md` | Hand-maintained prompt templates — fetched at runtime |
| `docs/REACT_ARCHITECTURE.md` | Hand-maintained — update after any structural React change |
| `docs/AI_UI_IMPLEMENTATION_CAUTIONS.md` | Hand-maintained — add RC/CD/CSS/A entries when new bugs are found; **not CLAUDE.md** |
| `docs/ARCHITECTURE.md` | Hand-maintained — update when the data pipeline or system architecture changes |
| `docs/aqa-student-answer-enrichment-prompt.md` | Hand-maintained — update when enrichment format or workflow changes |
| `docs/AQA_PIPELINE.md` | Hand-maintained — update when stage 1-4 scripts change |
| `docs/AQA_AI_WORKFLOW.md` | Hand-maintained — update when stage 5 or Smart Test changes |
| `generated_packs/` | AI draft output — **gitignored**, never committed |
| `dist/` | Vite build output — **gitignored** |
