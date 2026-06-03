# AQA Past-Paper AI Workflow — Complete Reference

How the Learning Web AQA pipeline works end-to-end: from the AQA website through to Smart Test packs playable in the app.

> **Last updated:** June 2026  
> **Applies to:** `scripts/aqa_pipeline/`, `src/react/hooks/useSmartTestSession.js`, `src/react/pages/SmartTestPage.jsx`

---

## 1. Overview — the five-stage pipeline

```
AQA website (live)
       │
       ▼
Stage 1: aqa_collect_listing.py   ← collect metadata only (no downloads)
       │  output/aqa_rs_all.csv / .json
       ▼
Stage 2: aqa_match_pairs.py       ← match Question Paper + Mark Scheme pairs
       │  output/aqa_rs_selected.csv / .json
       ▼
Stage 3: aqa_download_selected.py ← controlled download (dry-run default)
       │  downloads/aqa/<qualification>/<series>/<component>/
       │    question-paper.pdf
       │    mark-scheme.pdf
       ▼
Stage 4: aqa_pdf_to_md.py         ← smart PDF → Markdown conversion
       │  markdown/aqa/<series>/<paper>/
       │    question-paper.md
       │    mark-scheme.md
       ▼
Stage 5: aqa_md_to_pack.py        ← Markdown → Learning Web pack JSON
          data/Packs/gcse/religion/<pack_id>/pack_unified.json
          data/generated/manifest.json  (auto-updated)
```

**Core principle:** Never mass-download. Always collect metadata first, review, then download only what is needed.

---

## 2. Quick start (GCSE Religious Studies)

```bash
cd /path/to/learning-web

# Install Python dependencies (one-time)
pip install -r scripts/aqa_pipeline/requirements.txt
python -m playwright install chromium

# Stage 1 — collect metadata (no PDFs downloaded)
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_collect_listing \
  --url "https://www.aqa.org.uk/find-past-papers-and-mark-schemes?subject=Religious+Studies&qualification=GCSE+Religious+Studies&specCode=All+Specifications&collapse=subject%2Cqualification%2CspecCode%2CexamSeries&secondaryResourceType=Mark+schemes%3BExaminer+reports%3BQuestion+papers" \
  --subject "Religious Studies" \
  --qualification "GCSE Religious Studies" \
  --output-prefix "output/aqa_rs_all"

# Stage 2 — match question papers with mark schemes
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_match_pairs \
  --input "output/aqa_rs_all.csv" \
  --output-prefix "output/aqa_rs_selected"

# Stage 3 — dry run first (always)
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_download_selected \
  --input "output/aqa_rs_selected.json" \
  --download-dir "downloads/aqa" \
  --dry-run

# Stage 3 — actual controlled download (7s delay, 200 file cap)
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_download_selected \
  --input "output/aqa_rs_selected.json" \
  --download-dir "downloads/aqa" \
  --max-downloads 200 \
  --delay-ms 7000 \
  --confirm-download

# Stage 4 — convert all PDFs to Markdown
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_pdf_to_md \
  --input-dir "downloads/aqa" \
  --output-dir "markdown/aqa"

# Stage 5 — generate Learning Web packs from Markdown (all years)
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_md_to_pack \
  --markdown-root "markdown/aqa/unknown-qualification" \
  --learning-web-dir "."
```

---

## 3. Stage 1 — `aqa_collect_listing.py`

### What it does

Uses Playwright (a headless browser) to open the AQA past-paper finder page, navigate through all result pages, and extract metadata for every result card. **Does not download any PDFs.**

### Key decisions

- **Playwright** is needed because the AQA listing page is a React app that renders results via JavaScript; a plain `requests` call returns an empty shell.
- Crops the right 10% of each page before extraction to remove AQA's "For Examiner's Use" column.
- Intercepts PDF request URLs without following them.
- Deduplicates records by download URL.

### AQA page structure (2024)

```
<div id="sample-papers-and-mark-schemes.{year}.{month}.{code}_PDF">
  <a aria-label="{full title}" href="/files/{path}.pdf">
    <h3>{title}</h3>
    <span class="text-muted">{qualification}</span>
    <span>PDF</span>
    <span class="text-muted">{size}</span>
    <span class="text-muted">Published: {date}</span>
  </a>
</div>
```

### Output fields (36 per record)

| Field | Example |
|---|---|
| `title` | `"Question paper: Paper 1 Section A Option 3 The study of religions (Islam) - June 2024 - Religious Studies"` |
| `resource_type` | `"question_paper"` / `"mark_scheme"` / `"examiner_report"` |
| `exam_series` | `"June 2024"` |
| `component_key` | `"paper-1-section-a-option-3-the-study-of-religions-islam"` |
| `download_url` | `"https://www.aqa.org.uk/files/..."` |
| `is_modified` | `false` |
| `modified_type` | `"none"` / `"modified-a4-18pt"` / `"modified-a3-36pt"` |
| `published_date_iso` | `"2024-12-07"` |

### Results (GCSE Religious Studies)

- 406 unique records from 45 pages
- 269 question papers, 110 mark schemes, 68 examiner reports (source: AQA filter totals showing 447)
- 5 exam sittings: June 2022, June 2023, June 2024, November 2020, November 2021

---

## 4. Stage 2 — `aqa_match_pairs.py`

### What it does

Offline processing only — reads the Stage 1 CSV and produces matched Question Paper + Mark Scheme pairs. Groups by `(component_key, exam_series)` so each sitting is matched independently.

### Matching algorithm

1. Normalise titles: strip `"Question paper:"` / `"Mark scheme:"` prefix, strip `"- June 2024 - Religious Studies"` suffix.
2. Build a `component_key` slug: `"paper-1-section-a-option-3-the-study-of-religions-islam"`
3. Group by `(component_key, exam_series)` → separate bucket per year.
4. For each bucket: select the **best** QP and MS using priority: non-modified > latest `published_date_iso` > has `download_url`.

### Default exclusions

| Excluded | Reason |
|---|---|
| Examiner reports | Exam technique, not content |
| Modified A4 18pt / A3 36pt | Accessibility formats, duplicate content |
| Inserts, transcripts, booklets | Supporting material, not standalone QA |

### Results (GCSE RS, all sittings)

- **89 matched pairs** (QP + MS both present)
- 224 records excluded (68 examiner reports + 156 modified/insert/unknown)
- 4 partial pairs (QP only or MS only)

---

## 5. Stage 3 — `aqa_download_selected.py`

### What it does

Downloads only the files listed in the Stage 2 selected-pairs JSON. **Defaults to dry-run** — requires `--confirm-download` for actual downloads.

### Safety rules

| Rule | Value |
|---|---|
| Concurrency | 1 (strictly sequential) |
| Default delay | 7000 ms between files |
| Default cap | 20 files per run (raise with `--max-downloads`) |
| Dry-run | Default until `--confirm-download` is passed |
| Existing files | Skipped unless `--overwrite` |
| Auth bypass | Never — restricted files are flagged, not fetched |

### Folder structure

```
downloads/aqa/
  gcse-religious-studies/
    june-2024/
      paper-1-section-a-option-3-the-study-of-religions-islam/
        question-paper.pdf
        mark-scheme.pdf
        metadata.json
```

### Download log

```
downloads/aqa/download_log.csv
downloads/aqa/download_log.json
```

Fields: `timestamp`, `component_key`, `file_role`, `url`, `target_path`, `status`, `http_status`, `bytes_downloaded`, `error_message`

### Results (GCSE RS)

- 178 PDFs downloaded (89 question papers + 89 mark schemes)
- Total size: ~80 MB
- All HTTP 200 — no restricted files encountered

---

## 6. Stage 4 — `aqa_pdf_to_md.py`

### What it does

Converts downloaded PDFs to structured Markdown using pdfplumber, with PyMuPDF and pytesseract as fallbacks.

### AQA layout challenges

AQA exam papers use a two-column layout:
- Left column (~70%): question text
- Right column (~18%): "For Examiner's Use" table with Q number labels and mark boxes

Without adjustment, text extraction merges the two columns and produces noise like:

```
Q1.1 Which one of...                    box
                        [1 mark]
Q1.2 Give two...       Q1.3
                    Instructions...
```

### Solutions applied

| Problem | Fix |
|---|---|
| Two-column merge | Crop right 10% before extraction |
| Cover page noise | Skip page 1 (always instructions) |
| "For Examiner's Use" labels | Regex strip pass |
| Truncated mark brackets | Filter lone `[` lines |
| "IB", "Tu", artefact lines | Regex filter |
| Q numbers as spaced digits (`0 1 . 2`) | Normalise to `Q1.2` |

### Output format

**Question paper:**
```markdown
---
type: question_paper
examSeries: June 2024
---

### Q1.1
Which one of the following means Oneness of God?
**[1 marks]**
A Akhirah  B Risalah  C Tawhid  D Torah

### Q1.2
Give two beliefs about the revelation of the Qur'an.
**[2 marks]**
```

**Mark scheme:**
```markdown
---
type: mark_scheme
examSeries: June 2020
---

### Q1.1
Answer: C Tawhid

### Q1.2
**[2 marks]**
• It is the exact word of Allah.
• It was revealed through the angel Jibril in Arabic.
```

### Extraction fallback chain

1. **pdfplumber** — layout-aware text extraction (works for all 178 files in this dataset)
2. **PyMuPDF** — block-level extraction, better with multi-column layouts
3. **pytesseract** — OCR for scanned/image-only pages

### Results

- 178 Markdown files (89 QP + 89 MS)
- Zero empty files
- Average 3–8 KB per file

---

## 7. Stage 5 — `aqa_md_to_pack.py`

### What it does

Reads mark scheme Markdown files and generates Learning Web `pack_unified.json` files automatically. This is the key AI-workflow step — it converts AQA exam content directly into quizzable Learning Web packs without manual data entry.

### Parser architecture

#### Question header detection

The parser handles two AQA heading formats:

```
# Format A (standard):          # Format B (inline, some papers):
### Q1.1                         Q1.1 Which one of the following...
Which one of the following...
```

Pattern: `r"^(?:###\s+)?(Q\d+\.\d+)\b"`

#### Per-question-type processing

| AQA Q# | Marks | Parser extracts | Pack item types |
|---|---|---|---|
| `Q*.1` | 1 | MCQ question text + answer letter + options | `vocab` (MCQ style) |
| `Q*.2` | 2 | 2 bullet-point acceptable answers | 2× `vocab` |
| `Q*.3` | 4 | 2 bullet-point answers | 2× `vocab` |
| `Q*.4` | 5 | 2 bullet-point answers + first scripture quote | 2× `vocab` + 1× `vocab` (scripture) |
| `Q*.5` | 12 | Statement to evaluate + FOR bullets + AGAINST bullets | `vocab` FOR:/AGAINST: items |

#### Sentence-builder generation

For each Q*.2/3/4, the first bullet point is shortened to 6–8 words and used as a `sentenceBuilder` tile-arrange item:

```python
short = " ".join(bullet.split()[:8]) + "."
```

#### FOR/AGAINST detection

The parser locates the evaluate-question argument blocks by searching for the literal AQA headings:
```
Arguments in support
...
Arguments in support of other views
```

Each bullet becomes a `vocab` item prefixed `"FOR:"` or `"AGAINST:"`, enabling the Smart Test argument scaffold section.

#### Passage generation

Each pack includes one `passage` item: a contextual paragraph about the religion and exam series, with 3 comprehension MCQs. One question uses the actual Q1.1 MCQ from the paper.

### Item classification for Smart Test

The `useSmartTestSession.js` hook uses these rules to place items into sections:

| Item `sourceWord` | Smart Test section |
|---|---|
| Starts with `"MCQ:"` | Knowledge Check (5 MCQ questions) |
| `targetWord` length ≥ 40 chars, not FOR/AGAINST | Key Concepts flashcard (3 cards) |
| Starts with `"FOR:"` or `"AGAINST:"` | Evaluation Practice scaffold |
| `type === "sentenceBuilder"` | Sentence Builder (3 tile-arrange questions) |
| `type === "passage"` | Reading section |

### Output

For each mark scheme markdown file, one `pack_unified.json` is written:

```
data/Packs/gcse/religion/<pack_id>/pack_unified.json
```

The manifest is also updated with a `capabilities: ["revision", "passages"]` entry.

### Results

- 103 packs generated total (14 hardcoded 2024 + 89 auto-parsed)
- 5 exam sittings fully covered
- Zero errors on 89 auto-parsed packs

---

## 8. Smart Test mode — how it works in the app

### Hook: `useSmartTestSession.js`

The Smart Test session is built entirely client-side from the pack data. No server calls are made.

#### Session lifecycle

```
startSession(manifest, dataset)
  → loadVocabItems()        ← all vocab items from pack
  → loadUnifiedPack()       ← sentenceBuilder + passage items
  → buildSession()          ← classify + select + shuffle deterministically
  → _set(newSession)        ← mirror in sessionRef (RC9 safe)

Session phases:
  "running"  → per-section answering
  "done"     → results page
```

#### Deterministic session seeding

Sessions are seeded from `sessionId = "st-{datasetId}-{timestamp}"` using a simple LCG random number generator. This means re-loading a session with the same seed produces the same question order.

```javascript
function seededRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
```

#### Section build rules (per session)

```
MCQ section (5 questions):
  pool = vocab items where !isArgumentItem(w)
  shuffle(pool, rng).slice(0, 5)
  for each question: build 3 distractor options from other pool items

Sentence Builder (3 questions):
  pool = sentenceBuilder items from pack
  shuffle(pool, rng).slice(0, 3)
  tiles = model answer split on spaces, then shuffled

Reading (1 passage):
  pick first passage item (shuffled)
  show sourcePassage text + data.questions[] comprehension MCQs

Argument scaffold (all FOR/AGAINST items):
  forItems  = vocab items where sourceWord starts with "FOR:"
  againstItems = vocab items where sourceWord starts with "AGAINST:"
  display two-column scaffold with the evaluate statement
```

#### StrictMode-safe patterns (RC9)

All side effects fire **outside** `setState` updater functions:

```javascript
// WRONG — fires twice in StrictMode dev
setSession(prev => {
  updateProgress(state => recordWordAnswer(state, word.id, correct)); // ← double fire!
  return { ...prev };
});

// CORRECT — side effect outside setState
const newSession = { ...sessionRef.current, ... };
sessionRef.current = newSession;   // update mirror ref
setSession(newSession);            // pass value, not function
updateProgress(state => {          // side effect runs once, outside
  recordWordAnswer(state, word.id, correct);
});
```

#### Retry weak items

The `retryWeakItems(weakItems)` action builds a new session directly from the wrong-answer words without reloading the pack:

```javascript
const newSession = buildSession(weakItems, [], [], "retry", sessionId);
_set(newSession);
```

### Component: `SmartTestPage.jsx`

#### Page phases

```
Setup:   Subject card → Curriculum select → Pack select → Start
Running: ProgressBar → SectionHeader → (MCQ | Builder | Flashcard | Reading | Argument)
Results: Score % → Section breakdown → Weak items → Retry / New Test
```

#### Section components

| Section type | Interaction |
|---|---|
| `McqSection` | 4 option buttons → immediate feedback → Next |
| `BuilderQuestion` | Tile pool → build area → Check → feedback |
| `ReadingSection` | Passage display → Next Section |
| `ArgumentSection` | Two-column FOR/AGAINST cards → expandable detail → Finish |
| `FlashcardSection` | Reveal definition → Got it / Review again |

#### Builder tile state

Each `BuilderQuestion` is a keyed component (`key={question.id}`) so it mounts fresh state for each sentence. Tile pool state is local to the component.

---

## 9. Adding packs for new subjects or years

### Add packs for a new AQA subject

```bash
# 1. Collect metadata
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_collect_listing \
  --subject "History" \
  --qualification "GCSE History" \
  --output-prefix "output/aqa_history_all"

# 2. Match pairs
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_match_pairs \
  --input "output/aqa_history_all.csv" \
  --output-prefix "output/aqa_history_selected"

# 3. Download (dry run first)
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_download_selected \
  --input "output/aqa_history_selected.json" \
  --download-dir "downloads/aqa" --dry-run

# 4. Convert to Markdown
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_pdf_to_md \
  --input-dir "downloads/aqa" --output-dir "markdown/aqa"

# 5. Generate packs
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_md_to_pack \
  --markdown-root "markdown/aqa/unknown-qualification" \
  --learning-web-dir "."
```

### Re-run for a new exam year (e.g. June 2025)

```bash
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_md_to_pack \
  --markdown-root "markdown/aqa/unknown-qualification" \
  --learning-web-dir "." \
  --year "june-2025"
```

The `--year` filter means only papers from that sitting are processed. All existing packs are skipped automatically.

### Customising the pack generator

`aqa_md_to_pack.py` has two key extension points:

**`RELIGION_MAP` / `PAPER_LABEL_MAP`** — maps AQA folder names to display labels. Add new papers here.

**`questions_to_items()`** — converts parsed questions to pack items. To change how FOR/AGAINST items are written, how scripture is formatted, or how tile sentences are shortened, edit this function.

---

## 10. Pack schema reference

All AQA packs use schema v1.1 with `subject: "religion"`, `curriculum: "gcse"`.

### Vocab item (knowledge)

```json
{
  "id": "gcse_rs_june_2024_p1_opt3_q1_3_q1_3_pt1",
  "type": "vocab",
  "level": "GCSE Year 10-11",
  "topics": ["Islam: Beliefs"],
  "tags": ["GCSE", "religion", "AQA", "june-2024"],
  "data": {
    "partOfSpeech": "keyword",
    "sourceWord": "Predestination influence — comfort in hardship (1)",
    "targetWord": "Sunni Muslims believe Allah has decreed all that happens…",
    "examples": { "en-GB": "AQA June 2024 Q1.3" }
  }
}
```

### Argument scaffold item

```json
{
  "id": "..._q1_5_for1",
  "type": "vocab",
  "data": {
    "sourceWord": "FOR: The Qur'an is the direct word of Allah",
    "targetWord": "The Qur'an is believed to be the direct, unaltered word of Allah…"
  }
}
```

### Sentence builder item

```json
{
  "id": "..._q1_3_sb",
  "type": "sentenceBuilder",
  "data": {
    "cardType": "model_answer",
    "prompt": "Build a key point: Explain two ways predestination influences Muslims",
    "answer": "Sunni Muslims believe Allah has decreed all that happens.",
    "tiles": ["Sunni", "Muslims", "believe", "Allah", "has", "decreed", "all", "that", "happens."]
  }
}
```

### Passage item

```json
{
  "id": "..._passage",
  "type": "passage",
  "data": {
    "title": "Islam — June 2024 Overview",
    "sourcePassage": "This pack covers the AQA GCSE Religious Studies examination for Islam…",
    "targetPassage": "...(same)...",
    "speechLanguage": "en-GB",
    "questions": [
      {
        "id": "..._pq1",
        "questionType": "multiple_choice",
        "question": "How many marks is the evaluate question worth?",
        "options": ["4 marks", "5 marks", "10 marks", "12 marks"],
        "correctOptionIndex": 3
      }
    ]
  }
}
```

---

## 11. Ethics and legal notes

- All scripts respect AQA's website infrastructure — no brute-force crawling, no authentication bypass.
- The 7-second default delay between downloads is intentional and should not be reduced.
- Downloaded papers are copyright AQA. Use for personal revision and educational purposes only. Do not redistribute.
- The `--confirm-download` flag is required for real downloads precisely to prevent accidental mass-downloading.

---

## 12. File map

```
scripts/aqa_pipeline/
  aqa_common.py          — shared utilities: normalise_title, slugify, detect_*, write_csv/json
  aqa_collect_listing.py — Stage 1: Playwright scraper
  aqa_match_pairs.py     — Stage 2: offline pair matcher
  aqa_download_selected.py — Stage 3: controlled downloader
  aqa_pdf_to_md.py       — Stage 4: PDF → Markdown converter
  aqa_generate_packs.py  — Stage 5a: hardcoded 2024 packs (reference implementation)
  aqa_md_to_pack.py      — Stage 5b: automatic parser (all years, all subjects)
  requirements.txt       — Python dependencies
  README.md              — quick-start guide
  tests/
    test_normalisation.py  — 44 tests for aqa_common
    test_matching.py       — 15 tests for aqa_match_pairs

src/react/
  hooks/useSmartTestSession.js  — session builder + state machine
  pages/SmartTestPage.jsx       — setup → sections → results UI

data/Packs/gcse/religion/       — 103 AQA GCSE RS packs
data/generated/manifest.json    — updated with all packs

docs/
  AQA_PIPELINE.md       — stage-by-stage CLI reference
  AQA_AI_WORKFLOW.md    — this file (full technical explanation)
```
