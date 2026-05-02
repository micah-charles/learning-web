# Data Structures in `learning-web`

> A complete reference of every data format used in the project, what each field means, and which feature uses it.
> Generated: 2026-05-01

---

## Top-level: `manifest.json` — The Master Index

```json
{ "generatedAt", "core", "revisionPacks", "sentenceBuilderPacks", "passageGroups" }
```

Every file in the project is referenced from here. It's the root of everything — the app loads the manifest first, then uses it to locate all other data.

---

## 1. `data/vocab.json` — Core Vocabulary (JSON, single file)

**Used by:** Vocabulary browser, Quiz (word modes: multiple choice, typed, build)

An array of vocabulary word objects. **879 entries** in the core dataset.

```json
{
  "id": "aqa_f_0002",
  "de": "das",
  "en": "the (nt)",
  "pos": "det",
  "gender": "n",
  "plural": null,
  "exampleDe": null,
  "exampleEn": null,
  "topic": "grammar_core",
  "tags": ["Y7", "cat:grammar_core", "foundation"],
  "level": "Y7",
  "rank_frequency": null,
  "part_of_speech": "det",
  "headword": "das",
  "english_equivalent": "the (nt)",
  "tier": "F",
  "selection_principle": "R",
  "categories": ["grammar_core"]
}
```

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Unique identifier (e.g. `aqa_f_0002`) |
| `de` | string | German word — displayed as the "study" side |
| `en` | string | English translation — displayed as the "target" side |
| `pos` | string | Part of speech (det, noun, verb…) |
| `gender` | string | Noun gender: `n` (neuter), `m` (masculine), `f` (feminine) |
| `plural` | string? | Noun plural form (nullable) |
| `exampleDe` | string? | German example sentence (nullable) |
| `exampleEn` | string? | English example sentence (nullable) |
| `topic` | string | Topic label, e.g. `"grammar_core"`, `"family"` |
| `tags` | string[] | Array of tags like `["Y7", "cat:grammar_core", "foundation"]` |
| `level` | string | Year level filter: `"Y7"`, `"Y8"`, `"ALL"` |
| `rank_frequency` | number? | Frequency rank (optional) |
| `part_of_speech` | string | Alternative part-of-speech label |
| `headword` | string | Base form of the word |
| `english_equivalent` | string | Short English gloss |
| `tier` | string | Difficulty tier: `F` (foundation), `H` (higher) |
| `selection_principle` | string | Selection reason code |
| `categories` | string[] | Category labels for filtering |

---

## 2. `data/gcse_sentences.jsonl` — Sentence Pools (JSONL, one JSON per line)

**Used by:** Quiz (sentence build + sentence type modes)

```json
{
  "id": "B1-0001",
  "level": "Y7",
  "topics": ["Identity", "Personal details"],
  "de": "Ich heiße Tom und ich bin zwölf Jahre alt.",
  "en": "My name is Tom and I am twelve years old."
}
```

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Sentence ID (e.g. `B1-0001`) |
| `level` | string | Year filter: `"Y7"`, `"Y8"`… |
| `topics` | string[] | Topics linking this sentence to vocab words |
| `de` | string | German sentence |
| `en` | string | English sentence |

Each revision pack can also have its own `sentences.jsonl` at its `sentencePath`.

---

## 3. `data/Packs/[pack]/vocab.json` — Revision Pack Vocab (JSON, per-pack)

**Used by:** Vocab browser (per-pack view), Quiz (when that pack is selected)

Same shape as the core `vocab.json` above. Every pack has its own independent vocab file.

| Pack ID | Language | Notes |
|---------|----------|-------|
| `ks3_geography_glaciation_1` | Geography/English | **New** — 18 terms, glaciation topics |
| `cambridge_latin_stages` | Latin | Stage-based (1–12), stage options, no sentences |
| `y7_birthdays_and_months` | German | Y7 — ordinals, months |
| `y7_school_subjects` | German | Y7 — school vocabulary |
| `y7_family_and_age` | German | Y7 — family members, numbers |
| `y7_colours_and_appearance` | German | Y7 — colours, describing people |
| `y7_days_and_times` | German | Y7 — days, telling time |
| `y7_chapter2_review` | German | Y7 — mixed revision |
| `y7_learning_goals_test` | German | Y7 — test preparation |
| `y7_pets` | German | Y7 — animals, "Ich habe…" |
| `y7_superpets` | German | Y7 — extended pets vocabulary |
| `y7_teachers_and_possessives` | German | Y7 — possessive adjectives |
| `tiffin10-19` | German | Higher tier, Tiffin School Y10 |

---

## 4. `data/Packs/[pack]/sequence.jsonl` — Sequence Ordering (JSONL) *(new)*

**Used by:** Quiz (sequenceOrder mode)

User sees shuffled steps and must arrange them in the correct order by tapping to swap.

```json
{
  "id": "seq_001",
  "title": "How a Glacier Forms",
  "instruction": "Put the glacier formation steps in the correct order.",
  "items": [
    "More snow falls than melts.",
    "Snow builds up. This is called accumulation.",
    "Layers of snow are compressed.",
    "The snow becomes dense firn.",
    "Over hundreds of years, firn becomes glacier ice.",
    "The ice slides downhill due to gravity."
  ]
}
```

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Sequence ID (e.g. `seq_001`) |
| `title` | string | Shown as the question prompt |
| `instruction` | string | Shown below the title as guidance |
| `items` | string[] | **Ordered** array of process steps; shuffled on load |

Currently **2 sequences** in the glaciation pack.

---

## 5. `data/Packs/[pack]/category_sort.jsonl` — Category Sort (JSONL) *(new)*

**Used by:** Quiz (categorySort mode)

User sorts items into correct categories (e.g. Weathering vs Erosion).

```json
{
  "id": "cat_001",
  "title": "Weathering or Erosion?",
  "instruction": "Sort each process into the correct category.",
  "categories": ["Weathering", "Erosion"],
  "items": [
    { "text": "freeze-thaw",                "category": "Weathering" },
    { "text": "plucking",                   "category": "Erosion"    },
    { "text": "abrasion",                   "category": "Erosion"    },
    { "text": "rock broken in cracks by ice","category": "Weathering" },
    { "text": "rocks scraped along valley floor", "category": "Erosion" }
  ]
}
```

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Sort activity ID |
| `title` | string | Question prompt |
| `instruction` | string | Guidance shown to student |
| `categories` | string[] | Column headers (e.g. 2 or more category names) |
| `items` | object[] | Array of `{text, category}` — correct answer is hidden from user |

Currently **2 sort games** in the glaciation pack.

---

## 6. `data/Packs/[pack]/fill_blank.jsonl` — Fill in the Blank (JSONL) *(new)*

**Used by:** Quiz (fillBlank mode)

Presented as either multiple choice (with options) or typed answer.

```json
{
  "id": "gap_001",
  "sentence": "The build-up of snow where more falls than melts is called ____.",
  "answer": "accumulation",
  "hint": "Starts with 'a'"
}
```

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Gap-fill ID |
| `sentence` | string | Prompt with `____` placeholder for the missing word |
| `answer` | string | Correct answer |
| `hint` | string | Optional hint; shown to student on request |

Currently **8 gap-fill items** in the glaciation pack.

---

## 7. `data/SentenceBuilderPacks/*.jsonl` — Sentence Builder Cards (JSONL)

**Used by:** Builder tab (standalone tile-drill, independent from quiz flow)

```json
{
  "id": "SR-DATE-0001",
  "type": "key_date",
  "prompt": "331BC",
  "level": "Y7",
  "answer": "The Macedonians defeat the Persians at the battle of Gaugamela",
  "tiles": ["The", "Macedonians", "defeat", "the", "Persians", "at", "the", "battle", "of", "Gaugamela"]
}
```

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Card ID |
| `type` | string | Card category: `key_date`, `key_term`, `example_sentence`… |
| `prompt` | string | Short prompt or date shown to student |
| `level` | string | Year filter: `"Y7"`, `"Y8"`… |
| `answer` | string | The complete correct sentence |
| `tiles` | string[] | Word fragments shuffled into the tile bank |

Currently **1 pack**: `silk_road_y7.jsonl` (history topic).

---

## 8. `data/PassagePacks/[group]/[file]` — Reading Passage Packs (JSON or JSONL)

**Used by:** Reading tab

Passage groups with multiple files each. Each passage has an optional audio listen step and comprehension questions.

```json
{
  "id": "fif_s01_p01",
  "chapter": "Kapitel 1",
  "section": "Abschnitt A",
  "title_de": "Ferien in Frankfurt",
  "title_en": "Holidays in Frankfurt",
  "passage_de": "In den Sommerferien fahre ich immer zu meiner Oma nach Frankfurt...",
  "passage_en": "In the summer holidays I always go to my grandma's in Frankfurt...",
  "speech_language": "de-DE",
  "level": "Y9",
  "topic": "Holidays",
  "questions": [
    {
      "id": "q1",
      "type": "open",
      "difficulty": "medium",
      "question_en": "What does the student do during the summer?",
      "options": ["A", "B", "C"],
      "correct_option_index": 0,
      "model_answer_en": "They go to their grandma's in Frankfurt.",
      "accepted_keywords": ["grandma", "Frankfurt", "Oma"]
    }
  ]
}
```

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Passage ID |
| `chapter` | string | Chapter label |
| `section` | string | Section label |
| `title_de` | string | German passage title |
| `title_en` | string | English passage title |
| `passage_de` | string | Full German text (TTS plays this) |
| `passage_en` | string | English translation |
| `speech_language` | string | TTS language code, e.g. `"de-DE"` |
| `level` | string | Year level |
| `topic` | string | Topic label for filtering |
| `questions` | object[] | Comprehension questions |

**Question object:**

| Field | Type | Purpose |
|-------|------|---------|
| `id` | string | Question ID |
| `type` | string | `"open"` (typed) or `"mcq"` (multiple choice) |
| `difficulty` | string | `"easy"`, `"medium"`, `"hard"` |
| `question_en` | string | The question text |
| `options` | string[]? | MCQ options (present only if `type === "mcq"`) |
| `correct_option_index` | number? | Index of correct option (MCQ only) |
| `model_answer_en` | string | Model answer for open questions |
| `accepted_keywords` | string[] | Keywords used for keyword-based marking |

**Current passage groups:**

| Group | Description |
|-------|-------------|
| `bbc_bitesize_gcse_german` | BBC Bitesize GCSE German topics |
| `ferien_in_frankfurt` | Ferien in Frankfurt course |
| `schule_und_alltag` | Schule und Alltag reading texts |
| `dino_lernt_deutsch` | Dino Lernt Deutsch beginner series |
| `gcse_geography` | GCSE Geography settlement MCQ |
| `others` | Miscellaneous passages |
| `deutsche_welle_nicos_weg` | Deutsche Welle Nicos Weg |

---

## Summary Table

| # | File pattern | Format | Used by |
|---|-------------|--------|---------|
| 1 | `data/vocab.json` | JSON (array) | Vocab browser, Quiz word modes |
| 2 | `data/gcse_sentences.jsonl` + `[pack]/sentences.jsonl` | JSONL | Quiz sentence modes |
| 3 | `data/Packs/[name]/vocab.json` | JSON (array) | Per-pack vocab + quiz |
| 4 | `[pack]/sequence.jsonl` | JSONL | **Quiz — sequenceOrder mode** |
| 5 | `[pack]/category_sort.jsonl` | JSONL | **Quiz — categorySort mode** |
| 6 | `[pack]/fill_blank.jsonl` | JSONL | **Quiz — fillBlank mode** |
| 7 | `data/SentenceBuilderPacks/*.jsonl` | JSONL | Builder tab (standalone) |
| 8 | `data/PassagePacks/[group]/[file]` | JSON | Reading tab |

---

## Manifest Entry: Revision Pack Fields

When registering a new pack in `data/generated/manifest.json` (under `revisionPacks`), runtime entries should point at unified data:

```json
{
  "id": "pack_id",
  "displayName": "Human-readable Pack Title",
  "unifiedPath": "data/Packs/[pack]/pack_unified.json",
  "sourceLanguageLabel": "German",
  "sourceLanguageCode": "de-DE",
  "targetLanguageLabel": "English",
  "targetLanguageCode": "en-GB",
  "speechLanguage": "de-DE",
  "supportsSentences": true,
  "mergeCoreSentences": true,
  "stageOptions": [],
  "defaultQuizModes": ["englishWordChooseGerman", "sequenceOrder", "categorySort"],
  "wordCount": 50,
  "sentenceCount": 12
}
```

> **Note:** legacy source paths can still exist as conversion inputs, but app runtime should read `unifiedPath` only.
