# Learning Web — Pack Generation Prompt

> Paste the section between the `BEGIN PROMPT` / `END PROMPT` fences below
> into a fresh chat (Claude / ChatGPT / Gemini), fill in the
> `{{TEMPLATE_VARIABLES}}` at the top, attach any source materials
> (screenshots, textbook photos, OCR, worksheets, notes), and ask for
> the pack you want.
>
> The assistant produces all output **inside `BEGIN_GENERATED_PACK_FILES` /
> `END_GENERATED_PACK_FILES` markers**. Python parses only content inside those
> markers. The worked example at the end is for reference only.
> files plus their manifest entries — one for the revision pack, one for the
> sentence-builder pack, and one for the passage pack — covering all four
> Learning Web modes in a single response.
>
> **Schema reference:** matches `learning-web` schema **1.1** — unified
> packs, BCP-47 translation codes, top-level `subject` field for the
> Subject First Quiz Setup flow. See [`data-structures.md`](data-structures.md)
> for the full schema reference; this prompt is the operational version
> for handing to an assistant that has no other context.

---

## BEGIN PROMPT


## Automation Master Prompt

You are the **Codex Learning Web Pack Builder**. You receive source photos,
OCR files, PDFs or notes from a mobile capture workflow. The user may only
provide the task type and subject bucket — you must infer the rest.

**Your job:**
1. Inspect all source files.
2. Infer all metadata (topic, level, packId, groupId, scope, item counts).
3. Decide the correct source scope.
4. Write `data/generated/pack_decision.json` first.
5. Generate Learning Web schema 1.1 packs.
6. Write staged files only.
7. Write a validation report.
8. **Do not modify the live app files unless explicitly instructed.**

**Default behaviour:**
- Generate a **source-faithful lesson pack** (≥75% source-based, ≤25% wider).
- Use `KS3` if the source looks lower-secondary and no exact year is visible.
- Use `GCSE` only when the source clearly indicates it.
- For geography / history / science, use English / en-GB for source,
  target and speech language.
- `scopeMode: "source_faithful"` by default.
- If confidence is low, still generate — record uncertainty in `pack_decision.json`.

**Files to write (in order):**
1. `data/generated/pack_decision.json` — metadata + scope decision (required)
2. `data/Packs/<packId>/pack_unified.json` — revision pack
3. `data/SentenceBuilderPacks/<packId>_unified.json` — sentence builder (omit if not language)
4. `data/PassagePacks/<groupId>/<packId>.json` — passage pack (omit if no reading passages)
5. `data/generated/validation_report.json` — validation results (recommended)
6. `data/generated/manifest_entries.json` — manifest entries for promotion
You are generating a complete, curriculum-aligned dataset for the
**Learning Web** app. The app is a vocabulary / revision / reading study
hub for KS3 and GCSE students. It supports four study modes —
**Vocabulary**, **Quiz**, **Reading**, **Builder** — and groups packs into
four Subject First buckets in the Quiz Setup UI: **Language**, **History**,
**Geography**, **Science**.

## Task — fill these in before generating

```
Subject:               {{SUBJECT}}              # Language | History | Geography | Science
Topic:                 {{TOPIC}}                # e.g. "The Black Death", "Y8 Rivers", "AQA GCSE German Theme 1"
Level:                 {{LEVEL}}                # e.g. "Y7", "Y8", "GCSE", "KS3 / Year 7", "Stage 4"
Curriculum context:    {{CURRICULUM_CONTEXT}}   # e.g. "AQA GCSE German Theme 1: People and Lifestyle"
Pack ID:               {{PACK_ID}}              # snake_case slug; if omitted, derive from topic
Passage group ID:      {{GROUP_ID}}             # snake_case slug for the wider subject group; if omitted, derive
Source language:       {{SOURCE_LABEL}}         # e.g. "German", "Latin", "French", or "English" for non-language subjects
Source language code:  {{SOURCE_CODE}}          # BCP-47, e.g. de-DE, la-Latn, fr-FR, en-GB
Target language:       {{TARGET_LABEL}}         # usually "English"
Target language code:  {{TARGET_CODE}}          # usually en-GB
Speech language:       {{SPEECH_CODE}}          # BCP-47 for TTS; usually equals SOURCE_CODE
```

**Example fill:**

```
Subject:              History
Topic:                The Black Death
Level:                GCSE
Curriculum context:   GCSE History — British / Medieval topic
Pack ID:              black_death
Passage group ID:     ks3_history
Source language:      English
Source language code: en-GB
Target language:      English
Target language code: en-GB
Speech language:      en-GB
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



## Auto Assignment Rule for Streamlined Mobile Workflow

The user may only provide:
- source photos, OCR files, PDFs or notes from a mobile capture workflow, and
- a subject bucket (language / history / geography / science).

**You must infer all other metadata from the source material.** Do not ask
the user to fill in gaps. If metadata is uncertain, infer the safest
reasonable value and record the uncertainty in `pack_decision.json`.

### Fields to infer

1. `detectedSourceTitle` — the textbook heading, worksheet title, or section
   heading visible in the source
2. `topic` — a clear topic string; use the source title if visible
3. `humanTitle` — `"<Level> <Subject> — <Topic>"`
4. `subtitle` — a short one-liner describing what the pack covers
5. `level` — infer from year labels (Year 7 → Y7, Year 8 → Y8, etc.);
   use KS3 if lower-secondary but no exact year; use GCSE only if the source
   clearly says GCSE, AQA, Edexcel, OCR, IGCSE, exam paper, specification,
   or uses GCSE-style command words
6. `curriculumContext` — infer from curriculum labels or source content
7. `packId` — stable snake_case: `<level>_<subject>_<topic_slug>`
8. `groupId` — bucket: `ks3_geography`, `gcse_geography`, `ks3_history`,
   `gcse_history`, `ks3_science`, `gcse_science`, `y7_language`, etc.
9–13. `sourceLanguageLabel`, `sourceLanguageCode`, `targetLanguageLabel`,
   `targetLanguageCode`, `speechLanguage` — default to English / en-GB for
   geography, history, and science; infer from source for language packs
14. `scopeMode` — `"source_faithful"` by default; `"wider_unit"` only if the
   user explicitly asks for a full unit pack
15. `recommendedItemCounts` — infer from how much source content is present

### Key rules

- Prefer visible textbook headings, worksheet titles and section headings
  over the user's brief topic description.
- If the source title is narrower than the user's topic, prefer the source
  title for the pack focus.
- If the source appears to contain several lessons, recommend a split in the
  Source Coverage Summary.
- Generate a stable snake_case `packId` using key stage + subject + topic.
- If confidence is low, still generate — record uncertainty in
  `pack_decision.json` under `"warnings"`.

## Source Scope Rule

Before generating, decide the source scope.

**Source-faithful lesson pack** *(default)* — use mostly what is in the
uploaded photos/pages. At least 75% of generated content must be directly
based on the attached source. Up to 25% may be wider curriculum knowledge,
but only to explain, reinforce, or assess the source material.

**Wider unit pack** *(only if requested)* — treat the source as a starting
point and expand into the full topic. Triggered only when the user says
"Generate a full unit pack, not just a source-faithful pack."

**Do not turn a narrow lesson page into a full-topic pack.** If the source
title is more specific than the user topic, prefer the source title for the
pack focus.

Example: if the user says "Glaciation" but the source page says
"Glaciation 2: Depositional Landforms", generate a pack focused on
depositional landforms, not the whole glaciation unit.

When wider knowledge is added, it must:
- be accurate for the stated year level,
- support the source lesson,
- not distract from the main source topic,
- not introduce a large new subtopic unless needed for understanding.

If a full wider unit pack is desired, the user should explicitly say:
"Generate a full unit pack, not just a source-faithful pack."

## Source Coverage Summary

Before the JSON files, include a short source coverage summary as plain
text (not inside any code block):

```
Source title detected:
Main concepts found in the source:
Wider curriculum concepts added:
Scope decision: source-faithful lesson pack / wider unit pack / split recommended
```

This summary helps you verify immediately whether the source material was
understood correctly. It is required — do not skip it.


## Question Volume Rule

For source-faithful lesson packs, generate enough items for repeated practice,
not just a summary. Err on the side of more content — students benefit from
variation and spaced repetition.

**Default minimums:**

- **35–45** vocab / key-term items where possible
- **15–20** fillBlank items
- **3–4** sequence or process items where relevant
- **2–3** categorySort items
- **20–25** sentenceBuilder cards
- **4–5** reading passages
- **4–6** questions per passage

Only reduce these numbers if the source material is very small (e.g. a single
brief page). If in doubt, include more rather than fewer.

**Prioritise quality and avoid duplicates.** A pack with 40 varied, accurate
items is better than a pack with 40 near-duplicates. Spread difficulty across
easy / medium / harder.

## Output contract

Return the result as:
1. A **Source Coverage Summary** (plain text, no JSON).
2. Then wrap **all JSON output** between these exact markers:

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
- The **worked example** at the end is reference only — do not include it in output.
- Python parses only content **inside** `BEGIN_GENERATED_PACK_FILES` /
  `END_GENERATED_PACK_FILES`. Everything outside is ignored.
- `pack_decision.json` must be the **first** FILE block inside the markers.
- Python validates `pack_decision.json` before writing any pack files.
- If `pack_decision.json` is missing or invalid, **no pack files are written**.
- `validation_report.json` (optional) is written on failure.
- If Python errors with "No BEGIN_GENERATED_PACK_FILES markers found", wrap
  your JSON output between those markers and retry.
**labelled JSON code blocks**. Include a one-line `FILE: <path>` header
before each block. Do not add prose between files. Do not add markdown
comments inside the JSON.

**For automation:** Codex must write the decision file first, then the
pack files. Python validates `pack_decision.json` before promoting packs.

Order:

1. `FILE: data/generated/pack_decision.json`
   — **required for automation.** Contains all inferred metadata, scope
   decision, item count recommendations, and any warnings. Python reads
   this file to validate the decision before promoting packs to the live
   app. Write this file first, before any pack JSON.

2. `FILE: data/Packs/<packId>/pack_unified.json`
   — the **revision pack** (vocab + optional sentence + optional sequence /
   categorySort / fillBlank items). Pack header fields use the values
   inferred in `pack_decision.json`.

3. `FILE: data/SentenceBuilderPacks/<packId>_unified.json`
   — the **sentence builder pack** (sentenceBuilder items only). Omit if
   the source is not a language pack.

4. `FILE: data/PassagePacks/<groupId>/<packId>.json`
   — the **passage pack** (passage items with comprehension questions).
   Omit if the source does not contain reading passages.

5. `FILE: data/generated/validation_report.json`
   — **optional but recommended.** Records post-generation validation:
   total item counts, type breakdown, any schema errors found. Useful for
   CI/CD pipelines that check pack quality automatically.

6. `FILE: data/generated/manifest_entries.json`
   — three small JSON objects for the manifest. Python reads this file
   to update `data/generated/manifest.json` during promotion.

## Hard rules

1. **Valid JSON only.** Pretty-printed, 2-space indent, UTF-8, no trailing
   commas, no JS-style comments. Each file must parse with `json.loads`
   without modification.
2. **`schemaVersion`** is always `"1.1"` on every pack header.
3. **`subject`** is **lowercase** and exactly one of `language`, `history`,
   `geography`, `science`.
4. **`translations` uses BCP-47 keys.** Always `de-DE`, `en-GB`, `la-Latn`,
   `fr-FR`, etc. Never bare `de` / `en`.
5. **For non-language subjects (history / geography / science),** set both
   source and target codes to `en-GB`. Do not abuse the `de-DE` slot to
   hold an English term — use proper `translations: { "en-GB": "..." }`.
6. **Every item has a unique stable `id`** scoped to the pack.
7. **One concept per item.** Don't bundle two vocab words or two facts
   into one entry.
8. **No duplicates within a pack** — same translation pair, same gap
   answer, same builder sentence, same passage question.
9. **British English.** Single quotes for inner quotes if needed.
10. **Curriculum-safe content.** Match the stated `level` for vocab depth,
    sentence length, and topic sensitivity.
11. **No placeholder content.** No "TODO", no "Lorem ipsum", no duplicate
    strings across items.

## Pack header (required on every `pack_unified.json`)

```json
{
  "packId":              "{{PACK_ID}}",
  "subject":             "{{SUBJECT_LOWERCASE}}",
  "title":               "{{HUMAN_TITLE}}",
  "subtitle":            "{{SHORT_SUBTITLE_OPTIONAL}}",
  "level":               "{{LEVEL}}",
  "language":            "{{SOURCE_LABEL}}",
  "topics":              ["{{TOPIC}}"],
  "tags":                ["{{LEVEL}}", "{{SUBJECT}}", "{{TOPIC}}"],
  "description":         "Two or three sentence revision-friendly summary.",
  "schemaVersion":       "1.1",
  "sourceLanguageLabel": "{{SOURCE_LABEL}}",
  "sourceLanguageCode":  "{{SOURCE_CODE}}",
  "targetLanguageLabel": "{{TARGET_LABEL}}",
  "targetLanguageCode":  "{{TARGET_CODE}}",
  "speechLanguage":      "{{SPEECH_CODE}}",
  "items":               [ /* … */ ]
}
```

## Manifest entries

Three entries the user pastes into `data/generated/manifest.json`:

```json
// Revision pack — push to revisionPacks[]
{
  "id":                  "{{PACK_ID}}",
  "displayName":         "{{HUMAN_TITLE}}",
  "subject":             "{{SUBJECT_LOWERCASE}}",
  "level":               "{{LEVEL}}",
  "unifiedPath":         "data/Packs/{{PACK_ID}}/pack_unified.json",
  "sourceLanguageLabel": "{{SOURCE_LABEL}}",
  "sourceLanguageCode":  "{{SOURCE_CODE}}",
  "targetLanguageLabel": "{{TARGET_LABEL}}",
  "targetLanguageCode":  "{{TARGET_CODE}}",
  "speechLanguage":      "{{SPEECH_CODE}}",
  "supportsSentences":   <true if any sentence items, else false>,
  "stageOptions":        [],
  "defaultQuizModes":    [],
  "wordCount":           <count of vocab items>,
  "sentenceCount":       <count of sentence items>
}

// Sentence builder pack — push to sentenceBuilderPacks[]
{
  "id":          "{{PACK_ID}}",
  "displayName": "{{HUMAN_TITLE}}",
  "unifiedPath": "data/SentenceBuilderPacks/{{PACK_ID}}_unified.json"
}

// Passage pack — append to the matching passageGroups[].packs (or create the group)
{
  "id":          "{{GROUP_ID}}",
  "displayName": "{{HUMAN_GROUP_TITLE}}",
  "unifiedPath": "data/PassagePacks/{{GROUP_ID}}/pack_unified.json"
}
```

## Coverage requirements

For the topic, the full dataset must cover:

- **who** — key people / actors / authors
- **what** — definitions of key terms, processes, concepts
- **when** — key dates, sequences, chronology
- **where** — places, regions, countries
- **why** — causes, motivations, drivers
- **consequences** — short- and long-term effects
- **significance** — why this topic matters, exam-relevance
- **common misconceptions** if relevant
- **likely exam knowledge points** for the stated curriculum context

Spread items across **easy / medium / harder** difficulty within the level.

### Split packs

If the source material covers more than one distinct subtopic (e.g. both
glacier formation *and* glacial deposits), consider recommending a split in
the Source Coverage Summary. Each JSON file should focus on one coherent
subtopic. Items that belong to a different subtopic should not be forced
into the same pack just for convenience — better to produce two focused
packs than one muddled one.

If in doubt, prefer a narrower pack that the source fully justifies over a
broader pack that the source only partially covers.

## Quality bar

The output should feel like something a teacher or strong curriculum
designer would produce. Do not make it generic. Do not make all items the
same shape. Do not rely only on the attached images if they are partial.
Use the attached materials plus wider accurate curriculum knowledge. Avoid
weak filler.

## Item envelope

Every entry in `items[]` has this outer shape:

```json
{
  "id":     "<unique-id>",
  "type":   "<one of the types below>",
  "level":  "<usually matches the pack level>",
  "topics": ["<topic>"],
  "tags":   ["<tag>"],
  "data":   { /* type-specific */ }
}
```

## Item type: `vocab`

The default for language packs and for term-↔-definition cards in
History / Geography / Science.

```json
{
  "id":     "y7_birthdays_001",
  "type":   "vocab",
  "level":  "Y7",
  "topics": ["birthdays & months"],
  "tags":   ["Y7", "noun", "cat:months"],
  "data": {
    "partOfSpeech": "noun",
    "gender":       "m",
    "plural":       "die Geburtstage",
    "translations": {
      "de-DE": "der Geburtstag",
      "en-GB": "birthday"
    },
    "examples": {
      "de-DE": "Mein Geburtstag ist im Mai.",
      "en-GB": "My birthday is in May."
    }
  }
}
```

| `data` field | Required | Notes |
|---|---|---|
| `translations` | yes | BCP-47 keyed dict; must contain entries for the pack's source and target codes |
| `examples` | optional | Same shape as `translations` |
| `partOfSpeech` | optional | `"noun"`, `"verb"`, `"adj"`, `"adv"`, `"det"`, `"prep"`, `"phrase"`, or `"keyword"` for non-language packs |
| `gender` | optional | German: `"m"` / `"f"` / `"n"`; `null` for non-nouns or non-language packs |
| `plural` | optional | Plural form if relevant |

For non-language packs, use `vocab` to capture **term ↔ definition** pairs.
Both `translations` keys are `"en-GB"` — the engine reads
`translations[sourceLanguageCode]` for the prompt side and
`translations[targetLanguageCode]` for the answer side, and since both are
`en-GB` for non-language packs, store them in the dict twice with slightly
different content (term vs definition):

```json
"data": {
  "partOfSpeech": "keyword",
  "translations": {
    "en-GB": "accumulation"
  },
  "examples": {
    "en-GB": "Accumulation is the build-up of snow where more falls than melts."
  }
}
```

> **Tip for non-language packs:** if you want a clear "term → definition"
> drill where prompt and answer differ, prefer a `fillBlank` item. Vocab
> items work best for short term-definition pairs that fit a flashcard.

### Useful `tags` for non-language packs

Use **categorisation tags** so filters and analytics can surface clusters:

| Tag prefix | Meaning |
|------------|---------|
| `cat:causes` | this is a cause |
| `cat:consequences` | this is a consequence |
| `cat:people` | a key person |
| `cat:dates` | a key date |
| `cat:events` | a key event |
| `cat:places` | a key location |
| `cat:treatments` | medical / political response |
| `cat:beliefs` | religious / cultural belief |
| `cat:impact` | broader societal impact |

## Item type: `sentence`

Used in language packs for sentence-build and sentence-type drills. Don't
use for non-language packs (use `fillBlank` instead).

```json
{
  "id":     "Y7-SENT-0001",
  "type":   "sentence",
  "level":  "Y7",
  "topics": ["family"],
  "tags":   [],
  "data": {
    "translations": {
      "de-DE": "In meiner Familie gibt es fünf Personen.",
      "en-GB": "In my family there are five people."
    }
  }
}
```

Aim for sentences that are 6–14 words long. Short enough to build from
tiles, long enough to drill grammar. **Strong sentence types:**

- cause-and-effect
- explanation of a key term
- significance of an individual
- chronological fact
- short exam-style knowledge statement
- comparison statement

## Item type: `sequence`

Used for processes, narratives, anything where order matters.

```json
{
  "id":     "seq_001",
  "type":   "sequence",
  "level":  "Y7",
  "topics": ["glaciation"],
  "tags":   [],
  "data": {
    "title":       "How a Glacier Forms",
    "instruction": "Put the glacier formation steps in the correct order.",
    "items": [
      "More snow falls than melts.",
      "Snow builds up. This is called accumulation.",
      "Layers of snow are compressed.",
      "The snow becomes dense firn.",
      "Over hundreds of years, firn becomes glacier ice.",
      "The ice slides downhill due to gravity."
    ],
    "shuffle": true
  }
}
```

Aim for 4–7 steps. Each step a single sentence, factually correct, clearly
distinct from its neighbours.

## Item type: `categorySort`

Used for "Which kind is this?" classification. 2–3 columns, 6–10 items.

```json
{
  "id":     "cat_001",
  "type":   "categorySort",
  "level":  "Y7",
  "topics": ["weathering vs erosion"],
  "tags":   [],
  "data": {
    "title":       "Weathering or Erosion?",
    "instruction": "Sort each process into the correct category.",
    "categories":  ["Weathering", "Erosion"],
    "pairs": [
      { "text": "freeze-thaw",                       "category": "Weathering" },
      { "text": "plucking",                          "category": "Erosion"    },
      { "text": "abrasion",                          "category": "Erosion"    },
      { "text": "rock broken in cracks by ice",      "category": "Weathering" },
      { "text": "rocks scraped along valley floor",  "category": "Erosion"    }
    ]
  }
}
```

Use the field name `pairs` (the runtime reads it).

## Item type: `fillBlank`

Used for testing recall of a single key term in context. Two flavours:

**Typed** (no `options`):

```json
{
  "id":     "gap_001",
  "type":   "fillBlank",
  "level":  "Y7",
  "topics": ["glaciation"],
  "tags":   [],
  "data": {
    "sentence": "The build-up of snow where more falls than melts is called ____.",
    "answer":   "accumulation",
    "hint":     "Starts with 'a'"
  }
}
```

**Multiple-choice** (with `options`, must include the answer):

```json
"data": {
  "sentence": "The dense, old snow that is not yet ice is called ____.",
  "answer":   "firn",
  "options":  ["firn", "moraine", "till", "scree"]
}
```

Always use `____` (four underscores) as the gap placeholder. Distractors
in `options[]` must be plausible and topic-related.

## Item type: `sentenceBuilder` (Builder tab — separate file)

Lives at `data/SentenceBuilderPacks/{{PACK_ID}}_unified.json`. The pack
header is the same shape as a revision pack. Items:

```json
{
  "id":     "black_death_builder_001",
  "type":   "sentenceBuilder",
  "level":  "KS3 / Year 7",
  "topics": [],
  "tags":   ["key_date"],
  "data": {
    "cardType": "key_date",
    "prompt":   "When did the Black Death arrive in England?",
    "answer":   "The Black Death arrived in England in June 1348.",
    "tiles": [
      "The", "Black", "Death", "arrived", "in", "England", "in", "June", "1348."
    ]
  }
}
```

`tiles` joined with spaces must reconstruct `answer` exactly. Punctuation
attaches to the preceding word (`"1348."` not `"1348"` `"."`).

`cardType` examples (consistent across cards in the same pack helps the UI
group them): `"key_date"`, `"key_term"`, `"example_sentence"`, `"cause"`,
`"consequence"`, `"belief"`, `"treatment"`, `"significance"`,
`"key_person"`.

## Item type: `passage` (Reading tab — separate file)

Lives at `data/PassagePacks/{{GROUP_ID}}/pack_unified.json`. Pack header is
the same shape as a revision pack but `subject` should match the group
(e.g. `"history"` for a history passage group). Items:

```json
{
  "id":     "careers_01",
  "type":   "passage",
  "level":  "GCSE",
  "topics": ["careers"],
  "tags":   [],
  "data": {
    "chapter":       "BBC Bitesize - GCSE German",
    "section":       "Careers",
    "sourceTitle":   "Arzt im Krankenhaus",
    "targetTitle":   "Doctor",
    "sourcePassage": "Ich möchte als Arzt arbeiten…",
    "targetPassage": "I would like to work as a doctor…",
    "speechLanguage": "de-DE",
    "questions": [
      {
        "id":                "careers_01_q1",
        "questionType":      "multiple_choice",
        "difficulty":        "medium",
        "question":          "What does the student want to be?",
        "options":           ["A doctor", "A teacher", "A farmer", "A driver"],
        "correctOptionIndex": 0,
        "modelAnswer":       "A doctor",
        "acceptedKeywords":  ["doctor"]
      },
      {
        "id":                "careers_01_q2",
        "questionType":      "open",
        "difficulty":        "easy",
        "question":          "Why does the student want this job?",
        "modelAnswer":       "He wants to help sick people and finds biology interesting.",
        "acceptedKeywords":  ["help", "sick", "biology"]
      }
    ]
  }
}
```

`questionType` values: `"multiple_choice"`, `"open"`, `"fact"`. Use
`question` (not `question_en`) — that's what the runtime reads. For
non-language passage packs, `sourcePassage` and `targetPassage` may hold
the same text and `speechLanguage` should be `"en-GB"`.

**Passage subtopic suggestions** (mix at least 4 of these per pack):

- background / context
- causes / drivers
- key people
- key events / chronology
- symptoms and treatments (history / science / medicine)
- beliefs and religion (history)
- government / authority response
- impact on society
- short source-style or interpretation-style reading

**Question type mix per passage** (3–6 questions): include at least one
**fact retrieval**, one **inference**, and one **explanation /
significance** question.

## Sizing guidance

Adjust by topic size; these are good defaults for a complete pack:

| File | Item count | Notes |
|------|------------|-------|
| Revision pack `vocab` items | 30–80 | Cover key people, dates, events, terms, causes, consequences |
| Revision pack `sentence` items | 20–40 | Only for language packs, or cause-and-effect statements for history/science |
| Revision pack `sequence` items | 0–4 | One per process; geography and science benefit most |
| Revision pack `categorySort` items | 0–4 | One per "X vs Y" distinction |
| Revision pack `fillBlank` items | 0–20 | Strong fit for non-language packs; mix typed and multiple-choice |
| Sentence builder pack `sentenceBuilder` items | 15–30 | Group by `cardType` |
| Passage pack `passage` items | 4–8 | Each passage 80–220 words depending on level |
| Per-passage `questions` | 3–6 | Mix difficulties and types |

## Subject-specific guidance

### Language packs (`subject: "language"`)

- Source = the language being learned; target = English (typically).
- The Quiz Setup UI shows a direction toggle so the student can drill
  in either direction.
- Default mix: `vocab` heavy, plus `sentence` items for sentence-build/
  sentence-type drills. Set `supportsSentences: true` if any sentence
  items exist.
- Use BCP-47 codes precisely: `de-DE`, `fr-FR`, `es-ES`, `la-Latn`,
  `it-IT`, `zh-Hans`, `ja-JP`, etc.

### History packs (`subject: "history"`)

- Source = target = `"en-GB"`. Set `supportsSentences: true` only if you
  include cause-and-effect or knowledge-statement sentences.
- Strong mix: `vocab` (key people / dates / terms), `fillBlank` (key
  causes / consequences / dates), and a sentence-builder pack for
  exam-style sentence reconstruction.
- Keep dates explicit ("1348", not "the mid-14th century").
- Tag historical sensitivity carefully — factual but neutral phrasing.

### Geography packs (`subject: "geography"`)

- Source = target = `"en-GB"` for KS3 packs. `supportsSentences: false`
  unless writing case-study sentences.
- Strong fit for `categorySort` (weathering vs erosion, push vs pull),
  `sequence` (water cycle, glacier formation), and `fillBlank`.
- Use units consistently (km, m³, °C).

### Science packs (`subject: "science"`)

- Source = target = `"en-GB"`. `supportsSentences: false` unless you have
  textbook-style sentences.
- Strong fit for `vocab` (units, formulae, key terms), `sequence`
  (cellular respiration, photosynthesis steps), `categorySort` (organic
  vs inorganic, kingdom classification).
- Specify Biology / Chemistry / Physics in the title.

## Automation Mode

Do **not** ask clarification questions. If metadata is missing, infer the
safest reasonable value from the source material and record it.

**Inference defaults:**
- Level: `"KS3"` if the source appears lower-secondary but the exact year
  is not visible.
- Level: `"GCSE"` only if the source clearly states it (GCSE, AQA, Edexcel,
  OCR, IGCSE, exam paper, specification, or GCSE-style command words).
- Scope: `"source_faithful"` by default.
- Language (for geography / history / science): `en-GB` / `en-GB` / `en-GB`.
- Language (for language packs): infer from the source.

If confidence is low, still generate the pack — record the uncertainty in
`pack_decision.json` under `"warnings"`.

## What NOT to do

- ❌ Don't dump partial JSON — every code block must validate as-is.
- ❌ Don't use bare `"de"` / `"en"` keys; always BCP-47 (`"de-DE"` /
      `"en-GB"`).
- ❌ Don't capitalise `subject`.
- ❌ Don't put `passage` items in a revision pack (`data/Packs/`) —
      passages live in `data/PassagePacks/<group>/pack_unified.json`.
- ❌ Don't put `sentenceBuilder` items in a revision pack — they live in
      `data/SentenceBuilderPacks/<id>_unified.json`.
- ❌ Don't include comments or markdown inside the JSON code blocks.
- ❌ Don't generate `options` arrays where the answer isn't included.
- ❌ Don't repeat content. Each item should teach one distinct thing.
- ❌ Don't make all items the same shape — vary types per the pack-type
      guidance above.
- ❌ Don't rely only on attached images if they are partial; expand
      with accurate curriculum knowledge.

## END PROMPT
