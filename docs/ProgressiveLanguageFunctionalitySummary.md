# Progressive Language Functionality Summary

This document is a handoff guide for agents working on the Learning Web Progressive Language module. It explains the feature, data contracts, runtime flow, integration points, and common pitfalls without requiring a full read of `src/main.js`.

## Purpose

Progressive Language is a reusable multilingual lesson flow for beginner language learning. It teaches a small semantic concept pack through four phases:

1. Listen and repeat progressive phrase chains
2. Vocabulary multiple choice
3. Sentence builder
4. Review result

The module is intentionally independent from the existing quiz modes. It uses static JSON packs from `data/`, browser speech synthesis, local in-memory runtime state, and the same visual system as the main Quiz UI.

Do not describe this feature by referencing third-party language-learning products in code or comments.

## Primary Files

Main module:

- `src/progressive-language-lesson.js`

Reusable grammar helpers:

- `src/components/language/grammar-help.js`

App integration:

- `src/main.js`

Styling:

- `styles.css`

Progressive pack catalog:

- `data/ProgressiveLanguagePacks/manifest.json`

Structured Progressive pack data:

- `data/ProgressiveLanguagePacks/<pack-name>/<stage>/<lesson>/pack.json`
- Example: `data/ProgressiveLanguagePacks/qclaw/stage1/multilingual_foundation_pack_050_lunch_dinner/pack.json`

Prompt used to generate future packs:

- `docs/ProgressiveLanguage.md`

## High-Level Architecture

`src/progressive-language-lesson.js` owns nearly all Progressive Language behavior:

- Pack/stage/lesson catalog handling
- Target-language selector list
- Speech language mapping
- State shape
- Lesson rendering
- Phase rendering
- Action reducer
- Vocabulary option generation
- Sentence-builder tile comparison
- Grammar help rendering hooks

`src/main.js` only wires the module into the existing app shell:

- Adds the `Progressive Language` tab
- Loads the catalog with `loadProgressiveLessonCatalog`
- Loads the active pack with `loadProgressiveLessonPack`
- Stores `runtime.progressiveLesson`, `runtime.progressiveLessonCatalog`, and `runtime.progressiveLessonPack`
- Routes click actions to `runProgressiveLessonAction`
- Routes pack, stage, lesson, and language dropdown changes to change helpers
- Schedules automatic listen-mode speech after render

The module does not use React. It follows the existing Learning Web pattern of vanilla JS render functions returning HTML strings.

## Supported Languages

The module supports English as the source language and these target languages:

- `de` German
- `fr` French
- `es` Spanish
- `zh` Chinese
- `ja` Japanese

Display labels are defined in `TARGET_LANGUAGES` inside `src/progressive-language-lesson.js`.

Speech language mapping:

- `de` -> `de-DE`
- `fr` -> `fr-FR`
- `es` -> `es-ES`
- `zh` -> `zh-HK`
- `ja` -> `ja-JP`
- `en` -> `en-GB`

The speech layer uses the browser Web Speech API:

```js
speechSynthesis.speak(new SpeechSynthesisUtterance(text))
```

If speech synthesis is unavailable, the module shows a Quiz-style info feedback banner and still allows the lesson to continue.

## Pack, Stage, And Lesson Menus

Progressive packs are loaded from `data/ProgressiveLanguagePacks/manifest.json`, not from `data/generated/manifest.json`.

The catalog uses this shape:

```json
{
  "schemaVersion": "progressive-language-catalog-1.0",
  "packs": [
    {
      "id": "qclaw",
      "label": "QClaw",
      "description": "Generated multilingual foundation lessons for Stage 1.",
      "stages": [
        {
          "id": "stage1",
          "label": "Stage 1",
          "lessons": [
            {
              "id": "multilingual_foundation_pack_050_lunch_dinner",
              "label": "050 — Lunch and Dinner",
              "path": "./data/ProgressiveLanguagePacks/qclaw/stage1/multilingual_foundation_pack_050_lunch_dinner/pack.json"
            }
          ]
        }
      ]
    }
  ]
}
```

The UI renders three hierarchy selectors:

- Pack: `progressive-pack-collection`
- Stage: `progressive-stage`
- Lesson: `progressive-lesson`

To add a new Progressive lesson:

1. Create `data/ProgressiveLanguagePacks/<pack-name>/<stage>/<lesson>/pack.json`.
2. Add the lesson entry to `data/ProgressiveLanguagePacks/manifest.json`.
3. Run `npm run build`.
4. Verify the Pack / Stage / Lesson menus in the browser.

The current catalog contains:

- `Beta 1` / `Stage 1` / 100 corrected beginner lessons

## Required Pack Shape

A Progressive Language pack must use this top-level shape:

```json
{
  "packId": "",
  "schemaVersion": "prototype-0.2",
  "title": "",
  "description": "",
  "baseLanguageCode": "en",
  "supportedLanguages": ["en", "de", "fr", "es", "zh", "ja"],
  "languageLabels": {
    "en": "English",
    "de": "German",
    "fr": "French",
    "es": "Spanish",
    "zh": "Chinese",
    "ja": "Japanese"
  },
  "vocabulary": [],
  "grammarTokens": [],
  "phraseProgressionChains": [],
  "sentenceBuilders": [],
  "conceptSentenceIndex": {}
}
```

## Semantic Concept Model

The pack is semantic-first. Concepts are not raw words. They should represent meanings.

Good:

- `BANK_FINANCE`
- `BANK_RIVER`
- `NATURE_RIVER`
- `PLACE_BRIDGE`
- `ACTION_CROSS`

Bad:

- `BANK`
- `RIVER`
- `THE`

Function words such as articles, pronouns, and prepositions belong in `grammarTokens`, not in `conceptSentenceIndex`.

The module uses concept IDs for:

- Vocabulary badges
- Mistake records
- Sentence-builder concept tags
- Future semantic lookups

## Vocabulary

`vocabulary[]` drives the multiple-choice phase.

Each item should look like:

```json
{
  "conceptId": "NATURE_RIVER",
  "type": "noun",
  "senseKey": "flowing_body_of_water",
  "translations": {
    "en": { "text": "river" },
    "de": { "text": "Fluss", "article": "der" },
    "fr": { "text": "rivière", "article": "la" },
    "es": { "text": "río", "article": "el" },
    "zh": { "text": "河", "reading": "hé" },
    "ja": { "text": "川", "reading": "かわ", "romaji": "kawa" }
  }
}
```

`getDisplayText(entry, lang)` controls learner-facing display:

- Uses `text`, then `base`, then other fallback fields.
- For `de`, `fr`, and `es`, displays `article + " " + text` when an article exists.
- If the article ends with `'` or `’`, it joins without a space, so `l’` + `eau` becomes `l’eau`.
- For `zh` and `ja`, it displays text without articles.

Vocabulary MCQ options are generated with `buildVocabOptions`:

- Correct answer comes from the current item.
- Distractors come from other vocabulary items in the same pack.
- Duplicate display strings are removed.
- Up to four options are shown.
- Options are shuffled.

Important data rule: learner-facing vocabulary forms should match phrase and builder forms unless the grammar analysis explicitly explains the difference.

## Grammar Tokens

`grammarTokens[]` is support data for function words and grammar concepts.

Required app-compatible shape:

```json
{
  "tokenId": "ARTICLE_THE",
  "type": "article",
  "linkToConcept": false,
  "translations": {
    "en": "the",
    "de": "der/die/das",
    "fr": "le/la/les",
    "es": "el/la/los/las",
    "zh": "",
    "ja": ""
  }
}
```

Do not use older shapes such as:

```json
{
  "token": "the",
  "language": "en",
  "type": "article"
}
```

The grammar support drawer reads:

- `grammarTokens[].tokenId`
- `grammarTokens[].translations[state.targetLang]`

## Phrase Progression Chains

`phraseProgressionChains[]` drives Listen mode.

Expected chain shape:

```json
{
  "chainId": "CHAIN_BRIDGE_CROSS",
  "linkedConcepts": ["PLACE_BRIDGE", "ACTION_CROSS"],
  "difficulty": "A0-A1",
  "steps": []
}
```

Use `linkedConcepts`, not `conceptLinks`.

Each step must have:

```json
{
  "step": 1,
  "focus": "core_noun",
  "translations": {
    "en": { "text": "bridge" },
    "de": { "text": "Brücke", "analysis": {} },
    "fr": { "text": "pont", "analysis": {} },
    "es": { "text": "puente", "analysis": {} },
    "zh": { "text": "橋", "analysis": {} },
    "ja": { "text": "橋", "analysis": {} }
  }
}
```

Use numeric `step`. Do not use `stepId` in phrase steps.

Listen mode displays:

- English phrase: `step.translations.en.text`
- Target phrase: `step.translations[state.targetLang].text`
- Focus badge: `step.focus`
- Progress chip: `Step X / total`
- Inline token hints if `translation.analysis.tokens` exists
- Grammar help icon if `translation.analysis` exists
- Replay button
- Back button
- Next button

When a new Listen step renders, `src/main.js` calls `scheduleProgressiveLessonSpeech`, which reads `getCurrentSpeechCue` and speaks the target phrase once per step key.

## Translation Analysis

Grammar help comes from each target translation's `analysis` object:

```json
{
  "sentencePattern": "Subject + Verb + Object",
  "grammarExplanation": [
    "Chinese usually follows subject-verb-object order."
  ],
  "tokens": [
    {
      "text": "過",
      "type": "verb",
      "role": "action",
      "meaning": "cross",
      "grammarNote": "Used as the main action."
    }
  ],
  "literalOrderExplanation": "we -> cross -> bridge"
}
```

`analysis` is optional. If missing, grammar buttons hide gracefully.

Reusable render helpers live in `src/components/language/grammar-help.js`:

- `hasGrammarAnalysis`
- `renderGrammarHelpPanel`
- `renderGrammarTokenTooltip`
- `renderSentencePatternCard`

Token tooltips work through HTML/CSS hover and focus. On mobile, tapping/focusing the token can reveal the tooltip.

## Sentence Builders

`sentenceBuilders[]` drives Builder mode.

Expected shape:

```json
{
  "sentenceId": "S001",
  "difficulty": "A1",
  "concepts": ["PLACE_BRIDGE", "ACTION_CROSS"],
  "grammarFocus": ["word_order"],
  "sourceChainId": "CHAIN_BRIDGE_CROSS",
  "translations": {
    "en": {
      "text": "We cross the bridge.",
      "tiles": ["We", "cross", "the", "bridge."]
    },
    "de": {
      "text": "Wir überqueren die Brücke.",
      "tiles": ["Wir", "überqueren", "die", "Brücke."],
      "analysis": {}
    }
  }
}
```

Builder mode displays:

- English prompt from `sentence.translations.en.text`
- Concept badges from `sentence.concepts`
- Answer area
- Tile bank
- Back button
- Grammar help icon when analysis exists
- Show/Hide Grammar Labels button when analysis exists
- Reset button
- Check answer button
- Next sentence / Review result button after a correct answer

Tiles are stored in correct order in JSON. The app shuffles them using `resetBuilderTiles`.

Important: Chinese and Japanese answers are compared as arrays, not joined strings.

`compareTiles(selectedTiles, expectedTiles)` checks:

1. Both values are arrays.
2. Lengths match.
3. Every tile at each index matches exactly.

This avoids spacing bugs for languages where natural written sentences do not use spaces.

## Concept Sentence Index

`conceptSentenceIndex` maps vocabulary concept IDs to sentence builder IDs:

```json
{
  "PLACE_BRIDGE": ["S001"],
  "ACTION_CROSS": ["S001"],
  "NATURE_WATER": []
}
```

Rules:

- Keys should be `vocabulary[].conceptId`.
- Values should be `sentenceBuilders[].sentenceId`.
- Do not point to phrase step IDs.
- Every concept in `sentenceBuilders[].concepts` should list that sentence ID.
- Empty arrays are allowed for vocabulary concepts that have no builder sentence yet.

## State Shape

The lesson state is created by `createProgressiveLessonState`.

Current shape:

```js
{
  packPath: "./data/multilingual_foundation_pack_001_bank.json",
  targetLang: "de",
  phase: "listen",
  chainIndex: 0,
  stepIndex: 0,
  vocabIndex: 0,
  sentenceIndex: 0,
  selectedTiles: [],
  bankTiles: [],
  vocabOptions: [],
  feedback: null,
  spokenStepKey: "",
  showListenGrammar: false,
  showBuilderHint: false,
  showGrammarLabels: false,
  answered: {
    vocab: {},
    builder: {}
  },
  mistakes: [],
  score: {
    vocabCorrect: 0,
    vocabTotal: 0,
    builderCorrect: 0,
    builderTotal: 0
  }
}
```

`answered` prevents score inflation when learners jump backward or retry old items. Only the first answer attempt for a vocab concept or builder sentence affects the score and mistake list.

State is runtime-only. It is not persisted to localStorage.

## Phase Navigation

The phase row has four visible chips:

- Listen
- Vocabulary
- Builder
- Review

Listen, Vocabulary, and Builder are clickable buttons. Review is a passive result step and is only reached through the lesson flow.

Jump action:

```html
data-action="progressive-jump-phase"
data-phase="vocab"
```

Jumping clears current feedback and closes grammar panels. It keeps the current item index where possible:

- Jump to Listen: keeps current chain and step.
- Jump to Vocabulary: clamps current `vocabIndex` to pack length and regenerates options.
- Jump to Builder: clamps current `sentenceIndex`, clears selected tiles, and reshuffles the bank.

Back behavior:

- Listen Back: previous phrase step; disabled at first step.
- Vocabulary Back: previous vocab item; from first vocab item, returns to the last Listen step.
- Builder Back: previous builder sentence; from first builder sentence, returns to the last Vocabulary item.

## Action Handling

All Progressive actions are handled by `runProgressiveLessonAction(state, pack, action, dataset)`.

Important action names:

- `progressive-replay`
- `progressive-jump-phase`
- `progressive-listen-back`
- `progressive-listen-next`
- `progressive-toggle-listen-grammar`
- `progressive-vocab-answer`
- `progressive-vocab-back`
- `progressive-vocab-next`
- `progressive-builder-pick`
- `progressive-builder-remove`
- `progressive-builder-reset`
- `progressive-toggle-builder-hint`
- `progressive-toggle-grammar-labels`
- `progressive-builder-check`
- `progressive-builder-back`
- `progressive-builder-next`
- `progressive-restart`
- `progressive-change-language`

`src/main.js` must include each action in its progressive action switch. If a new `data-action` is added in `src/progressive-language-lesson.js`, also add it to `src/main.js`.

Actions either mutate state and return `null`, or return an effect object:

```js
{ speak: { text, lang } }
```

For restart/change-language actions, the reducer returns a new state object.

## Pack and Language Changes

Pack dropdown:

- DOM id: `progressive-pack`
- Handled in `handleChange` in `src/main.js`
- Calls `changeProgressiveLessonPack`
- Loads the selected pack immediately
- Resets the lesson while preserving the current target language

Language dropdown:

- DOM id: `progressive-language`
- Calls `changeProgressiveLessonLanguage`
- Resets the lesson while preserving the selected pack path

Restart and Change Language buttons preserve `state.packPath`. This is important so a non-default selected pack does not snap back to Pack 001.

## Review Phase

Review shows:

- Lesson complete heading
- Vocabulary correct count
- Sentence builder correct count
- Total items to revisit
- Mistakes list
- Restart lesson button
- Change language button

Mistakes are recorded from first attempts only.

Vocabulary mistake shape:

```js
{
  phase: "Vocabulary",
  conceptId,
  prompt,
  expected,
  selected
}
```

Builder mistake shape:

```js
{
  phase: "Sentence builder",
  conceptId,
  prompt,
  expected,
  selected
}
```

## Styling and UI Alignment

Progressive Language intentionally reuses the app's Quiz visual language:

- `question-shell`
- `builder-shell`
- `question-box`
- `question-prompt`
- `option-grid`
- `option-button`
- `feedback`
- `feedback-icon`
- `tile-area`
- `tile`
- `mode-chip`
- `badge`

Progressive-specific classes are layered on top:

- `progressive-lesson-shell`
- `progressive-lesson-hero`
- `progressive-selector-stack`
- `progressive-phase-row`
- `progressive-phase-chip`
- `progressive-lesson-card`
- `progressive-progress-track`
- `progressive-phrase-grid`
- `progressive-options`
- `grammar-icon-button`
- `grammar-inline-tokens`
- `progressive-grammar-support`

Feedback banners use the same fox mascot style as Quiz:

- Correct: `happy.png`
- Wrong: `sad.png`
- Info: `thinking.png`

Do not replace these with plain checkmark/cross icons unless the Quiz UI changes too.

## Common Pitfalls

1. Forgetting to register a lesson in `data/ProgressiveLanguagePacks/manifest.json`.

The file can exist under `data/ProgressiveLanguagePacks/` but will not show in the Progressive menus until it is listed in the catalog.

2. Using old generated schema names.

Bad old names:

- `conceptLinks`
- `stepId`
- `builderId`
- `targetStepId`
- `correctSentence`
- `shuffledTiles`

Current names:

- `linkedConcepts`
- numeric `step`
- `sentenceId`
- `concepts`
- `translations[lang].tiles`

3. French elision display bug.

If a pack has:

```json
{ "text": "eau", "article": "l’" }
```

the app now defensively displays `l’eau`, but future packs should prefer:

```json
{ "text": "l’eau" }
```

4. Chinese/Japanese vocabulary drift.

Do not teach `河流` in vocab and then use only `河` everywhere in phrase/builders unless the analysis explains that difference.

5. Linked concepts that do not appear.

Do not include broad thematic concepts in `linkedConcepts`. If `NATURE_WATER` is not actually used in the chain, remove it from that chain.

6. Score inflation after navigation.

If changing answer logic, preserve the `answered.vocab` and `answered.builder` first-attempt behavior.

7. Auto-showing builder grammar help.

The current expected UX is opt-in: Builder shows a grammar icon, but does not automatically open grammar help after answers.

8. Comparing builder answers by joined strings.

Do not replace array comparison with string comparison. Chinese and Japanese need tile-sequence comparison.

9. Adding new state keys without initialization.

This module's state is created locally, not via `DEFAULT_STATE`, but all new keys still need defaults in `createProgressiveLessonState` and defensive setup in `prepareProgressiveLessonState` if older runtime objects may exist.

## Manual Test Checklist

After modifying the module or adding a pack:

1. Run `npm run build`.
2. Open `http://127.0.0.1:5173/`.
3. Go to `Progressive Language`.
4. Confirm the pack appears in the Pack dropdown.
5. Select German and verify Listen mode speaks or shows audio-unavailable fallback.
6. Jump to Vocabulary and answer one item correctly and one item incorrectly.
7. Confirm the feedback banner uses the fox icon and Quiz-style layout.
8. Jump to Builder and build a sentence.
9. Check that Japanese and Chinese compare tile arrays correctly.
10. Use Back inside Listen, Vocabulary, and Builder.
11. Open grammar help in Listen with the `?` icon.
12. Open grammar help in Builder with the `?` icon.
13. Toggle `Show Grammar Labels`.
14. Finish the lesson and confirm the Review counts and mistakes list.

Specific regression checks from recent packs:

- Pack 001: `BANK_FINANCE` and `BANK_RIVER` remain separate concepts.
- Pack 001: Japanese and Chinese builder answers compare as tile arrays.
- Hill pack: `sentenceBuilders[]` use app-compatible shape, not old `builderId` shape.
- River/Bridge pack: French `l’eau` does not display as `l’ eau`.
- River/Bridge pack: Chinese river vocabulary and sentence usage are consistent.

## Future Architecture Notes

The module is still independent from the main quiz modes. Future improvements could include:

- Optionally merging Progressive catalog discovery into the main app manifest later
- Persisting learner progress per progressive pack
- Reusing the global quiz progress model
- Adding IPA, pinyin, furigana, pronunciation hints, and cultural notes
- Adding pack validation scripts
- Adding unit tests for `getDisplayText`, `buildVocabOptions`, and `compareTiles`

Keep future changes small and preserve independence from existing Quiz modes unless intentionally merging the systems.
