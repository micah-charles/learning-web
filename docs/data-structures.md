# Data Structures in `learning-web`

> Complete reference for every data format used in the project.
> Generated: 2026-05-03
> Schema version: 1.1 (multilingual translations)

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
  "core":           { …revision-pack-entry… },
  "revisionPacks":  [ …revision-pack-entry…, … ],
  "sentenceBuilderPacks": [ …builder-pack-entry…, … ],
  "passageGroups":  [ …passage-group-entry…, … ]
}
```

---

## Manifest: Revision Pack Entry

Every entry in `revisionPacks[]`:

```json
{
  "id":                  "y7_german_full",
  "displayName":         "Y7 German — Full Course",
  "subject":             "language",
  "level":               "Y7",
  "unifiedPath":         "data/Packs/y7_german_full/pack_unified.json",
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

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Unique pack ID |
| `displayName` | string | Human-readable title shown in the UI |
| `subject` | string | Subject bucket: `language` \| `history` \| `geography` \| `science` |
| `level` | string | Suggested year level (used as a default filter) |
| `unifiedPath` | string | Path to the pack's `pack_unified.json` |
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

---

## Manifest: Core Pack Entry

The `core` entry follows the same shape as a revision pack entry, with `id: "core"`. It is listed alongside revision packs in the dataset dropdown.

---

## Manifest: Sentence Builder Pack Entry

```json
{
  "id":           "black_death",
  "displayName":  "Black Death",
  "unifiedPath":  "data/SentenceBuilderPacks/black_death_unified.json"
}
```

---

## Manifest: Passage Group Entry

```json
{
  "id":           "bbc_bitesize_gcse_german",
  "displayName":  "BBC Bitesize GCSE German",
  "unifiedPath":  "data/PassagePacks/bbc_bitesize_gcse_german/pack_unified.json"
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

### Valid item `type` values

| Type | Used by | Quiz mode |
|------|---------|-----------|
| `vocab` | Revision packs, core | Word choice, word type, fill-blank |
| `sentence` | Revision packs, core | Sentence build, sentence type |
| `sequence` | Revision packs | Sequence ordering |
| `categorySort` | Revision packs | Category sorting |
| `fillBlank` | Revision packs | Gap-fill |
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
        "question_en":         "What does the student want to be?",
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
  "question_en":         "What does the student want to be?",
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
| `question_en` | string | The question text |
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

## Adding a New Pack

1. Create the pack directory: `data/Packs/[pack-id]/`
2. Create `pack_unified.json` with the [unified pack header](#unified-pack-format-pack_unifiedjson) and items
3. Add an entry to `revisionPacks[]` in `data/generated/manifest.json`
4. Set `supportsSentences: false` if the pack has no sentence items
5. Run `python3 scripts/validate_unified.py` to check the pack
