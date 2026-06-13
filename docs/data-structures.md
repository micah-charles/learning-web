# Data Structures in `learning-web`

> Complete reference for every data format used in the project.
> Schema version: 1.1 (multilingual translations)
>
> **Machine-readable schemas:** `schemas/pack_unified.schema.json` and `schemas/passages.schema.json`

---

## Architecture Overview

Every file is referenced from `data/generated/manifest.json`. The app loads the manifest first, then resolves all pack and passage data via `unifiedPath` entries.

There are two data layers:

- **Unified packs** (`pack_unified.json`) — the runtime format for revision packs, sentence builder packs, and passage packs. Single file per pack containing a typed array of items.
- **Legacy source files** (e.g. `vocab.json`, `sentences.jsonl`) — conversion inputs only. The app never loads them at runtime.

---

## Top-level: `manifest.json`

```json
{
  "generatedAt":    "2026-05-02T…",
  "schemaVersion":  "1.1",
  "coreUnifiedPath": "data/core_unified.json",
  "core":           { …pack-entry… },
  "packs":          [ …pack-entry…, … ],
  "sentenceBuilderPacks": [ …builder-pack-entry…, … ]
}
```

> **`revisionPacks` and `passageGroups` are removed.** All content packs
> (revision and passages) are now registered in the single `packs[]` array.
> The `capabilities` field on each entry declares what the pack supports.

---

## Manifest: Pack Entry

Every entry in `packs[]`:

```json
{
  "id":                  "y7_german_full",
  "displayName":         "Y7 German — Full Course",
  "subject":             "language",
  "curriculum":          "ks3",
  "level":               "Y7",
  "capabilities":        ["revision"],
  "unifiedPath":         "data/Packs/ks3/language/y7_german_full/pack_unified.json",
  "sourceLanguageLabel": "German",
  "sourceLanguageCode":  "de-DE",
  "targetLanguageLabel": "English",
  "targetLanguageCode":  "en-GB",
  "speechLanguage":      "de-DE",
  "supportsSentences":   true,
  "stageOptions":        [],
  "defaultQuizModes":    [],
  "wordCount":           426,
  "sentenceCount":       37
}
```

When the pack also has a `passages.json`, add:

```json
{
  "capabilities": ["revision", "passages"],
  "passagePath":  "data/Packs/ks3/language/y7_german_full/passages.json"
}
```

When the pack has a Study Book markdown file, add:

```json
{
  "contentMdPath": "data/Packs/ks3/science/biology_cells/study_notes.md",
  "extraMdFiles": [
    { "title": "Exam Tips",  "path": "data/Packs/ks3/science/biology_cells/exam_tips.md" }
  ]
}
```

Both `contentMdPath` and `extraMdFiles` are **optional and backward-compatible** — omitting them simply means the Study Book button does not appear for that pack. `extraMdFiles` is only needed when a pack has more than one markdown file; the `contentMdPath` file is always listed first as "Notes" in the file-tab row.

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Unique pack ID |
| `displayName` | string | Human-readable title shown in the UI |
| `subject` | string | Subject bucket: `language` \| `history` \| `geography` \| `science` \| `literature` |
| `curriculum` | string | `ks3` \| `gcse` \| `other` |
| `level` | string | Suggested year level (used as a default filter) |
| `capabilities` | string[] | Declares which tabs this pack supports: `"revision"` \| `"passages"` |
| `unifiedPath` | string | Path to the pack's `pack_unified.json` |
| `passagePath` | string? | Path to the pack's `passages.json` — only present when `capabilities` includes `"passages"` |
| `contentMdPath` | string? | Path to the primary Study Book markdown file (relative to repo root) |
| `extraMdFiles` | `{ title: string, path: string }[]?` | Additional markdown files — shown as tabs in the Study Book drawer |
| `sourceLanguageLabel` | string | Display label for the study language (shown in quiz prompts) |
| `sourceLanguageCode` | string | BCP-47 code for the study language (e.g. `de-DE`, `la-Latn`, `en-GB`) |
| `targetLanguageLabel` | string | Display label for the target language |
| `targetLanguageCode` | string | BCP-47 code for the target language |
| `speechLanguage` | string | BCP-47 code for TTS (often matches `sourceLanguageCode`) |
| `supportsSentences` | boolean | `false` for packs that have only vocab items — prevents the quiz engine from trying to build sentence questions from an empty pool |
| `stageOptions` | string[] | Set when a pack has named stages (e.g. Cambridge Latin Stages has `["Stage 1", …, "Stage 12"]`) |
| `defaultQuizModes` | string[] | Preferred mode IDs for this pack (empty = use app defaults) |
| `wordCount` | number | Approximate vocab item count |
| `sentenceCount` | number | Sentence item count |

### Subject field

The `subject` field groups packs in the Quiz Setup UI (Subject First flow). It describes the **subject matter**, not the language of instruction.

| Value | Meaning |
|-------|---------|
| `language` | Language learning packs (German, Latin, etc.) — shows the direction toggle in Quiz Setup |
| `history` | History knowledge packs |
| `geography` | Geography knowledge packs |
| `science` | Science packs |
| `literature` | Literature and text analysis packs |
| `computing` | Computing and digital literacy packs |
| `religion` | Religious studies packs |
| `other` | Miscellaneous packs that don't fit another bucket |

---

## Manifest: Core Pack Entry

The `core` entry follows the same shape as a pack entry, with `id: "core"`. It is listed alongside packs in the dataset dropdown.

---

## Manifest: Sentence Builder Pack Entry

```json
{
  "id":           "black_death",
  "displayName":  "Black Death",
  "unifiedPath":  "data/SentenceBuilderPacks/black_death/pack_unified.json"
}
```

---

## Unified Pack Format (`pack_unified.json`)

Every unified pack has the same header structure regardless of type:

```json
{
  "packId":              "y7_german_full",
  "subject":             "language",
  "title":               "Y7 German — Full Course",
  "subtitle":            "All 11 Y7 German packs merged",
  "level":               "Y7",
  "language":            "German",
  "topics":              ["birthdays & months", "colours & appearance", …],
  "tags":                ["Y7", "German", "beginner", "full-course"],
  "description":          "A complete Y7 German vocabulary course…",
  "schemaVersion":       "1.1",
  "sourceLanguageLabel":  "German",
  "sourceLanguageCode":   "de-DE",
  "targetLanguageLabel":  "English",
  "targetLanguageCode":   "en-GB",
  "speechLanguage":       "de-DE",
  "items":               [ … ]
}
```

All fields mirror the manifest entry. The pack header fields are repeated so individual pack files are self-describing.

---

## Unified Item Format

Every item in a unified pack has a fixed outer envelope:

```json
{
  "id":     "y7_birthdays_and_months_001",
  "type":   "vocab",
  "level":  "Y7",
  "topics": ["birthdays", "birthdays & months"],
  "tags":   ["Y7", "custom", "cat:months"],
  "data":   { …type-specific-fields… }
}
```

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Unique item ID within the pack |
| `type` | string | Item kind — see table below |
| `level` | string | Year level (e.g. `"Y7"`, `"Stage 1"`) |
| `topics` | string[] | Topic labels for filtering |
| `tags` | string[] | Additional labels (origin, category, etc.) |
| `data` | object | Polymorphic payload — shape depends on `type` |

### Optional image metadata

Any revision, reading, or builder item may include image metadata either on the item envelope or inside `data`. Prefer putting it inside `data` so the image travels with the prompt/passage payload.

```json
{
  "data": {
    "image": "/assets/history/y7/section-c/athelstan_military_conquest_comic.png",
    "imageAlt": "Six-panel comic showing Athelstan's conquest, law and kingship.",
    "imageCaption": "Visual argument: conquest gave Athelstan power, while law and Christianity made that power recognised.",
    "imagePlacement": "top"
  }
}
```

| Field | Type | Purpose |
|-------|------|---------|
| `image` | string | Optional image source. Prefer root-relative public assets such as `/assets/...`; HTTPS is also supported in the React image renderer. |
| `imageAlt` | string | Accessible alt text. Required in practice for new packs, even though old data may omit it. |
| `imageCaption` | string | Optional caption shown below the image. |
| `imagePlacement` | `"top"` \| `"inline"` \| `"bottom"` | Placement hint. Current renderers treat `inline` like `top`. |

Study Book Markdown also supports image syntax such as `![alt](/assets/...)`. Do not reference an image that is not present under `public/`; the build may still pass, but the learning experience will show a broken visual.

### Valid item `type` values

| Type | Used by | Quiz mode |
|------|---------|-----------|
| `vocab` | Revision packs, core | Word choice, word type, fill-blank |
| `sentence` | Revision packs, core | Sentence build, sentence type |
| `sequence` | Revision packs | Sequence ordering |
| `categorySort` | Revision packs | Category sorting |
| `fillBlank` | Revision packs | Gap-fill |
| `multipleChoice` | Revision packs | Standalone multiple-choice |
| `sentenceBuilder` | Sentence builder packs | Builder tab (standalone) |
| `passage` | Passage packs | Reading tab |

---

## Item Types: `vocab`

```json
{
  "id":     "y7_birthdays_and_months_001",
  "type":   "vocab",
  "level":  "Y7",
  "topics": ["birthdays", "birthdays & months"],
  "tags":   ["Y7", "custom", "cat:months"],
  "data": {
    "partOfSpeech": "noun",
    "gender":       "m",
    "plural":       "die Geburtstage",
    "translations": {
      "de-DE": "der Geburtstag",
      "en-GB": "birthday"
    }
  }
}
```

| Data field | Type | Notes |
|------------|------|-------|
| `translations` | `Record<code, string>` | **Preferred (schema 1.1).** BCP-47 keys. Prefer `de-DE`/`en-GB` over `de`/`en` for clarity. |
| `examples` | `Record<code, string>` | Example sentence per language |
| `partOfSpeech` | string | e.g. `"noun"`, `"verb"`, `"det"` |
| `gender` | string? | Noun gender: `m` \| `f` \| `n`; `null` for non-nouns |
| `plural` | string? | Noun plural form |
| `sourceWord` | string | **Legacy fallback.** Used if `translations` is absent. |
| `targetWord` | string | **Legacy fallback.** |

> **Language code priority:** The quiz engine reads `translations[sourceLanguageCode]` for the study side and `translations[targetLanguageCode]` for the target side, falling back to `translations["de-DE"]` → `translations["en-GB"]` → `sourceWord`/`targetWord` in order.

---

## Item Types: `sentence`

```json
{
  "id":     "Y7-SENT-0001",
  "type":   "sentence",
  "level":  "Y7",
  "topics": ["family", "tiffin 10-19"],
  "tags":   [],
  "data": {
    "translations": {
      "de-DE": "In meiner Familie gibt es fünf Personen…",
      "en-GB": "In my family there are five people…"
    }
  }
}
```

| Data field | Type | Notes |
|------------|------|-------|
| `translations` | `Record<code, string>` | **Preferred (schema 1.1).** |
| `sourceSentence` | string | **Legacy fallback.** |
| `targetSentence` | string | **Legacy fallback.** |
| `sourceLanguage` | string | **Legacy.** Non-BCP-47 code (`"de"`, `"en"`). |
| `targetLanguage` | string | **Legacy.** |

---

## Item Types: `sequence`

```json
{
  "id":     "seq_001",
  "type":   "sequence",
  "level":  "Y7",
  "topics": [],
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

The `items` array is shown to the user in shuffled order. They tap two items to swap positions until the order is correct.

| Data field | Type | Notes |
|------------|------|-------|
| `title` | string | Question prompt |
| `instruction` | string | Guidance shown below the title |
| `items` | string[] | Ordered steps; UI shuffles on load |
| `shuffle` | boolean | Whether to shuffle on load (default: `true`) |

---

## Item Types: `categorySort`

```json
{
  "id":     "cat_001",
  "type":   "categorySort",
  "level":  "Y7",
  "topics": [],
  "tags":   [],
  "data": {
    "title":       "Weathering or Erosion?",
    "instruction": "Sort each process into the correct category.",
    "categories":  ["Weathering", "Erosion"],
    "pairs": [
      { "text": "freeze-thaw",                   "category": "Weathering" },
      { "text": "plucking",                      "category": "Erosion"    },
      { "text": "abrasion",                      "category": "Erosion"    },
      { "text": "rock broken in cracks by ice", "category": "Weathering" },
      { "text": "rocks scraped along valley floor", "category": "Erosion" }
    ]
  }
}
```

The UI shows all `pairs[].text` values in a tile pool. The user taps a tile to select it, then taps a category column to place it.

| Data field | Type | Notes |
|------------|------|-------|
| `title` | string | Question prompt |
| `instruction` | string | Guidance |
| `categories` | string[] | Column headers — any number of columns supported |
| `pairs` | `Array<{text, category}>` | `text` shown to user; `category` is the correct column |

> Note: `pairs` is used for backwards compatibility. New exports should use `items` as an alias.

---

## Item Types: `fillBlank`

```json
{
  "id":     "gap_001",
  "type":   "fillBlank",
  "level":  "Y7",
  "topics": [],
  "tags":   [],
  "data": {
    "sentence": "The build-up of snow where more falls than melts is called ____.",
    "answer":   "accumulation",
    "hint":     "Starts with 'a'"
  }
}
```

Rendered as either a typed input or a button-grid of options (the UI picks based on what `options` are present — see variant below).

```json
"data": {
  "sentence": "The build-up of snow where more falls than melts is called ____.",
  "answer":   "accumulation",
  "options":  ["accumulation", "abrasion", "plucking", "firn"]
}
```

| Data field | Type | Notes |
|------------|------|-------|
| `sentence` | string | Prompt with `____` placeholder |
| `answer` | string | Correct answer (used for typed mode) |
| `hint` | string? | Optional hint shown to the student |
| `options` | string[]? | Multiple-choice options; if present, rendered as a button grid |

---

## Item Types: `multipleChoice`

```json
{
  "id":     "grammar_case_001",
  "type":   "multipleChoice",
  "level":  "Stage 1",
  "topics": ["Latin grammar", "cases"],
  "tags":   ["grammar", "mcq"],
  "data": {
    "question": "What case is 'servus' in 'servus dormit'?",
    "answer":   "nominative",
    "options":  ["nominative", "accusative", "dative", "ablative"],
    "hint":     "The noun is doing the verb."
  }
}
```

Use `multipleChoice` for standalone authored MCQ prompts that are **not** gap-fill sentences. This is the correct type for grammar drills such as "What case is...?", "What does this ending show?", or "Which form agrees with...?" where the prompt is a full question and the learner must choose one fixed answer.

Do **not** encode these as `fillBlank` unless the prompt genuinely contains a `____` blank. `fillBlank` is reserved for cloze/gap-fill prompts; `multipleChoice` uses `data.question`.

| Data field | Type | Notes |
|------------|------|-------|
| `question` | string | Full prompt shown to the learner. Required. |
| `answer` | string | Correct option. Required and must appear in `options`. |
| `options` | string[] | Fixed answer choices shown as buttons. Include the correct answer plus distractors. |
| `hint` | string? | Optional hint shown to the student |
| `questionType` | string? | Optional semantic metadata, e.g. `"multiple_choice"`; the renderer uses `type: "multipleChoice"` and `options`. |

Runtime behavior:
- Quiz treats `multipleChoice` as `modeId: "multipleChoice"`, `kind: "choice"`, and `modeTitle: "Multiple choice"`.
- Grammar-only language packs with zero `vocab` items can still start a quiz when they contain `multipleChoice` items.
- Arcade Quiz Hunt can load `multipleChoice` items from the same unified pack and uses the authored `options` as answer tokens.

---

## Item Types: `sentenceBuilder`

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

Used by the **Builder tab** (standalone tile drill, independent of quiz flow).

| Data field | Type | Notes |
|------------|------|-------|
| `cardType` | string | Card category: `key_date`, `key_term`, `example_sentence`… |
| `prompt` | string | Short prompt or date shown above the tile bank |
| `answer` | string | The complete correct sentence |
| `tiles` | string[] | Word fragments — shuffled into the tile bank on load |

---

## Item Types: `passage`

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
        "id":                  "q1",
        "questionType":        "multiple_choice",
        "difficulty":          "medium",
        "question":            "What does the student want to be?",
        "options":             ["A doctor", "A teacher", "A farmer", "A driver"],
        "correctOptionIndex":   0,
        "modelAnswer":         "A doctor",
        "acceptedKeywords":    ["doctor"]
      }
    ]
  }
}
```

Used by the **Reading tab**.

| Data field | Type | Notes |
|------------|------|-------|
| `chapter` | string | Chapter label (shown as eyebrow above title) |
| `section` | string | Section label |
| `sourceTitle` | string | Title in the source language |
| `targetTitle` | string | Title in the target language |
| `sourcePassage` | string | Full source-language text (TTS reads this) |
| `targetPassage` | string | Target-language translation |
| `speechLanguage` | string | BCP-47 TTS language code (e.g. `"de-DE"`, `"en-GB"`) |
| `questions` | `PassageQuestion[]` | Comprehension questions |

### PassageQuestion

```json
{
  "id":                  "q1",
  "questionType":        "multiple_choice",
  "difficulty":          "medium",
  "question":            "What does the student want to be?",
  "options":             ["A doctor", "A teacher", "A farmer", "A driver"],
  "correctOptionIndex":   0,
  "modelAnswer":         "A doctor",
  "acceptedKeywords":    ["doctor"]
}
```

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Question ID |
| `questionType` | string | `"open"` (typed) or `"multiple_choice"` |
| `difficulty` | string | `"easy"` \| `"medium"` \| `"hard"` |
| `question` | string | The question text. **Must use this field name** — not `questionText`, not `question_en` |
| `options` | string[] | MCQ options (required if `questionType === "multiple_choice"`) |
| `correctOptionIndex` | number | 0-based index of the correct option |
| `modelAnswer` | string | Model answer for open questions |
| `acceptedKeywords` | string[] | Keywords for keyword-based marking |

---

## Subject First Quiz Flow

The Quiz Setup UI (introduced in PR #13) uses `subject` to group packs into four buckets: Language, History, Geography, Science.

For **Language packs** (`subject === "language"`), an additional direction toggle appears in Quiz Setup:

```
[ German → English ]   [ English → German ]
```

This sets the quiz direction (`studyToTarget` vs `targetToStudy`), which controls whether vocab prompts show the source word or the target word.

For **non-language packs** (`history`, `geography`, `science`), the direction toggle is hidden — prompts always show the pack's `sourceLanguageLabel`. Only one quiz direction is valid for knowledge-revision packs.

---

## Current Packs Summary

### Revision packs

| ID | Subject | Source | Target | Items |
|----|---------|--------|--------|-------|
| `core` | language | German (de-DE) | English (en-GB) | 979 (879 vocab + 100 sentences) |
| `y7_german_full` | language | German (de-DE) | English (en-GB) | 426 (326 vocab + 100 sentences) |
| `y7_chapter2_review` | language | German (de-DE) | English (en-GB) | 21 vocab |
| `y7_learning_goals_test` | language | German (de-DE) | English (en-GB) | 0 (mock test) |
| `cambridge_latin_stages` | language | Latin (la-Latn) | English (en-GB) | 656 vocab (12 stages) |
| `black_death` | history | English (en-GB) | English (en-GB) | 89 (61 vocab + 28 sentences) |
| `ks3_geography_glaciation_1` | geography | English (en-GB) | German (de-DE) | 32 (18 vocab + 2 seq + 2 sort + 10 gaps) |

### Sentence builder packs

| ID | Display name | Items |
|----|-------------|-------|
| `black_death` | Black Death | 22 |
| `silk_road_y7` | Silk Road Y7 | 23 |

### Passage groups

| ID | Display name | Passages |
|----|-------------|---------|
| `bbc_bitesize_gcse_german` | BBC Bitesize GCSE German | 16 |
| `dino_lernt_deutsch` | Dino Lernt Deutsch | 16 |
| `ferien_in_frankfurt` | Ferien in Frankfurt | — |
| `gcse_geography` | GCSE Geography | 2 |
| `ks3_history` | KS3 History | — |
| `deutsche_welle_nicos_weg` | Deutsche Welle Nicos Weg | — |
| `others` | Others | — |

---

## Schema Version History

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-05-01 | Initial unified schema: single `pack_unified.json` per pack, basic `translations` dict |
| 1.1 | 2026-05-02 | `examples` dict for per-language example sentences; `questionType` renamed from `type`; `PassageQuestion.correctOptionIndex` (numeric) replaces `correct_option_index` (legacy snake-case alias retained) |

---

## Folder structure

```
data/
  Packs/<curriculum>/<subject>/<id>/
    pack_unified.json    ← vocab, fillBlank, sequence, categorySort items
    passages.json        ← passage items (optional — only if Reading tab content exists)
  SentenceBuilderPacks/<id>/
    pack_unified.json    ← sentenceBuilder items only
  core_unified.json      ← legacy core German pack
  generated/
    manifest.json
```

Valid `<curriculum>` values: `ks3` | `gcse` | `other`
Valid `<subject>` values: `language` | `history` | `geography` | `science` | `literature`

---

## JSON Schemas

Machine-readable schemas live in `schemas/`:

| File | Validates |
|------|-----------|
| `schemas/pack_unified.schema.json` | Any `pack_unified.json` (vocab, sentence, fillBlank, sequence, categorySort, sentenceBuilder items) |
| `schemas/passages.schema.json` | Any `passages.json` (passage items only) |

Both schemas use JSON Schema draft-07 and can be used by:
- **AI generation prompts** — attach or reference the schema so the model can self-validate structure before outputting JSON
- **Editor plugins** — VS Code will show inline errors if you add `"$schema"` to pack files or configure `json.schemas` in `.vscode/settings.json`
- **`ajv` or `jsonschema`** — for programmatic validation in CI

The schemas are the authoritative source for field names and types. `validate_pack.py` enforces the same rules but also applies semantic checks (tile concatenation, same-word vocab, etc.) that JSON Schema cannot express.

---

## Validator Constraints (`scripts/validate_pack.py`)

`validate_pack.py` enforces the values below. Violations produce either a hard **ERROR** (exit 1) or a **WARNING** (exit 0). AI agents must run the validator and reach 0 errors before committing a pack.

### Allowed `subject` values

```
language  history  geography  science  literature  computing  religion  other
```

- Must be **lowercase**. `"Geography"` or `"GCSE Geography"` are both errors.
- These are the only accepted values — free-text subject names are rejected.

### Allowed `schemaVersion` values

```
1.0   1.1
```

New packs must use `"1.1"`. `"1.0"` is accepted for legacy packs only.

### Allowed item `type` values

```
vocab  sentence  sequence  categorySort  fillBlank  sentenceBuilder  passage
```

Any other string is an error.

### Passage `questionType` values

Used in `passages.json` items inside `data.questions[].questionType`.

| Value | Status | Behaviour |
|-------|--------|-----------|
| `open` | ✓ use this | Renders a text area; marked against `modelAnswer` |
| `multiple_choice` | ✓ use this | Renders an option grid; requires `options[]` and `correctOptionIndex` |
| `fact` | ✓ semantic label | Treated as `open` — describes the question's cognitive level |
| `inference` | ✓ semantic label | Treated as `open` |
| `grammar` | ✓ semantic label | Treated as `open` |
| `explanation` | ✓ semantic label | Treated as `open` |
| `comprehension` | ✓ semantic label | Treated as `open` |
| `mcq` | ⚠ alias | Identical to `multiple_choice` — avoid in new packs |
| `choice` | ⚠ alias | Identical to `multiple_choice` — avoid in new packs |
| `gap` | ⚠ wrong context | A quiz question `kind` (set by `quiz.js`), not a passage type — do not use in `passages.json` |
| `typing` | ⚠ wrong context | Same as `gap` — quiz-only |

> **Rendering note:** The app does not branch on `questionType` for display. It calls `isPassageMultipleChoice(question)`, which returns `true` when `options.length > 1`, regardless of the type string. The `questionType` field is semantic metadata only.

Unknown values outside this table produce a **warning** (not an error) — but they will cause confusion for future authors and should be avoided.

### `partOfSpeech` abbreviation check (language packs only)

For packs where `sourceLanguageCode ≠ targetLanguageCode`, the validator rejects single-letter `partOfSpeech` values:

```
n  v  a  d  r  p  c  i
```

Use the full English word instead: `noun`, `verb`, `adjective`, `adverb`, `preposition`, `pronoun`, `conjunction`, `interjection`.

Non-language packs should use `"keyword"` for all vocab items.

### Same-word vocab check

| Pack type | Behaviour |
|-----------|-----------|
| Non-language (`srcCode === tgtCode`) | **ERROR** — `targetWord` repeating `sourceWord` means no definition was written |
| Language (`srcCode ≠ tgtCode`) | **WARNING** — identical source/target is allowed for cognates (e.g. Latin `toga` → English `toga`) |

### `sentenceBuilder` tile check

`" ".join(tiles)` must exactly equal `answer`. Common causes of failure:

- Terminal punctuation as a separate tile: `[…, "organisms", "."]` → merge to `[…, "organisms."]`
- Word-spelled numbers vs digits: `"seventy"` vs `"70"` — match whatever the `answer` uses
- Missing commas: tiles `["income", "health"]` vs answer `"income, health"` — add commas to the tiles

---

## Study Book Markdown Files

Packs may optionally ship one or more Markdown files that are displayed in the **Study Book drawer** — a side panel for reference and revision notes.

### File location

Place `.md` files inside the pack's own directory:

```
data/Packs/ks3/science/biology_cells/
  pack_unified.json
  passages.json          ← optional
  study_notes.md         ← primary Study Book file
  exam_tips.md           ← optional additional file
```

The filename is not constrained by convention, but `study_notes.md` is the established default for KS3 Science packs.

### Manifest registration

```json
{
  "id": "ks3_science_biology_cells",
  "contentMdPath": "data/Packs/ks3/science/biology_cells/study_notes.md",
  "extraMdFiles": [
    { "title": "Exam Tips", "path": "data/Packs/ks3/science/biology_cells/exam_tips.md" }
  ]
}
```

`contentMdPath` is always the primary file; `extraMdFiles` is shown as additional tabs in the drawer header. Both fields are optional — omitting them means no Study Book button appears for the pack.

### Markdown format rules

The Study Book renderer uses `marked` (GFM mode) with a custom heading renderer that generates stable heading IDs from the text. Supported elements:

| Element | Notes |
|---------|-------|
| `# h1` / `## h2` / `### h3` | Appear in TOC; generate anchor IDs |
| `#### h4` | Rendered but not in TOC |
| Paragraphs, bold, italic, links | Standard GFM |
| Unordered and ordered lists | Standard |
| Tables | Block-level scroll on mobile |
| Code blocks (fenced) | Monospace, no syntax highlighting |
| Blockquotes | Left teal border |
| Horizontal rules | Section dividers |

**Heading anchor generation:** `text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-")`.
Example: `## Key Knowledge` → `id="key-knowledge"`.

The same algorithm is used by `extractTOC` and the `marked` custom renderer, so TOC links and `sourceRef.anchor` fields must use this formula.

### Cross-reference in quiz questions

A quiz question item in `pack_unified.json` may carry an optional `sourceRef` field to link directly to a Study Book heading:

```json
{
  "id": "q_diffusion",
  "type": "vocab",
  "data": { … },
  "sourceRef": {
    "mdFile":  "study_notes.md",
    "heading": "Diffusion",
    "anchor":  "diffusion"
  }
}
```

`sourceRef` is consumed by `renderQuizSession` to render a "Jump to [heading]" button. The quiz engine ignores it entirely — it is purely UI metadata.

### Migration script

`scripts/migrate_science_study_notes.py` copies KS3 Science `.md` files from the study prompt repo into the correct pack directories and patches `manifest.json`. Run it for new study-note batches:

```bash
python3 scripts/migrate_science_study_notes.py           # dry-run
python3 scripts/migrate_science_study_notes.py --apply   # apply
```

---

## Adding a New Pack

1. Create the pack directory: `data/Packs/<curriculum>/<subject>/<id>/`
2. Create `pack_unified.json` with the [unified pack header](#unified-pack-format-pack_unifiedjson) and revision items
3. If the pack has passage content, create `passages.json` in the same directory
4. If the pack has a Study Book, place `study_notes.md` (or similar) in the pack directory and add `contentMdPath` to the manifest entry
5. Add one entry to `packs[]` in `data/generated/manifest.json`; include `passagePath` and `"passages"` in `capabilities` if `passages.json` exists
6. Set `supportsSentences: false` if the pack has no sentence items
7. Run `python3 scripts/validate_pack.py data/Packs/<curriculum>/<subject>/<id>/pack_unified.json` to check the pack
