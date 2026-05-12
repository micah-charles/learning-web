# Learning Web Data Structure Summary

Last updated: 2026-05-12

## Overview

The current Learning Web app is driven by a single manifest file:

- `data/generated/manifest.json`

That manifest tells the UI which data files belong to each feature:

- `Vocabulary` uses dataset `vocabPath`
- `Quiz` uses dataset `vocabPath` plus optional `sentencePath`
- `Reading` uses `passageGroups[*].packs[*].path`
- `Builder` uses `sentenceBuilderPacks[*].path`

Important note:

- `data/Packs/<pack>/pack.json` is mainly metadata for manifest generation
- the browser app does not load `pack.json` directly at runtime
- instead, `scripts/generate_manifest.py` copies selected `pack.json` fields into `manifest.json`

## 1. Manifest Layer

### File

- `data/generated/manifest.json`

### Used by

- all browser features

### Main sections

#### `core`

The default dataset for Vocabulary and Quiz.

Key fields:

- `id`
- `displayName`
- `vocabPath`
- `sentencePath`
- `wordCount`
- `sentenceCount`
- `sourceLanguageLabel`
- `sourceLanguageCode`
- `targetLanguageLabel`
- `targetLanguageCode`
- `speechLanguage`
- `supportsSentences`
- `mergeCoreSentences`
- `stageOptions`
- `defaultQuizModes`

#### `revisionPacks`

Additional datasets for Vocabulary and Quiz.

Key fields:

- `id`
- `displayName`
- `topic`
- `sectionTitleEn`
- `sectionTitleDe`
- `topicEn`
- `grammarFocusEn`
- `quizBucket`
- `sourceLanguageLabel`
- `sourceLanguageCode`
- `targetLanguageLabel`
- `targetLanguageCode`
- `speechLanguage`
- `supportsSentences`
- `mergeCoreSentences`
- `stageOptions`
- `defaultQuizModes`
- `vocabPath`
- `sentencePath`
- `wordCount`

#### `sentenceBuilderPacks`

Builder pack registry.

Key fields:

- `id`
- `displayName`
- `path`
- `cardCount`

#### `passageGroups`

Reading pack registry.

Key fields:

- `id`
- `displayName`
- `packs`

Each `packs[]` item contains:

- `id`
- `displayName`
- `path`
- `resourceName`
- `fileType`
- `passageCount`

## 2. Vocabulary Feature

### Files used

- `data/vocab.json`
- `data/Packs/*/vocab.json`

### File type

- JSON array

### Used by

- `Vocabulary` tab
- `Quiz` word questions
- `Review` tab

### Required structure in practice

Each item should have:

- `id`
- `de`
- `en`
- `level`
- `topic`

### Fields currently used by Vocabulary UI

- `id`
- `de`
- `en`
- `level`
- `topic`
- `part_of_speech` or fallback `pos`
- `categories`
- `tags`
- `gender`
- `plural`
- `example_de`
- `example_en`

### Fields also used by Quiz/Review

- `accepted_answers`
- `accepted_translations`
- `stage`
- `stage_label`

### Example shape

```json
{
  "id": "y7_school_subjects_001",
  "de": "Deutsch",
  "en": "German",
  "pos": "noun",
  "gender": "n",
  "topic": "school",
  "tags": ["Y7", "custom", "topic:school"],
  "level": "Y7",
  "categories": ["school", "vocabulary"],
  "part_of_speech": "noun",
  "headword": "Deutsch",
  "english_equivalent": "German"
}
```

### Feature behavior

- Vocabulary filters by `level` or `stage`
- Vocabulary search matches `de`, `en`, `topic`, and `tags`
- Review uses `id`, `de`, and `en`
- Quiz word modes use `de`, `en`, and accepted answer variants

## 3. Quiz Feature

### Files used

- dataset `vocabPath` from `manifest.json`
- dataset `sentencePath` from `manifest.json`
- core `sentencePath` may also be merged in automatically

### File types

- vocab: JSON array
- sentence pool: JSONL

### Word question data source

Same `vocab.json` structure as Vocabulary.

Word quiz fields used:

- `id`
- `de`
- `en`
- `topic`
- `level`
- `stage`
- `stage_label`
- `accepted_answers`
- `accepted_translations`

### Sentence question data source

Sentence pool records are loaded from JSONL files such as:

- `data/gcse_sentences.jsonl`
- `data/Packs/tiffin10-19/sentences.jsonl`

Sentence fields currently used:

- `id`
- `de`
- `en`
- `level`
- `topics`
- `target_vocab_id`
- `vocab_ids`

### Example sentence record

```json
{
  "id": "Y7-SENT-0001",
  "level": "Y7",
  "topics": ["family"],
  "de": "In meiner Familie gibt es fünf Personen.",
  "en": "In my family there are five people."
}
```

### How Quiz uses those fields

- `level` filters by year unless stage-based mode is used
- `target_vocab_id` links a sentence directly to a vocab item
- `vocab_ids` provides fallback links to related vocab items
- `topics` provides another matching route when vocab IDs are absent
- `de` and `en` become prompts, answers, and build tiles

### Quiz mode dependency

- if `supportsSentences` is `false`, sentence quiz modes are hidden
- if `mergeCoreSentences` is `true`, pack sentence data is merged with core GCSE sentences
- `defaultQuizModes` controls the default mode selection for that dataset

## 4. Reading Feature

### Files used

- `data/PassagePacks/**/*.json`
- code also supports `data/PassagePacks/**/*.jsonl`

### File types

- JSON array, or
- JSON object with a top-level `passages` array, or
- JSONL records

### Used by

- `Reading` tab

### Passage fields currently used

- `id`
- `chapter`
- `section`
- `title_de`
- `title_en`
- `level`
- `topic`
- `passage_de`
- `passage_en`
- `questions`

### Question fields currently used

- `id`
- `question_en`
- `model_answer_en`
- optional `type`
- optional `difficulty`
- optional `accepted_keywords`

### Example passage shape

```json
{
  "id": "frankfurt_01_flight",
  "chapter": "Frankfurt Trip",
  "section": "The Flight",
  "title_de": "Der Flug",
  "title_en": "The Flight",
  "level": "Y7-Y8",
  "topic": "travel",
  "passage_de": "Der Flug von Sizilien nach Frankfurt dauert zwei Stunden.",
  "passage_en": "The flight from Sicily to Frankfurt takes two hours.",
  "questions": [
    {
      "id": "frankfurt_01_q1",
      "question_en": "How long does the flight take?",
      "model_answer_en": "The flight takes two hours."
    }
  ]
}
```

### Feature behavior

- Reading filters passages by `topic`
- Reading filters visible questions by `difficulty`
- Reading speaks `passage_de`
- Reading reveals `passage_en` and `model_answer_en`

## 5. Builder Feature

### Files used

- `data/SentenceBuilderPacks/*.jsonl`

### File type

- JSONL

### Used by

- `Builder` tab

### Fields currently used

- `id`
- `type`
- `prompt`
- `level`
- `answer`
- `tiles`

### Example builder card

```json
{
  "id": "SR-DATE-0001",
  "type": "key_date",
  "prompt": "331BC",
  "level": "Y7",
  "answer": "The Macedonians defeat the Persians at the battle of Gaugamela",
  "tiles": ["The", "Macedonians", "defeat", "the", "Persians"]
}
```

### Feature behavior

- Builder filter uses `type`
- Builder header shows `prompt` and `level`
- correctness check compares built text against `answer`
- tile bank is created from `tiles`

## 6. `pack.json` Metadata Files

### Files used

- `data/Packs/*/pack.json`

### File type

- JSON object

### Used by

- `scripts/generate_manifest.py`
- study-pack export pipeline

### Not used directly by runtime UI

The browser app reads these fields only after they have been copied into `manifest.json`.

### Common fields seen today

- `display_name`
- `topic`
- `source_file`
- `section_title_en`
- `section_title_de`
- `topic_en`
- `grammar_focus_en`
- `quiz_bucket`
- `source_language_label`
- `source_language_code`
- `target_language_label`
- `target_language_code`
- `speech_language`
- `supports_sentences`
- `merge_core_sentences`
- `stage_options`
- `default_quiz_modes`
- `generated_at`

## 7. Clear Feature-to-Data Mapping

| Feature | Main data file(s) | Type | Fields most relied on |
| --- | --- | --- | --- |
| Vocabulary | `vocabPath` | JSON array | `id`, `de`, `en`, `level`, `topic`, `part_of_speech`/`pos`, `categories`, `tags` |
| Quiz word modes | `vocabPath` | JSON array | `id`, `de`, `en`, `accepted_answers`, `accepted_translations`, `level`, `stage`, `topic` |
| Quiz sentence modes | `sentencePath` plus optional core merge | JSONL | `id`, `de`, `en`, `level`, `topics`, `target_vocab_id`, `vocab_ids` |
| Reading | `passageGroups[*].packs[*].path` | JSON / JSONL | `chapter`, `section`, `title_de`, `title_en`, `passage_de`, `passage_en`, `questions[]` |
| Builder | `sentenceBuilderPacks[*].path` | JSONL | `id`, `type`, `prompt`, `level`, `answer`, `tiles` |
| Manifest | `data/generated/manifest.json` | JSON object | `core`, `revisionPacks`, `sentenceBuilderPacks`, `passageGroups` |

## 8. Current Practical Rules

If someone adds or changes data for a feature, these are the current expectations:

- new Vocabulary or Quiz dataset: update `vocab.json`, optional `sentences.jsonl`, matching `pack.json`, then rebuild `manifest.json`
- new Reading set: add JSON or JSONL under `data/PassagePacks/<group>/`, then rebuild `manifest.json`
- new Builder set: add JSONL under `data/SentenceBuilderPacks/`, then rebuild `manifest.json`
- if fields used by the UI change, update this summary document and its HTML version at the same time
