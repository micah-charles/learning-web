# Learning Web — React App Architecture

> **For AI agents working on any UI task.** Read this before touching any React file.
> Last updated: 2026-05-25 · Covers the state after PR #114 (merged).

---

## 1. Bird's-eye view

```
index.html          ← single HTML page; mounts <div id="root">
src/react/main.jsx  ← ReactDOM.render(<App />) entry point
src/react/App.jsx   ← providers wrap + tab router + StudyBookDrawer
```

The app is a **React 18 + Vite** shell over a **vanilla JS engine**. All
quiz logic, data loading, storage, and progress tracking live in vanilla
ES modules (`src/*.js`). React only handles rendering and user interaction.

**No Redux, no React Router, no global state libraries.**
Tab state = `useState` in `AppContent`. All persistent data = `localStorage`
via `ProgressContext`.

---

## 2. Provider tree (App.jsx)

```
<ManifestProvider>          ← loads manifest.json once; exposes useManifest()
  <ProgressProvider>        ← loads/saves localStorage; exposes useProgress()
    <StudyBookProvider>     ← Study Book drawer state; exposes useStudyBook()
      <AppContent>          ← tab router + Hero + NavBar
        <StudyBookDrawer /> ← fixed overlay; rendered ONCE here so it
      </AppContent>           survives tab switches
    </StudyBookProvider>
  </ProgressProvider>
</ManifestProvider>
```

### ManifestContext (`src/react/context/ManifestContext.jsx`)
- Fetches `data/generated/manifest.json` once on mount.
- Calls `hydrateManifest(manifest, registerPackInCache)` so uploaded packs (from My Packs) are injected into the live manifest.
- Exposes `{ manifest, loading, rehydrate }`.
- `rehydrate()` must be called after every upload/delete in MyPacksPage — it shallow-clones the manifest to trigger re-renders.

### ProgressContext (`src/react/context/ProgressContext.jsx`)
- Loads `loadStoredState()` on mount; saves via `saveStoredState()` on every mutation.
- Exposes `{ progress: storedState, updateProgress }`.
- **`progress` is the FULL stored-state `{ prefs: {}, progress: { words: {}, sessions: [], attemptEvents: [] } }`** — never unwrap to `progress.progress` before passing to storage helpers.
- `updateProgress(fn)` calls `setState(prev => { fn(structuredClone(prev)); ... })`. The mutation function `fn` receives the full cloned state and mutates it in place.

### StudyBookContext (`src/react/context/StudyBookContext.jsx`)
- Manages Study Book drawer state: `open`, `html`, `toc`, `searchQuery`, `splitMode`, etc.
- `openBook(dataset, { anchor, mdPath })` — loads markdown via `loadMarkdownFile` (cached), parses TOC, renders HTML.
- `closeBook()`, `toggleSplit()`, `switchFile()`, `setSearchQuery()`.
- A `stateRef` mirrors state for use inside `async` callbacks (avoids stale closures).

---

## 3. Tab routing (App.jsx — AppContent)

```jsx
const [activeTab, setActiveTab] = useState("home");

// Tabs (NavBar shows the main ones; ai-prompt is reached from My Packs / Hero):
home | language | quiz | arcade | vocab | reading | builder | crossword |
  progress | mypacks | about | ai-prompt

// Each tab conditionally renders its page:
{activeTab === "quiz" && <QuizPage initialCustomWords={quizCustomWords} />}
{activeTab === "arcade" && <ArcadeGamePage />}
{activeTab === "ai-prompt" && <AIPromptBuilder onNavigate={handleNavigate} />}
```

**Session tabs** (`quiz`, `reading`, `builder`, `language`, `crossword`): re-clicking the active tab shows a confirm dialog ("Restart?"). The tab is briefly set to `"__reset__"` then back to force a remount.

**Cross-tab navigation**: `handleNavigate(tab, opts)` — used by HomePage to launch a quiz with custom words (`opts.customWords`).

---

## 4. Page inventory

| Tab ID | Page file | Key data | Study Book |
|--------|-----------|----------|------------|
| `home` | `HomePage.jsx` | `getDashboardSummary`, recent activity | — |
| `language` | `LanguagePage.jsx` | vanilla `progressive-language-lesson.js` via `dangerouslySetInnerHTML` | — |
| `quiz` | `QuizPage.jsx` | `useQuizSession`, `findDataset` | ✓ next to Start quiz |
| `arcade` | `games/arcade/ArcadeGamePage.jsx` | `useArcadeContent` (vocab/builder packs), `recordArcadeResult` | — |
| `vocab` | `VocabPage.jsx` | `useVocabBrowser`, `listDatasets` | — |
| `reading` | `ReadingPage.jsx` | `useReadingSession`, `listPassageGroups` | ✓ next to Start reading |
| `builder` | `BuilderPage.jsx` | `useBuilderSession`, `listSentenceBuilderPacks` | ✓ in stats row |
| `crossword` | `CrosswordPage.jsx` | vanilla `crossword.js` via `dangerouslySetInnerHTML` | — |
| `progress` | `ProgressPage.jsx` | `getDashboardSummary`, `getRecentActivity`, `SnapshotCard` stat row | — |
| `mypacks` | `MyPacksPage.jsx` | `usePackLoader`, `rehydrate` | — |
| `about` | `AboutPage.jsx` | static content | — |
| `ai-prompt` | `AIPromptBuilder.jsx` | prompt templates (`promptConfigs.js`), guided tour | — |

---

## 5. Hooks

### `useQuizSession` (`hooks/useQuizSession.js`) ★ CRITICAL
- Manages the full quiz lifecycle: load → question → answer → next → complete.
- Uses a `sessionRef` (mirrors session state) so side-effect callbacks (`updateProgress`, `recordAttempt`) are called **outside** React state updaters — avoids React 18 StrictMode double-invocation.
- Exposes: `{ session, loading, error, startQuiz, answerQuestion, nextQuestion, updateBuildState, resetQuiz }`.
- `answerQuestion` calls both `recordWordAnswer` (mastery) and `recordAttempt` (Recent Activity chart) on every answer.
- `nextQuestion` calls `recordQuizSession` with a `timestamp` field when the quiz completes.

### `useReadingSession` (`hooks/useReadingSession.js`)
- Loads passages via `loadPassagePack(manifest, groupId, packId)`.
- Manages: `deck` (shuffled playable passages), `currentIndex`, `answers`, `revealed`.
- `nextPassage()` calls `recordPassageCompletion` (passage stats only — does NOT write to Recent Activity).
- Exposes: `{ passages, loading, started, current, deck, currentIndex, answers, revealed, completedCount, message, categoryOptions, startSession, answerQuestion, revealPassage, nextPassage, resetSession, jumpToPassage }`.

### `useBuilderSession` (`hooks/useBuilderSession.js`)
- Loads sentence builder cards via `loadBuilderPack`.
- Manages: `cards`, `index`, `tiles` (placed/answer), `feedback`, `stats`.
- Exposes: `{ currentCard, cards, index, tiles, feedback, loading, stats, pickTile, returnTile, clearTiles, hintTile, checkAnswer, nextCard, jumpToCard }`.

### `useVocabBrowser` (`hooks/useVocabBrowser.js`)
- Loads all vocab items for a dataset; applies filters (POS, category, stage, search).
- Exposes: `{ allWords, scopedWords, filtered, loading, posOptions, categoryOptions }`.

### `useSpeech` (`hooks/useSpeech.js`)
- Thin wrapper around `speakText` / `stopSpeaking` from `utils.js`.
- Default lang is `"en-GB"` (not `"de-DE"` — callers must pass the correct speech language).
- Exposes: `{ speak, stop }`.

### `usePackLoader` (`hooks/usePackLoader.js`)
- Generic pack loader; used by MyPacksPage.
- Also exports standalone `useManifest()` and `usePackList()` — but prefer `ManifestContext.useManifest()` in most pages.

---

## 6. Components

### Layout components (`components/layout/`)

#### `Hero.jsx`
- Renders the watercolour banner: mascot image (with Facebook social badge overlay), logo, tagline, and stat chips (packs/reading groups/builder sets).
- **No stat row in Hero** — stat cards (words seen, mastered, quiz sessions, last quiz score) were moved to `ProgressPage.jsx` (`SnapshotCard` component) in PR #114.
- `variant` prop (`"standard"` by default) sets a modifier class `lw-app-header--standard`. The old `hideStats` boolean prop is gone.
- **To change the hero image or logo**: edit the `import heroBg` / `import logoImg` paths at the top of the file. Images are imported as ES modules (Vite hashes them for production).
- **To add a stat chip** (pack counts row): add to the `<div className="lw-hero-counts">` section in `Hero.jsx`.
- **Social badge**: the Facebook `<a>` inside `.lw-header-mascot` uses `lw-social-badge lw-social-badge--facebook` CSS classes. Add new badges alongside it using `lw-social-badge--<platform>`.

#### `NavBar.jsx` (`components/layout/NavBar.jsx`) — extracted in PR #114
- Standalone component; **no longer defined inline in `App.jsx`**.
- Exports `TABS` (array of `{ id, label, tone? }`) and default `NavBar({ active, onChange })`.
- Two internal variants: `<DesktopNav>` (pill row, visible ≥ 769 px) and `<MobileNav>` (bottom bar, visible < 769 px).
- **Mobile nav**: shows 5 primary tabs (`MOBILE_PRIMARY_TABS`) + a "More" dropdown for the remaining 5 (`MOBILE_MORE_TABS`).
- **Tone classes**: `tone="orange"` → `.tone-orange` (Language Ladder tab), `tone="blue"` → `.tone-blue` (Quiz tab) — applied to pill and mobile button.
- **To add a tab**: add to `TABS`, `MOBILE_PRIMARY_TABS` or `MOBILE_MORE_TABS` in `NavBar.jsx`, add to `SESSION_TABS` in `App.jsx` if needed, and add the page component import + render in `AppContent`.

#### `SubjectCardGrid.jsx`
- Grid of subject cards (Language, History, Geography, Science, Literature, Computing, Religion, Other).
- Props: `subjects: [{ id, count }]`, `activeSubject`, `onSelect`.
- Used in QuizPage, VocabPage, ReadingPage, BuilderPage for subject filtering.
- Each subject card shows an icon, label, and pack count. Greyed out if `count === 0`.

#### `Controls.jsx` — shared UI primitives
| Export | Description |
|--------|-------------|
| `LabeledSelect` | `<label>` + `<select>` with consistent styling |
| `PillGroup` | Single-select pill buttons (e.g., Answer Mode) |
| `ToggleGroup` | Multi-select toggle buttons (e.g., Stages) |
| `FilterRow` | Flex row wrapper for filter controls |
| `EmptyState` | Centred empty-state placeholder |
| `LoadingText` | Simple "Loading…" spinner text |

### Learning components (`components/learning/`)

#### `StudyBookDrawer.jsx`
- Full Study Book panel: markdown content, TOC sidebar, search, split-mode, drag-to-resize.
- Rendered **once** at `App.jsx` level; persists across tab switches.
- Also exports `StudyBookButton` — renders a "📖 Study Book" button if the dataset has `contentMdPath`; renders nothing otherwise.
- CSS from `styles.css` (shared `.study-book-drawer`, `.sb-*` classes).
- Resize handle: drag the left edge, range 280–820 px. In split-mode, `padding-right` on `.lw-app` is updated in real time.

#### `TileBuilder.jsx`
- Word-tile drag interface for Build answer mode in Quiz and for Sentence Builder.

#### `QuizCard.jsx`
- Displays the current question text, badges (topic, POS), and answer choices.

#### `FeedbackPanel.jsx`
- Shows correct/incorrect feedback after an answer.

#### `AnswerButton.jsx`
- Single MCQ answer option button with correct/wrong visual states.

#### `SequenceQuiz.jsx`, `SortQuiz.jsx`
- Specialised question types: sequence ordering and category sorting.

#### `ReviewPanel.jsx`, `Flashcard.jsx`, `ProgressBar.jsx`, `PassageReader.jsx`, `PackSelector.jsx`
- Supporting components used within specific pages.

---

## 7. Vanilla JS engine modules (shared with legacy main.js)

These are `src/*.js` files — imported directly by React hooks and pages via the `@/` alias (`src/`).

| Module | Purpose |
|--------|---------|
| `data.js` | Manifest loading, pack loading, vocab/passage/builder item mapping, `findDataset`, `listDatasets`, `listPassageGroups`, `listSentenceBuilderPacks`, `vocabFromItem`, `passageFromItem` |
| `quiz.js` | Question generation: `createQuizSession`, `gradeQuestion`, `resolveQuizModesForUI`, `makeBuildState` |
| `storage.js` | localStorage: `DEFAULT_STATE`, `loadStoredState`, `saveStoredState`, `recordWordAnswer`, `recordQuizSession` |
| `progress.js` | Analytics: `recordAttempt`, `getRecentActivity`, `getDashboardSummary`, `getPackageProgress`, `getWordProgress` |
| `admin-storage.js` | Upload handling: `hydrateManifest`, `saveUploadedPack`, `deleteUploadedPack` |
| `utils.js` | `speakText`, `stopSpeaking`, `shuffle`, `normalizeForCompare`, `escapeHtml`, `humanizeLabel` |
| `study-book.js` | Markdown: `loadMarkdownFile`, `renderMarkdown`, `extractTOC`, `highlightMatches`, `datasetHasStudyBook`, `getStudyBookFiles` |
| `quiz-helpers.js` | `filterWordsForScope`, `getSelectedStages`, `describeScope`, `getDatasetStageOptions`, `usesStageSelection` |
| `lang-utils.js` | Language code normalisation |
| `progressive-language-lesson.js` | Vanilla lesson engine used by LanguagePage |
| `crossword.js` | Crossword engine used by CrosswordPage |

---

## 8. Data flow patterns

### Pattern 1 — Quiz session lifecycle
```
QuizPage (setup prefs)
  → startQuiz({ manifest, dataset, prefs, progress })
    → [data.js] loadVocabItems, loadSentencePools, loadSequenceItems, …
    → [quiz.js] createQuizSession → session object with questions[]
    → sessionRef.current = session   ← ref for side-effect callbacks
    → setSession(session)            ← React state for rendering

  → answerQuestion(response, { updateProgress })
    → [quiz.js] gradeQuestion → result
    → setSession(newSession)         ← awaitingNext = true
    → updateProgress(state => {      ← OUTSIDE setSession (StrictMode safe)
        recordWordAnswer(state, id, correct)
        recordAttempt(state, { sessionId, packId, … })
      })

  → nextQuestion({ updateProgress })
    → if completed: updateProgress(state => recordQuizSession(state, { timestamp }))
    → setSession(nextSession)
```

### Pattern 2 — updateProgress (ProgressContext)
```js
// Always called OUTSIDE a React state updater:
updateProgress(state => {
  // `state` = full stored-state clone { prefs, progress: { words, sessions, attemptEvents } }
  // mutate state directly — it's a structuredClone
  state.progress.words[id] = { ... };
  state.progress.attemptEvents.push({ ... });
  // saveStoredState(state) is called automatically by ProgressContext
});
```

### Pattern 3 — Recent Learning Activity
`getRecentActivity(state, days)` uses a two-pass approach:
1. **Pass 1**: reads `state.progress.attemptEvents` (per-question, populated by `recordAttempt`)
2. **Pass 2**: for days with no event coverage, supplements from `state.progress.sessions` (summary-level fallback for older sessions)

This means: **both `recordAttempt` AND `recordQuizSession` must be called** at quiz completion to ensure Recent Activity shows correctly regardless of data age.

### Pattern 4 — Passage data field names
`passageFromItem` in `data.js` maps raw JSON fields to the UI shape:
```
data.sourcePassage  → passage.sourceText    (source language text / English for monolingual)
data.targetPassage  → passage.targetText    (target / translation)
data.sourceTitle    → passage.sourceTitle   (falls back to data.title, then item-root)
data.targetTitle    → passage.targetTitle   (falls back to data.title, then item-root)
data.speechLanguage → passage.speech_language  (falls back to pack-level speechLanguage)
```
Packs that only have `data.title` (no `sourceTitle`/`targetTitle`) will still show correct titles.

> ⚠️ The old names `passage_de`, `passage_en`, `title_de`, `title_en` were removed in PR #123.
> Do not reintroduce them — they were a legacy artefact from when the app was German-only.

---

## 9. CSS system

Two CSS files are in play:

| File | Scope |
|------|-------|
| `styles.css` (repo root) | Shared design tokens (`--ink`, `--surface`, etc.) + all vanilla JS UI classes + Study Book drawer classes |
| `src/react/styles/global.css` | React-specific design tokens (`--lw-*`) + all React component classes |

### React design tokens (`--lw-*` in global.css)
```css
--lw-bg, --lw-panel, --lw-ink, --lw-muted, --lw-line
--lw-blue, --lw-green, --lw-amber, --lw-coral  (+ *-soft variants)
--lw-radius, --lw-radius-sm, --lw-font, --lw-font-sans
```

### React component class naming convention (`lw-*`)
```
lw-app         → root app container
lw-app-header  → Hero banner
lw-main        → <main> tab content area
lw-nav-bar     → sticky tab nav
lw-nav-pill    → individual tab button
lw-page        → per-tab page wrapper (padding, max-width)
lw-card        → rounded white card panel
lw-btn         → base button
lw-btn-primary → teal filled button
lw-btn-secondary, lw-btn-ghost
lw-chip        → small coloured label (blue/green/amber/coral)
lw-section-title → bold section heading
lw-option-grid → MCQ answer grid
lw-sort-arena  → sort quiz target zones
```

### Shared design tokens (from `styles.css`, used by Study Book drawer)
```css
--ink, --muted, --surface, --surface-alt, --surface-strong, --line
--teal, --coral, --green
```

### Dark mode
`styles.css` has `@media (prefers-color-scheme: dark)` overrides for the shared tokens. `global.css` does not yet have full dark mode support for `--lw-*` tokens. If adding a card/panel that must be dark-mode safe, use `var(--surface-alt)` or `var(--ink)` from `styles.css` rather than hardcoded colours.

### CSS Modules
Some learning components use CSS Modules (`.module.css` files): `TileBuilder`, `QuizCard`, `FeedbackPanel`, `AnswerButton`, `SequenceQuiz`, `SortQuiz`, `ReviewPanel`, `Flashcard`, `ProgressBar`, `PassageReader`, `PackSelector`, `SubjectCardGrid`. Import and use as `styles.className`.

---

## 10. Where to make common changes

### Change the Hero banner (image, logo, tagline, stat chips)
→ Edit `src/react/components/layout/Hero.jsx`
- Hero background: change the `import heroBg from "…"` path
- Logo / mascot: change the `import logoImg from "…"` path
- Tagline copy: edit the `<h1>` / `<p>` inside `.lw-hero-brand-block`
- Stat chips (packs count, reading groups, builder sets): edit the JSX inside `.lw-hero-counts`
- ⚠ **Stat cards** (words mastered, quiz sessions, last quiz score) are no longer in Hero. They live in `ProgressPage.jsx` as `<SnapshotCard>` components.
- Social badges (Facebook etc.): edit the `<a className="lw-social-badge …">` block inside `.lw-header-mascot`

### Add a new navigation tab
1. Add `{ id: "newtab", label: "New Tab" }` to the `TABS` array in **`NavBar.jsx`** (not `App.jsx`)
2. Decide if it's a primary mobile tab (first 5) or a "More" tab — add to `MOBILE_PRIMARY_TABS` or `MOBILE_MORE_TABS` in `NavBar.jsx` with an icon
3. Create `src/react/pages/NewTabPage.jsx`
4. Import and add `{activeTab === "newtab" && <NewTabPage />}` in `AppContent`'s `<main>` in `App.jsx`
5. If it's a session tab (quiz/lesson/builder state): add `"newtab"` to `SESSION_TABS` in `App.jsx`

### Add a new subject to SubjectCardGrid
1. Add the subject ID to `SUBJECTS` in `src/data.js`
2. Add an icon + label entry in `SubjectCardGrid.jsx`
3. Add subject detection in `getDatasetSubject()` in `data.js`
4. Add label to `SUBJECT_LABELS` in `main.js` (for vanilla tabs)

### Change quiz behaviour (answer modes, question count, etc.)
→ `src/quiz.js` (question generation) + `src/react/hooks/useQuizSession.js` (session state machine)
- New answer mode: add to `ANSWER_MODES_ALL` in `QuizPage.jsx`, handle in `resolveQuizModesForUI` in `quiz.js`
- New question type: add case in `createQuizSession`, add `makeInitialBuildState` case in `useQuizSession.js`

### Change how vocab words display (VocabPage)
→ `src/react/pages/VocabPage.jsx` — the `VocabCard` function at the top
- Language packs: shows `word.de` (source term) large, `word.en` (definition) small
- Non-language packs: shows `word.en` (definition) large, `word.de` (term) small
- Speech: language packs speak `word.de` in `speechLang`; non-language packs speak `"${word.de}: ${word.en}"` in `speechLang`

### Change how passages are displayed (ReadingPage)
→ `src/react/pages/ReadingPage.jsx` — the `PassageDisplay` function
- The 🔊 button calls `speak(sourceText || mainText, speechLang)` where `speechLang = passage?.speech_language || "en-GB"`
- Auto-speak on passage change: `useEffect` with `[passage?.id]` dep (has cleanup to cancel on change)

### Change the ReadingPage setup screen (filters, layout)
→ `src/react/pages/ReadingPage.jsx` — the `PassageSetup` function
- PR #114 added **Topic** and **Difficulty** filter dropdowns to the setup screen (passed as `categoryOptions` and `prefs.difficulty`).
- Layout: `lw-reading-setup-grid` (two-column on desktop, single on mobile): `lw-reading-main-column` (filters) + `lw-reading-side-column` (tips).
- Error message: `friendlyMessage` logic maps filter-mismatch errors into readable text based on whether the group has packs at all.
- `categoryOptions` comes from `useReadingSession`'s exposed value; set via `prefs.category` state.

### Add Study Book to a new page
```jsx
import { StudyBookButton } from "../components/learning/StudyBookDrawer.jsx";
// Inside your component, with access to a dataset object:
<StudyBookButton dataset={dataset} />  // renders null if no contentMdPath
```

### Change what gets recorded in Recent Learning Activity
→ `src/progress.js` — `recordAttempt()` and `getRecentActivity()`
→ `src/react/hooks/useQuizSession.js` — `answerQuestion` calls `recordAttempt`
- Reading and Builder sessions do NOT currently write to `attemptEvents`; they use separate stats storage (`passageStats`, `builderStats`)

### Change storage defaults (new preference key)
→ `src/storage.js` — `DEFAULT_STATE`
- Every new preference key **must** have a default value in `DEFAULT_STATE`
- `mergeState` deep-merges stored JSON with `DEFAULT_STATE` — missing keys in old stored state get the default

---

## 11. React StrictMode patterns (dev mode)

The app runs in React 18 StrictMode in development (`npm run dev`). StrictMode **deliberately calls state updater functions twice** to detect impure reducers.

**Critical rule:** Never call side-effect functions (`recordAttempt`, `recordWordAnswer`, `recordQuizSession`, `saveStoredState`) inside a state updater function.

```js
// WRONG — StrictMode calls the updater twice → side effect fires twice
setSession(prev => {
  updateProgress(state => recordAttempt(state, { ... })); // ← fires twice!
  return { ...prev, ... };
});

// CORRECT — read from ref, call updateProgress outside the updater
const prev = sessionRef.current;
setSession(newSession);              // pass value directly, not a function
updateProgress(state => {           // called once, outside setSession
  recordAttempt(state, { ... });
});
```

When you must read current state in a non-updater context, maintain a `useRef` that mirrors the state:
```js
const sessionRef = useRef(null);
// In every place you call setSession with a new value:
sessionRef.current = newSession;
setSession(newSession);
```

---

## 12. LanguagePage special patterns

`LanguagePage.jsx` is a hybrid: it renders vanilla HTML via `dangerouslySetInnerHTML` (the progressive language lesson engine). This means:

- **React's synthetic `onChange` does NOT fire for `<select>` inside `dangerouslySetInnerHTML`** — those selects are outside React's fiber tree.
- **Solution**: use a native `addEventListener("change")` via a `useCallbackRef` pattern:

```js
function useCallbackRef(fn) {
  const ref = useRef(fn);
  useEffect(() => { ref.current = fn; });
  return ref;
}

const handleChangeRef = useCallbackRef(handleChange);
useEffect(() => {
  const container = containerRef.current;
  if (!container) return;
  const listener = (e) => handleChangeRef.current(e);
  container.addEventListener("change", listener);
  return () => container.removeEventListener("change", listener);
}, [catalog]); // catalog: null → populated once after load → container is mounted
```

- The effect depends on `catalog` (not `[]`) because the container div is not mounted until after data loads.

---

## 13. Speech synthesis patterns

The `speakText` function in `utils.js` handles the Chrome `cancel()` + `speak()` timing bug:
- If something is already speaking/pending: calls `cancel()` then defers `speak()` via `requestAnimationFrame` (stays within user-activation window)
- If nothing is speaking: calls `speak()` directly

**Rules:**
- Always pass the correct speech language — don't rely on the default
- Language packs: `dataset.speechLanguage` or `dataset.sourceLanguageCode`
- Non-language packs: `"en-GB"`
- Never call `speakText` inside `useEffect` without a user-gesture wrapper (Chrome blocks auto-play speech)
- When auto-speak is needed on passage/content change, always add a cleanup: `return () => window.speechSynthesis.cancel()`

---

## 14. Vite configuration notes

`vite.config.js` uses a function form to detect `command`:
- `base: command === "build" ? "./" : "/"` — relative paths for Render.com, absolute for local dev
- `viteStaticCopy` runs **only in build mode** — wrapping it in `command === "build"` conditional prevents it intercepting `brand/` image requests in dev and causing "image/jpeg" MIME type errors
- `@` alias resolves to `src/` — use `import ... from "@/data.js"` for vanilla modules
- `@react` alias resolves to `src/react/` — rarely needed (prefer relative imports within react/)

---

## 15. File-change impact matrix

Use this to understand what to change when modifying a feature:

| Change | Files to touch |
|--------|---------------|
| Hero visual (image/logo/copy/chips) | `Hero.jsx` |
| Hero social badges | `Hero.jsx` (`.lw-social-badge` block) + `global.css` |
| Stat cards (words/sessions/score) | `ProgressPage.jsx` (`SnapshotCard` component) |
| Navigation tabs (labels/order/tones) | `NavBar.jsx` (`TABS`, `MOBILE_PRIMARY_TABS`, `MOBILE_MORE_TABS`) |
| Reading setup filters (topic/difficulty) | `ReadingPage.jsx` (`PassageSetup` function) + `useReadingSession.js` |
| Quiz question types | `quiz.js` + `useQuizSession.js` |
| Quiz answer modes | `quiz.js` (resolveQuizModesForUI) + `QuizPage.jsx` (ANSWER_MODES_*) |
| Vocab display / speak | `VocabPage.jsx` (VocabCard function) |
| Reading passage display | `ReadingPage.jsx` (PassageDisplay function) |
| Passage data fields | `data.js` (passageFromItem) |
| Recent Activity chart | `progress.js` (getRecentActivity) + `useQuizSession.js` (recordAttempt call) |
| Study Book drawer UI | `StudyBookDrawer.jsx` + `StudyBookContext.jsx` |
| Study Book trigger button | `StudyBookDrawer.jsx` (StudyBookButton) → add to page |
| New preference key | `storage.js` (DEFAULT_STATE) + page that uses it |
| Upload/delete packs | `MyPacksPage.jsx` + `admin-storage.js` + call `rehydrate()` after |
| New manifest pack | `data/generated/manifest.json` + pack JSON file in `data/Packs/` |
| Arcade mode/tuning | `games/arcade/*` (see §16) |
| AI Pack Creator template | `services/promptConfigs.js` + a markdown file in `public/docs/` |
| Build configuration | `vite.config.js` |
| Deployment | `render.yaml` |

---

## 16. Arcade game mode (`src/react/games/arcade/`)

"FoxChild Arcade" (the `arcade` tab) turns existing packs into a PacMan/Snake-style
game. It reuses the unified pack schema, the normalised loaders, and the
Manifest/Progress providers — **no parallel content or storage system**.

### Module layout

```
games/arcade/
  ArcadeGamePage.jsx       setup screen + content load + progress + sound, then renders a mode
  QuizHuntGame.jsx         Mode 1 — fox eats the correct answer token (from vocab packs)
  SnakeBuilderGame.jsx     Mode 2 — snake eats sentence words IN ORDER (from builder packs)
  engine/
    grid.js                grid model + collision (DIRS, isFloor, stepInDirection, reachableFrom …)
    useGameLoop.js         requestAnimationFrame loop: delta timing, discrete steps, pause
  hooks/
    useArcadeContent.js    loads vocab/builder packs → game questions via the adapter
    useArcadeControls.js   swipe + WASD/arrows + D-pad → a directionRef (no re-render per key)
    useArcadeSound.js      muteable WebAudio blips + speech (no audio assets)
    useBoardMetrics.js     responsive grid sizing (cols/rows/cellPx) via ResizeObserver
  maps/mapGenerator.js     "open" (border walls only) or "pillars" (border + 3-step interior grid)
  ui/                      ArcadeHud, DpadControls, PauseOverlay
  components/GameBoard.jsx React+CSS grid renderer (no Canvas); playerEmoji accepts emoji or "/path"
  utils/
    gameQuestionAdapter.js pack data → { quiz-hunt | snake-builder } question objects
    tokenLayout.js         pill orientation + multi-cell footprint (placement + BFS solvability)
  public/images/           foxchild-fox.png (Quiz Hunt), foxchild-girl.png (Snake)
```

### Key patterns (see cautions RC15–RC17)

- **Data-driven & multilingual.** `gameQuestionAdapter.js` maps the generic vocab
  word shape (`de`/`en`) and builder card shape (`tiles[]`) into game questions —
  no subject- or language-specific logic. Quiz Hunt works for any subject; Snake
  Builder works for any `sentenceBuilder` pack.
- **Ref-authoritative loop.** Per-step game state lives in `gRef`; React state is a
  snapshot set once per discrete grid step (not per frame). Side effects (sound,
  `onRecord`) fire outside state updaters. **RC16.**
- **Multi-cell token footprint + BFS solvability.** A pill can span cells (wide or
  rotated vertical); `tokenLayout.js` keeps placement, rendering, and ≥50%-coverage
  collision in sync. After placing tokens, a BFS from the player (treating wrong-token
  footprints as blocked) verifies a clear path to the correct answer; retried up to
  12 times. **RC17.**
- **Map layouts.** Every map's outer ring is a real wall so the player can never leave
  the visible area. Quiz Hunt → `"pillars"` (3-step interior grid, 2-cell corridors).
  Snake → `"open"` (border walls only, fully open interior — prevents the growing tail
  getting trapped in corridors). Map type is hardcoded per mode, not user-selectable.
- **Sentence Snake specifics.** Exactly 2 tokens on screen at a time (next correct
  word + 1 distractor from remaining sentence words). Each correct eat grows the
  tail; collected words appear as labels on body segments. Wrong token **and**
  self-collision (head enters own tail, excluding the last segment) both cost a life
  and briefly freeze the snake. `state === "wrong"` tokens are excluded from subsequent
  collision checks so the same wrong token never costs more than one heart.
- **Progress + prefs.** Per-word answers feed existing word mastery
  (`recordWordAnswer`); arcade bests live in `progress.arcadeStats` via
  `recordArcadeResult`. `prefs.arcade` (mode/subject/curriculum/pack/goal/sound)
  is persisted **through `updateProgress`**, never a side-channel save. **RC15.**
- **Round goals.** `prefs.arcade.goal` → 20/40/60 questions, a 5-minute timer, or
  endless; always 3 lives. Questions wrap so timed/large goals keep going on small packs.
- **Player images.** `GameBoard.playerEmoji` accepts an emoji string **or** a `"/path"`.
  Paths render as `<img className="arc-seg-img" />`. Images live in `public/images/`;
  Vite serves `public/` at the root so they work in production without `viteStaticCopy`.

### Adding a mode

Mirror `QuizHuntGame.jsx`: build questions in the adapter, keep state in a ref,
drive it with `useGameLoop`, read input from `useArcadeControls`' `directionRef`,
render via `GameBoard`, and register the mode in `ArcadeGamePage`'s setup. Do not
introduce a game engine or `setInterval`.
