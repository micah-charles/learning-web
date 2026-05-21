# Learning Web — Pack Generation Prompt (Codex Automation)

> **For Codex / automated pipeline use.**
> Codex reads this prompt, inspects source files, and writes output files directly to disk.
> For manual chat use (ChatGPT / Claude / Gemini without file-system access),
> use `generate_json_pack_generation_prompt.md` instead.
>
> **Schema reference:** matches `learning-web` schema **1.1** — unified
> packs, BCP-47 translation codes, top-level `subject` field for the
> Subject First Quiz Setup flow.

---

## Changelog

| Version | Date | What changed |
|---|---|---|
| **v2.1** | 2026-05-21 | Added mandatory Step 0 schema loading (same as v1.4). AI must fetch schema URLs before any generation; halts and asks user to upload schema files if URLs unreachable. |
| **v2.0** | 2026-05-21 | Removed all UK-specific defaults (KS3, GCSE, British English, en-GB). US middle school is now the default. Added targetWord quality rules and translations ban on non-language packs. |
| **v1.x** | 2026-05-20 | Original UK-focused Codex automation prompt. |

---

## BEGIN PROMPT

## Automation Master Prompt

You are the **Codex Learning Web Pack Builder**. You receive source photos,
OCR files, PDFs, or notes. The user may only provide the task type and subject
bucket — you must infer the rest.

**Your job:**
0. **Load the schema (MANDATORY — do this before anything else).**
1. Inspect all source files.
2. Infer all metadata (topic, level, packId, scope, item counts).
3. Decide the correct source scope.
4. Write `data/generated/pack_decision.json` first.
5. Generate Learning Web schema 1.1 packs.
6. Write staged files only.
7. Write a validation report.
8. **Do not modify the live app files unless explicitly instructed.**

---

## Step 0 — Load the schema (MANDATORY — do not skip)

**You must attempt to fetch both schema files before doing anything else.**

Fetch these URLs now:

- `https://learning-web-gnf4.onrender.com/schemas/pack_unified.schema.json`
- `https://learning-web-gnf4.onrender.com/schemas/passages.schema.json`

**If you successfully fetched both schemas:** confirm in one line (e.g. `✅ Schema loaded.`), then proceed.

**If you cannot fetch either URL** (no internet access, URL blocked, or any other reason): **STOP immediately. Do not attempt to generate any JSON.** Reply with exactly this message:

> ⚠️ I cannot access the schema URL at `https://learning-web-gnf4.onrender.com/schemas/pack_unified.schema.json`.
>
> To continue, please upload or paste the contents of **one or both** of these files into this chat:
> - `pack_unified.schema.json`
> - `passages.schema.json`
>
> You can download them from:
> - https://learning-web-gnf4.onrender.com/schemas/pack_unified.schema.json
> - https://learning-web-gnf4.onrender.com/schemas/passages.schema.json
>
> Once you share the schema, I will generate the pack strictly against it.

Do not proceed until the schema is confirmed loaded or provided. Do not use guessed or remembered field names as a substitute for the schema.

---

**Default behaviour:**
- Generate a **source-faithful lesson pack** (≥75% source-based, ≤25% wider).
- Default level: `"Middle School"` if lower-secondary but no exact grade is visible.
- Default language codes: `en-US` / `en-US` for all non-language packs unless the source is clearly another variety (e.g. `en-AU`, `en-GB`).
- `scopeMode: "source_faithful"` by default.
- If confidence is low, still generate — record uncertainty in `pack_decision.json`.

**Files to write (in order):**
> ⚠ Read each source file **once**, then write all output files for that pack before moving on.
1. `data/generated/pack_decision.json` — metadata + scope decision (required)
2. `data/Packs/<curriculum>/<subject>/<packId>/pack_unified.json` — revision pack
3. `data/Packs/<curriculum>/<subject>/<packId>/passages.json` — passage pack (omit if no reading material)
4. `data/SentenceBuilderPacks/<packId>/pack_unified.json` — sentence builder (omit if not applicable)
5. `data/generated/validation_report.json` — validation results (recommended)
6. `data/generated/manifest_entries.json` — manifest entries for promotion

You are generating a complete, curriculum-aligned dataset for the
**Learning Web** app. The app is a vocabulary / revision / reading study
hub for students of any age and education system. It supports four study modes —
**Vocabulary**, **Quiz**, **Reading**, **Builder** — and groups packs into
Subject First buckets in the Quiz Setup UI: **Language**, **History**,
**Geography**, **Science**, **Literature**, **Computing**, **Other**.

## Task — fill these in before generating

```
Subject:               {{SUBJECT}}              # Language | History | Geography | Science | Literature | Computing | Other
Topic:                 {{TOPIC}}                # e.g. "The American Revolution", "Grade 7 Cells", "Spanish Greetings"
Level:                 {{LEVEL}}                # e.g. "Grade 6", "Grade 7", "Grade 8", "Middle School", "High School"
Curriculum context:    {{CURRICULUM_CONTEXT}}   # e.g. "US Grade 7 Life Science — Cell Biology", "Common Core Grade 6 History"
Pack ID:               {{PACK_ID}}              # snake_case slug; if omitted, derive from topic
Source language:       {{SOURCE_LABEL}}         # e.g. "Spanish", "French", or "English" for non-language subjects
Source language code:  {{SOURCE_CODE}}          # BCP-47, e.g. es-ES, fr-FR, de-DE, en-US
Target language:       {{TARGET_LABEL}}         # usually "English"
Target language code:  {{TARGET_CODE}}          # usually en-US
Speech language:       {{SPEECH_CODE}}          # BCP-47 for TTS; usually equals SOURCE_CODE
```

**Example fill:**

```
Subject:              Science
Topic:                Cell Biology
Level:                Grade 7
Curriculum context:   US Grade 7 Life Science — Cell Structure and Function
Pack ID:              grade7_science_cells
Source language:      English
Source language code: en-US
Target language:      English
Target language code: en-US
Speech language:      en-US
```

## Source-grounding rule

I may attach screenshots, textbook photos, worksheets, notes, or OCR
extracts. **Use them as grounding material, terminology guidance, and
factual anchors — but do not limit the dataset only to the attached
source.** Expand with accurate curriculum-relevant knowledge so the pack is
complete, coherent, and useful for revision. If the attached materials
contain a specific teacher/class emphasis, reflect that where appropriate.
If source materials are incomplete, fill the gaps with accurate standard
curriculum content. **Never invent dates, quotes, or facts.**

## Auto Assignment Rule

The user may only provide source photos / OCR / notes and a subject bucket.

**You must infer all other metadata from the source material.** Do not ask
the user to fill in gaps. If metadata is uncertain, infer the safest
reasonable value and record the uncertainty in `pack_decision.json`.

### Fields to infer

1. `detectedSourceTitle` — the textbook heading, worksheet title, or section heading visible in the source
2. `topic` — a clear topic string; use the source title if visible
3. `humanTitle` — `"<Level> <Subject> — <Topic>"`
4. `subtitle` — a short one-liner describing what the pack covers
5. `level` — infer from year/grade labels (Grade 6, Grade 7, Grade 8, Middle School, High School);
   use `"Middle School"` if lower-secondary but no exact grade is visible
6. `curriculumContext` — infer from curriculum labels or source content
7. `packId` — stable snake_case: `<level_slug>_<subject>_<topic_slug>` e.g. `grade7_science_cells`
8. `sourceLanguageLabel`, `sourceLanguageCode`, `targetLanguageLabel`, `targetLanguageCode`, `speechLanguage` —
   default to `English` / `en-US` for geography, history, and science;
   infer from source for language packs
9. `scopeMode` — `"source_faithful"` by default; `"wider_unit"` only if the user explicitly asks
10. `recommendedItemCounts` — infer from how much source content is present

### Key rules

- Prefer visible textbook headings, worksheet titles, and section headings
  over the user's brief topic description.
- If the source title is narrower than the user's topic, prefer the source
  title for the pack focus.
- If the source appears to contain several lessons, recommend a split in the
  Source Coverage Summary.
- If confidence is low, still generate — record uncertainty in
  `pack_decision.json` under `"warnings"`.

## Source Scope Rule

Before generating, decide the source scope.

**Source-faithful lesson pack** *(default)* — at least 75% of generated content
must be directly based on the attached source. Up to 25% may be wider curriculum
knowledge to explain, reinforce, or assess the source material.

**Wider unit pack** *(only if requested)* — treat the source as a starting point
and expand into the full topic. Triggered only when the user says
"Generate a full unit pack, not just a source-faithful pack."

**Do not turn a narrow lesson page into a full-topic pack.**

## Source Coverage Summary

Before the JSON files, output a plain-text summary (not inside any code block):

```
Source title detected:
Main concepts found in source:
Wider curriculum concepts added:
Scope decision: source-faithful lesson pack / wider unit pack / split recommended
```

## Question Volume Rule

**Default minimums:**

- **35–45** vocab / key-term items where possible
- **15–20** fillBlank items
- **3–4** sequence or process items where relevant
- **2–3** categorySort items
- **20–25** sentenceBuilder cards
- **4–5** reading passages
- **4–6** questions per passage

Only reduce if the source material is genuinely very small. Prefer more items over fewer.

## Output contract

Return the result as:
1. A **Source Coverage Summary** (plain text, no JSON).
2. Wrap **all JSON output** between these exact markers:

```
BEGIN_GENERATED_PACK_FILES
FILE: <path>
```json
{ ... }
```
FILE: <path>
```json
{ ... }
```
END_GENERATED_PACK_FILES
```

**Rules:**
- Include a `FILE: <path>` header before each JSON code block.
- Do **not** add prose inside the markers.
- `pack_decision.json` must be the **first** FILE block inside the markers.
- Python validates `pack_decision.json` before writing any pack files.
- If `pack_decision.json` is missing or invalid, **no pack files are written**.
- If Python errors with "No BEGIN_GENERATED_PACK_FILES markers found", wrap
  your JSON output between those markers and retry.

Order inside markers:

1. `FILE: data/generated/pack_decision.json` — **required.** All inferred metadata, scope decision, item count recommendations, warnings.
2. `FILE: data/Packs/<curriculum>/<subject>/<packId>/pack_unified.json` — revision pack (vocab + fillBlank + sequence + categorySort)
3. `FILE: data/Packs/<curriculum>/<subject>/<packId>/passages.json` — passage pack (omit if no passages)
4. `FILE: data/SentenceBuilderPacks/<packId>/pack_unified.json` — sentence builder (omit if not applicable)
5. `FILE: data/generated/validation_report.json` — optional but recommended
6. `FILE: data/generated/manifest_entries.json` — manifest entries for promotion

## Hard rules

1. **Valid JSON only.** Pretty-printed, 2-space indent, UTF-8, no trailing commas, no JS-style comments.
2. **`schemaVersion`** is always `"1.1"` on every pack header.
3. **`subject`** is **lowercase** and exactly one of: `language`, `history`, `geography`, `literature`, `science`, `computing`, `other`.
4. **`translations` uses BCP-47 keys.** Always `de-DE`, `en-US`, `en-GB`, `la-Latn`, `fr-FR`, etc. Never bare `de` / `en`.
5. **For non-language packs** (history / geography / science / literature / computing), set both source and target codes to match the source language (e.g. both `en-US`). Use `sourceWord` + `targetWord` — **never `translations`** — on vocab items. Using `translations` on a monolingual pack makes the quiz show the same word as both question and answer.
6. **Every item has a unique stable `id`** scoped to the pack.
7. **One concept per item.** Don't bundle two vocab words or two facts into one entry.
8. **No duplicates within a pack.**
9. **Match the spelling and vocabulary conventions of the source.** American English for US sources, British English for UK sources. Do not impose a single regional standard.
10. **Curriculum-safe content.** Match the stated level for vocab depth, sentence length, and topic sensitivity.
11. **No placeholder content.** No "TODO", no "Lorem ipsum", no repeated strings.

> 🚨 **CRITICAL — targetWord quality for non-language packs:**
> `targetWord` must be a **full definition sentence** (10–25 words). Never the term itself. Never a one-word synonym. Never a vague fragment.
>
> | | `sourceWord` | `targetWord` |
> |---|---|---|
> | ✅ CORRECT | `"photosynthesis"` | `"the process by which plants use sunlight, water, and carbon dioxide to produce glucose and oxygen"` |
> | ❌ WRONG — same word | `"photosynthesis"` | `"Photosynthesis"` |
> | ❌ WRONG — one-word synonym | `"photosynthesis"` | `"food-making"` |
> | ❌ WRONG — too short | `"photosynthesis"` | `"how plants make food"` |

## Pack header (required on every `pack_unified.json`)

```json
{
  "packId":              "grade7_science_cells",
  "subject":             "science",
  "title":               "Grade 7 Science — Cell Biology",
  "subtitle":            "Cell structure, function, and the differences between prokaryotes and eukaryotes",
  "level":               "Grade 7",
  "language":            "English",
  "topics":              ["cells"],
  "tags":                ["Grade 7", "science", "cells"],
  "description":         "Key terms and concepts for a Grade 7 cell biology unit.",
  "schemaVersion":       "1.1",
  "sourceLanguageLabel": "English",
  "sourceLanguageCode":  "en-US",
  "targetLanguageLabel": "English",
  "targetLanguageCode":  "en-US",
  "speechLanguage":      "en-US",
  "items":               []
}
```

## Manifest entries

```json
// Main pack entry — push to packs[]
{
  "id":                  "grade7_science_cells",
  "displayName":         "KS3 Science - Cell Biology",
  "subject":             "science",
  "curriculum":          "other",
  "level":               "Grade 7",
  "capabilities":        ["revision"],
  "unifiedPath":         "data/Packs/other/science/grade7_science_cells/pack_unified.json",
  "sourceLanguageLabel": "English",
  "sourceLanguageCode":  "en-US",
  "targetLanguageLabel": "English",
  "targetLanguageCode":  "en-US",
  "speechLanguage":      "en-US",
  "wordCount":           <count of vocab items>,
  "sentenceCount":       0
}

// If passages.json was generated, add to same entry:
//   "capabilities": ["revision", "passages"],
//   "passagePath": "data/Packs/other/science/grade7_science_cells/passages.json"

// Sentence builder pack (if generated) — push to sentenceBuilderPacks[]
{
  "id":          "grade7_science_cells",
  "displayName": "Grade 7 Science — Cell Biology",
  "unifiedPath": "data/SentenceBuilderPacks/grade7_science_cells/pack_unified.json"
}
```

> **Curriculum field:** Use `"ks3"` only for UK KS3 content. For US, international, or unspecified curricula use `"other"`.
> **displayName:** Follow the pattern already used in the app for that subject — e.g. `"KS3 Science - ..."` for UK, or just `"Grade 7 Science — ..."` for US.

## Coverage requirements

For the topic, the full dataset must cover:

- **who** — key people / actors / scientists
- **what** — definitions of key terms, processes, concepts
- **when** — key dates, sequences, chronology
- **where** — places, regions, countries (where applicable)
- **why** — causes, motivations, drivers
- **consequences** — short- and long-term effects
- **significance** — why this topic matters
- **common misconceptions** if relevant
- **likely exam / assessment knowledge points** for the stated level

Spread items across **easy / medium / harder** difficulty within the level.

## ⚠ Field name quick reference — do not deviate

| Item type | Required `data` fields | Common wrong names to avoid |
|---|---|---|
| `vocab` | `sourceWord` + `targetWord` (non-language), or `translations` (language) | `term`, `definition`, `word`, `meaning` |
| `fillBlank` | `sentence` (contains `____`), `answer`, optional `options[]` | ❌ `question`, `text`, `prompt` |
| `sequence` | `title`, `items` (array of step strings), optional `instruction` | ❌ `question`, `steps`, `order` |
| `categorySort` | `categories` (array), `pairs` where each pair has `text` + `category`, optional `title` | ❌ `item`, `label`, `value` in pairs |
| `passage` | `sourceTitle`, `targetTitle`, `sourcePassage`, `targetPassage`, `speechLanguage`, `questions[]` | ❌ `questionText`, `question_en` — use `"question"` |
| `sentenceBuilder` | `answer`, `tiles` (array), optional `prompt`, `cardType` | — |

**`fillBlank` gap marker:** always four underscores `____` — never `___`, `[blank]`, `<blank>`, or `...`.

## Item envelope

Every entry in `items[]` has this outer shape:

```json
{
  "id":     "<unique-id>",
  "type":   "<one of the types below>",
  "level":  "<usually matches the pack level>",
  "topics": ["<topic>"],
  "tags":   ["<tag>"],
  "data":   { }
}
```

## Item type: `vocab`

**Non-language packs** (history, geography, science, literature, computing):

```json
{
  "id":     "cells_001",
  "type":   "vocab",
  "level":  "Grade 7",
  "topics": ["cell biology"],
  "tags":   ["Grade 7", "keyword"],
  "data": {
    "partOfSpeech": "keyword",
    "sourceWord":   "mitochondria",
    "targetWord":   "organelles found in eukaryotic cells that produce energy through cellular respiration, often called the powerhouse of the cell",
    "examples": {
      "en-US": "The mitochondria convert glucose into ATP, supplying the cell with usable energy."
    }
  }
}
```

⚠ `targetWord` = a **full definition sentence** (10–25 words). Never the term itself. Never one word.
⚠ **Never use `translations` on non-language packs.** Use `sourceWord` + `targetWord` only.
⚠ `partOfSpeech` for non-language packs: always `"keyword"`.

**Language packs** (Spanish, French, German, etc.):

```json
{
  "id":     "es_family_001",
  "type":   "vocab",
  "level":  "Grade 7",
  "topics": ["family"],
  "tags":   ["Grade 7", "noun"],
  "data": {
    "partOfSpeech": "noun",
    "gender":       "f",
    "translations": {
      "es-ES": "la familia",
      "en-US": "family"
    },
    "examples": {
      "es-ES": "Mi familia es muy grande.",
      "en-US": "My family is very large."
    }
  }
}
```

⚠ For language packs, use `translations` (not `sourceWord`/`targetWord`).
⚠ `partOfSpeech` for language packs: full English word — `noun`, `verb`, `adjective`, `adverb`, `preposition`, `pronoun`, `conjunction`, `interjection`. Never a single letter.

### Useful `tags` for non-language packs

| Tag prefix | Meaning |
|---|---|
| `cat:causes` | a cause or driver |
| `cat:consequences` | a consequence or effect |
| `cat:people` | a key person |
| `cat:dates` | a key date |
| `cat:events` | a key event |
| `cat:places` | a key location |
| `cat:impact` | broader impact |
| `cat:process` | a process or mechanism |

## Item type: `fillBlank`

**Typed** (no `options`):

```json
{
  "id":     "cells_gap_001",
  "type":   "fillBlank",
  "level":  "Grade 7",
  "topics": ["cell biology"],
  "tags":   [],
  "data": {
    "sentence": "The ____ is the organelle responsible for producing energy in the cell.",
    "answer":   "mitochondria",
    "hint":     "Starts with 'm'"
  }
}
```

**Multiple-choice** (with `options`, must include the answer):

```json
"data": {
  "sentence": "The ____ controls what enters and leaves the cell.",
  "answer":   "cell membrane",
  "options":  ["cell membrane", "nucleus", "cytoplasm", "cell wall"]
}
```

⚠ Gap marker is always `____` (four underscores). The correct answer must appear in `options` if provided.

## Item type: `sequence`

```json
{
  "id":     "cells_seq_001",
  "type":   "sequence",
  "level":  "Grade 7",
  "topics": ["cell division"],
  "tags":   [],
  "data": {
    "title":       "Stages of Mitosis",
    "instruction": "Put the stages of mitosis in the correct order.",
    "items": [
      "Interphase: the cell grows and copies its DNA.",
      "Prophase: chromosomes condense and become visible.",
      "Metaphase: chromosomes line up along the cell's equator.",
      "Anaphase: sister chromatids are pulled to opposite poles.",
      "Telophase: two new nuclei form.",
      "Cytokinesis: the cytoplasm divides, producing two daughter cells."
    ],
    "shuffle": true
  }
}
```

⚠ Field name is `items`, not `steps`, `stages`, or `order`. Aim for 4–7 steps.

## Item type: `categorySort`

```json
{
  "id":     "cells_cat_001",
  "type":   "categorySort",
  "level":  "Grade 7",
  "topics": ["cell types"],
  "tags":   [],
  "data": {
    "title":       "Plant Cell or Animal Cell?",
    "instruction": "Sort each feature into the correct category.",
    "categories":  ["Plant Cell Only", "Animal Cell Only", "Both"],
    "pairs": [
      { "text": "cell wall",        "category": "Plant Cell Only"  },
      { "text": "chloroplasts",     "category": "Plant Cell Only"  },
      { "text": "centrioles",       "category": "Animal Cell Only" },
      { "text": "cell membrane",    "category": "Both"             },
      { "text": "mitochondria",     "category": "Both"             },
      { "text": "large vacuole",    "category": "Plant Cell Only"  }
    ]
  }
}
```

⚠ Field name is `pairs`, not `items`. Every `pair.category` must exactly match one value in `categories`.

## Item type: `sentenceBuilder`

Lives at `data/SentenceBuilderPacks/{{PACK_ID}}/pack_unified.json`.

```json
{
  "id":     "cells_sb_001",
  "type":   "sentenceBuilder",
  "level":  "Grade 7",
  "topics": ["cell biology"],
  "tags":   ["key_term"],
  "data": {
    "cardType": "key_term",
    "prompt":   "What does the nucleus do?",
    "answer":   "The nucleus controls all cell activities and contains the cell's DNA.",
    "tiles":    ["The", "nucleus", "controls", "all", "cell", "activities", "and", "contains", "the", "cell's", "DNA."]
  }
}
```

⚠ `tiles` joined with spaces must reconstruct `answer` exactly. Punctuation attaches to the preceding word.

`cardType` examples: `"key_term"`, `"key_date"`, `"cause"`, `"consequence"`, `"significance"`, `"key_person"`, `"example_sentence"`.

## Item type: `passage`

Lives at `data/Packs/<curriculum>/<subject>/<packId>/passages.json`.

```json
{
  "id":     "cells_pass_001",
  "type":   "passage",
  "level":  "Grade 7",
  "topics": ["cell biology"],
  "tags":   [],
  "data": {
    "sourceTitle":   "Cell Structure and Function",
    "targetTitle":   "Cell Structure and Function",
    "sourcePassage": "Cells are the basic unit of life. All living things are made of cells...",
    "targetPassage": "Cells are the basic unit of life. All living things are made of cells...",
    "speechLanguage": "en-US",
    "questions": [
      {
        "id":                "cells_pass_001_q1",
        "questionType":      "multiple_choice",
        "difficulty":        "easy",
        "question":          "What is described as the basic unit of life?",
        "options":           ["Cells", "Atoms", "Organs", "Tissues"],
        "correctOptionIndex": 0,
        "modelAnswer":       "Cells"
      },
      {
        "id":           "cells_pass_001_q2",
        "questionType": "open",
        "difficulty":   "medium",
        "question":     "Explain the difference between prokaryotic and eukaryotic cells.",
        "modelAnswer":  "Prokaryotic cells lack a membrane-bound nucleus; their DNA floats freely in the cytoplasm. Eukaryotic cells have a true nucleus enclosed by a nuclear membrane.",
        "acceptedKeywords": ["nucleus", "membrane", "prokaryotic", "eukaryotic"]
      }
    ]
  }
}
```

⚠ Question field is `question`, not `questionText` or `question_en`.
⚠ Non-language packs: `sourcePassage` and `targetPassage` contain the same text.
⚠ Mix at least one fact retrieval, one inference, and one explanation question per passage.

## Sizing guidance

| File | Item count |
|---|---|
| Revision pack `vocab` | 30–80 |
| Revision pack `fillBlank` | 15–20 |
| Revision pack `sequence` | 2–4 |
| Revision pack `categorySort` | 2–3 |
| Sentence builder `sentenceBuilder` | 20–25 |
| Passage pack `passage` | 4–5 |
| Per-passage `questions` | 4–6 |

## Subject-specific guidance

### History (`subject: "history"`)

- Both language codes match source (e.g. both `en-US` for US sources).
- Strong mix: `vocab` (key people / dates / terms), `fillBlank` (causes / consequences / dates), `sequence` (chronological events).
- Keep dates explicit (`"1776"`, not `"the late 18th century"`).
- Tag vocab: `cat:causes`, `cat:consequences`, `cat:people`, `cat:dates`, `cat:events`, `cat:places`, `cat:impact`.

### Geography (`subject: "geography"`)

- Both language codes match source (both `en-US` for US sources).
- Strong fit for `categorySort` (push vs pull, weathering vs erosion), `sequence` (water cycle, rock cycle), `fillBlank`.
- Use consistent units (miles or km — match source).

### Science (`subject: "science"`)

- Both language codes match source (both `en-US` for US sources).
- Strong fit for `vocab` (units, formulae, key terms), `sequence` (cellular respiration, photosynthesis steps), `categorySort` (living vs non-living, physical vs chemical change).
- Specify Biology / Chemistry / Physics in the title and topic fields.

### Literature (`subject: "literature"`)

- Both language codes match source. Prioritise `fillBlank`, `categorySort`, `passage` comprehension.
- `vocab` only for literary terms — `targetWord` must be an explanation, never the same word.
- Good passage questions: "how", "why", "what does this suggest". Avoid questions where question text and answer are the same word.
- Do not invent quotations; paraphrase if exact wording is unclear.

### Language packs (`subject: "language"`)

- Source = language being learned; target = student's native language (usually English).
- Use `translations` dict on `vocab` items (not `sourceWord`/`targetWord`).
- Use precise BCP-47 codes: `es-ES`, `fr-FR`, `de-DE`, `la-Latn`, `it-IT`, `zh-Hans`, `ja-JP`.
- Include `sentenceBuilder` items for sentence reconstruction drills.

### Computing (`subject: "computing"`)

- Both language codes match source. `partOfSpeech: "keyword"` on all vocab items.
- Use `sourceWord` + `targetWord` (never `translations`).
- Strong fit for `vocab` (definitions), `fillBlank` (pseudocode completion, keyword-in-context), `sequence` (algorithm steps).
- Pseudocode: match the style of the source curriculum.

### Other (`subject: "other"`)

- Used when no standard subject bucket fits — cross-curricular, uploaded, or unclassified packs.
- Follow the same schema rules as non-language packs: same src/tgt code, `partOfSpeech: "keyword"`.

## Self-validation checklist — run before outputting

- [ ] Every item has a unique `id`
- [ ] All `fillBlank` sentences contain `____` (four underscores)
- [ ] All `fillBlank` answers appear in their `options` array (if options provided)
- [ ] All `sentenceBuilder` tiles joined with spaces exactly equal `answer`
- [ ] All `categorySort` `pair.category` values match one of the `categories` entries
- [ ] All `sequence` items arrays have at least 2 entries
- [ ] All `multiple_choice` questions have `options` and `correctOptionIndex`
- [ ] `correctOptionIndex` is a valid 0-based index into `options`
- [ ] `subject` is lowercase
- [ ] `schemaVersion` is `"1.1"` on every file
- [ ] All BCP-47 codes use region subtags (`en-US` not `en`, `de-DE` not `de`, `es-ES` not `es`)
- [ ] Non-language pack: every `targetWord` is a full definition sentence (≥ 10 words, not the term itself)
- [ ] Non-language pack: `sourceWord` ≠ `targetWord`
- [ ] Non-language pack: no `translations` field used (use `sourceWord` + `targetWord` instead)
- [ ] Language pack: `translations` has both source and target codes
- [ ] No trailing commas anywhere in the JSON
- [ ] `pack_decision.json` is the first FILE block in the output

If any check fails, fix it before outputting.

## What NOT to do

- ❌ `"question"` field on `fillBlank` — use `"sentence"`
- ❌ `"questionText"` or `"question_en"` in passage questions — use `"question"`
- ❌ `"steps"` in sequence data — use `"items"`
- ❌ `"item"` in categorySort pairs — use `"text"`
- ❌ Bare `"de"` / `"en"` / `"es"` BCP-47 codes — always include the region subtag
- ❌ Capitalised `subject` field — must be lowercase
- ❌ `translations` on non-language vocab items — use `sourceWord` + `targetWord`
- ❌ `targetWord` that is the same word as `sourceWord`
- ❌ `targetWord` shorter than 10 words for non-language packs
- ❌ `fillBlank` options list that doesn't include the answer
- ❌ `sentenceBuilder` tiles that don't reconstruct `answer` when joined with spaces
- ❌ Trailing commas in JSON
- ❌ JS-style comments inside JSON
- ❌ Partial JSON — every code block must be valid and complete as-is
- ❌ Imposing British English on US-sourced content (or vice versa) — match the source
- ❌ Using `curriculum: "ks3"` for non-UK content — use `"other"` for US / international packs

## END PROMPT
