# AQA Past Paper Collection Pipeline

A safe, polite, reusable 3-stage Python CLI pipeline for collecting AQA GCSE past-paper PDFs and mark schemes — without mass-downloading from the listing page.

---

## Why a 3-stage design?

| Stage | What it does | Why separate? |
|---|---|---|
| **1 — Collect** | Scrapes metadata and download URLs only — no PDFs | Lets you inspect results before committing to any download |
| **2 — Match** | Pairs Question Papers with Mark Schemes from the metadata | You can review, filter, and curate the pairs before touching the website again |
| **3 — Download** | Downloads only the selected, reviewed files | Small, targeted, polite; no mass crawling |

This design means you never download files you didn't choose, and you always have a human review step between scraping and downloading.

---

## Install

```bash
# 1. Install Python dependencies
pip install -r scripts/aqa_pipeline/requirements.txt

# 2. Install the Playwright browser (Chromium only — minimal footprint)
python -m playwright install chromium
```

Python 3.10+ recommended.

---

## Quick start — GCSE Religious Studies example

### Stage 1 — Collect metadata (no downloads)

```bash
# From a direct AQA URL
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_collect_listing \
  --url "https://www.aqa.org.uk/find-past-papers-and-mark-schemes?subject=Religious+Studies&qualification=GCSE+Religious+Studies&specCode=All+Specifications&collapse=subject%2Cqualification%2CspecCode%2CexamSeries&secondaryResourceType=Mark+schemes%3BExaminer+reports%3BQuestion+papers" \
  --output-prefix "output/aqa_rs_all"

# Or from filter parameters
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_collect_listing \
  --subject "Religious Studies" \
  --qualification "GCSE Religious Studies" \
  --output-prefix "output/aqa_rs_all"

# With headless browser visible (useful for debugging)
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_collect_listing \
  --subject "Religious Studies" \
  --qualification "GCSE Religious Studies" \
  --output-prefix "output/aqa_rs_all" \
  --headless false
```

Outputs:
- `output/aqa_rs_all.csv` — one row per result card
- `output/aqa_rs_all.json` — structured JSON with metadata block

Stage 1 never downloads PDFs. It only reads the listing page and records download URLs.

---

### Stage 2 — Match question papers with mark schemes

```bash
# Filter to June 2024 only
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_match_pairs \
  --input "output/aqa_rs_all.csv" \
  --exam-series "June 2024" \
  --output-prefix "output/aqa_rs_june_2024_selected"

# All exam series
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_match_pairs \
  --input "output/aqa_rs_all.csv" \
  --output-prefix "output/aqa_rs_all_selected"

# Filter to specific papers only
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_match_pairs \
  --input "output/aqa_rs_all.csv" \
  --exam-series "June 2024" \
  --include-paper "Paper 1" \
  --include-paper "Paper 2" \
  --output-prefix "output/aqa_rs_june_2024_p1_p2"

# Review mode — includes unmatched pairs in output for inspection
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_match_pairs \
  --input "output/aqa_rs_all.csv" \
  --exam-series "June 2024" \
  --output-prefix "output/aqa_rs_june_2024_selected" \
  --review-mode
```

Outputs:
- `output/aqa_rs_june_2024_selected.csv` — one row per matched pair (open in Excel to review)
- `output/aqa_rs_june_2024_selected.json` — structured pairs with full metadata

**Review the CSV before downloading.** Check that:
- Each row has both a `question_paper_url` and a `mark_scheme_url`
- The `component_key` and `display_title` look correct
- No unexpected papers are included

---

### Stage 3 — Download selected files

```bash
# Dry run first (default — safe, no files downloaded)
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_download_selected \
  --input "output/aqa_rs_june_2024_selected.json" \
  --download-dir "downloads/aqa" \
  --dry-run

# Actual download (requires --confirm-download)
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_download_selected \
  --input "output/aqa_rs_june_2024_selected.json" \
  --download-dir "downloads/aqa" \
  --max-downloads 20 \
  --delay-ms 7000 \
  --confirm-download
```

**Dry-run is the default.** Without `--confirm-download`, the script only simulates what it would do and writes a log. This lets you verify the target paths and file count before committing.

---

## Dry-run and safe download mode

The downloader has two explicit safety layers:

1. **Dry-run default** — Unless you pass `--confirm-download`, the script logs what it *would* download but saves nothing.
2. **Max-downloads limit** — `--max-downloads` (default: 20) caps the total number of files per run.

These defaults exist to prevent accidental mass downloads. Increase `--max-downloads` only when you've reviewed the selected pairs CSV and confirmed the scope.

---

## Filtering by subject, qualification, and exam series

### Stage 1 — at collection time

| Option | Example |
|---|---|
| `--subject` | `"Religious Studies"` |
| `--qualification` | `"GCSE Religious Studies"` |
| `--exam-series` | `"June 2024"` |
| `--spec-code` | `"All Specifications"` |

Or pass a pre-built `--url` with all filters already encoded.

### Stage 2 — at matching time

| Option | Example |
|---|---|
| `--exam-series` | `"June 2024"` — restrict to one sitting |
| `--include-paper` | `"Paper 1"` — repeatable, limits to named papers |
| `--exclude-modified` | `true` (default) — skip A4/A3 large-print versions |
| `--exclude-examiner-reports` | `true` (default) — skip examiner reports |
| `--exclude-additional-material` | `true` (default) — skip inserts, transcripts, booklets |

---

## Reviewing selected pairs before download

After Stage 2, open `output/aqa_rs_june_2024_selected.csv` in any spreadsheet app.

Columns to review:
- `match_status` — should be `matched` for all pairs you intend to download
- `question_paper_url` — should be a real AQA CDN URL, not blank
- `mark_scheme_url` — same
- `display_title` — human-readable component name (e.g. "Paper 1 Section A Option 2 Christianity")
- `match_confidence` — 1.0 = high confidence; lower values indicate shorter/ambiguous keys

Use `--review-mode` in Stage 2 to also see unmatched question papers and mark schemes in the JSON output.

---

## Download folder structure

```
downloads/
  aqa/
    gcse-religious-studies/
      june-2024/
        paper-1-section-a-option-2-the-study-of-religions-christianity/
          question-paper.pdf
          mark-scheme.pdf
          metadata.json
        paper-1-section-a-option-3-the-study-of-religions-islam/
          question-paper.pdf
          mark-scheme.pdf
          metadata.json
    download_log.csv
    download_log.json
```

Each component folder contains `metadata.json` with source URLs, published dates, and download timestamps.

---

## Reusing for other subjects

The pipeline is fully parameterised. To run for GCSE History:

```bash
PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_collect_listing \
  --subject "History" \
  --qualification "GCSE History" \
  --output-prefix "output/aqa_history_all"

PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_match_pairs \
  --input "output/aqa_history_all.csv" \
  --exam-series "June 2024" \
  --output-prefix "output/aqa_history_june_2024_selected"

PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_download_selected \
  --input "output/aqa_history_june_2024_selected.json" \
  --download-dir "downloads/aqa" \
  --max-downloads 20 \
  --delay-ms 7000 \
  --confirm-download
```

---

## Running tests

```bash
python -m pytest tests/ -v
```

Tests cover: title normalisation, component key generation, resource type detection, exam series detection, modified paper detection, additional material detection, date parsing, and pair matching logic.

---

## Safety and ethics notes

- **No login bypass.** The pipeline does not attempt to access restricted or login-gated resources. If a file requires authentication, it is flagged as `is_restricted = true` and skipped.
- **No mass downloads.** Stage 1 collects URLs only. Stage 3 requires explicit `--confirm-download` and has a default cap of 20 files per run.
- **Polite delays.** The default delay between downloads is 7 seconds (`--delay-ms 7000`).
- **No guessed URLs.** Download URLs are extracted from the real AQA listing page, not constructed by pattern-matching.
- **AQA copyright.** Past papers and mark schemes are copyright AQA. Downloaded materials are for personal revision and educational use only, consistent with AQA's standard terms. Do not redistribute.

---

## Stage 1 CLI reference

```
--url                   Full AQA listing URL (optional if using --subject/--qualification)
--subject               Subject name
--qualification         Qualification name
--spec-code             Specification code (default: All Specifications)
--exam-series           e.g. "June 2024"
--resource-types        Comma-separated types (default: Question papers,Mark schemes,Examiner reports)
--items-per-page        Items per page (if supported by AQA page)
--max-pages             Safety limit on number of pages scraped
--output-prefix         Output file path prefix (required)
--headless              true/false (default: true)
--slow-mo-ms            Slow-motion delay in ms (for debugging)
```

## Stage 2 CLI reference

```
--input                 CSV or JSON from Stage 1 (required)
--exam-series           Filter to one sitting
--include-paper         Paper name filter (repeatable)
--exclude-modified      true/false (default: true)
--exclude-examiner-reports  true/false (default: true)
--exclude-additional-material  true/false (default: true)
--latest-only           true/false (default: true)
--output-prefix         Output file path prefix (required)
--review-mode           Include unmatched entries in output
```

## Stage 3 CLI reference

```
--input                 selected_pairs JSON from Stage 2 (required)
--download-dir          Root download directory (required)
--dry-run               Simulate only (default: on)
--confirm-download      Required for actual downloads
--max-downloads         File cap (default: 20)
--delay-ms              Delay between files in ms (default: 7000)
--overwrite             Overwrite existing files (default: skip)
--user-agent            HTTP User-Agent string
```
