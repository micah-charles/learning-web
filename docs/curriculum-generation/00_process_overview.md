# Learning Web — Curriculum Content Generation: Process Overview

This document describes the end-to-end pipeline for adding a new subject or
curriculum to the Learning Web platform. It references the exact prompt files
used at each stage.

---

## Pipeline at a Glance

```
Stage 1 — Architecture Design
  Prompt: 01_curriculum_architecture_generator.md
  Output: folder structure + topic list + ARCHITECTURE.md
        + per-topic prompt .md files
              ↓
Stage 1.5 — Topic Prompt Enrichment
  Prompt: 02_enrichment_of_specific_guidance.md
  Output: enriched per-topic prompt .md files with concrete knowledge,
          skills, vocabulary, stimulus, misconceptions, and question styles
              ↓
Stage 2 — Study Content Generation
  Prompt: 02_example_computing_study_content_master_rules.md
         + <topic>.md (one per topic)
  Output: generated_contents/<topic>.md  (one per topic)
              ↓
Stage 3 — JSON Pack Generation
  Prompt: 04_json_pack_generation_prompt.md
         + generated_contents/<topic>.md
  Output: data/Packs/<curriculum>/<subject>/<packId>/pack_unified.json
          data/Packs/<curriculum>/<subject>/<packId>/passages.json
              ↓
Stage 4 — Validation
  Script: scripts/validate_pack.py  (per-file schema check)
  Script: scripts/validate_unified.py  (manifest-wide check)
  Fix:    field names, subject values, item counts
              ↓
Stage 5 — Manifest Registration + Subject Support
  File:   data/generated/manifest.json  (add pack entries)
  Files:  src/data.js, src/main.js, src/react/**  (add subject if new)
```

---

## Stage 1 — Architecture Design

**Prompt file:** [`01_curriculum_architecture_generator.md`](01_curriculum_architecture_generator.md)

**Input:** Subject name (e.g. "KS3 Computing")

**What it produces:**
- Complete folder structure for topic prompt files
- `ARCHITECTURE.md` covering topic map, Learning Web compatibility matrix,
  and batch generation workflow
- `00_master_general_rules.md` — shared writing rules for the subject
- One `.md` prompt file per topic, organised into subdirectories by topic group

**Key decisions made here:**
- Topic groupings and numbering
- Vocabulary table format
- Which Learning Web item types suit each topic (vocab, fillBlank, sequence, categorySort, passage)
- GCSE bridging scope

---

## Stage 2 — Study Content Generation

**Optional enrichment prompt before this stage:** [`02_enrichment_of_specific_guidance.md`](02_enrichment_of_specific_guidance.md)

Use this when the per-topic prompt files from Stage 1 are too generic and need
more concrete subject guidance before batch content generation.

**Prompt files used together:**
1. [`02_example_computing_study_content_master_rules.md`](02_example_computing_study_content_master_rules.md) — example Computing writing style, required sections, vocabulary rules
2. The individual topic `.md` prompt file (e.g. `01_computational_thinking/01_decomposition_abstraction.md`)

**What it produces** (one file per topic saved to `generated_contents/`):
- Overview paragraph
- Key knowledge sections with worked examples, pseudocode, trace tables, ASCII diagrams
- Key vocabulary table
- Common misconceptions table
- Exam-style questions (1–5 mark, MCQ, fill-in-blank)
- Model answers
- Revision checklist

**Format:** Markdown, 6,000–10,000 words per topic.

---

## Stage 3 — JSON Pack Generation

**Prompt file:** [`04_json_pack_generation_prompt.md`](04_json_pack_generation_prompt.md)
*(This is the canonical Learning Web pack schema reference.)*

**Input:** `generated_contents/<topic>.md` (from Stage 2)

**What it produces** per topic:
- `data/Packs/<curriculum>/<subject>/<packId>/pack_unified.json`
  - 25–35 `vocab` items (sourceWord / targetWord, partOfSpeech: "keyword")
  - 15–25 `fillBlank` items (field: `data.sentence` with `____`)
  - 2–3 `sequence` items (fields: `data.title` + `data.items[]`)
  - 2–3 `categorySort` items (fields: `data.pairs[].text` + `data.pairs[].category`)
- `data/Packs/<curriculum>/<subject>/<packId>/passages.json`
  - 3 `passage` items, each with 4 multiple-choice comprehension questions

### ⚠ Critical field names — do not deviate

| Item type | Correct field | Wrong field (causes validator error) |
|---|---|---|
| `fillBlank` | `data.sentence` | ❌ `data.question` |
| `sequence` | `data.title` + `data.items` | ❌ `data.question` + `data.steps` |
| `categorySort` pairs | `text` + `category` | ❌ `item` + `category` |
| `vocab` (non-language) | `sourceWord` + `targetWord` | ❌ `translations` |

---

## Stage 4 — Validation

```bash
# Validate individual pack files
python3 scripts/validate_pack.py data/Packs/ks3/<subject>/*/pack_unified.json

# Validate all manifest-registered packs
python3 scripts/validate_unified.py
```

**Common errors and fixes:**

| Error message | Fix |
|---|---|
| `subject 'computing' must be one of [...]` | Add subject to `VALID_SUBJECTS` in `validate_pack.py` |
| `fillBlank: missing data.sentence` | Rename `data.question` → `data.sentence` |
| `sequence: missing data.title` | Rename `data.question` → `data.title` |
| `sequence: data.items must be a list` | Rename `data.steps` → `data.items` |
| `categorySort: pairs[n] missing 'text'` | Rename `pairs[n].item` → `pairs[n].text` |

---

## Stage 5 — Manifest Registration & Subject Support

### Add packs to manifest
Each pack needs an entry in `data/generated/manifest.json` under `packs[]`:

```json
{
  "id": "<packId>",
  "subject": "<subject>",
  "displayName": "<Human Title>",
  "curriculum": "ks3",
  "level": "KS3",
  "unifiedPath": "data/Packs/ks3/<subject>/<packId>/pack_unified.json",
  "sourceLanguageCode": "en-GB",
  "targetLanguageCode": "en-GB",
  "speechLanguage": "en-GB",
  "yearOptions": ["ALL", "Y7", "Y8", "Y9"],
  "year": "ALL",
  "wordCount": <vocab item count>,
  "capabilities": ["revision"]
}
```

### Add a new subject (if needed)
Update **all four** of these files — they are each independent and must stay in sync:

| File | What to add |
|---|---|
| `src/data.js` | Add to `SUBJECTS` array; add ID pattern to `inferSubject`; add to `VALID_SUBJECTS` in `validate_pack.py` |
| `src/main.js` | Add to `SUBJECT_LABELS` with icon emoji |
| `src/react/components/layout/SubjectCardGrid.jsx` | Add to `SUBJECT_META` |
| `src/react/pages/HomePage.jsx` | Add to `SUBJECT_ICONS` |
| `src/react/components/learning/PackSelector.jsx` | Add to `SUBJECT_ORDER`, `SUBJECT_LABELS`, local `inferSubject` |

---

## File Locations

| File | Purpose |
|---|---|
| `docs/curriculum-generation/01_curriculum_architecture_generator.md` | Stage 1 — generate topic list and folder structure |
| `docs/curriculum-generation/02_enrichment_of_specific_guidance.md` | Stage 1.5 — enrich generic topic prompt files with concrete generation guidance |
| `docs/curriculum-generation/02_example_computing_study_content_master_rules.md` | Stage 2 example — Computing writing rules shared across Computing topics |
| `docs/curriculum-generation/03_ks3_computing_architecture.md` | Stage 2 — KS3 Computing topic map and batch generation notes |
| `docs/curriculum-generation/04_json_pack_generation_prompt.md` | Stage 3 — canonical Learning Web schema 1.1 JSON generation prompt |
| `docs/pack-generation-prompt.md` | Same as 04 — the primary operational prompt (kept in docs/ root for backwards compatibility) |
| `scripts/validate_pack.py` | Stage 4 — per-file schema validation |
| `scripts/validate_unified.py` | Stage 4 — manifest-wide validation |
| `data/generated/manifest.json` | Stage 5 — app pack registry |

---

## Adding a New Subject: Checklist

- [ ] Run Stage 1 with the new subject name
- [ ] Run Stage 2 for each topic (combine master rules + topic prompt)
- [ ] Run Stage 3 for each topic (use `04_json_pack_generation_prompt.md`)
- [ ] Run `validate_pack.py` — fix all errors before proceeding
- [ ] Add `subject` to `VALID_SUBJECTS` in `validate_pack.py`
- [ ] Register all packs in `manifest.json`
- [ ] Add subject icon/label to the 5 source files listed in Stage 5
- [ ] Test: subject card appears in all four app tabs
- [ ] Open PR against `main`
