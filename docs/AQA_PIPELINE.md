# AQA Past Paper Collection Pipeline

A safe, reusable 3-stage Python CLI pipeline for collecting AQA GCSE past papers and mark schemes, converting them to structured Markdown, and preparing them for Learning Web pack generation.

---

## Overview

```
Stage 1: aqa_collect_listing.py   ← scrape metadata + download URLs (no PDFs)
           ↓  output/aqa_rs_all.csv / .json

Stage 2: aqa_match_pairs.py       ← match QP + MS pairs, filter noise
           ↓  output/aqa_rs_selected.csv / .json

Stage 3: aqa_download_selected.py ← controlled download (7s delay, dry-run default)
           ↓  downloads/aqa/<qualification>/<series>/<component>/

Stage 4: aqa_pdf_to_md.py         ← smart PDF → Markdown conversion
           ↓  markdown/aqa/<qualification>/<series>/<component>/
```

**Guiding principle:** Never mass-download. Always collect metadata first, review, then download only selected matched pairs.

---

## Files Created

```
scripts/aqa_pipeline/
  __init__.py               Package init
  aqa_common.py             Shared utilities (normalisation, slugify, I/O)
  aqa_collect_listing.py    Stage 1 — Playwright scraper
  aqa_match_pairs.py        Stage 2 — offline pair matcher
  aqa_download_selected.py  Stage 3 — controlled downloader
  aqa_pdf_to_md.py          Stage 4 — smart PDF → Markdown converter
  requirements.txt          Python dependencies

tests/
  test_normalisation.py     Unit tests for aqa_common helpers
  test_matching.py          Unit tests for pair matching logic

output/                     Stage 1 & 2 outputs (CSV + JSON)
downloads/                  Stage 3 PDF downloads
markdown/                   Stage 4 Markdown outputs
docs/AQA_PIPELINE.md        This file
```

---

## Installation

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r scripts/aqa_pipeline/requirements.txt
python -m playwright install chromium
```

---

## Stage 1 — Collect Listing Metadata

Scrapes the AQA past-paper listing page using Playwright. Collects metadata and download URLs for every result card. **Does not download any PDFs.**

```bash
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_collect_listing \
  --url "https://www.aqa.org.uk/find-past-papers-and-mark-schemes?subject=Religious+Studies&qualification=GCSE+Religious+Studies&specCode=All+Specifications&collapse=subject%2Cqualification%2CspecCode%2CexamSeries&secondaryResourceType=Mark+schemes%3BExaminer+reports%3BQuestion+papers" \
  --subject "Religious Studies" \
  --qualification "GCSE Religious Studies" \
  --output-prefix "output/aqa_rs_all"
```

**Outputs:**
- `output/aqa_rs_all.csv` — one row per result card (36 metadata fields)
- `output/aqa_rs_all.json` — same data with a metadata block

**Key metadata fields extracted:**

| Field | Description |
|---|---|
| `title` | Full document title from the page |
| `resource_type` | `question_paper` / `mark_scheme` / `examiner_report` / `unknown` |
| `exam_series` | e.g. `June 2024` |
| `component_key` | Normalised slug for matching, e.g. `paper-1-section-a-option-3-the-study-of-religions-islam` |
| `download_url` | Direct PDF URL from the AQA CDN |
| `is_modified` | `true` if Modified A4/A3 18pt/36pt large-print version |
| `is_insert_or_additional_material` | `true` if Insert, Transcript, Booklet, etc. |
| `modified_type` | `none` / `modified-a4-18pt` / `modified-a3-36pt` / `large-print` |
| `published_date_iso` | ISO-8601 date |

**What was collected (GCSE Religious Studies, all years):**
- 406 unique records across 45 pages
- Years: June 2022, June 2023, June 2024, November 2020, November 2021
- 269 question papers, 110 mark schemes, 68 examiner reports (per AQA filter totals showing 447)

---

## Stage 2 — Match Question Papers with Mark Schemes

Offline processing only — no network access. Reads Stage 1 output and produces matched pairs.

```bash
# All years
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_match_pairs \
  --input "output/aqa_rs_all.csv" \
  --output-prefix "output/aqa_rs_all_selected"

# One exam series only
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_match_pairs \
  --input "output/aqa_rs_all.csv" \
  --exam-series "June 2024" \
  --output-prefix "output/aqa_rs_june_2024_selected"

# Review mode — see unmatched items
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_match_pairs \
  --input "output/aqa_rs_all.csv" \
  --output-prefix "output/aqa_rs_all_selected" \
  --review-mode
```

**Default exclusions:**
- Examiner reports (`--exclude-examiner-reports true`)
- Modified A4/A3 large-print papers (`--exclude-modified true`)
- Inserts, transcripts, source booklets (`--exclude-additional-material true`)

**Matching algorithm:**
1. Group records by `(component_key, exam_series)` — each year is matched separately
2. For each group: find best QP and best MS using priority order:
   - Non-modified preferred over modified
   - Latest `published_date_iso` preferred
   - Records with valid `download_url` preferred
3. Pairs with confidence < 1.0 (short/ambiguous keys) are flagged

**Results (all years, GCSE RS):**
- **93 total pairs** (89 fully matched QP+MS, 4 partial)
- 224 records excluded (68 examiner reports + 156 modified/insert/unknown)

---

## Stage 3 — Controlled Download

Downloads only the files listed in the selected_pairs JSON. Defaults to dry-run.

```bash
# Dry run (default — always safe)
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_download_selected \
  --input "output/aqa_rs_all_selected.json" \
  --download-dir "downloads/aqa" \
  --dry-run

# Actual download — requires explicit confirmation
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_download_selected \
  --input "output/aqa_rs_all_selected.json" \
  --download-dir "downloads/aqa" \
  --max-downloads 200 \
  --delay-ms 7000 \
  --confirm-download
```

**Safety rules enforced by the script:**
- `--confirm-download` required for actual downloads (dry-run otherwise)
- Max concurrency = 1 (strictly sequential)
- Default delay = 7000 ms between files
- Default cap = 20 files per run (increase with `--max-downloads`)
- Skips existing files unless `--overwrite`
- Writes `download_log.csv` and `download_log.json`

**Folder structure:**
```
downloads/aqa/<qualification>/<exam-series>/<component>/
  question-paper.pdf
  mark-scheme.pdf
  metadata.json
```

**Result:** 178 PDFs downloaded (89 question papers + 89 mark schemes across 5 exam sittings)

---

## Stage 4 — Smart PDF → Markdown Conversion

Converts downloaded PDFs to structured Markdown. Tuned specifically for AQA two-column layout.

```bash
# Single file
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_pdf_to_md \
  --input "downloads/aqa/.../question-paper.pdf" \
  --output "markdown/question-paper.md"

# Batch — all 178 PDFs
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_pdf_to_md \
  --input-dir "downloads/aqa" \
  --output-dir "markdown/aqa"
```

**How it handles AQA layout:**

| Problem | Solution |
|---|---|
| AQA two-column PDF ("For Examiner's Use" right column) | Crop right 10% of each page before extraction |
| Cover page (instructions, "For Examiner's Use" table) | Skip page 1 of question papers (always cover) |
| Column noise: "outside the box", "IB", artefact lines | Regex stripping pass |
| Question numbers as spaced digits: "0 1 . 2" | Normalised to `Q1.2` |
| Marks in right margin: `[2 marks]` | Preserved as `**[2 marks]**` |
| MCQ options A/B/C/D | Preserved inline |
| OCR fallback | pytesseract for scanned/image-only pages |

**Question paper output structure:**
```markdown
---
type: question_paper
examSeries: June 2024
...
---
### Q1.1
Which one of the following means Oneness of God?
**[1 marks]**
A Akhirah  B Risalah  C Tawhid  D Torah

### Q1.2
Give two beliefs about the revelation of the Qur'an.
**[2 marks]**
```

**Mark scheme output structure:**
```markdown
---
type: mark_scheme
examSeries: June 2020
...
---
### Q1.1
Answer: C Tawhid

### Q1.2
**[2 marks]**
• It is the exact word of Allah.
• It was revealed through the angel Jibril in Arabic.
• It contains 114 surahs...

### Q1.3
First way
Simple explanation – 1 mark / Detailed – 2 marks
• Muslims believe that recording angels are always present...
```

**Result:** 178 Markdown files (89 QP + 89 MS), zero empty files, average 3–8KB per file.

---

## AQA Question Structure → Learning Web Pack Mapping

AQA GCSE RS papers follow a fixed 5-question pattern per section:

| AQA question | Type | Marks | Pack item type |
|---|---|---|---|
| Q1.1 | MCQ (tick one box) | 1 | `vocab` — quiz generates MCQ from pool |
| Q1.2 | Give two beliefs/reasons | 2 | 2 × `vocab` (one per point) |
| Q1.3 | Explain two ways/beliefs | 4 | 2 × `vocab` (with detailed definition) |
| Q1.4 | Explain two + scripture | 5 | 2 × `vocab` + 1 × `vocab` (scripture quote) |
| Q1.5 | Evaluate a statement | 12 | 2–4 × `vocab` FOR + 2–4 × `vocab` AGAINST + 1 `passage` |

**Model answer rewriting:** The AI will rewrite mark scheme bullet points into full, self-contained sentences at the "detailed explanation" quality level (2-mark standard). Short bullet fragments become complete explanations.

**Evaluate questions (12 marks):** Split into:
- `vocab` items with `sourceWord: "FOR: <claim>"` / `"AGAINST: <claim>"`
- 1 `passage` item containing the question + model answer structure

---

## Next Step: `aqa_md_to_pack.py`

The next pipeline stage will use Claude API to:
1. Read each `question-paper.md` + `mark-scheme.md` pair
2. Rewrite mark scheme content into full-sentence definitions
3. Output a `pack_unified.json` ready for Learning Web

---

## Running the Tests

```bash
python -m pytest tests/ -v
# 59 tests — all passing
```

Tests cover: title normalisation, component key generation, resource type detection, exam series detection, modified paper detection, additional material detection, date parsing, pair matching, deduplication, exclusion rules.

---

## Reusing for Other AQA Subjects

All scripts are fully parameterised. Example for GCSE History:

```bash
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_collect_listing \
  --subject "History" \
  --qualification "GCSE History" \
  --output-prefix "output/aqa_history_all"

PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_match_pairs \
  --input "output/aqa_history_all.csv" \
  --output-prefix "output/aqa_history_selected"

PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_download_selected \
  --input "output/aqa_history_selected.json" \
  --download-dir "downloads/aqa" \
  --max-downloads 50 \
  --delay-ms 7000 \
  --confirm-download

PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_pdf_to_md \
  --input-dir "downloads/aqa" \
  --output-dir "markdown/aqa"
```

---

## Ethics and Compliance

- No login bypass or access to restricted/Centre Services resources
- No mass downloads — metadata always reviewed before any download
- Default 7-second delay between requests
- Downloaded materials for educational/revision use consistent with AQA's standard terms
- Do not redistribute downloaded PDFs
