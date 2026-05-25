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
const vocabModes = mode === "mcq"   ? [choiceMode]
                 : mode === "typed" ? [typedMode]
                 : [choiceMode, typedMode];
return fillBlankCount > 0 ? [...vocabModes, "fillBlank"] : vocabModes;
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
const filteredFillBlankItems = filterFillBlankByStage(unifiedPack, prefs, dataset);
const fillBlankCount = filteredFillBlankItems.length;

const resolvedModes = resolveQuizModesForUI({ ..., fillBlankCount });
const maxCount = getQuizMaxQuestionCount({ ..., fillBlankCount });
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
// BAD — fillBlankCount not in deps; modes go stale when pack changes
const modes = useMemo(() => resolveQuizModesForUI({ subject, direction, answerMode }), 
  [subject, direction, answerMode]);

// GOOD
const modes = useMemo(() => resolveQuizModesForUI({ subject, direction, answerMode, fillBlankCount, vocabCount }),
  [subject, direction, answerMode, fillBlankCount, vocabCount]);
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
const modes = useMemo(() => resolveQuizModesForUI({ answerMode, fillBlankCount, vocabCount }),
  [answerMode, fillBlankCount, vocabCount]);
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

*Last updated: 2026-05-25*
*Covers PRs #55, #57, #58, #72, #83, #85, #89, #90, #95, #110, #111*
*Architecture: React 18 + Vite, vanilla JS engine modules, Render.com static site deployment*
