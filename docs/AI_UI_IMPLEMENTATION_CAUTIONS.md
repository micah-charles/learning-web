# AI Implementation Cautions — Learning Web

Lessons distilled from real mistakes across multiple development sessions.
Read this **before** implementing any feature that touches quiz logic, pack loading, UI state, or React architecture.

> **Architecture as of PR #110 (merged 2026-05-25):**
> The app is now a **React 18 + Vite** single-page app. The vanilla JS engine
> modules (`quiz.js`, `data.js`, `storage.js`, `admin-storage.js`, `utils.js`,
> `progress.js`) are **still vanilla ES modules** — they are imported directly
> by React hooks and pages. The React layer is a thin shell; all core logic
> stays in vanilla JS.

---

## PART A — Vanilla JS Core Engine

These cautions apply to `quiz.js`, `data.js`, `storage.js`, `admin-storage.js`, and any vanilla module. They remain critical because the React app calls these modules directly.

---

### ⚠️ A1. Mode resolver must reflect actual pack content

**Mistake (PRs #55, #57):** `resolveQuizModesForUI` assumed `fillBlank` items only exist in grammar-*only* packs (`vocabCount === 0`). When the grammar pack was merged into the vocab pack, the mixed pack fell through to vocab-only modes — 240 grammar questions were silently never generated.

**Rule:** Handle every combination of item types:

```js
// BAD — only catches grammar-only packs
if (fillBlankCount > 0 && vocabCount === 0) return ["fillBlank"];
return [choiceMode, typedMode]; // ← mixed packs silently drop fillBlank

// GOOD
const standaloneModes = [
  ...(multipleChoiceCount > 0 ? ["multipleChoice"] : []),
  ...(fillBlankCount > 0 ? ["fillBlank"] : []),
];
const vocabModes = mode === "mcq"   ? [choiceMode]
                 : mode === "typed" ? [typedMode]
                 : [choiceMode, typedMode];
return standaloneModes.length > 0 ? [...vocabModes, ...standaloneModes] : vocabModes;
```

**Checklist when adding a new item type to a pack:**
- [ ] Does `resolveQuizModesForUI` handle this type alongside existing types?
- [ ] Does `createQuizSession` have a case for this mode?
- [ ] Does `getQuizMaxQuestionCount` count items of this type?

---

### ⚠️ A2. Count the same thing the same way in every call site

**Mistake (PR #57):** `fillBlankCount` was computed differently in `getQuizMaxQuestionCount` (stage-filtered) vs `resolveQuizModesForUI` (raw count). Mode detection and the max-question-count disagreed when a stage filter was active.

**Rule:** Any derived count must be computed identically at every call site. Extract it once above both usages:

```js
const fillBlankCount = filterFillBlankByStage(unifiedPack, prefs, dataset).length;
const multipleChoiceCount = filterMultipleChoiceByStage(unifiedPack, prefs, dataset).length;

const resolvedModes = resolveQuizModesForUI({ ..., fillBlankCount, multipleChoiceCount });
const maxCount = getQuizMaxQuestionCount({ ..., fillBlankCount, multipleChoiceCount });
```

---

### ⚠️ A3. localStorage persistence survives pack removals — always fall back gracefully

**Mistake (PR #58):** `loadUnifiedPack` threw when a pack ID from localStorage was no longer in the manifest. This hard-crashed the app on page load for users with the old pack saved.

**Rule:** Never throw from a loader for a missing preference reference. Fall back silently:

```js
// BAD
if (!pack?.unifiedPath) throw new Error(`No unifiedPath for pack: ${packId}`);

// GOOD
if (!pack?.unifiedPath) return loadCoreUnifiedPack(manifest); // silent fallback
```

Also sanitise stored IDs early, before they reach loaders:

```js
const knownIds = new Set(listDatasets(runtime.manifest).map((d) => d.id));
if (prefSection.datasetId && !knownIds.has(prefSection.datasetId)) {
  prefSection.datasetId = "core";
}
```

---

### ⚠️ A4. Stage filtering must be applied to every item type uniformly

**Mistake (PR #57):** Stage filtering was applied to vocab items but not to `fillBlank` items when computing badge counts.

**Rule:** Every item type with a `level`/`stage` tag must use the same stage-filter pipeline. Mirror this pattern for any new item type:

```js
function filterFillBlankByStage(unifiedPack, prefSection, dataset) {
  const all = filterUnifiedItems(unifiedPack, "fillBlank");
  if (!usesStageSelection(dataset)) return all;
  const selectedStages = new Set(getSelectedStages(prefSection, dataset).map(String));
  if (!selectedStages.size) return all;
  return all.filter((item) => {
    const stageStr = String(item.level || "").replace(/^Stage\s+/i, "").trim();
    return !stageStr || isNaN(Number(stageStr)) || selectedStages.has(stageStr);
  });
}
```

---

### ⚠️ A5. `answerMode` must be threaded through to every question generator

**Mistake:** `makeFillBlankFromUnified` always generated MCQ options regardless of UI selection.

**Rule:** Any preference that affects question format must be an explicit parameter. Never infer from global state:

```js
// BAD
function makeFillBlankFromUnified(unifiedItems, count, dataset) { ... }

// GOOD
function makeFillBlankFromUnified(unifiedItems, count, dataset, answerMode = "mixed") { ... }
```

---

### ⚠️ A6. Merging packs is a 3-file atomic operation

**Rule:** Always do all three in one commit:
1. Update the destination `pack_unified.json`
2. Update `manifest.json` — remove source entry, update destination `wordCount`/`sentenceCount`
3. Delete the source pack directory

---

### ⚠️ A7. `localStorage` — save after every mutation

- Always call `saveStoredState` after mutating `persisted`.
- Never mutate a nested object by reference without saving — `persisted.prefs.quiz.stages.push(x)` mutates memory but nothing persists until `saveStoredState()` is called.
- Apply defaults *after* loading, not before — so new `DEFAULT_STATE` fields are merged in for existing users.

---

### ⚠️ A8. `manifest.json` is the sole source of truth for pack visibility

The app has no backend and cannot list directories. A pack file on disk is invisible until it has a valid entry in `data/generated/manifest.json`.

**Rule:** Pack add/rename/remove is always a two-step operation: change the JSON file **and** update the manifest in the same commit.

---

### ⚠️ A9. Mode ID regex must stop before the kind token ("Word"/"Sentence")

**Mistake (PR #72):** The regex stopped at `Choose/Type/Build`, capturing `"englishWord"` instead of `"english"`. Both directions resolved `isReverse = false` — the direction toggle had no effect.

```js
// BAD — captures "englishWord"
const shownLang = modeId.replace(/^(.+?)(Choose|Type|Build)(.+)$/, "$1");

// GOOD — captures "english"
const shownLang = modeId.replace(/^(.+?)(Word|Sentence)(Choose|Type|Build)(.+)$/, "$1");
```

**Checklist when modifying a question generator that parses modeId:**
- [ ] Regex captures only the language name, not trailing kind tokens
- [ ] Test both directions in the UI after any change
- [ ] `modeTitle` direction matches the actual prompt/answer orientation

---

### ⚠️ A10. Uploaded packs live in `manifest.revisionPacks`, not `manifest.packs`

**Mistake (PR #89):** `hydrateManifest` injects uploaded packs into `manifest.revisionPacks`; the `list*` / `findDataset` functions only read `manifest.packs`. Uploaded packs were invisible to the quiz and vocab tabs.

**Rule:** Every `list*` / `find*` function in `data.js` must look in both arrays:

```js
export function listDatasets(manifest) {
  const revision = packsWithCapability(manifest, "revision");
  const uploadedRevision = (manifest.revisionPacks || []).filter((p) => p._uploaded);
  return [manifest.core, ...revision, ...uploadedRevision].filter(Boolean).map(asDisplayPack);
}
```

| Static source | Uploaded source | Function |
|---|---|---|
| `manifest.packs` (cap `"revision"`) | `manifest.revisionPacks` (`_uploaded: true`) | `listDatasets` |
| `manifest.packs` (cap `"passages"`) | `manifest.passageGroups` (`_uploaded: true`) | `listPassageGroups` |
| `manifest.packs` (cap `"sentenceBuilder"`) | `manifest.sentenceBuilderPacks` (`_uploaded: true`) | `listSentenceBuilderPacks` |

---

### ⚠️ A11. Uploaded pack path is `unifiedPath`; static passage packs use `passagePath`

**Mistake (PR #89):** `loadPassageUnifiedPack` required `pack.passagePath` but uploaded packs only have `pack.unifiedPath` — static and uploaded passage packs use different field names.

**Rule:** Any loader resolving a pack's JSON path must accept both:

```js
const path = pack?.passagePath || pack?.unifiedPath;
if (!path) throw new Error(`No path for pack: ${groupId}`);
```

---

### ⚠️ A12. ZIP uploads — merge files sharing the same `packId` before saving

**Mistake (PR #89):** Processing each ZIP entry independently caused the second file with the same `packId` to overwrite the first. Revision pack disappeared after upload.

**Rule:** Group all parsed files by `packId` before any save call:

```js
const mergedById = new Map();
for (const { filename, parsed } of parsedFiles) {
  const id = parsed.packId || parsed.id || deriveIdFromFilename(filename);
  if (mergedById.has(id)) {
    mergedById.get(id).parsed.items.push(...(parsed.items || []));
  } else {
    mergedById.set(id, { parsed, filenames: [filename] });
  }
}
for (const { parsed, filenames } of mergedById.values()) {
  saveUploadedPack(parsed, filenames[0]);
}
```

---

### ⚠️ A13. Monolingual packs must use `sourceWord`/`targetWord`, never `translations`


**Mistake (PR #90):** AI-generated Geography/History/Science packs used the `translations` field (for bilingual packs). Because `srcCode === tgtCode === "en-GB"`, both `word.de` and `word.en` resolved to the same value → quiz questions became "Climate → choose Climate".

**Rule:** Non-language packs (Geography, History, Science, Literature) must use `sourceWord` (term) and `targetWord` (definition). `translations` is bilingual-language-pack only.

```json
// WRONG
"data": { "partOfSpeech": "keyword", "translations": { "en-GB": "Climate" } }

// CORRECT
"data": { "partOfSpeech": "keyword", "sourceWord": "Climate",
          "targetWord": "The usual weather patterns of a place over a long time." }
```

---

### ⚠️ A14. Stored user preferences are not bugs — never force-overwrite them


**Mistake (PR #95):** A migration unconditionally rewrote `"mixed"` → `"mcq"` for all users, permanently overriding deliberate user choices.

**Rule:** `DEFAULT_STATE` sets values for **new users only**. Existing users keep their stored preference. Only migrate stored values that would cause a runtime crash or broken UI if kept — never migrate a value the user can still actively choose.

```js
// CORRECT — DEFAULT_STATE only applies when the key is missing/null
export const DEFAULT_STATE = {
  prefs: { quiz: { answerMode: "mcq" } } // new users only
};
```

---

### ⚠️ A15. `handleChange` fires before `click` when user blurs a free-text input

**Mistake (PR #85):** Blur from a quiz textarea fired `change` → `renderApp()` rebuilt the DOM before the "Check" button's `click` event fired. `input.value` was `""` by the time the handler ran.

**Rule (vanilla):** Any `<input>`/`<textarea>` that does not control a persisted preference must be excluded from `handleChange`:

```js
async function handleChange(event) {
  if (event.target.id === "quiz-typed-answer") return; // not a preference
  // ...
}
```

**React equivalent:** See **RC3** below — use controlled inputs and `onChange` directly on the input, not event delegation.

---

### ⚠️ A16. Crossword grid — three recurring layout bugs

**A16a. `focus()` without `preventScroll` jumps the viewport:**
```js
input.focus({ preventScroll: true }); // always
```

**A16b. Never reset `transform` before measuring `scrollWidth`:**
`scrollWidth` is a layout value unaffected by CSS `transform`. Resetting `transform` before measuring causes a one-frame board expansion → scroll flash.

```js
// WRONG — resets transform to measure; board briefly expands
board.style.transform = "";
const natural = board.scrollWidth;

// CORRECT — scrollWidth is always the unscaled layout width
const natural = board.scrollWidth; // measure first
board.style.transform = natural > available ? `scale(${available / natural})` : "";
```

**A16c. Use double `requestAnimationFrame` after DOM insertion:**
```js
requestAnimationFrame(() => requestAnimationFrame(scaleCrosswordToFit));
```

---

### ⚠️ A17. Item type strings must exactly match `filterUnifiedItems()` — `"sentenceBuilder"` not `"sentence"`

**Bug found (PR #120):** Prompt-builder UI and `promptAssembler.js` used `"sentence"` as the item type label for the Builder tab. The correct string is `"sentenceBuilder"`. `loadSentenceBuilderPack()` in `data.js` calls `filterUnifiedItems(pack, "sentenceBuilder")` — a pack with `"sentence"` items is silently ignored by every loader.

**Authoritative item type strings (cross-reference `filterUnifiedItems` call sites in `data.js`):**

| Type string | Where it appears |
|---|---|
| `"vocab"` | Vocabulary tab + Quiz (word-choice / typed-answer questions) |
| `"multipleChoice"` | Quiz standalone multiple-choice questions |
| `"fillBlank"` | Quiz fill-in-the-blank questions |
| `"sequence"` | Quiz ordering questions |
| `"categorySort"` | Quiz category-sort questions |
| `"sentenceBuilder"` | Builder tab — loaded by `loadSentenceBuilderPack()` |
| `"passage"` | Reading tab — loaded by `loadPassageUnifiedPack()` |

**Rule:** Whenever you reference an item type string in UI labels, prompt text, assembler logic, or feature detection, cross-check it against the `filterUnifiedItems()` call sites in `data.js`. The schema and the loader must agree.

```js
// WRONG — "sentence" items are never matched by any loader
if (types.includes("sentence")) { ... }

// CORRECT
if (types.includes("sentenceBuilder")) { ... }
```

---

### ⚠️ A18. Import `SUBJECTS` from `data.js`; build curriculum option lists with `listCurricula()` — never hardcode either

**Bug found (PR #120):** `PromptInputPanel.jsx` had a hardcoded `SUBJECTS` array that was missing `"religion"`. `promptAssembler.js` returned `"gcse"` as a computed manifest curriculum value, but at the time `"gcse"` was not a valid value.

**Updated (PR #127): curricula are now DYNAMIC, not a fixed enum.**
- `CURRICULUMS = ["ks3", "us-middle-school", "other"]` in `data.js` is only the **built-in seed list** (always offered).
- Any other `curriculum` value found on a pack is now **discovered at runtime** and preserved as its own slug — unknown values are no longer collapsed into `"other"`.
- `getDatasetCurriculum(dataset)` → normalised slug (via `normalizeCurriculum`, e.g. `"AQA GCSE"` → `"aqa-gcse"`).
- `listCurricula(manifest)` → `[{ id, label }]` = built-ins **+** every curriculum present on packs / passage groups / builder packs, with `curriculumLabel()` providing the display text.

**Authoritative source of truth in `data.js`:**

```js
export const SUBJECTS    = ["language", "history", "geography", "science",
                            "literature", "computing", "religion", "other"];
export const CURRICULUMS = ["ks3", "us-middle-school", "other"]; // built-in seed only
export function normalizeCurriculum(value) { /* slugify */ }
export function curriculumLabel(slug, rawValue) { /* display text */ }
export function listCurricula(manifest) { /* built-ins + discovered */ }
```

**Rules:**
1. Always import `SUBJECTS` from `@/data.js` — never hardcode it in a component or service.
2. Build curriculum dropdowns from `listCurricula(manifest)` (wrapped in `useMemo([manifest])`), **never** from a static `CURRICULUMS.map(...)` list — that hides custom curricula carried by uploaded packs.
3. To emit a curriculum on a generated/uploaded pack, write the user's value **verbatim** to the pack's top-level `curriculum`; the app normalises it via `normalizeCurriculum` for grouping. Do **not** force it into `ks3 / us-middle-school / other`.
4. When `data.js` gains a new subject, every component that imports `SUBJECTS` updates automatically.

```js
// CORRECT — discovers built-in + pack-supplied curricula
import { listCurricula } from "@/data.js";
const curriculumOptions = useMemo(
  () => [{ id: "all", label: "All" }, ...(manifest ? listCurricula(manifest) : [])],
  [manifest],
);

// WRONG — stale static list that hides custom curricula
const CURRICULUM_OPTIONS = [{ id: "all", label: "All" }, ...CURRICULUMS.map(c => ({ id: c, label: CURRICULUM_LABELS[c] }))];
```

---

## PART B — React App Shell (real bugs from production)

These apply to `src/react/` — the React layer over the vanilla engine.

---

### ⚠️ RC1. `useProgress()` returns the full stored-state — never unwrap it before passing to storage helpers

**Bug found (PR #110):** `VocabPage` and `ReviewPage` passed `progress?.progress` (the inner object) to `getWordProgress()`, `isWordMastered()`, etc. These functions expect the **full stored-state** `{ prefs, progress: { words, sessions } }` and access `state.progress.words[id]`. Passing the unwrapped object made that read `undefined.words[id]` → crash on every render.

**What `useProgress()` actually returns:**
```js
// ProgressContext.jsx
const [state, setState] = useState(() => loadStoredState());
// ...
return <Ctx.Provider value={{ progress: state, updateProgress }}>{children}</Ctx.Provider>;
// ↑ `progress` = the FULL stored-state { prefs: {…}, progress: { words: {}, sessions: [] } }
```

**Rule:** Pass `progress` (or a safe fallback) directly to storage helpers. Never unwrap `.progress`:

```js
// BAD — crashes: getWordProgress tries state.progress.words but state is { words, sessions }
const prog = progress?.progress || { words: {} };
getWordProgress(prog, word.id);

// GOOD — pass the full state; provide a shape-correct fallback
const storedState = progress || { prefs: {}, progress: { words: {}, sessions: [] } };
getWordProgress(storedState, word.id);
```

**Storage helpers that need the full state:** `getWordProgress`, `isWordMastered`, `isMasteredProgress`, `countMasteredWords`, `recordWordAnswer`.

**Analytics functions** (`progress.js`: `getDashboardSummary`, `getPackageProgress`, etc.) use an internal `bucket()` helper that accepts **either** shape — they are safe with both.

**Checklist when calling any function from `storage.js` in a React component:**
- [ ] Are you passing `progress` (the Context value), not `progress?.progress`?
- [ ] Is there a shape-correct fallback for the initial render before Context loads?
- [ ] Does the prop/variable name make the shape obvious? (prefer `state` or `storedState` over `progress` when passing to storage helpers)

---

### ⚠️ RC2. ManifestContext must call `hydrateManifest()` — uploaded packs are invisible without it

**Bug found (PR #110):** `ManifestContext` called `loadManifest()` but never called `hydrateManifest()`. All packs uploaded via My Packs were saved to localStorage but never injected into the live manifest → invisible to Quiz, Vocabulary, Reading, and Builder.

**Rule:** Always call `hydrateManifest` after loading the manifest, and expose `rehydrate()` for post-upload refresh:

```js
// ManifestContext.jsx — CORRECT pattern
import { loadManifest, registerPackInCache } from "@/data.js";
import { hydrateManifest } from "@/admin-storage.js";

useEffect(() => {
  loadManifest()
    .then(m => {
      hydrateManifest(m, registerPackInCache); // inject uploaded packs
      setManifest(m);
    })
    .catch(...)
}, []);

const rehydrate = useCallback(() => {
  setManifest(prev => {
    if (!prev) return prev;
    const next = { ...prev }; // new reference → triggers re-render
    hydrateManifest(next, registerPackInCache);
    return next;
  });
}, []);
```

**Rule:** `MyPacksPage` must call `rehydrate()` after every successful upload and delete:

```js
const { rehydrate } = useManifest();
// after upload/delete:
refresh();       // update local pack list state
rehydrate();     // inject/remove pack in live manifest
```

**Why `{ ...prev }` in rehydrate?** `hydrateManifest` mutates the manifest in place (it appends to arrays). A shallow clone creates a new object reference which triggers React's re-render cycle.

---

### ⚠️ RC3. `LanguagePage` — vanilla-rendered HTML uses id-based `<select>` elements, not `data-action`

**Bug found (PR #110):** `LanguagePage` renders vanilla HTML via `dangerouslySetInnerHTML`. The `<select>` elements for pack/stage/lesson/language use `id="pl-*-select"` but have **no `data-action` attribute**. The `handleChange` handler only looked for `input[data-action]` → all four dropdowns silently did nothing.

**Rule:** Always detect `pl-*` selects by id, not data-action:

```js
// BAD — pl-* selects have no data-action, so this is always null
const input = target.closest("input[data-action]");

// GOOD — detect by tagName + id prefix
if (target.tagName === "SELECT" && target.id?.startsWith("pl-")) {
  if (target.id === "pl-language-select") { ... }
  if (target.id === "pl-pack-select")     { ... }
  if (target.id === "pl-stage-select")    { ... }
  if (target.id === "pl-lesson-select")   { ... }
  return;
}
```

**Also: speech synthesis inside `setTimeout` is blocked by Chrome's autoplay policy.** The `scheduleAutoSpeak` pattern (setTimeout → speakText) fires outside the browser's user-gesture window. Always call `speakText()` inline within the `onClick` handler:

```js
// BAD — setTimeout puts the call outside the user-gesture window
function scheduleAutoSpeak(state, pack, ref) {
  setTimeout(() => speakText(cue.text, cue.lang), 350); // ← Chrome blocks this
}

// GOOD — call inline in the click handler (inside user gesture)
const handleClick = useCallback((e) => {
  const { state: newState, effect } = runProgressiveLessonAction(...);
  if (effect?.speak) {
    speakText(effect.speak.text, effect.speak.lang); // ← inside gesture ✓
  } else {
    speakListenCue(newState, pack, spokenKeyRef);    // ← inside gesture ✓
  }
  setPlState(newState);
}, [plState, pack]);
```

---

### ⚠️ RC4. React UI answer mode labels differ from the vanilla engine's mode IDs

**Bug found (PR #110):** The React Quiz UI uses `"choice"`, `"typed"`, `"mixed"`, `"build"` as `answerMode` values. The vanilla `resolveQuizModesForUI` engine originally only accepted `"mcq"`, `"typed"`, `"mixed"`. Selecting "Choice" produced typed questions; "Build" produced nothing.

**Rule:** Normalize UI labels to engine IDs at the boundary — in `resolveQuizModesForUI`:

```js
// Normalise UI label → canonical engine value
const mode = answerMode === "choice" ? "mcq" : answerMode;
```

**"Build" is a language-pack-only mode.** It requires sentence pools (`sentencePools` or `sentence`-type items). Non-language packs (history, geography, science, literature) have no sentence pools.

**Rule:** Filter "Build" from the Answer Mode UI for non-language datasets:

```js
const ANSWER_MODES_ALL   = [{ id: "mixed" }, { id: "choice" }, { id: "typed" }, { id: "build" }];
const ANSWER_MODES_BASIC = ANSWER_MODES_ALL.filter(m => m.id !== "build");

const isLanguage = getDatasetSubject(dataset) === "language";
const answerModes = isLanguage ? ANSWER_MODES_ALL : ANSWER_MODES_BASIC;
```

**Rule:** Auto-reset `answerMode` to `"mixed"` when the user switches to a non-language subject or dataset while "build" is selected:

```js
answerMode: (!newIsLanguage && prev.answerMode === "build") ? "mixed" : prev.answerMode
```

---

### ⚠️ RC5. `useMemo` dependency arrays must include every value that affects the result

**Rule:** Any call to a vanilla engine function inside `useMemo` must list every input in the dep array. Missing deps produce stale results when the pack changes.

```js
// BAD — item counts not in deps; modes go stale when pack changes
const modes = useMemo(() => resolveQuizModesForUI({ subject, direction, answerMode }), 
  [subject, direction, answerMode]);

// GOOD
const modes = useMemo(() => resolveQuizModesForUI({ subject, direction, answerMode, fillBlankCount, multipleChoiceCount, vocabCount }),
  [subject, direction, answerMode, fillBlankCount, multipleChoiceCount, vocabCount]);
```

---

### ⚠️ RC6. Config vs derived — store user choices in state, compute everything else in useMemo

**Config** (user preference, persisted): `answerMode`, `datasetId`, `stages`, `questionCount`
**Derived** (computed at quiz start, never persisted): `resolvedModes`, `filteredWords`, `maxQuestionCount`

```js
// BAD — derived value in state; can go stale
const [modes, setModes] = useState([]);
useEffect(() => { setModes(resolveQuizModesForUI(...)); }, [answerMode]);

// GOOD — always current
const modes = useMemo(() => resolveQuizModesForUI({ answerMode, fillBlankCount, multipleChoiceCount, vocabCount }),
  [answerMode, fillBlankCount, multipleChoiceCount, vocabCount]);
```

---

### ⚠️ RC7. Async pack loaders must return null/fallback — never throw into an error boundary

**Rule:** `loadUnifiedPack`, `loadPassageUnifiedPack`, etc. must return `null` (or a fallback) for missing packs. A thrown error propagates to the nearest React error boundary and takes down the whole tab.

```js
// BAD — crashes the component tree
const pack = await loadUnifiedPack(manifest, packId); // throws if not found

// GOOD — null propagates; component renders empty state
const pack = await loadUnifiedPackSafe(manifest, packId) ?? null;
if (!pack) return <div>Pack not found.</div>;
```

---

### ⚠️ RC8. Hero and global layout — mascot must NOT share a flex container with the stats row

**Bug found (PR #110):** The mascot image (`lw-header-mascot`) and stats row were inside the same `lw-header-inner` flex container. With `align-items: flex-end`, the 170px mascot bottom-aligned into the 90px stats band → overlapping.

**Rule:** The stats row must be a **sibling** of `lw-header-inner`, not a child of it:

```jsx
// CORRECT Hero structure
<div className="lw-app-header">
  <div className="lw-header-inner">          {/* mascot + hero copy only */}
    <div className="lw-header-mascot">...</div>
    <div className="lw-hero-copy">...</div>   {/* flex:1 directly */}
  </div>
  <div className="lw-stats-row">...</div>    {/* full-width, outside the row */}
</div>
```

`lw-hero-copy` gets `flex: 1; min-width: 0` directly — the intermediate `lw-header-right` wrapper is not needed.

---

### ⚠️ RC9. React 18 StrictMode double-invocation — NEVER put side effects inside state updater functions

**Bug found (PR #113):** `answerQuestion` in `useQuizSession` called `updateProgress` (which calls `recordAttempt` and `recordWordAnswer`) **inside** the `setSession(prev => ...)` updater function. React 18 StrictMode deliberately calls state updater functions **twice** in development to detect impure reducers. Result: every answer attempt recorded two events → "4 answered / 4 wrong" when the user had only answered 2 questions.

**Rule:** State updater functions (`setState(prev => …)`) must be **pure** — zero side effects. Any call to `updateProgress`, `saveStoredState`, logging, or external APIs must happen **outside** the updater.

```js
// BAD — updateProgress fires twice in StrictMode dev (and could in production too)
setSession(prev => {
  const result = gradeQuestion(prev.questions[prev.index], response);
  updateProgress(state => recordAttempt(state, { ... })); // ← INSIDE updater = double-fire
  return { ...prev, feedback: result, awaitingNext: true };
});

// GOOD — read prev from a ref, call side effects outside the updater
const prev = sessionRef.current;
if (!prev || prev.awaitingNext) return;
const result = gradeQuestion(prev.questions[prev.index], response);
const newSession = { ...prev, feedback: result, awaitingNext: true };
sessionRef.current = newSession;
setSession(newSession);           // ← simple assignment, no updater function
updateProgress(state => recordAttempt(state, { ... }));  // ← OUTSIDE = fires once
```

**The `sessionRef` pattern:** Mirror every session state object in a `useRef` so async callbacks can safely read current state without going through the React state updater:

```js
const sessionRef = useRef(null);

// When state changes:
sessionRef.current = newSession;
setSession(newSession);

// In callbacks — read from ref, not from state (avoids closure staleness + updater):
const prev = sessionRef.current;
```

**Checklist for any hook that records progress or fires analytics:**
- [ ] Is `updateProgress` / `recordAttempt` called **outside** `setState()` updater functions?
- [ ] Is session state mirrored in a `useRef` so callbacks always see current state?
- [ ] Have you verified in dev mode (StrictMode on) that attempts only record once?

---

### ⚠️ RC10. Study Book drawer — render once at App level, not inside page components

**Architecture (PR #113):** The Study Book drawer is a persistent overlay that must survive tab navigation. If it were rendered inside a page component, it would unmount and lose all state whenever the user switches tabs.

**Rule:** `<StudyBookDrawer />` is rendered **once** in `AppContent` (inside `App.jsx`), wrapped in `<StudyBookProvider>`. Page components only render a `<StudyBookButton>` trigger — they never render the drawer itself.

```jsx
// App.jsx — CORRECT
<StudyBookProvider>
  <AppContent>
    <main>...</main>
    <StudyBookDrawer />   {/* rendered here, survives tab switches */}
  </AppContent>
</StudyBookProvider>

// QuizPage / ReadingPage / BuilderPage — CORRECT
<StudyBookButton dataset={dataset} />  {/* trigger only — no drawer */}

// WRONG — drawer inside a page component unmounts on tab switch
export default function QuizPage() {
  return <><StudyBookDrawer /><main>...</main></>;  // ← never do this
}
```

**`StudyBookContext` state:** open, loading, html, toc, files, activeFile, datasetId, searchQuery, searchMatchIndex, searchMatchCount, currentAnchor, scrollTop, splitMode. All exposed via `useStudyBook()`.

**`StudyBookButton` props:** `dataset` (pack object with `contentMdPath`), `anchor`, `mdPath`, `label`. Returns `null` if the dataset has no study notes → pages never need to conditionally render it.

**Split-mode:** When `splitMode === true`, the drawer adds `body.sb-split-mode` and sets `.lw-app { padding-right: <drawerWidth>px }`. The CSS rule in `global.css` provides the default: `body.sb-split-mode .lw-app { padding-right: 420px; transition: padding-right 0.3s ease }`. The actual value is set inline by `useSplitMode()`.

---

### ⚠️ RC11. Chrome Web Speech API — never call `speak()` immediately after `cancel()`

**Bug found (PR #113):** The `speak` button in ReadingPage made no sound. The `useSpeech` hook called `synth.cancel()` then immediately `synth.speak(utterance)`. Chrome's Web Speech API silently **drops** a new utterance when `speak()` is called in the same microtask tick as `cancel()`.

**Rule:** If the synthesiser is currently speaking or has a pending utterance, cancel first and defer the new `speak()` call via `requestAnimationFrame`:

```js
// BAD — Chrome silently drops the utterance
synth.cancel();
synth.speak(utterance); // ← lost

// GOOD — defer via rAF to let the cancel settle
if (synth.speaking || synth.pending) {
  synth.cancel();
  requestAnimationFrame(() => synth.speak(utterance)); // ← arrives after cancel settles
} else {
  synth.speak(utterance);
}
```

**Also:** Always guard against empty text — `new SpeechSynthesisUtterance("")` throws in some browsers.

**Also:** Speech inside `setTimeout` is blocked by Chrome's autoplay policy (outside user-gesture window). Always call `speakText()` inline within the click/event handler. See RC3 for the full LanguagePage pattern.

**The canonical `speakText` implementation** is in `src/utils.js`. Import and reuse it — do not write a new Web Speech wrapper in a hook or component.

---

### ⚠️ RC12. `getRecentActivity` — sessions[] is a supplement, not a fallback

**Bug found (PR #113):** `getRecentActivity` in `progress.js` used `if (events.length) { use events } else { use sessions }`. Once ANY subject (e.g. Computing) created `attemptEvents`, the entire session history was discarded — subjects whose sessions were recorded before `attemptEvents` were introduced (e.g. Biology) became permanently invisible in Recent Learning Activity.

**Rule:** Always run **both passes**. Use `sessions[]` to fill in days that have **zero event coverage**, never as an either/or alternative:

```js
// BAD — once any events exist, all sessions are ignored
if (progress.attemptEvents?.length) {
  for (const ev of progress.attemptEvents) { /* … */ }
} else {
  for (const s of progress.sessions) { /* … */ }
}

// GOOD — two-pass: events first, sessions supplement for uncovered days
// Pass 1: accumulate per-question events
for (const event of progress.attemptEvents || []) {
  const key = dateKey(event.ts);
  rows[key] = rows[key] || emptyRow(key);
  rows[key].questionsAttempted += 1;
  rows[key].correctAnswers += event.correct ? 1 : 0;
  addSubject(rows[key], event.packId);
}
// Pass 2: sessions supplement for days with no event coverage
for (const session of progress.sessions || []) {
  const key = dateKey(session.endTime || session.startTime);
  rows[key] = rows[key] || emptyRow(key);
  if (rows[key].questionsAttempted > 0) continue; // already covered by events
  rows[key].questionsAttempted += session.questionsAnswered || 0;
  rows[key].correctAnswers += session.correct || 0;
  addSubject(rows[key], session.packId);
}
```

---

### ⚠️ RC13. `passageFromItem` — always fall back to `data.title` for passage titles

**Bug found (PR #113):** Passage groups were showing "Passage 2", "Passage 3" instead of real titles. `passageFromItem` in `data.js` only read `data.sourceTitle` and `data.targetTitle`. RE and Science passage packs only have `data.title` (a shared title for both languages).

**Rule:** Always include `data.title` as a final fallback for passage title fields. The runtime passage shape uses **language-agnostic field names** (renamed from German-specific names in PR #123):

```js
// BAD — missing data.title fallback; also uses removed legacy names
passage_de: data.sourcePassage || "",   // ← old name, do not use
title_de: data.sourceTitle || "",       // ← old name, do not use

// GOOD — language-agnostic names + data.title fallback + item-root fallbacks for AI-generated packs
sourceText:  data.sourcePassage  || item.sourcePassage  || "",
targetText:  data.targetPassage  || item.targetPassage  || "",
sourceTitle: data.sourceTitle    || data.title || item.sourceTitle || item.title || "",
targetTitle: data.targetTitle    || data.title || item.targetTitle || item.title || "",
```

**Checklist when a new passage pack type is added:**
- [ ] Does `passageFromItem` handle all title field variants (`sourceTitle`, `targetTitle`, `title`)?
- [ ] Check that passage titles appear in the ReadingPage jump selector (not "Passage 1", "Passage 2")
- [ ] Use `sourceText` / `targetText` / `sourceTitle` / `targetTitle` — never the old `passage_de` / `passage_en` / `title_de` / `title_en`
- [ ] The inline normalizer in `src/main.js` must stay in sync with `passageFromItem()` in `data.js`

---

### ⚠️ RC14. Never access `localStorage` directly — always use `loadStoredState()` / `saveStoredState()`

**Bug found (PR #120):** `AIPromptBuilder.jsx` hardcoded the storage key `"learningGermanWeb.v1"` and read/wrote `localStorage` directly. This bypassed the `mergeState(DEFAULT_STATE, parsed)` step inside `loadStoredState()`, with two consequences:
- New users with empty storage got `null` instead of the correct default values.
- Users with old stored state never received newly-added `DEFAULT_STATE` keys — the migration that `mergeState` performs was skipped entirely.
- The storage key was duplicated in source — if it ever changes, every direct call site breaks independently.

**Rule:** All storage reads and writes must go through the shared API in `src/storage.js`:

```js
import { loadStoredState, saveStoredState } from "@/storage.js";

// READ — always includes DEFAULT_STATE deep-merge for free
function loadMyPrefs() {
  return loadStoredState().prefs.mySection; // defaults already merged in
}

// WRITE — read full state first, patch your section, write back
function saveMyPrefs(prefs) {
  const state = loadStoredState();
  state.prefs.mySection = prefs;
  saveStoredState(state);
}
```

**Never do:**
```js
// BAD — bypasses DEFAULT_STATE merge; duplicates the storage key
const STORAGE_KEY = "learningGermanWeb.v1";
const raw = window.localStorage.getItem(STORAGE_KEY);
const state = raw ? JSON.parse(raw) : {};
```

**Corollary — no duplicate `DEFAULT_VALUES` in components:**
Do not copy the default values from `DEFAULT_STATE` into a component-level `DEFAULT_VALUES` constant. Initialise directly from `loadStoredState()`, which already has defaults merged in:

```js
// WRONG — duplicate that can drift from DEFAULT_STATE
const DEFAULT_VALUES = { subject: "geography", topic: "", level: "KS3", ... };
const [values, setValues] = useState({ ...DEFAULT_VALUES, ...loadSavedPrefs() });

// CORRECT — single source of truth; defaults handled by loadStoredState()
const [values, setValues] = useState(() => loadStoredState().prefs.promptBuilder);
```

**Checklist:**
- [ ] Every new preference key must first be added to `DEFAULT_STATE` in `storage.js`
- [ ] No component or service imports `"learningGermanWeb.v1"` or calls `localStorage` directly
- [ ] Pref persistence uses the read-full → patch → write-back pattern above

---

### ⚠️ RC15. Prompt Builder example presets must not overpower the user's source

**Bug found (2026-06-12):** The 11+ English example preset used Sherlock Holmes
metadata and detailed `additionalInstructions`. If the learner changed the topic
and URL to a different source, those Sherlock-specific instructions could remain
in storage and override the new metadata. The generated prompt then asked for
Augustine/Trinity in one section but Helen Stoner, Baker Street, Roylott and Stoke
Moran in another, so the AI reasonably generated the wrong pack.

**Rule:** In Pack Creator prompts, Source Material and Pack Metadata are
authoritative. `additionalInstructions` are secondary and must be ignored when
they name a different text, URL, scene, character, topic, or question count.

**Implementation checklist:**
- [ ] Example presets use generic wording wherever possible.
- [ ] When topic/source fields change after loading an example, clear
      preset-specific `additionalInstructions`.
- [ ] Prompt templates must say that supplied URLs/pasted text are the primary
      source, not just a loose "anchor".
- [ ] Never ask for placeholder evidence such as `"short supporting quote"`; use
      real source text or omit the field.

---

### ⚠️ RC16. Arcade (and any) prefs must be written THROUGH `ProgressProvider`, not via a side-channel save

`ProgressContext` keeps its **own** copy of the entire stored state and writes it
back on every `updateProgress()`. If a page persists a preference with a
*separate* `loadStoredState()/saveStoredState()` round-trip, the provider is now
holding stale data — and the next normal progress write (`recordWordAnswer`,
`recordArcadeResult`, …) clones that stale state and **overwrites your pref**.

Reproduced on the Arcade page: unchecking "Sound", playing, then eating a token
flipped `prefs.arcade.sound` back to `true`.

```js
// WRONG — side-channel save races the provider's state
useEffect(() => { saveArcadePrefs(prefs); }, [prefs]);   // provider still has old prefs

// CORRECT — persist through the same provider state everything else uses
const { progress, updateProgress } = useProgress();      // progress = full stored state
const [prefs, setPrefs] = useState(() => progress.prefs.arcade);
useEffect(() => {
  updateProgress((state) => { state.prefs.arcade = prefs; });
}, [prefs, updateProgress]);
```

**Rule:** if a component reads/writes both `prefs.*` and `progress.*`, route *all*
writes through `updateProgress()` so there is a single source of truth. (Still
RC14-safe — `updateProgress` is the only thing that calls `saveStoredState`.)

---

### ⚠️ RC16. Arcade game loop — authoritative state in refs, `setState` once per discrete step, never per frame

The arcade modes (`games/arcade/QuizHuntGame.jsx`, `SnakeBuilderGame.jsx`) run a
`requestAnimationFrame` loop (`engine/useGameLoop.js`). Two hard rules:

- **Authoritative per-step state lives in a ref** (`gRef`). React state is a cheap
  *snapshot* set **once per discrete grid step** (~5–6×/sec), not once per
  animation frame. A per-frame `setState` would rebuild the React tree 60×/sec.
- **Side effects fire imperatively in the step handler**, never inside a state
  updater (RC9). The loop reads `onStep`/`stepInterval` from refs so a changing
  callback never restarts or staleness-traps it; the rAF is started/stopped in a
  `useEffect` with cleanup (StrictMode-safe).
- **Directional input** is buffered in a ref (`directionRef`) written by
  `useArcadeControls` (swipe + WASD/arrows + D-pad) and read each step — no
  re-render per keypress. To make the player stop after an event, the handler
  resets `directionRef.current = "none"`.

If you add a mode, copy this discipline. Do **not** drive movement with
`setInterval`, and do **not** `setState` inside the rAF tick.

---

### ⚠️ RC17. Arcade tokens occupy a multi-cell *footprint* — placement, rendering, and collision must agree

A word pill can span several grid cells (wide horizontal, or rotated 90°
vertical for long words). `utils/tokenLayout.js` is the single source of truth:

- `tokenLayout(text, cellPx)` decides orientation (rotate only when the word is
  much wider than a cell) — **GameBoard rendering must use the same call** so the
  visual matches the logic.
- `tokenCells(...)` maps a pill to the cells it covers by a coverage threshold:
  collision uses **≥50%** (`tokenContains`) so the player only "eats" a word when
  genuinely under it (no phantom touches when merely beside one); placement
  reserves any cell touched **≥18%** so pills never visually overlap each other
  or the player.
- `placeTokensNoOverlap(...)` reserves each footprint (+ a ring around the player)
  and places longest words first, with a graceful fallback if the board is tight.

Collision and rendering both depend on the live `cellPx`; thread it through
`step()`/`initState()` (via a `cellPxRef`) — a stale cell size desyncs the
footprint from what is drawn.

---

### ⚠️ RC18. Arcade wrong tokens must be excluded from subsequent collision checks

Once a wrong token has been hit it is marked `state = "wrong"` but **stays on the
board** as a visual indicator. Without an explicit guard, the player moving through
or near it on the very next step triggers another collision, costing a second heart.

```js
// WRONG — hits the same token twice
const hit = g.tokens.find((t) => tokenContains(t, g.player.x, g.player.y, cellPx));

// CORRECT — skip already-hit tokens
const hit = g.tokens.find(
  (t) => t.state !== "wrong" && tokenContains(t, g.player.x, g.player.y, cellPx)
);
```

Applied in `QuizHuntGame.jsx`. If you add a new mode that keeps wrong tokens on the
board, apply the same guard.

---

### ⚠️ RC19. Arcade map walls must include the outer border ring — pure visual borders do not block movement

The early version rendered the border ring as decorative `arc-border-cell` divs but
did **not** add those cells to `map.walls`. The snake used modulo wrapping and could
leave the visible play area.

The fix: `generateMap()` adds the full outer ring to `map.walls` for every layout.
`stepInDirection()` already respects walls, so no further change is needed. The
GameBoard detects border cells by position (`x===0 || x===cols-1 || y===0 ||
y===rows-1`) and applies `arc-border-cell` styling; interior walls use `arc-wall`.

**Rule:** if you add a new map layout, always add its boundary cells to `map.walls`.
Never rely on purely visual tiles to constrain movement.

---

### ⚠️ RC20. Sentence Snake: two tokens at a time, distractor from the same sentence — never all words at once

The original Snake loaded all sentence words + random decoys from other questions
onto the board at once. This caused clutter, out-of-context distractors, and tokens
spawning on the growing snake body.

Current design (`spawnPair`):
- Exactly **2 tokens** on screen: next correct word + 1 distractor drawn from the
  **remaining words in the same sentence** (future words the player will collect).
- On the **final word** only 1 token appears — no distractor.
- Tokens are placed avoiding all current body cells (`reserved = [...g.body]`).
- After eating a correct word OR hitting a wrong token, both tokens are respawned
  at new body-safe positions.

Do not revert to all-at-once placement. Do not use decoys from other questions
(they add confusion and break the sentence-learning purpose).

---

### ⚠️ RC21. Extracted React components must not read parent-local state unless it is passed explicitly

**Bug found (PR #179):** `PassageSetup` was extracted as a top-level helper component but read `readingVoicePractice`, `setReadingVoicePractice`, `updateProgress`, and `voice` directly from the parent page scope. The file still built, but the first render of Reading setup threw a runtime `ReferenceError` because those names do not exist inside the child component's lexical scope.

**Rule:** If an extracted component needs parent-owned state, callbacks, or service objects, pass them as props. Never "reach upward" by referencing a variable declared in the parent component body.

```jsx
// BAD — child reads variables that only exist inside ReadingPage()
function PassageSetup({ manifest, prefs }) {
  return <input checked={readingVoicePractice} onChange={() => updateProgress(...)} />;
}

// GOOD — every dependency is explicit in the props list
function PassageSetup({ manifest, prefs, readingVoicePractice, setReadingVoicePractice, updateProgress, voice }) {
  return <input checked={readingVoicePractice} onChange={() => updateProgress(...)} />;
}
```

**Checklist when extracting JSX into a helper component:**
- [ ] Search the child body for identifiers not declared in the child itself.
- [ ] Every parent-owned state value or callback is listed in the props signature.
- [ ] Re-test the first render path, not just the interaction path — these bugs fail on mount.

---

### ⚠️ RC22. Voice / async UI states must be mapped exhaustively into both UI feedback and domain actions

**Bug found (PR #179):**
- The voice hook added a new `wrong-language` phase, but page-level feedback mappers only handled `unclear`, `incorrect`, and `correct`, so the new branch in `VoiceFeedbackPanel` was dead.
- Language Ladder treated a `"correct"` voice result as UI-only success and then dispatched the regular tile-check reducer path, which still graded against `selectedTiles` instead of the spoken answer.

**Rule 1:** Whenever a hook exports a new state enum, update **every** consumer that maps that enum into UI status.

```js
// BAD — new hook phase is silently dropped
const status =
  voice.phase === "unclear" ? "unclear" :
  voice.phase === "incorrect" ? "mispronounced" :
  voice.phase === "correct" ? "correct" :
  null;

// GOOD — exhaustive mapping for every public hook phase
const status =
  voice.phase === "unclear" ? "unclear" :
  voice.phase === "wrong-language" ? "wrong-language" :
  voice.phase === "incorrect" ? "mispronounced" :
  voice.phase === "correct" ? "correct" :
  null;
```

**Rule 2:** A success state in UI is not enough. If a feature is meant to complete a lesson step, record progress through the authoritative reducer / session API using the actual payload the reducer expects.

```js
// BAD — flashes success UI, then grades empty selectedTiles
if (voice.phase === "correct") {
  onDispatch("pl-builder-check");
}

// GOOD — pass the spoken answer into the reducer path that records progress
if (voice.phase === "correct" && voice.lastResult?.transcript) {
  onDispatch("pl-builder-check", { spokenAnswer: voice.lastResult.transcript });
}
```

**Checklist when integrating a voice / async helper hook:**
- [ ] Every exported phase is mapped by every consumer.
- [ ] Success transitions call the real domain action, not just UI state setters.
- [ ] Retry paths and first-attempt paths share the same validation branches.
- [ ] Add at least one regression test for any reducer/action path that now accepts async payloads.

---

### ⚠️ RC23. Language Ladder speech features must be capability-gated per browser, and data fallbacks must preserve the learning flow

**Bug found (PR #181 follow-up):**
- Browsers without `SpeechRecognition` still rendered the Language Ladder "Voice Practice Mode" toggle, inviting the learner into a dead feature.
- Browsers without speech playback could strand the lesson in the Listen phase even though no audio could play.
- Stage 2 builder data relied on monolithic CJK sentence tiles, so even after the React UI was fixed the data still produced a one-button "builder".

**Rule 1:** Gate speech UI from the actual browser capability, not from optimistic assumptions.

```js
// BAD — always shows speech-only controls
<label><input type="checkbox" checked={voicePracticeMode} /> Voice Practice Mode</label>

// GOOD — only render recognition UI when the browser supports it
const voicePracticeSupported = isSpeechRecognitionSupported();
{voicePracticeSupported && <VoicePracticeToggle ... />}
```

**Rule 2:** If a prerequisite phase is unavailable, remove it from the visible step order and jump to the next valid phase. Do not leave Back/Next paths pointing at hidden phases.

```js
// GOOD — listen is hidden and the session starts at vocab when playback is unavailable
const phase = !speechPlaybackSupported && session.phase === "listen"
  ? "vocab"
  : session.phase;
```

**Rule 3:** For CJK builder content, never trust `translation.tiles` blindly when it is a single full-sentence string. Use a segmentation fallback in the runtime, and repair the source data so the fallback is not the only protection.

**Checklist for Language Ladder speech / builder work:**
- [ ] `speechSynthesis` and `SpeechRecognition` are checked separately.
- [ ] Listen and Voice Practice controls disappear cleanly when unsupported.
- [ ] Hidden phases are removed from the stepper and from Back/Next behaviour.
- [ ] Stage 2 builder data has multi-token `tiles` for zh/ja sentences.
- [ ] Add a browser regression test that forces speech APIs off and verifies the fallback flow.

---

### ⚠️ RC24. Question types must own distinct data and UI contracts; randomized QA must pin its seed

**Mistake (Chinese Input, 2026-07-30):** A root-recognition question borrowed a multi-key character record, reduced its accepted answer to the first root key, and then rendered the borrowed character's full canonical sequence after submission. The evaluator behaved correctly, but learners saw `二 = MM`, typed `M`, and appeared to receive a premature full-character answer. A Playwright repeated-key test also passed or failed depending on `Date.now()` because it assumed the shuffled first character always used `DD`.

**Rule:**

- Root-recognition questions carry `rootKey` and `rootLabel`, not a borrowed `characterId`.
- Root feedback explains the root-to-key mapping and never renders character decomposition.
- Guided-typing questions retain the displayed character's complete accepted-code set.
- For every multi-key guided question, the first-key prefix must not auto-submit.
- Browser tests that depend on shuffled content must pin the random seed or discover a suitable data-driven question before interacting.
- Generated-curriculum tests must assert these invariants across every adapted lesson, because legacy fixtures may contain only one-key root characters and hide the bug.

---

### ⚠️ RC25. Assistance controls must own the cue they reveal; keyboard states need one visual meaning

**Mistake (Chinese Input, 2026-07-30):** The Hint button repeated meaning and code metadata already visible on the question card, while the expected keyboard key was highlighted independently and by default. Disabling guidance also made inactive lesson keys appear available, so grey, green and yellow no longer had stable meanings.

**Rule:**

- Lesson Hint starts off and toggles only the expected-next-key highlight.
- When Hint is on, the yellow cue advances after each correctly positioned input key.
- Inactive lesson keys remain disabled grey regardless of hint state.
- Active lesson keys are light green.
- Only the currently hinted key is yellow.
- Do not perform another state update inside a React state-updater callback when toggling Hint.
- Browser QA must assert both `data-key-state` and the computed colour for grey, light green and yellow.

---

### ⚠️ RC26. Large static learning worlds need cached topology, session boundaries, and post-paint persistence

**Bug found (Chinese Input, 2026-08-03):** The Learning Runtime built 26 root regions by repeatedly scanning 3,000 characters, 560 lessons and 10,000 words. React StrictMode also started the uncached dataset loader twice, while `ProgressContext` cloned and synchronously serialized the entire app state inside the answer event. The result was a 1.6-second keyboard interaction and delayed discovery of the LCP world image.

**Rule:**

- Cache validated dataset promises so StrictMode and remounts share one fetch/parse operation.
- Precompute immutable root-to-character, root-to-lesson and root-to-word topology once per dataset object.
- Never call `find()` over the canonical character array from inside a per-lesson or per-root loop.
- Do not mount or rebuild the full Learning Runtime world while a lesson or game owns the screen.
- Persist state from an effect after React paints; use `pagehide` for the final synchronous flush.
- Fetch only generated artifacts with an active runtime consumer. Build-only assessment and game graphs stay out of the browser request path.
- Preload route-specific LCP art before asynchronous curriculum parsing completes.
- Browser QA must record the longest task, image request start, dashboard-ready time, duplicate data requests and physical-key response time.

---

## PART C — Build & Deployment

---

### ⚠️ CD1. `data/` directory must be explicitly copied into `dist/` — Vite does not include it automatically

**Bug found (PR #111):** The `data/` directory (manifest.json + all pack JSON files, ~31 MB) is fetched at runtime via `fetch('./data/...')`. Vite only copies files in `publicDir` (default `<root>/public/`) into `dist/`. The `data/` directory was never copied → `manifest.json: 404` on production.

**Fix:** `vite-plugin-static-copy` in `vite.config.js`:

```js
import { viteStaticCopy } from "vite-plugin-static-copy";

plugins: [
  react(),
  viteStaticCopy({ targets: [{ src: "data", dest: "." }] }),
],
```

This copies `data/` → `dist/data/` at every build. Verified by `[vite-plugin-static-copy] Copied 578 items.` in build output.

**Checklist for any new directory that is fetched at runtime (not imported):**
- [ ] Is it listed in `viteStaticCopy` targets in `vite.config.js`?
- [ ] Is the path correct? `src: "data"` + `dest: "."` → `dist/data/`
- [ ] After adding a new static directory, run `npm run build` and verify it appears in `dist/`

---

### ⚠️ CD2. Render.com deployment requires `render.yaml` with a build step

**Bug found (PR #111):** Without `render.yaml`, Render served the project root with `python3 -m http.server`. That served the raw `index.html` which contains `<script src="./src/react/main.jsx">` — raw JSX that browsers cannot parse → blank page (only `styles.css` background loaded).

**Rule:** `render.yaml` at the project root must always be present:

```yaml
services:
  - type: web
    name: learning-web
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    headers:
      - path: /*
        name: Cache-Control
        value: no-cache
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

**Why the `/*` rewrite?** Without it, direct navigation to any URL other than `/` returns a 404. The React client-side router handles routing — the server just needs to always return `index.html`.

**`npm start` script** should also build before serving so local production preview works:
```json
"start": "npm run build && python3 -m http.server --directory dist 4173"
```

---

### ⚠️ CD3. `dist/` is gitignored — never commit it, never rely on it being in the repo

`dist/` is in `.gitignore`. The build always runs on the deployment server, not from a committed artefact. If `render.yaml` is misconfigured or the build step is skipped, `dist/` will not exist and the site will 404.

**Checklist on every deploy:**
- [ ] `render.yaml` is present in the repo root
- [ ] Render dashboard shows a successful build step (`npm run build`)
- [ ] `dist/data/generated/manifest.json` exists in the build output (check build logs for "Copied 578 items")

---

### ⚠️ CD4. Branch protection — never push directly to `main`; always use a PR

The `main` branch has push protection. All changes must go through a PR. **Pre-flight before every first push in a session:**

```bash
git fetch origin main
gh pr view --json state,url 2>/dev/null  # check if current branch's PR is already merged
git log --oneline origin/main..HEAD       # confirm only intended commits are ahead
```

- If `state: "MERGED"` → do NOT push more commits to this branch. Create a new branch.
- If `state: "OPEN"` → push to the same branch; the PR updates automatically.

---

### ⚠️ CD5. Runtime-fetched files belong in `public/` (project root), not in `src/`

**Bug found (PR #120):** A markdown prompt file placed at `src/react/public/docs/generate_json_pack_generation_prompt.md` produced a 404 in both dev and production. `src/react/public/` is just a source folder — it has no special meaning to Vite.

**How Vite's public directory works:**
- Vite's built-in public directory is `<project-root>/public/` (configured by `publicDir`, which defaults to `"public"` relative to `root`).
- Files there are served at the root URL **in dev** without any configuration.
- They are **automatically copied into `dist/`** on every production build — no `viteStaticCopy` entry needed.

```
public/docs/my-prompt.md
  → dev:  served at /docs/my-prompt.md
  → prod: copied to dist/docs/my-prompt.md automatically
```

**Rule:** Any file fetched at runtime via `fetch()` (markdown files, JSON config, prompt templates, etc.) must live under `public/` at the **project root**.

```js
// CORRECT — file is at public/docs/my-prompt.md
const res = await fetch("./docs/my-prompt.md");

// WRONG — src/react/public/docs/ is not served; produces 404
// (file placed at src/react/public/docs/my-prompt.md)
const res = await fetch("./docs/my-prompt.md"); // 404 in production
```

**Note on `data/` and `brand/`:** These directories predate this pattern and are NOT in `public/` — they sit at the project root and are handled by `viteStaticCopy` (see CD1). New runtime-fetched assets should use `public/` instead to avoid manual `viteStaticCopy` entries.

**Checklist for any file that is fetched at runtime:**
- [ ] File is placed under `public/` at the project root (not under `src/` or `src/react/`)
- [ ] Run `npm run build` and confirm the file appears in `dist/` at the expected path
- [ ] Test `fetch("./path/to/file")` in both dev (`npm run dev`) and production preview (`npm run preview`)

---

## PART D — CSS & Responsive Layout

---

### ⚠️ CSS1. Nav bar — remove `max-width` constraints to fit 10+ tabs

With 10 tabs the nav will overflow if `max-width` is set on `.lw-nav-inner`. Rules:

```css
.lw-nav-inner {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;           /* scroll instead of wrap */
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  /* NO max-width — let all pills use the full viewport */
}
.lw-nav-pill {
  padding: 6px 11px;           /* tight enough for 10 tabs at 1280px+ */
  font-size: 0.82rem;
  flex-shrink: 0;              /* never squish */
  white-space: nowrap;
}
```

---

### ⚠️ CSS2. Hero background images must be imported as ES modules in React, not as CSS `url()` strings

In React/Vite, `url('./brand/hero-bg.jpg')` in a CSS file works locally (Vite resolves it) but the path may break in production if the asset hash changes.

**Rule:** Import brand images as ES modules and apply them via inline `style` or CSS variables:

```jsx
import heroBg  from "../../../../brand/hero-bg.jpg";
import logoImg from "../../../../brand/logo.png";

// Apply via inline style:
<div style={{ background: `url(${heroBg}) center / cover no-repeat` }} />
<img src={logoImg} />
```

Vite will hash and fingerprint the assets and ensure paths are correct in all environments.

---

### ⚠️ CSS3. Button class modifier uses a **single hyphen** — never BEM double-dash

**Bug found (PR #120):** Prompt-builder components used `.lw-btn--primary` and `.lw-btn--ghost` (BEM `--` double-dash). The design system uses `.lw-btn-primary` and `.lw-btn-ghost` (single hyphen). The BEM classes matched nothing in the stylesheet — buttons were unstyled.

A second issue in the same PR: the commit appended a full `.lw-btn { … }` redefinition to the end of `global.css` (after the existing rule at line 849). Because it appeared later, it overrode the design-system base styles **globally** — Quiz, Builder, Reading, and Progress buttons all lost their colours.

**Correct modifier class names:**

| Role | Correct class | Wrong class |
|---|---|---|
| Primary — blue filled | `lw-btn lw-btn-primary` | `lw-btn lw-btn--primary` |
| Secondary — blue outline | `lw-btn lw-btn-secondary` | `lw-btn lw-btn--secondary` |
| Ghost — transparent | `lw-btn lw-btn-ghost` | `lw-btn lw-btn--ghost` |

**Rules:**
1. Always use **single-hyphen** modifiers: `lw-btn-primary`, `lw-btn-ghost`, `lw-btn-secondary`.
2. **Never redefine `.lw-btn`** anywhere in `global.css`. It is defined once at line 849; any later duplicate overrides every button in the app.
3. Before adding new CSS to `global.css`, `grep` for the class name to confirm it does not already exist.

```jsx
{/* CORRECT */}
<button className="lw-btn lw-btn-primary">Save</button>
<button className="lw-btn lw-btn-ghost">Cancel</button>

{/* WRONG — these classes do not exist in the stylesheet */}
<button className="lw-btn lw-btn--primary">Save</button>
<button className="lw-btn lw-btn--ghost">Cancel</button>
```

---

*Last updated: 2026-08-03*
*Covers PRs #55, #57, #58, #72, #83, #85, #89, #90, #95, #110, #111, #113, #120, #127, #179*
*Architecture: React 18 + Vite, vanilla JS engine modules, Render.com static site deployment*
*For full React component/hook/context map, see `docs/REACT_ARCHITECTURE.md`*
