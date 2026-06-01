# Learning Web — UI Overview

> Golden handbook for any agent or developer joining this project.
> Read this + `docs/data-structures.md` before making any UI or data change.
> Generated from source: `src/main.js`, `src/data.js`, `src/storage.js`, `src/quiz.js`, `src/crossword.js`, `src/study-book.js`

---

## Quick orientation

- **React 18 + Vite** single-page app (since PR #110) built over a **shared vanilla JS engine** (`quiz.js`, `data.js`, `storage.js`, `admin-storage.js`, `progress.js`, `utils.js`, `crossword.js`, …) that the React hooks/pages import directly. All state in `localStorage` under key `learningGermanWeb.v1`.
- **`docs/REACT_ARCHITECTURE.md` is authoritative** for the current app shell (routing, providers, pages, Arcade module). The sections below document the **shared engine** and the **legacy vanilla UI** (`src/main.js`, kept for reference) — the React pages mirror its behaviour but render with React, not `renderApp()`.
- React tabs (`NavBar.jsx`): **Home, Language Ladder, Quiz, Arcade, Vocabulary, Reading, Builder, Crossword, Progress, My Packs, About** (+ AI Pack Creator, reached from My Packs / Hero). Legacy vanilla tabs were: Home, Vocabulary, Quiz, Crossword, Reading, Builder, Review, About, Admin.
- Every tab uses the "Subject First" UX: a card grid (`What are you learning?`) filters the pack dropdown by subject. Curriculum pills further narrow the list — built-in `All / KS3 / US Middle School / Other` plus any pack-supplied curriculum, discovered dynamically via `listCurricula()` (never hardcoded).
- Valid subjects: `language | history | geography | science | literature | computing | religion | other` (defined in `data.js:SUBJECTS`).
- `getDatasetSubject(dataset)` / `inferSubject(dataset)` are the single source of truth for a pack's subject — never hardcode subject strings from pack IDs.
- Mastery threshold: `correct >= 3 && streak >= 2` (checked by `isMasteredProgress` in `storage.js`).
- *(Legacy vanilla UI only)* Every render is a full re-render of `#app`; there is no virtual DOM — `renderApp()` is called after every state change. The current React app uses React's virtual DOM and per-component state instead.
- `persisted` (loaded from `loadStoredState()`) holds all user prefs and progress. `runtime` holds ephemeral session objects that are **not** persisted.
- Packs are loaded on demand via `loadVocabItems` / `loadUnifiedPack` etc. from `data.js`; results are cached in `jsonCache`.
- The **Study Book drawer** lives in `#study-book-root` — a sibling of `#app` in `index.html` — so it survives full `renderApp()` re-renders. It is managed entirely by `src/study-book.js` + the Study Book block in `main.js`. Its state lives in `runtime.studyBook` (never persisted).
- The quiz mode system has two layers: the high-level UI (`subject`, `direction`, `answerMode`) is translated to internal legacy mode IDs by `resolveQuizModesForUI()` before `createQuizSession()` is called.

---

## App shell

### Navigation

> **React app (current):** `TABS` in `src/react/components/layout/NavBar.jsx`:
> `home | language | quiz | arcade | vocab | reading | builder | crossword | progress | mypacks | about`
> (plus `ai-prompt`, reached from My Packs / Hero rather than the tab bar). See
> `docs/REACT_ARCHITECTURE.md` §3–4 and §16 (Arcade) for the authoritative routing.

Legacy vanilla `main.js` `TABS` (kept for reference) defined the tab bar as:

```
home | vocab | quiz | crossword | reading | builder | review | about | admin
```

Clicking the currently-active tab triggers a `window.confirm` before resetting that tab's setup view. Clicking a different tab saves `persisted.activeTab` and re-renders.

### Hero (always visible)

Displays app title, a pack/reading/builder count summary, and four hero stats:
- Total vocab items across all revision packs
- Mastered word count (from `persisted.progress.words`)
- Total quiz sessions stored
- Last quiz score

---

## Tab: Home

**Route:** `persisted.activeTab === "home"` (or session detail overlay)

Shows:
- Quick-launch card grid linking to Quiz, Reading, Review, Builder tabs
- Status snapshot (words seen, builder cards solved, passages completed, latest quiz accuracy)
- Featured revision packs (first 4 from `manifest.packs` with `capabilities: ["revision"]`)
- Current defaults card (quiz pack, reading group, builder pack, stored sessions count)

Sub-views rendered inside Home tab (controlled by `runtime.sessionDetail`):
- Session detail view (`renderSessionDetail`) — accessed via "Details" button on any session row
- All-sessions view (`renderSessionHistoryAll`) — accessed via "View all" link in Quiz tab recent sessions

### Home tab buttons

| Button | Action | Effect |
|--------|--------|--------|
| Quick-launch cards (Quiz/Reading/Review/Builder) | `data-tab="..."` | Switches active tab |
| Details (session row) | `session-detail` | Opens session detail overlay |
| View all | `session-history-all` | Opens all-sessions list |
| Delete (session row) | `session-delete` | Confirms then deletes session from `persisted.progress.sessions` |
| ← Back (detail view) | `session-detail-back` | Returns to home or all-sessions view |
| Re-quiz wrong answers | `session-requiz` | Rebuilds quiz from missed `wordId`s in that session |
| Clear all sessions | `session-clear-all` | Confirms then calls `clearAllSessions` |
| Delete session (in detail) | `session-delete` | Same as row delete |

---

## Tab: Vocabulary

**Route:** `persisted.activeTab === "vocab"`  
**Render function:** `renderVocabTab()` (async)  
**Data loading:** `loadVocabItems(manifest, dataset.id)` → filtered by `filterWordsForScope`

Displays up to 120 vocab cards. Cards show: term, definition, mastery badge (New/Practising/Mastered), level badge, topic badge (language packs), gender/plural badges, example sentences (split by language when `srcCode !== tgtCode`), correct/wrong counts.

### Vocabulary tab controls

| Control | Type | Values | Prefs key | Effect |
|---------|------|--------|-----------|--------|
| Subject card grid | Card buttons | All `SUBJECTS` values | `prefs.vocab.subject` | Switches subject, resets dataset to first match, clears all filters |
| Curriculum | Pill buttons | `all / ks3 / us-middle-school / other` + any pack-supplied (dynamic, via `listCurricula`) | `prefs.vocab.curriculum` | Filters pack dropdown, auto-selects first match |
| Pack (`vocab-dataset`) | `<select>` | All packs for current subject+curriculum | `prefs.vocab.datasetId` | Loads new pack, resets PoS, category, categories, stages |
| Year (`vocab-year`) | `<select>` | `ALL / Y7 / Y8 / Y9 / Y10 / Y11` (or pack's `yearOptions`) | `prefs.vocab.year` | Only shown for **language** packs without stage selection; filters by `word.level` |
| Stages fieldset | Checkboxes | Pack's `stageOptions` array | `prefs.vocab.stages` | Shown instead of Year for stage-based packs (e.g. Cambridge Latin) |
| Part of speech (`vocab-pos`) | `<select>` | Derived from pack's `partOfSpeech` values | `prefs.vocab.partOfSpeech` | Only shown for **language** packs; empty = all |
| Category checkboxes | Checkboxes | Derived from `word.categories` (topics array) | `prefs.vocab.categories` | Only shown for language packs **without** stage selection (German); `[]` = all selected |
| Type dropdown (`vocab-category`) | `<select>` | `cat:*` tags stripped of prefix | `prefs.vocab.category` | Only shown for **literature** packs; empty = all |
| Search (`vocab-search`) | `<input>` | Free text | `prefs.vocab.search` | Debounced (120 ms); matches `word.de + word.en + word.topic + word.tags` |
| Speak button (per card) | Button | — | — | Calls `speakText(word.de, speechLanguageCode)` |

### Subject-specific filter visibility

| Subject | Year | Stages | PoS dropdown | Category checkboxes | Type dropdown |
|---------|------|--------|-------------|---------------------|---------------|
| `language` (German) | Yes | No | Yes | Yes | No |
| `language` (Latin) | No | Yes | Yes | No | No |
| `literature` | No | No | No | No | Yes |
| `history / geography / science` | No | No | No | No | No |

---

## Tab: Quiz

**Route:** `persisted.activeTab === "quiz"`  
**Render functions:** `renderQuizTab()` (setup), `renderQuizSession()` (active session), `renderQuizSummary()` (completed)  
**Data loading:** `loadVocabItems`, `loadUnifiedPack`, optionally `loadPassageUnifiedPack` (for literature)

The tab has three states: **setup** (no `runtime.currentQuiz`), **active session** (`runtime.currentQuiz` set), **summary** (`runtime.currentQuiz.completed === true`).

### Quiz setup controls

| Control | Type | Values | Prefs key | Effect |
|---------|------|--------|-----------|--------|
| Subject card grid | Card buttons | All `SUBJECTS` values | `prefs.quiz.subject` | Switches subject, auto-picks first dataset, resets stages + modes |
| Curriculum | Pill buttons | `all / ks3 / us-middle-school / other` + any pack-supplied (dynamic, via `listCurricula`) | `prefs.quiz.curriculum` | Narrows pack dropdown |
| Pack (`quiz-dataset`) | `<select>` | Packs for current subject+curriculum | `prefs.quiz.datasetId` | Sets dataset, keeps subject in sync, resets stages + modes |
| Year (`quiz-year`) | `<select>` | `ALL / Y7 / Y8 / Y9 / Y10 / Y11` | `prefs.quiz.year` | Language packs only (no stage selection) |
| Stages fieldset | Checkboxes | Pack's `stageOptions` | `prefs.quiz.stages` | Stage-based packs only |
| Questions (`quiz-question-count`) | `<select>` | `12 / 18 / 24 / 30` (capped to max available) | `prefs.quiz.questionCount` | Max is computed by `getQuizMaxQuestionCount()` |
| Word pool (`quiz-exclude-mastered`) | `<select>` | `true / false` | `prefs.quiz.excludeMastered` | Excludes mastered words from candidate pool |
| Direction | Pill buttons | `studyToTarget / targetToStudy` | `prefs.quiz.direction` | **Language packs only.** Controls prompt language. |
| Answer mode | Pill buttons | `mcq / typed / mixed` | `prefs.quiz.answerMode` | Passed to `resolveQuizModesForUI()` |
| Start quiz | Button | — | — | Calls `startQuiz()` |
| Open review desk | Button | — | — | Switches to Review tab |

### Direction toggle

Only rendered when `prefs.subject === "language"`. Labels come from `dataset.sourceLanguageLabel` and `dataset.targetLanguageLabel`. For German: "German → English" and "English → German".

### Answer mode pills

| Mode | Meaning |
|------|---------|
| `mcq` | Multiple choice only |
| `typed` | Free-text typing only |
| `mixed` | Both MCQ and typed questions interleaved |

### How `resolveQuizModesForUI` maps UI to engine

The quiz engine takes a `modes` array of legacy mode IDs. `resolveQuizModesForUI({ subject, direction, answerMode, fillBlankCount, vocabCount })` translates the three UI controls to that array:

| Subject | answerMode | direction | Resulting mode IDs |
|---------|-----------|-----------|-------------------|
| `language` | `mcq` | `studyToTarget` | `["germanWordChooseEnglish"]` |
| `language` | `mcq` | `targetToStudy` | `["englishWordChooseGerman"]` |
| `language` | `typed` | `studyToTarget` | `["germanWordTypeEnglish"]` |
| `language` | `typed` | `targetToStudy` | `["englishWordTypeGerman"]` |
| `language` | `mixed` | `studyToTarget` | `["germanWordChooseEnglish", "germanWordTypeEnglish"]` + `fillBlank` if pack has fill-blank items |
| `language` | `mixed` | `targetToStudy` | `["englishWordChooseGerman", "englishWordTypeGerman"]` + `fillBlank` if applicable |
| `literature` | `mcq` | n/a | `["passageQuestionChooseAnswer"]` |
| `literature` | `typed` | n/a | `["fillBlank"]` |
| `literature` | `mixed` | n/a | `["passageQuestionChooseAnswer", "fillBlank", "categorySort"]` |
| `history / geography / science` | `mcq` | n/a | `["germanWordChooseEnglish"]` |
| `history / geography / science` | `typed` | n/a | `["germanWordTypeEnglish"]` |
| `history / geography / science` | `mixed` | n/a | `["germanWordChooseEnglish", "germanWordTypeEnglish"]` |

Note: legacy mode IDs still say "german/english" even for non-German packs. The engine is generic; the names are historical.

### Quiz question types (kinds)

| `kind` | Engine mode | Interaction |
|--------|-------------|-------------|
| `choice` | `*WordChooseEnglish`, `*WordChooseGerman`, `passageQuestionChooseAnswer`, `fillBlank` (with options) | 4-option button grid; auto-submits on tap |
| `typed` | `*WordType*`, `*SentenceType*`, `fillBlank` (no options) | `<textarea>` + "Check answer" button |
| `build` | `*SentenceBuild*` | Tile bank + answer bar; "Clear", "Hint", "Check answer" buttons |
| `sequence` | `sequenceOrder` | Ordered list of items; tap two to swap; "Shuffle" + "Check order" buttons |
| `sort` | `categorySort` | Tile pool + category columns; "Place here" / remove / "Reset" / "Check sorting" |
| `gap` | `fillBlank` | Same as `typed` or `choice` depending on whether `options` array is non-empty |

### Quiz session active controls

| Button | Action | Effect |
|--------|--------|--------|
| Option buttons | `quiz-choice` | Submits answer, shows feedback |
| Check answer | `quiz-check-typed` | Submits typed answer |
| Check answer (gap) | `quiz-check-gap` | Submits gap fill answer |
| Gap MCQ options | `quiz-gap-choice` | Submits selected gap option |
| Tile (bank→answer) | `quiz-build-pick` | Moves tile to answer bar |
| Tile (answer→bank) | `quiz-build-return` | Returns tile to bank |
| Clear | `quiz-build-clear` | Resets tile build state |
| Hint | `quiz-build-hint` | Moves next correct tile to answer bar |
| Check answer (build) | `quiz-check-build` | Joins answer tiles, submits |
| Tap sequence item | `quiz-seq-select` | Selects/swaps sequence items |
| Shuffle | `quiz-seq-shuffle` | Re-shuffles sequence |
| Check order | `quiz-check-sequence` | Submits sequence order |
| Sort: tap tile | `quiz-sort-select-item` | Selects item for placement |
| Sort: Place here | `quiz-sort-place` | Places selected item in category |
| Sort: × (remove) | `quiz-sort-remove` | Returns placed item to pool |
| Sort: Reset | `quiz-sort-reset` | Clears all placements |
| Sort: Check sorting | `quiz-check-sort` | Evaluates all placements |
| Next question / Finish | `quiz-next` | Advances session or marks complete |
| Speak | `speak` | TTS for question's `speechText` |

### Quiz summary controls

| Button | Action | Effect |
|--------|--------|--------|
| Run again | `restart-quiz` | Re-runs same config |
| Review missed words | `quiz-review-missed` | Starts quiz on `session.missedWords` |
| Back to setup | `end-quiz` | Clears `runtime.currentQuiz` |

### Word mastery logic

A word is mastered when `progress.correct >= 3 && progress.streak >= 2`. Per-word progress is stored in `persisted.progress.words[wordId]` with fields `correct`, `wrong`, `streak`, `lastSeenAt`. `recordWordAnswer(state, wordId, wasCorrect)` in `storage.js` mutates this object.

---

## Tab: Crossword

**Route:** `persisted.activeTab === "crossword"`  
**Render functions:** `renderCrosswordTab()` (setup), `renderCrosswordGame()` (active game)  
**Data loading:** `loadVocabItems` → `crosswordEntriesFromWords` → `generateCrossword`

Builds a crossword grid from pack vocabulary. Clues are English definitions (`word.en`); answers are the study-language terms (`word.de` / `word.headword`). German diacritics are normalised: Ä→AE, Ö→OE, Ü→UE, ß→SS. Latin and other diacritics are stripped via NFD decomposition. Words shorter than 3 or longer than 24 characters are excluded from the pool.

The generator runs up to 80 attempts (120 during start) selecting random subsets of `wordCount` words, keeping the highest-scoring layout.

### Crossword setup controls

| Control | Type | Values | Prefs key | Effect |
|---------|------|--------|-----------|--------|
| Subject card grid | Card buttons | Subjects with vocab packs | `prefs.crossword.subject` | Resets dataset and game |
| Curriculum | Pill buttons | `all / ks3 / us-middle-school / other` + any pack-supplied (dynamic, via `listCurricula`) | `prefs.crossword.curriculum` | Narrows pack dropdown |
| Pack (`crossword-dataset`) | `<select>` | Vocab packs for subject+curriculum | `prefs.crossword.datasetId` | Resets game |
| Year (`crossword-year`) | `<select>` | `ALL / Y7…` | `prefs.crossword.year` | Language packs only |
| Stages fieldset | Checkboxes | Pack's `stageOptions` | `prefs.crossword.stages` | Stage-based packs |
| Words (`crossword-word-count`) | `<select>` | `10 / 12 / 15 / 20` (capped to available) | `prefs.crossword.wordCount` | Number of words to place |
| Word pool (`crossword-exclude-mastered`) | `<select>` | `true / false` | `prefs.crossword.excludeMastered` | Excludes mastered words from entry candidates |
| Start game | Button | — | — | Calls `startCrosswordGame()` |

### Crossword game controls

| Button | Action | Effect |
|--------|--------|--------|
| Check answers | `crossword-check` | Marks each cell correct/wrong (green/red), shows message |
| Reveal | `crossword-reveal` | Fills all cells with correct letters, shows answers in clue list |
| New game | `crossword-new` | Regenerates with same settings |
| Options | `crossword-options` | Returns to setup (clears `runtime.crossword`) |
| Cell input | `handleInput` | Normalises to uppercase, advances focus right on entry; arrow keys/backspace navigate |

### Crossword runtime state (`runtime.crossword`)

```
{
  dataset,       // selected dataset object
  datasetId,     // dataset.id string
  poolSize,      // count of valid crossword entries
  game,          // { grid, placedEntries } from generateCrossword
  letters,       // Record<"row:col", letter> — current user input
  checked,       // boolean — whether Check was pressed
  revealed,      // boolean — whether Reveal was pressed
  message,       // { tone: "good"|"bad", text: string }
}
```

---

## Tab: Reading

**Route:** `persisted.activeTab === "reading"`  
**Render function:** `renderReadingTab()` (async)  
**Data loading:** `listPassageGroups` → `loadPassagePack` → individual passage objects

Shows passage packs (packs with `capabilities: ["passages"]`). Grouped by passage group / book; individual pack selection only shown when a group has more than one pack.

The tab has two states: **setup** (`runtime.passages.started === false`) and **active reading session** (`runtime.passages.started === true`).

> **React app (current `ReadingPage.jsx`):** the active session is a split-panel
> "Context Viewer" — passage on the left, a sticky **one-question-at-a-time**
> panel on the right, with paragraph numbering and "Show evidence" jump links
> (`question.sourceRef`). For **language packs the primary passage is the
> source language** (e.g. German); the `prefs.passages.showGerman` checkbox
> (labelled "Show translation") reveals the English translation, and the audio
> button reads the source-language passage as a play/stop toggle. Questions are
> MCQ **or written** — open questions render a textarea; on reveal the student's
> answer is shown next to the model answer. Monolingual English packs are
> unaffected (`sourceText === targetText`).

### Reading setup controls

| Control | Type | Values | Prefs key | Effect |
|---------|------|--------|-----------|--------|
| Subject card grid | Card buttons | Subjects with passage groups | `prefs.passages.subject` | Resets group, pack, category, difficulty |
| Curriculum | Pill buttons | `all / ks3 / us-middle-school / other` + any pack-supplied (dynamic, via `listCurricula`) | `prefs.passages.curriculum` | Filters group dropdown |
| Book / Group (`passage-group`) | `<select>` | Passage groups for current subject | `prefs.passages.groupId` | Resets pack, category, difficulty |
| Set (`passage-pack`) | `<select>` | Packs within selected group (hidden when only 1 pack) | `prefs.passages.packId` | Resets category, difficulty |
| Category (`passage-category`) | `<select>` | `all` + unique topics from passages | `prefs.passages.category` | Filters passage list |
| Difficulty (`passage-difficulty`) | `<select>` | `all / easy / medium / hard` | `prefs.passages.difficulty` | Filters question visibility |
| Show source text | Checkbox | `true / false` | `prefs.passages.showGerman` | Whether source text is visible before reveal |
| Autoplay voice | Checkbox | `true / false` | `prefs.passages.voiceEnabled` | Whether TTS plays on passage start |
| Start reading practice | Button | — | — | Calls `startReadingSession()` |

### Reading session controls

| Button | Action | Effect |
|--------|--------|--------|
| Play source text | `play-passage` | Calls `speakText(passage.sourceText, speechLanguage)` |
| Stop audio | `stop-passage` | Calls `stopSpeaking()` |
| MCQ option buttons | `passage-choice` | Records selected option in `runtime.passages.answers` |
| Open text answer | `handleInput` | Writes to `runtime.passages.answers[questionId]` |
| Reveal translation + model answers | `reading-reveal` | Sets `runtime.passages.revealed = true`, records passage completion |
| Next passage | `reading-next` | Advances to next playable passage |
| Back to setup | `reading-reset` | Sets `runtime.passages.started = false` |

### Reading runtime state (`runtime.passages`)

```
{
  groupId, packId,
  allPassages,           // full loaded passage array
  playable,              // filtered by category/difficulty
  current,               // current passage object
  started,               // boolean
  revealed,              // boolean
  answers,               // Record<questionId, string>
  completedThisSession,  // number
  categoryOptions,       // string[] for category dropdown
}
```

---

## Tab: Builder

**Route:** `persisted.activeTab === "builder"`  
**Render function:** `renderBuilderTab()` (async)  
**Data loading:** `loadSentenceBuilderPack(manifest, packId)` → array of `sentenceBuilder` items

Independent tile-drag drill. Loads from `sentenceBuilderPacks` in manifest (separate from `packs`). Progress tracked separately in `persisted.progress.builderStats[packId]`.

### Builder controls

| Control | Type | Values | Prefs key | Effect |
|---------|------|--------|-----------|--------|
| Subject card grid | Card buttons | Subjects with builder packs | `prefs.builder.subject` | Resets pack to first match |
| Curriculum | Pill buttons | `all / ks3 / us-middle-school / other` + any pack-supplied (dynamic, via `listCurricula`) | `prefs.builder.curriculum` | Narrows pack dropdown |
| Pack (`builder-pack`) | `<select>` | Builder packs for current subject+curriculum | `prefs.builder.packId` | Loads new builder pack |
| Filter (`builder-filter`) | `<select>` | `all / key_date / key_term / example_sentence` | `prefs.builder.filter` | Filters cards by `card.type` field |
| Tile (bank→answer) | `builder-pick` | — | — | Moves tile from bank to answer bar |
| Tile (answer→bank) | `builder-return` | — | — | Returns tile to bank |
| Clear | `builder-clear` | — | — | Returns all answer tiles to bank |
| Hint | `builder-hint` | — | — | Moves next correct tile to answer bar |
| Check | `builder-check` | — | — | Compares joined answer tiles to `card.answer`; records in builderStats |
| Next | `builder-next` | — | — | Advances to next card (marks skip if not correct) |

### Builder runtime state (`runtime.builder`)

```
{
  packId,          // currently loaded pack
  filter,          // current filter value
  cards,           // filtered card array
  cardIndex,       // current card index
  currentCard,     // current sentenceBuilder card { type, prompt, answer, tiles, level }
  answerTiles,     // tiles in answer bar
  bankTiles,       // tiles in bank
  feedback,        // null | { tone, title, body }
}
```

---

## Tab: Arcade (React only)

**Route:** `activeTab === "arcade"` → `src/react/games/arcade/ArcadeGamePage.jsx`
**Engine:** lightweight React + `requestAnimationFrame` (no Canvas, no game library)

"FoxChild Arcade" turns existing packs into a PacMan/Snake-style game. It reuses
the unified schema and normalised loaders — no new content system. Full
architecture: `docs/REACT_ARCHITECTURE.md` §16.

### Setup controls

| Control | Values | Pref |
|---|---|---|
| Game mode | Quiz Hunt 🦊 / Sentence Snake 🐍 | `prefs.arcade.mode` |
| Subject | `SubjectCardGrid` (counts per mode) | `prefs.arcade.subject` |
| Curriculum | dynamic (`listCurricula`) | `prefs.arcade.curriculum` |
| Pack | vocab dataset (Quiz Hunt) / builder pack (Snake) | `prefs.arcade.datasetId` / `packId` |
| Map | Open field / Pillars | `prefs.arcade.mapType` |
| Challenge | 20 / 40 / 60 questions · 5-minute rush · Endless | `prefs.arcade.goal` |
| Sound | on/off (muteable WebAudio blips) | `prefs.arcade.sound` |

### Modes

- **Quiz Hunt** — built from a vocab pack via `gameQuestionAdapter`. The HUD shows
  the prompt (English/definition); the fox must eat the correct term token and
  avoid distractors (wrong = lose a life + brief freeze + combo reset). Always 3
  lives.
- **Sentence Snake** — built from a `sentenceBuilder` pack. The snake must eat the
  sentence's word tokens **in order** (it grows as it builds the sentence);
  out-of-order or decoy words cost a life. Multilingual and subject-agnostic.

### Controls & gameplay

- **Move:** swipe (touch), arrow keys / WASD (desktop), or the on-screen D-pad.
  Pause: Esc/P or the ⏸ button. The player **stands still after eating** a token —
  give a fresh input to move again.
- **Tokens** can span several cells (wide horizontal, or rotated 90° vertical for
  long words). Collision is coverage-based (you only eat a word when ≥50% under
  the pill); placement reserves each word's footprint so pills never overlap.

### Progress

- Per-answer correctness feeds the existing word mastery (`progress.words`).
- Round bests are stored in `progress.arcadeStats[mode]` (`recordArcadeResult`).
- All persisted through `ProgressContext.updateProgress` (RC15) — `prefs.arcade`
  and progress share one stored-state write.

---

## Tab: Review

**Route:** `persisted.activeTab === "review"`  
**Render function:** `renderReviewTab()` (async)  
**Data loading:** `loadVocabItems` filtered to words with any quiz history

Shows two columns: "Needs review" (top 12 by wrong-minus-correct score) and "Mastered" (up to 12 mastered words). Each card shows the term, translation, correct/wrong counts, and a Speak button.

### Review controls

| Control | Type | Values | Prefs key | Effect |
|---------|------|--------|-----------|--------|
| Dataset (`review-dataset`) | `<select>` | All datasets (flat, no subject filter) | `prefs.review.datasetId` | Loads word progress for that dataset |
| Quiz hardest words | Button | — | — | Calls `startQuiz(hardest, "Hardest words review")` |
| Review mastered words | Button | — | — | Calls `startQuiz(mastered, "Mastered words refresh")` |
| Speak (per card) | Button | — | — | TTS for `word.de` |

Note: Review uses `renderDatasetSelect` which shows **all** datasets regardless of subject — no subject filter card here.

---

## Study Book Drawer (global overlay)

**Not a tab.** A persistent right-side drawer (desktop) or bottom sheet (mobile) that can be opened from any tab. Managed by `src/study-book.js` + the Study Book block in `main.js`.

**Mount point:** `<div id="study-book-root">` in `index.html`, a sibling of `<main id="app">`. The drawer is rendered imperatively into this element and never destroyed by `renderApp()`.

**Entry point:** `openStudyBook(datasetId, { anchor, mdPath })` — the single function called from all tabs and quiz questions. Loads markdown, renders it, and opens the drawer.

**Trigger button factory:** `renderStudyBookButton(dataset, opts)` — returns a ghost button only when `datasetHasStudyBook(dataset)` is true. Tabs call this helper with one line; no tab contains its own open logic.

### When the button appears

The 📖 Study Book button is injected into the chip row of:
- **Quiz setup** — beside Start quiz
- **Quiz active question** — in the question sideContent chip row (shows "Jump to [heading]" when `question.sourceRef` is present)
- **Vocabulary** — in the header chip row
- **Reading setup** — beside Start reading practice
- **Builder** — in the header chip row
- **Review** — in the header chip row

The button renders nothing for packs without `contentMdPath` / `extraMdFiles` in the manifest — no conditional logic in the tab renderers.

### Study Book runtime state (`runtime.studyBook`)

```
{
  open: boolean,          // whether the drawer is visible
  datasetId: string|null, // which pack's notes are loaded
  activeFile: string|null,// path of the .md file currently shown
  markdown: string|null,  // raw markdown string
  html: string|null,      // sanitized rendered HTML (from renderMarkdown)
  toc: [                  // table of contents extracted from headings
    { level: 1|2|3, text: string, anchor: string }
  ],
  currentAnchor: string|null, // id of the TOC heading currently in view
  scrollTop: number,          // content scroll position — restored on re-render
  searchQuery: string,        // live search text
  searchMatches: number,      // total match count for current query
  searchMatchIndex: number,   // index of the currently-highlighted match (0-based)
  pendingAnchor: string|null, // anchor to jump to after open
}
```

This state is **never written to `localStorage`**. It resets on every page load.

### Study Book data flow

```
openStudyBook(datasetId, { anchor, mdPath })
  → findDataset(manifest, datasetId)
  → getStudyBookFiles(dataset) — returns [{ title, path }] from contentMdPath + extraMdFiles
  → loadMarkdownFile(path)     — fetches .md, caches in mdCache (Map)
  → extractTOC(raw)            — parses headings into toc[]
  → renderMarkdown(raw)        — marked.parse() → DOMPurify.sanitize() → sanitized HTML
  → runtime.studyBook updated
  → renderStudyBookDrawer()
  → scrollToStudyBookAnchor(anchor) if anchor provided
```

### Search behaviour

Typing ≥ 2 characters in the search box:
1. `highlightMatches(html, query)` wraps each match in `<mark class="sb-highlight">`
2. The drawer re-renders showing the highlighted HTML
3. `scrollToSearchMatch(0)` jumps to the first match, adding `sb-highlight-active` class
4. ↑ / ↓ nav buttons cycle through matches; counter shows `X / N`
5. Clearing the query restores the previous scroll position

### Cross-reference (quiz questions)

Quiz question objects may optionally carry a `sourceRef`:

```json
{
  "sourceRef": {
    "mdFile":  "study_notes.md",
    "heading": "Binary Search",
    "anchor":  "binary-search"
  }
}
```

When present, `renderQuizSession` renders a "Jump to [heading]" button instead of the generic Study Book button. Clicking it calls `openStudyBook(datasetId, { anchor, mdPath })` and scrolls directly to that section with a flash animation.

### Study Book controls

| Control | `data-sb-action` | Effect |
|---------|-----------------|--------|
| Close (✕) | `close` | Hides drawer, removes `sb-split-mode` |
| Split view (⊞) | `toggle-split` | Toggles `body.sb-split-mode`; pushes `#app` margin right |
| TOC link | `toc-jump` | Smooth-scrolls content to heading; flashes target |
| File tab | `switch-file` | Loads a different `.md` file for the same pack |
| ↑ prev match | `search-prev` | Goes to previous search match (wraps) |
| ↓ next match | `search-next` | Goes to next search match (wraps) |
| Scrim click | `close` | Same as close button |
| Escape key | `handleKeyDown` | Closes drawer if open |
| Resize handle | drag | Resizes drawer width (desktop only, 280–760 px) |

### `src/study-book.js` exports

| Function | Purpose |
|----------|---------|
| `loadMarkdownFile(path)` | Fetch + cache raw markdown. Throws on HTTP error. |
| `loadContentMarkdown(dataset)` | Convenience: reads `dataset.contentMdPath`, returns null if absent |
| `renderMarkdown(raw)` | `marked.parse` → `DOMPurify.sanitize` with a safe tag allowlist |
| `extractTOC(raw)` | Regex scan of `# / ## / ###` headings → `{ level, text, anchor }[]` |
| `highlightMatches(html, query)` | Wraps query matches in `<mark class="sb-highlight">`. Returns `{ html, count }` |
| `datasetHasStudyBook(dataset)` | Returns true if `contentMdPath` or `extraMdFiles` is present |
| `getStudyBookFiles(dataset)` | Returns ordered `[{ title, path }]` for all .md files on the dataset |

All markdown is cached in module-level `mdCache` (`Map<path, string>`), mirroring `jsonCache` in `data.js`.

---

## Tab: About

**Route:** `persisted.activeTab === "about"`  
**Render function:** `renderAboutTab()` (async)

Static informational page only. No controls. Describes the project purpose: AI-assisted local-first revision platform for KS3–KS4 students and families. Includes an image link to `./brand/learning-web-overview.png`.

---

## Tab: Admin

**Route:** `persisted.activeTab === "admin"`  
**Render function:** `renderAdminTab()` (sync)

Three sections:

### Progress Management section

- Shows top 20 most-struggled words (by `wrong - correct`) in a table with per-word Reset buttons.
- Buttons: "Clear all sessions" (calls `clearAllSessions`), "Reset all word progress" (calls `clearAllWordProgress`).
- Per-word Reset: `admin-reset-word` → `resetWordProgress(persisted, wordId)`.

### Pack Admin section

- Drag-and-drop / click upload for `pack_unified.json` files.
- File input: `#admin-file-upload` — handled by `handleAdminFileUpload(file)`.
- Upload flow: JSON parse → `validatePack(parsed)` (in `admin-storage.js`) → `saveUploadedPack(parsed, filename)` → `hydrateManifest(manifest, registerPackInCache)` — pack is immediately available in all tabs.
- Upload status banner (`runtime.adminUploadStatus`) shows success or error.

### Uploaded Packs section

- Lists packs saved to browser storage by `saveUploadedPack`.
- Each card shows: displayName, id, item type chips, section chips, subject, item count, file size, date added.
- Delete button: `admin-delete-pack` → `deleteUploadedPack(packId)` then reloads manifest.

### Admin buttons

| Button | Action | Effect |
|--------|--------|--------|
| Clear all sessions | `admin-clear-sessions` | Confirms, calls `clearAllSessions` |
| Reset all word progress | `admin-clear-words` | Confirms, calls `clearAllWordProgress` |
| Reset (word row) | `admin-reset-word` | Calls `resetWordProgress` for that word ID |
| Delete (pack card) | `admin-delete-pack` | Confirms, deletes uploaded pack, reloads manifest |
| File drop / click | `admin-file-upload` change | Triggers `handleAdminFileUpload` |

---

## Subject system

### Defined in `data.js`

```javascript
export const SUBJECTS = ["language", "history", "geography", "science", "literature", "computing", "other"];
```

`SUBJECT_LABELS` in `main.js` maps each to a display label and emoji icon.

### `getDatasetSubject(dataset)` / `inferSubject(dataset)`

Returns the subject for a dataset. Priority:
1. Explicit `dataset.subject` field if it matches `SUBJECTS`
2. ID-string pattern matching (e.g. `includes("geography")`, `includes("history")`)
3. Source-language code heuristic (`LANGUAGE_HINT_CODES = ["de", "fr", "es", "it", "la", …]`)
4. Falls back to `"other"`

This function is called everywhere subject matters — **never derive subject from a hardcoded pack ID**.

### Per-tab subject behaviour

| Subject | Direction toggle | Vocab PoS filter | Vocab categories | Stage checkboxes |
|---------|-----------------|-------------------|------------------|-----------------|
| `language` (German-style) | Yes | Yes | Checkboxes (topics) | No |
| `language` (Latin/stage-based) | Yes | Yes | No | Yes |
| `literature` | No | No | Type dropdown (`cat:*` tags) | No |
| `history / geography / science` | No | No | No | No |

`usesStageSelection(dataset)` returns `true` when `dataset.stageOptions.length > 0` — this switches year filter to stage checkboxes in Vocab, Quiz, and Crossword tabs.

---

## Curriculum system

### Defined in `data.js`

```javascript
// Built-in seed list — always offered. NOT an exhaustive enum.
export const CURRICULUMS = ["ks3", "us-middle-school", "other"];
export const CURRICULUM_LABELS = { ks3: "KS3 (UK)", "us-middle-school": "US Middle School", other: "Other" };

export function normalizeCurriculum(value)        // "AQA GCSE" -> "aqa-gcse"
export function curriculumLabel(slug, rawValue)   // display text for a slug
export function listCurricula(manifest)           // built-ins + pack-discovered
```

Curricula are **dynamic**, not a fixed enum. Curriculum pills appear in Vocab, Quiz, Crossword, Builder, and Reading tabs and are built from `listCurricula(manifest)` — the built-in seed list **plus** any curriculum value found on packs / passage groups / builder packs in the manifest (including uploaded packs). Selecting a curriculum filters the pack/group dropdown to matching packs. "All" shows all curricula.

`getDatasetCurriculum(dataset)` / `inferCurriculum(dataset)` checks the explicit `dataset.curriculum` field first and **preserves any value** as its own normalised slug (via `normalizeCurriculum`) — unknown values are no longer collapsed to `"other"`. Only when there is no explicit value does it fall back to ID prefix (`usmsg_`, `ks3_`, `y7_`/`y8_`/`y9_`), then `"other"`.

> ⚠ Build curriculum dropdowns with `listCurricula(manifest)`, never a static `CURRICULUMS.map(...)` — see caution A18 in `AI_UI_IMPLEMENTATION_CAUTIONS.md`.

---

## localStorage state structure

Storage key: `learningGermanWeb.v1`

`loadStoredState()` deep-merges `DEFAULT_STATE` with stored JSON so new keys always have defaults.

```
{
  activeTab: string,          // "home" | "vocab" | "quiz" | ...
  prefs: {
    vocab: {
      datasetId,              // pack id, default: "core"
      subject,                // "language"
      curriculum,             // "all"
      year,                   // "ALL"
      stages,                 // [] (all stages for stage packs)
      search,                 // ""
      partOfSpeech,           // "" = all
      category,               // "" (literature Type dropdown)
      categories,             // [] = all (language category checkboxes)
    },
    quiz: {
      subject,                // "language"
      curriculum,             // "all"
      direction,              // "studyToTarget"
      answerMode,             // "mixed"
      datasetId,              // "core"
      year,                   // "Y7"
      stages,                 // []
      excludeMastered,        // true
      questionCount,          // 18
      modes,                  // legacy safety net array
    },
    crossword: {
      subject,                // "language"
      curriculum,             // "all"
      datasetId,              // "core"
      year,                   // "ALL"
      stages,                 // []
      excludeMastered,        // true
      wordCount,              // 10
    },
    builder: {
      packId,                 // first builder pack id
      filter,                 // "all"
      subject,                // "history"
      curriculum,             // "all"
    },
    passages: {
      subject,                // ""
      curriculum,             // "all"
      groupId,                // first passage group id
      packId,                 // first pack in group
      category,               // "all"
      difficulty,             // "all"
      showGerman,             // false
      voiceEnabled,           // true
    },
    review: {
      datasetId,              // "core"
      sort,                   // "needsReview"
    },
    promptBuilder: {
      // AI Pack Creator form (subject, topic, level, curriculum, itemTypes, …)
      promptTemplate,         // "standard" | "lit-11plus" | "gcse-science" | … (promptConfigs.js)
      tourSeen,               // false — guided-tour hint flag
    },
    arcade: {                 // FoxChild Arcade (arcade tab)
      mode,                   // "quiz-hunt" | "snake-builder"
      subject,                // "language"
      curriculum,             // "all"
      datasetId,              // quiz-hunt source (revision dataset), "core"
      packId,                 // snake-builder source (sentenceBuilder pack)
      mapType,                // "open" | "pillars"
      goal,                   // "q20" | "q40" | "q60" | "time5" | "endless"
      sound,                  // true
    },
  },
  progress: {
    words: {
      [wordId]: { correct, wrong, streak, lastSeenAt }
    },
    sessions: [
      {
        id, label, timestamp, score, totalQuestions,
        datasetId, scopeLabel, year, config,
        answers: [ { prompt, expected, userAnswer, correct, wordId?, speechText?, speechLanguage? } ]
      }
    ],  // capped at 50 sessions; each session's answers capped at 60
    builderStats: {
      [packId]: { totalAttempted, totalCorrect, streak, perCardAttempts: { [cardId]: count } }
    },
    passageStats: {
      [packId]: { passagesCompleted }
    },
    arcadeStats: {            // FoxChild Arcade bests, keyed by mode
      [mode]: { plays, bestScore, bestStreak, lastPlayedAt }
    },
  }
}
```

**Rule:** every new `prefs.*` key read anywhere in the codebase must have a matching entry in `DEFAULT_STATE` in `storage.js`. `mergeState` will assign `undefined` to keys absent from `DEFAULT_STATE` when old stored state is loaded.

---

## Data loading pipeline

```
loadManifest()
  → manifest.json (cached in jsonCache)
    → listDatasets(manifest)         — all packs with "revision" capability
    → listPassageGroups(manifest)    — all packs with "passages" capability
    → listSentenceBuilderPacks(manifest) — sentenceBuilderPacks array

loadVocabItems(manifest, datasetId)
  → loadUnifiedPack(manifest, datasetId) → fetchJson(pack.unifiedPath)
    → filterUnifiedItems(pack, "vocab")
    → .map(item => vocabFromItem / custom inline mapping in loadVocabItems)
    → returns flat word objects: { id, de, en, pos, gender, plural, exampleDe, exampleEn, topic, tags, level, stage, categories, ... }

loadUnifiedPack(manifest, datasetId)
  → fetches pack.unifiedPath, returns full pack JSON including all item types

filterUnifiedItems(pack, type)
  → pack.items.filter(item => item.type === type)
```

Key mapping in `loadVocabItems`:
- `word.de` ← `translations[srcCode]` → `sourceWord` → `data.de`
- `word.en` ← `translations[tgtCode]` → `targetWord` → `data.en`
- `word.exampleDe` ← only set when `srcCode !== tgtCode` (prevents double-render on en-GB packs)
- `word.stage` ← `parseInt(item.level.replace("Stage ", ""))` (for Cambridge Latin)
- `word.categories` ← `item.topics` (the full array)

---

## Quiz engine pipeline

```
startQuiz()
  → loadVocabItems → filterWordsForScope → words
  → loadSentencePools → sentencePools
  → loadUnifiedPack → unifiedPack
  → loadPassageUnifiedPack (literature only) → passageUnifiedPack
  → resolveQuizModesForUI({ subject, direction, answerMode, fillBlankCount, vocabCount }) → modeIds[]
  → createQuizSession({ words, sentencePools, config: { ...prefs, modes: modeIds }, dataset, unifiedPack, ... })
      → for each active mode: generate question group (distribute questions across modes)
      → interleave groups (one from each mode in rotation)
      → returns session { id, label, questions[], index, score, answers[], buildState }
```

### Question object standard fields

```
{
  id, modeId, modeTitle, kind,       // "choice"|"typed"|"build"|"sequence"|"sort"|"gap"
  prompt, answer, acceptedAnswers,
  options,                           // MCQ options (choice/gap)
  tiles,                             // sentence build tiles
  wordId,                            // for progress tracking
  topic,                             // shown as amber badge
  pos,                               // shown as blue badge (language packs)
  subtitle,                          // stage_label · topic
  speechText, speechLanguage,
  stimulus,                          // optional { type, title, content, ... }
}
```

### Stimulus types (optional context block rendered above question)

| `stimulus.type` | Rendered as |
|----------------|-------------|
| `asciiDiagram` / `mapExtract` | `<pre>` monospaced diagram + optional `<ul>` key |
| `sourceExtract` / `source_extract` | `<blockquote>` |
| `table` / `dataTable` / `data_table` | HTML `<table>` with optional headers |
| anything else with `.content` | `<p>` pre-wrapped text |

---

## Crossword engine

`crossword.js` exports three functions:

- `normalizeCrosswordAnswer(value)` — uppercases, replaces Ä/Ö/Ü/ß, strips all non-alphanumeric.
- `crosswordEntriesFromWords(words)` — maps vocab words to `{ id, answer, clue, displayAnswer, topic }`. Filters: answer length 3–24, deduplicates by normalised answer.
- `generateCrossword(entries, { wordCount, attempts, gridSize })` — runs up to `attempts` (default 80) layout attempts, returns best-scoring `{ grid, placedEntries }`. Scoring: `placed_count * 1000 - grid_area + filled_cells`. Grid size: `max(17, min(25, wordCount + 7, longest + 4))`.

Placed entries carry `{ answer, clue, displayAnswer, row, col, direction, number }`. `number` is assigned after placement in reading order (top-to-bottom, left-to-right start positions).

---

## Render helper functions

| Helper | Purpose |
|--------|---------|
| `renderSubjectCardGrid(active, action)` | Subject card grid (Vocab/Quiz tabs) |
| `renderCrosswordSubjectCardGrid(active)` | Subject card grid (Crossword tab) |
| `renderBuilderSubjectCardGrid(active)` | Subject card grid (Builder tab) |
| `renderPassageSubjectCardGrid(active)` | Subject card grid (Reading tab) |
| `renderCurriculumPills(active, action)` | Curriculum pill row (all tabs) |
| `renderDatasetSelectFiltered(id, value, subject, curriculum)` | Pack `<select>` filtered by subject+curriculum |
| `renderCrosswordDatasetSelect(value, subject, curriculum)` | Pack `<select>` for crossword (vocab packs only) |
| `renderBuilderPackSelectFiltered(value, subject, curriculum)` | Pack `<select>` for builder |
| `renderDirectionToggle(dataset, direction)` | Language direction pills (language packs only) |
| `renderAnswerModePills(current)` | MCQ/Typed/Mixed mode pills |
| `renderYearSelect(id, value, dataset)` | Year `<select>` |
| `renderStageFieldset(key, stageOptions, selectedStages)` | Stage checkboxes |
| `renderCategoryFieldset(key, cats, selected)` | Category checkboxes (German vocab) |
| `renderSelectField(id, label, options, current)` | Generic `<select>` |
| `renderQuestionBox({ eyebrow, modeLabel, prompt, subtitle, meta, sideContent })` | Shared question prompt box |
| `renderFeedbackBanner({ tone, title, body, extra })` | Feedback banner (correct/wrong/info) |
| `renderStimulus(stimulus)` | Optional stimulus block above question |
| `renderEmptyStateCard({ eyebrow, title, body, actionLabel, action })` | Empty state placeholder |
| `foxFace(expression)` | Returns `<img>` for fox mascot (calm/happy/sad/thinking) |
| `renderStudyBookButton(dataset, opts)` | Study Book trigger button — returns `""` when pack has no markdown |
| `buildStudyBookHTML()` | Builds complete drawer HTML from `runtime.studyBook` state |
| `renderStudyBookDrawer()` | Writes drawer HTML to `#study-book-root` and attaches listeners |
| `openStudyBook(datasetId, opts)` | Opens the drawer, loads markdown if needed, jumps to anchor |
| `scrollToStudyBookAnchor(anchor)` | Smooth-scrolls to a heading and flashes it |
| `scrollToSearchMatch(index)` | Scrolls to the nth search highlight mark |

---

## Key gotchas

1. **`DEFAULT_STATE` is mandatory for every new prefs key.** `mergeState` silently leaves missing keys as `undefined` for users with existing localStorage. Any new `prefs.*` field read in the code must be added to `storage.js:DEFAULT_STATE`.

2. **`resolveQuizModesForUI` is the UI→engine adapter.** The legacy `prefs.quiz.modes` array is overwritten at session start by `resolveQuizModesForUI`. Do not try to control question types by editing `prefs.quiz.modes` directly from the UI — edit `direction` / `answerMode` / `subject` instead.

3. **`exampleDe` must be null when `srcCode === tgtCode`.** Non-language packs (geography, history, science) have both language codes set to `en-GB`. If `exampleDe` is populated for these packs, the example sentence renders twice on vocab cards.

4. **`filterWordsForScope` skips year filtering for non-language subjects.** Non-language packs use level strings like `"KS3 / Year 7"` which don't match Y-year filters. The function only applies year filtering when `getDatasetSubject(dataset) === "language"`.

5. **Stage packs replace year with checkboxes everywhere.** `usesStageSelection(dataset)` checks `dataset.stageOptions.length > 0`. When true: year selects are hidden, stage checkboxes appear in Vocab, Quiz, and Crossword tabs, and `filterWordsForScope` filters by `word.stage` instead of `word.level`.

6. **`prefs.quiz.subject` and the dataset subject can drift.** After a `quiz-dataset` change, both are synced. But on tab switch the code explicitly checks: `if (datasetSubject !== prefs.subject) prefs.subject = datasetSubject`. Treat `prefs.subject` as a hint for the subject card highlight, not as the authoritative subject — always call `getDatasetSubject(dataset)` to get the real subject.

7. **Pack not in manifest = invisible.** A `pack_unified.json` that exists on disk but has no entry in `data/generated/manifest.json` (or lacks the `"revision"` / `"passages"` capability) is never loaded. After adding a pack file, always register it in the manifest.

8. **`generated_packs/` is gitignored — never commit from there.** Pack drafts must be moved to `data/Packs/<curriculum>/<subject>/<id>/pack_unified.json` and registered in the manifest before they work.

9. **`listDatasets` includes both `manifest.core` and `manifest.packs` with `capabilities: ["revision"]`** — but `listPassageGroups` uses `capabilities: ["passages"]`. A pack can have both capabilities and appear in both systems.

10. **Category checkboxes default to all-selected when `prefs.vocab.categories` is empty (`[]`).** `getSelectedCategories` returns all category options when the stored array is empty. Deselecting the last checkbox is prevented by the handler. When switching packs or subjects, always reset `prefs.vocab.categories = []` to restore the "all selected" default — three places in click handlers do this and they must all be kept in sync.

11. **`partOfSpeech` abbreviations are legacy.** `POS_LABELS` in `main.js` maps single-letter abbreviations (`n`, `v`, `a`, etc.) to display labels. New packs must use full English words (`noun`, `verb`, `adjective`, etc.) for language packs or `"keyword"` for non-language packs. The `POS_LABELS` map is a safety net only.

12. **The crossword requires ≥ 5 candidate entries.** `startCrosswordGame` checks `entries.length < 5` and shows an error if so. Small packs, heavy mastery filtering, or narrow stage selection can cause this. The "Start game" button is disabled when `entries.length < 5`.

13. **Study Book drawer survives `renderApp()`.** It is mounted in `#study-book-root`, a sibling of `#app`, so full-page re-renders never destroy it. `renderStudyBookDrawer()` is called independently of `renderApp()` — never merge Study Book rendering into the main render cycle.

14. **Study Book state is runtime-only — never add to `DEFAULT_STATE`.** `runtime.studyBook` is ephemeral session UI state. It must not be written to `localStorage`. There is no `prefs.studyBook` key.

15. **`renderStudyBookButton` returns `""` silently for packs without markdown.** Do not add `if (datasetHasStudyBook(dataset))` guards around calls to `renderStudyBookButton` — the function handles that itself. Just call it and interpolate the result.
