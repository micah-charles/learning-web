# Learning Web — Architecture Reference

> How the entire system fits together.

---

## 1. System Overview

Learning Web is a **browser-only, offline-capable revision app** for KS3–GCSE students.

**Tech stack:**
- **React 18 + Vite** shell (tab routing, contexts, hooks)
- **Vanilla JS engine** (quiz generation, data loading, storage, progress)
- **Static JSON files** served from `data/` — no backend, no database
- **localStorage** for all user state
- **Static site** deployed to Render.com

---

## 2. Data Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                    DATA PIPELINE (source of all content)           │
│                                                                    │
│  AQA website ──► Stage 1-4: Collect/Download/Convert              │
│       │               (aqa_pipeline/*.py)                          │
│       ▼                                                           │
│  markdown/aqa/.../question-paper.md + mark-scheme.md               │
│       │                                                           │
│       ▼                                                           │
│  Stage 5: aqa_generate_geography.py / aqa_md_to_pack.py           │
│       │   (adaptive OCR parser → structured questions)            │
│       ▼                                                           │
│  consolidated_geography_questions.json   ← intermediate,          │
│       │                                     gitignored            │
│       ▼                                                           │
│  ChatGPT Enrichment (studentAnswer fields added)                  │
│       │                                                           │
│       ▼                                                           │
│  consolidated_*_student_model_answers.json ← tracked (can't       │
│       │                                     regenerate)           │
│       ▼                                                           │
│  deploy_geo_packs.py                                              │
│       │   (splits enriched JSON into per-paper packs)             │
│       ▼                                                           │
└──────────┬─────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────────────────┐
│                   MANIFEST (data/generated/manifest.json)          │
│                                                                    │
│  The central registry — controls what the app serves.             │
│  Every pack, passage, and study note is registered here.           │
│                                                                    │
│  packs[] ← all revision packs (with unifiedPath + contentMdPath)  │
└───────┬────────────────────────────────────────────────────────────┘
        │
        ├────────────────────────────────────────────────┐
        ▼                                                ▼
┌──────────────────┐                    ┌──────────────────────────┐
│   STUDY BOOK      │                    │     SEO PAGES            │
│   System          │                    │     (Build-time)         │
│                   │                    │                          │
│  contentMdPath    │                    │  generate-seo-pages.mjs  │
│  ───► study_notes.│                    │  ───► dist/revision/     │
│       md          │                    │      subjects/index.html │
│                   │                    │      subjects/{slug}/    │
│  StudyBookDrawer  │                    │      studybook/{subj}/   │
│  reads markdown   │                    │      {pack}/index.html   │
│  at runtime       │                    │      sitemap.xml         │
│                   │                    │                          │
└──────────────────┘                    └──────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────────────┐
│                     TUTOR (FoxChild)                               │
│                                                                     │
│  build-studybook-index.js (build-time)                              │
│    ───► public/search/studybook-index.json                         │
│         (15,510 chunks from 521 study_notes.md files)              │
│                                                                     │
│  studybookIndex.js (runtime)                                        │
│    ───► MiniSearch + optional semantic search (Transformers.js)    │
│    ───► search across all study books + current pack               │
│                                                                     │
│  Used by: TutorWidget, TutorPanel, tutorEngine                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Layout — Key Paths

```
learning-web/
├── data/
│   ├── generated/
│   │   ├── manifest.json                  ← CENTRAL REGISTRY
│   │   └── consolidated_geography_questions_student_model_answers.json
│   │                                      ← ChatGPT-enriched (checked in, can't regenerate)
│   │                                      ← Other generated files are gitignored
│   ├── Packs/
│   │   ├── <curriculum>/<subject>/<pack_id>/
│   │   │   ├── pack_unified.json          ← REQUIRED: revision items
│   │   │   ├── passages.json              ← OPTIONAL: reading content
│   │   │   └── study_notes.md             ← OPTIONAL: study book content
│   │   └── ... (200+ packs across subjects)
│   └── core_unified.json                  ← Core German vocabulary
│
├── scripts/
│   ├── aqa_pipeline/                      ← AQA data pipeline (Python)
│   │   ├── aqa_common.py
│   │   ├── aqa_collect_listing.py         ← Stage 1: scrape metadata
│   │   ├── aqa_match_pairs.py             ← Stage 2: match QP+MS pairs
│   │   ├── aqa_download_selected.py       ← Stage 3: controlled download
│   │   ├── aqa_pdf_to_md.py              ← Stage 4: PDF → Markdown
│   │   ├── adaptive_ocr_parser.py         ← Format-adaptive OCR parser
│   │   ├── aqa_generate_geography.py      ← Stage 5a: Geography pack gen
│   │   ├── export_geo_consolidated.py     ← Consolidated JSON + markdown
│   │   └── deploy_geo_packs.py            ← Split enriched JSON → packs
│   ├── build-studybook-index.js           ← Tutor index builder (Node)
│   ├── generate-seo-pages.mjs             ← SEO page generator (Node)
│   ├── generate_manifest.py               ← Manifest builder (Python)
│   ├── generate_study_book_index.py       ← Alternate indexer (Python)
│   └── validate_pack.py                   ← Pack validator
│
├── src/
│   ├── react/
│   │   ├── App.jsx                        ← Tab routing, provider tree
│   │   ├── context/
│   │   │   ├── ManifestContext.jsx         ← Manifest loader
│   │   │   ├── StudyBookContext.jsx        ← Study book state
│   │   │   └── TutorProvider.jsx           ← Tutor state + integration
│   │   ├── pages/                         ← One per tab (14 tabs)
│   │   └── components/
│   │       ├── layout/                    ← NavBar, Hero, SubjectCardGrid
│   │       └── learning/                  ← StudyBookDrawer, QuizCard, etc.
│   ├── features/
│   │   └── tutor/                         ← FoxChild Tutor (isolated feature)
│   ├── study-book-core.js                 ← Pure functions for study book
│   ├── study-book.js                      ← DOM-dependent study book helpers
│   ├── data.js                            ← Manifest/pack loading (SHARED)
│   ├── quiz.js                            ← Question generation (SHARED)
│   ├── storage.js                         ← State persistence (SHARED)
│   └── progress.js                        ← Analytics (SHARED)
│
├── public/
│   ├── search/
│   │   └── studybook-index.json           ← Tutor search index (15,510 chunks)
│   ├── docs/                              ← Runtime-fetched prompt templates
│   └── revision/                          ← SEO page static assets
│       ├── revision.css
│       ├── revision-study-book.js
│       ├── logo.png
│       └── hero-bg.jpg
│
├── docs/
│   ├── ARCHITECTURE.md                    ← THIS FILE
│   ├── AQA_PIPELINE.md                    ← Stage 1-4 CLI reference
│   ├── AQA_AI_WORKFLOW.md                 ← Stage 5 + Smart Test reference
│   ├── foxchild_tutor.md                  ← Tutor feature docs
│   ├── data-structures.md                 ← Full schema reference (v1.1)
│   ├── pack-generation-prompt.md          ← AI pack generation master prompt
│   ├── manifest-registration-guide.md     ← Manifest registration guide
│   └── REACT_ARCHITECTURE.md              ← React provider tree, hooks, pages
│
├── AGENTS.md                              ← AI agent workflow rules
├── CLAUDE.md                              ← Project guide (schema, UI, conventions)
├── DESIGN.md                              ← Visual design principles
├── vite.config.js                         ← Vite config + static copy
└── render.yaml                            ← Render.com deployment
```

---

## 4. Pipeline Stages (AQA Content)

### 4.1 Data Collection (Stages 1-4)
Documented in `docs/AQA_PIPELINE.md`.

Summary: Scrape → Match → Download → Convert PDF to Markdown.

### 4.2 Pack Generation (Stage 5)
Documented in `docs/AQA_AI_WORKFLOW.md`.

Two sub-pipelines:

**Geography (current):**
1. `adaptive_ocr_parser.py` — auto-detects 6+ OCR formats (hash headers, inline Q numbers, duplicate detection, artifact filtering)
2. `aqa_generate_geography.py` — reads QP+MS markdown pairs, uses adaptive parser, generates consolidated question JSON + study notes per paper
3. `export_geo_consolidated.py` — merges all papers into `consolidated_geography_questions.json` + `consolidated_geography.md` (both **gitignored** — intermediate artifacts)
4. **ChatGPT enrichment** — adds `studentAnswer` fields (model answers, key points, exam technique, sentence builder candidates) — see `docs/aqa-student-answer-enrichment-prompt.md`. Output: `consolidated_geography_questions_student_model_answers.json` (tracked — can't be regenerated automatically)
5. `deploy_geo_packs.py` — splits enriched JSON into per-paper `pack_unified.json`, copies `study_notes.md`, registers in manifest

**Religious Studies (legacy):**
- `aqa_md_to_pack.py` — auto-parses all 89 RS pairs into packs in one pass

### 4.3 Geography — Question Format Detection

The adaptive OCR parser (`adaptive_ocr_parser.py`) auto-detects these formats:

| Format | Pattern | Papers |
|--------|---------|--------|
| `hash_q_dot` | `### Q1.1` | Clean Geography/RS |
| `hash_q_dot_duped` | `### Q1.1` (duplicate of Q1.10/11) | Papers with sub-questions |
| `hash_q0` | `### Q0.x` (wrong prefix) | Nov 2020 |
| `inline_q_space` | `Q1 1` (no headers) | June 2022 inline style |
| `inline_q_space_continuation` | `Q1 1 0` → Q1.10 | Split sub-numbers |
| `flat_q` | `Q1` (no sub-number) | History papers |

Cross-format fallback: if auto-detected format produces less than 70% extraction, the parser rotates to the next-best format.

### 4.4 Enrichment Pipeline

After consolidated question JSON is generated, ChatGPT enriches it with:

```
For each question → studentAnswer:
  answerType:       "mcq" | "short_response" | "extended_response"
  modelAnswer:      Full student-facing answer
  modelAnswerLevel: "basic" | "clear" | "detailed"
  keyPoints:        Bullet-point summary
  examTechnique:    Strategy notes
  sentenceBuilderCandidates:  Sentence-level fragments
                                (for extended response, ChatGPT-generated)
```

The enrichment prompt is documented in `docs/aqa-student-answer-enrichment-prompt.md`.

### 4.5 Deployment

`deploy_geo_packs.py` reads enriched JSON and for each paper:
1. Creates `data/Packs/gcse/geography/<pack_id>/pack_unified.json`
2. Copies `study_notes.md` into the pack directory
3. Registers in `data/generated/manifest.json` with `contentMdPath`

**Item type mapping (Geography):**
| Question type | Pack item type | Notes |
|--------------|----------------|-------|
| MCQ (isMCQ) | `multipleChoice` | answer resolved from options/correctIndex |
| Short response | `vocab` (keyword) | sourceWord = Q text, targetWord = answer |
| Extended response | `vocab` (keyword) | ChatGPT's sentenceBuilderCandidates skipped (tiles are sentence-level, not word-level) |

---

## 5. Study Book System

### 5.1 How it works

1. Pack directory contains `study_notes.md` — the full exam mark scheme content
2. Manifest registrations have `contentMdPath` pointing to it
3. StudyBookContext loads the markdown at runtime via `fetch()`
4. `study-book-core.js` renders it with `marked` + extracts TOC for navigation
5. StudyBookDrawer displays the rendered HTML with collapsible TOC

### 5.2 Multiple files

When a pack has more than one markdown file, use:
```json
{
  "contentMdPath": "data/Packs/.../study_notes.md",
  "extraMdFiles": [
    { "title": "Exam Tips", "path": "data/Packs/.../exam_tips.md" }
  ]
}
```

### 5.3 Must have heading-based structure

The TOC extraction and tutor chunking both depend on markdown headings (`##`, `###`):

```markdown
# Pack Title

## Q1.1: Question text here

Answer content here

## Q1.2: Question text here
```

Each `##` heading produces a TOC entry and a tutor index chunk.

---

## 6. FoxChild Tutor System

### 6.1 Architecture

```
src/features/tutor/
├── TutorProvider.jsx      ← React Context — state, prefs, integration hooks
├── TutorWidget.jsx        ← Mount point (Button + Panel)
├── TutorButton.jsx        ← Floating action button (bottom-right)
├── TutorPanel.jsx         ← Chat panel UI
├── tutorEngine.js         ← Response generation, intent detection
├── tutorRetrieval.js      ← Tokenization, scoring, snippet extraction
├── tutorSpeech.js         ← Browser SpeechSynthesis wrapper
├── studybookIndex.js      ← MiniSearch + semantic search index loader
├── tutorStorage.js        ← Preferences via existing storage.js
└── tutor.css              ← Styles
```

### 6.2 Index pipeline

```
Build-time:
  scripts/build-studybook-index.js
    ─► reads manifest.json
    ─► follows each contentMdPath
    ─► splits each study_notes.md by headings → chunks
    ─► outputs public/search/studybook-index.json (15,510 chunks)

Runtime:
  src/features/tutor/studybookIndex.js
    ─► fetches studybook-index.json
    ─► initializes MiniSearch index
    ─► supports fuzzy matching, prefix search, field boosting
    ─► optionally loads Transformers.js for semantic search
```

### 6.3 Tutor integration points

| Component | Data shared via TutorProvider setter |
|-----------|-------------------------------------|
| QuizPage | `quizSessionRef`, `datasetRef` |
| ReadingPage | `readingPassageRef`, `datasetRef` |
| Vocab data | `datasetRef` |

When no dataset is active (e.g. home page), tutor searches across ALL study books and suggests packs to open.

---

## 7. SEO Pages System

### 7.1 Build pipeline

```
npm run generate:seo   (or part of npm run build)
  ─► scripts/generate-seo-pages.mjs
      ─► reads manifest.json
      ─► collects all packs with contentMdPath
      ─► groups by subject
      ─► generates:
          dist/revision/subjects/index.html           ← all subjects
          dist/revision/subjects/{slug}/index.html    ← per-subject page
          dist/revision/studybook/{subject}/{pack}/index.html  ← full content
          dist/sitemap.xml
          dist/robots.txt
```

### 7.2 Subject routing

```
/revision/subjects/                          → all subjects
/revision/subjects/geography/                → all geography packs
/revision/studybook/geography/gcse_geo_p1_.../ → full study book HTML
```

### 7.3 Auto-discovery

Any pack with `contentMdPath` in the manifest is automatically included in SEO pages. No additional config needed. The geography packs already qualify.

---

## 8. Provider Tree (React)

```
<ManifestProvider>
  <ProgressProvider>
    <StudyBookProvider>
      <TutorProvider>
        <AppContent />
          <StudyBookDrawer />    ← persistent overlay (any page)
          <TutorWidget />        ← floating tutor button (any page)
      </TutorProvider>
    </StudyBookProvider>
  </ProgressProvider>
</ManifestProvider>
```

- **ManifestProvider**: loads manifest.json once, exposes `manifest`, `loading`, `error`
- **ProgressProvider**: wraps `loadStoredState/saveStoredState`, exposed via `useProgress()`
- **StudyBookProvider**: state for the Study Book drawer (open/closed, HTML, TOC, search, split mode)
- **TutorProvider**: state for the tutor panel + integration setters

---

## 9. Key Conventions

### 9.1 Pack directory structure
```
data/Packs/<curriculum>/<subject>/<pack_id>/
  pack_unified.json    ← REQUIRED
  passages.json        ← OPTIONAL (if reading content exists)
  study_notes.md       ← OPTIONAL (if study book content exists)
```

### 9.2 Manifest registration
Every pack in `data/Packs/` must be registered in `data/generated/manifest.json` under `packs[]`.

Required fields: `id`, `displayName`, `subject`, `curriculum`, `capabilities`, `unifiedPath`, `sourceLanguageCode`, `targetLanguageCode`, `wordCount`.

Optional but important:
- `contentMdPath` — enables Study Book + SEO pages + tutor indexing
- `passagePath` + `"passages"` in capabilities — enables reading content
- `extraMdFiles` — additional markdown tabs in Study Book

### 9.3 Non-language packs
`sourceLanguageCode === targetLanguageCode === "en-GB"`. `partOfSpeech` = `"keyword"`.

### 9.4 Validation
Every pack must pass `scripts/validate_pack.py` before committing:
```bash
python3 scripts/validate_pack.py data/Packs/<curriculum>/<subject>/<id>/pack_unified.json
```

### 9.5 Never write to `generated_packs/`
It is gitignored and the app never loads from it.

---

## 10. Build & Deploy Commands

```bash
npm run dev                  # Vite dev server (hot reload)
npm run build                # Full production build:
                             #   1. npm run build:study-books
                             #   2. npm run build:studybook-index
                             #   3. vite build
                             #   4. npm run generate:seo
npm run build:data           # Regenerate manifest.json
npm run build:study-books    # Generate combined study book markdown
npm run build:studybook-index # Generate tutor search index
npm run generate:seo         # Generate SEO pages
npm run preview              # Serve dist/ locally
```

Deployment: Render.com picks up `render.yaml` — runs `npm run build`, serves `dist/`.

---

## 11. File Relationship Summary

| File | Consumed by | Purpose |
|------|-------------|---------|
| `data/generated/manifest.json` | App, SEO generator, tutor indexer | Central registry of all packs |
| `data/Packs/**/pack_unified.json` | App (vocab/quiz/reading/tabs) | All revision items |
| `data/Packs/**/study_notes.md` | StudyBookDrawer, tutor indexer, SEO pages | Full study content |
| `data/Packs/**/passages.json` | ReadingPage | Reading comprehension |
| `public/search/studybook-index.json` | Tutor search (studybookIndex.js) | 15,510 searchable chunks |
| `src/features/tutor/*` | TutorWidget | Chat-based study assistance |
| `dist/revision/**` | Search engines (SEO) | Static HTML for /revision/subjects/ |
| `src/study-book-core.js` | StudyBookDrawer, SEO generator | Markdown rendering + TOC |

### My Packs Upload Boundary

My Packs upload is browser-local and JSON-only. A `.zip` upload is treated as a
bundle of JSON pack files; it does not persist images, markdown, PDFs, or other
assets from the archive.

Uploaded pack image references must already be loadable by the app. The upload
validator accepts HTTPS images and root-relative app paths such as `/assets/...`,
`/images/...`, or `/data/...`. It rejects relative ZIP-local paths such as
`images/foo.png`, because there is no backend file store to serve those bytes
after upload. Image-heavy ChatGPT ZIPs should be converted into built-in served
packs under `data/Packs/**` plus `public/assets/**`.

---

## 12. Known Gaps & Future Work

- **sentenceBuilder items** are currently NOT generated for Geography (ChatGPT candidates are sentence-level, not word-level tiles). Future work could split sentences into word tiles server-side.
- **Passages** are not yet generated for Geography packs (only `"revision"` capability, no `"passages"`). Reading content could be added.
- **CLAUDE.md** references `revisionPacks[]` and `passageGroups[]` which no longer exist — the manifest uses a unified `packs[]` array with `capabilities` field.
- **Two parallel study book indexers** exist: Python (`generate_study_book_index.py`) and Node (`build-studybook-index.js`). Only the Node version is used at build time.
- **My Packs ZIP upload is JSON-only**. It does not import image files or
  markdown files from ZIP archives; visual packs need HTTPS images or served
  public assets.

---

## 13. Chinese Input canonical and curriculum pipeline

Chinese Input Lab keeps source facts and educational decisions in separate build layers:

```text
Pinned EDB / MOE / Rime / Unihan / CHISE snapshots
  → canonical generator
  → characters + readings + ordered decomposition + component display metadata
  → independent Cangjie audit + semantic/HK-anchor audit
  → human review table with approved HK corpus evidence
  → curriculum compiler
  → lesson graph + assessment graph + game graph
```

The canonical generator is deterministic and offline after explicit source acquisition. Cross-source glyph aliases are reviewed constants with source-glyph lineage. CHISE entities are never learner-facing glyphs; decomposition occurrence IDs resolve through `canonical_component_metadata`.

The production curriculum compiler is fail-closed on three independent conditions:

1. an approved Hong Kong corpus source exists in curriculum policy;
2. each included record has reviewed meaning, register, HK evidence and display reading;
3. at least 2,500 included character reviews are approved.

Fixture compilation uses a separate fixture policy and cannot weaken production policy.

The complete preview compiler reads versioned policy files from
`learning-data/chinese-input/curriculum-policy/` and emits disposable graphs
under `learning-data/chinese-input/generated-curriculum/preview/`. Stable
root, character and word entities drive progress migration. The runtime remains
legacy by default; `VITE_CHINESE_CURRICULUM_SOURCE=generated-preview` enables a
schema-checked adapter with an explicit provisional warning.
`generated-production` is rejected unless its manifest is production-approved.
