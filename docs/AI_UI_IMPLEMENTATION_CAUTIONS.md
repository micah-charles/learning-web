# AI Implementation Cautions — Learning Web

Lessons distilled from real mistakes made during Latin grammar pack development (PRs #55, #57, #58).
Read this before implementing any feature that touches quiz logic, pack loading, or UI state.

---

## PART A — Vanilla JS (this project)

This app is **pure vanilla JS ES modules + Vite**. There is no React, no Vue, no virtual DOM. All UI is string-concatenated HTML re-rendered into `root.innerHTML`. All persistent state is `localStorage`.

---

### ⚠️ 1. Mode resolver must reflect actual pack content

**Mistake made:** `resolveQuizModesForUI` hardcoded the assumption that `fillBlank` items only exist in grammar-*only* packs (`vocabCount === 0`). When the grammar pack was merged into the vocabulary pack, the mixed pack (`vocabCount: 656`, `fillBlankCount: 240`) fell through to vocab-only modes — 240 grammar questions were silently never generated.

**Rule:** Mode resolvers must handle every combination of content:

```js
// BAD — only catches grammar-only packs
if (fillBlankCount > 0 && vocabCount === 0) return ["fillBlank"];
return [choiceMode, typedMode]; // ← mixed packs silently drop fillBlank

// GOOD — any pack with fillBlank items includes the fillBlank mode
const vocabModes = answerMode === "mcq"   ? [choiceMode]
                 : answerMode === "typed" ? [typedMode]
                 : [choiceMode, typedMode];
return fillBlankCount > 0 ? [...vocabModes, "fillBlank"] : vocabModes;
```

**Checklist before adding a new item type to a pack:**
- [ ] Does `resolveQuizModesForUI` handle packs with this type alongside existing types?
- [ ] Does `createQuizSession` have a `case` for this mode?
- [ ] Does `getQuizMaxQuestionCount` count items of this type?

---

### ⚠️ 2. Count the same thing the same way in every call site

**Mistake made:** `fillBlankCount` was computed differently in two places:
- `getQuizMaxQuestionCount`: used stage-filtered count (`filterFillBlankByStage(...)`)
- `resolveQuizModesForUI` at quiz start: used raw unfiltered count (`filterUnifiedItems(...).length`)

This caused mode detection and the max-question-count to disagree when a stage filter was active.

**Rule:** Any derived value (filtered word count, filtered question count, mode list) must be computed identically at every call site. Extract it once above both usages if needed:

```js
// GOOD — compute once, use twice
const filteredFillBlankItems = filterFillBlankByStage(unifiedPack, prefs, dataset);
const fillBlankCount = filteredFillBlankItems.length;

const resolvedModes = resolveQuizModesForUI({ ..., fillBlankCount });
const maxCount = getQuizMaxQuestionCount({ ..., fillBlankCount });
```

---

### ⚠️ 3. localStorage persistence survives pack removals — always fall back gracefully

**Mistake made:** `loadUnifiedPack` threw `Error("No unifiedPath for pack: X")` when a pack ID from localStorage was no longer in the manifest (because the pack had been merged or deleted). This hard-crashed the app on page load for any user with the old pack saved.

**Rule:** Never throw from a loader when the stored preference refers to a resource that may no longer exist. Always fall back:

```js
// BAD
if (!pack || !pack.unifiedPath) throw new Error(`No unifiedPath for pack: ${packId}`);

// GOOD
if (!pack || !pack.unifiedPath) {
  return loadCoreUnifiedPack(manifest); // silent fallback
}
```

Also sanitise stored IDs early, before they reach the loader:

```js
// in applyDatasetDefaults — run before any downstream logic
const knownIds = new Set(listDatasets(runtime.manifest).map((d) => d.id));
if (prefSection.datasetId && !knownIds.has(prefSection.datasetId)) {
  prefSection.datasetId = "core";
}
```

**Rule:** When you delete or rename a pack, search for every place that stores or reads its ID and add a migration guard.

---

### ⚠️ 4. Stage filtering must be applied to every item type uniformly

**Mistake made:** Stage filtering (`filterWordsForScope`) was applied to vocab items but not to `fillBlank` items when computing the badge count. The badge showed 240 regardless of which stages were selected.

**Rule:** Every item type that carries a `level` / `stage` tag must go through the same stage-filtering pipeline. When you add a new item type, mirror the existing filter pattern:

```js
// Pattern: extract stage number, compare against selected stage Set
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

**Checklist when adding a new item type:**
- [ ] Badge count includes stage-filtered count for this type
- [ ] `getQuizMaxQuestionCount` includes this type
- [ ] `createQuizSession` stage-filter block handles this type
- [ ] The stage filter uses the same `"Stage X" → number` extraction logic as vocab

---

### ⚠️ 5. `answerMode` must be threaded through to every question generator

**Mistake made:** `makeFillBlankFromUnified` always generated MCQ options regardless of whether the user selected MCQ or Typed in the UI. The `answerMode` preference existed in `prefs` but was never passed into the function.

**Rule:** Any preference that affects question *format* (MCQ buttons vs text input) must be an explicit parameter of the question generator. Never infer it from global state inside the generator:

```js
// BAD — generator ignores answerMode, always produces options
function makeFillBlankFromUnified(unifiedItems, count, dataset) { ... }

// GOOD — caller decides; generator respects it
function makeFillBlankFromUnified(unifiedItems, count, dataset, answerMode = "mixed") {
  // options = [] for typed; shuffle existing for mcq; etc.
}
```

---

### ⚠️ 6. Merging packs requires updating the manifest atomically

**Mistake made:** After merging two packs' JSON files, the old pack's manifest entry (`cambridge_latin_grammar_challenges`) was not removed at the same time, leaving the UI showing two pack cards in the selector briefly and causing confusion.

**Rule:** A pack merge is a 3-file atomic operation:
1. Update the destination `pack_unified.json` (add merged items)
2. Update `data/generated/manifest.json` — remove the source entry, update destination `wordCount`/`sentenceCount`
3. Delete the source pack directory

Never commit step 1 without steps 2–3 in the same commit.

---

### ⚠️ 7. `innerHTML` re-render means all event listeners are ephemeral

This is a full-re-render app (no virtual DOM). Every time a section is re-rendered via `root.innerHTML = ...`, all previously attached `addEventListener` calls on that DOM are destroyed.

**Rule:**
- All event listeners must be attached inside the render function that produces that DOM — never cache a DOM reference across renders.
- Use event delegation on stable ancestor elements (`document` or `root`) for events that outlive a single render cycle.
- Never do `document.querySelector('.my-button').addEventListener(...)` outside the function that last wrote `.my-button` to the DOM.

---

### ⚠️ 8. `localStorage` is your only persistence layer — protect it defensively

- Always call `saveStoredState` after mutating `persisted`.
- Never mutate nested objects in `persisted` by reference without calling save — `persisted.prefs.quiz.stages.push(x)` mutates in memory but nothing is persisted until `saveStoredState()` is called.
- On load, always apply defaults *after* loading state, not before — so new fields added to `DEFAULT_STATE` are merged in for existing users.

---

### ⚠️ 9. `manifest.json` is the source of truth — the app never introspects the filesystem

The app has no backend. It cannot list directories. The only way a pack appears in the UI is if it has a valid entry in `data/generated/manifest.json`.

**Rule:** Adding, renaming, or removing a pack JSON file has zero effect until `manifest.json` is updated. Always regenerate or hand-edit the manifest as part of any pack change.

---

### ⚠️ 10. Hard browser cache causes stale state during development

After changing pack JSON or manifest, a normal refresh may still serve the old cached files.

**Rule:**
- Always `Cmd+Shift+R` (hard refresh) after any data file change during development.
- If symptoms persist, open DevTools → Application → Storage → Clear Site Data.
- Never diagnose a data bug without first confirming the browser is loading the current files.

---

### ⚠️ 11. Mode ID regex for direction detection must stop before the kind token ("Word"/"Sentence")

**Mistake made:** `makeVocabChoiceFromUnified` used this regex to extract the shown language from a mode ID:

```js
// BAD — stops at "Choose/Type/Build", capturing "englishWord" not "english"
const shownLang = modeId.replace(/^(.+?)(Choose|Type|Build)(.+)$/, "$1");
// "englishWordChooseGerman" → shownLang = "englishWord"
// "englishword" === "english" → false  ← isReverse always false!
```

Both `"germanWordChooseEnglish"` and `"englishWordChooseGerman"` resolved `isReverse = false`, so the direction toggle had zero effect on choice questions — both directions showed the study-language (Latin/German) as the prompt.

**Rule:** The regex must stop before the kind token (`Word` / `Sentence`), not before the action token (`Choose` / `Type` / `Build`):

```js
// GOOD — stops at "Word"/"Sentence", extracting just "english" or "german"
const shownLang = modeId.replace(/^(.+?)(Word|Sentence)(Choose|Type|Build)(.+)$/, "$1");
// "englishWordChooseGerman" → shownLang = "english"
// "english" === "english" → true  ← isReverse correctly true for English → Latin
```

**Also fix:** The `direction` field passed to `buildModeTitle` inside `makeVocabChoiceFromUnified` was inverted — `isReverse ? "studyToTarget"` should be `isReverse ? "targetToStudy"`. When the prompt is the target language (English), the mode direction is `targetToStudy`.

**Checklist when adding or modifying a question generator that parses modeId:**
- [ ] Verify the regex captures only the language name, not trailing kind tokens
- [ ] Test both directions in the UI after any change to mode ID parsing
- [ ] Confirm `isReverse = true` → prompt shows target language, answer requires study language
- [ ] Confirm `isReverse = false` → prompt shows study language, answer requires target language
- [ ] `modeTitle` direction matches the actual prompt/answer orientation

---

## PART B — React (general cautions if this project is ever migrated)

These apply if the app is ever rewritten in React or a React-based framework (Next.js, Remix, etc.).

---

### ⚠️ R1. Never conflate "what the user selected" with "what the pack supports"

In React, derived state is often computed via `useMemo`. It is tempting to write:

```js
const modes = useMemo(() => resolveQuizModesForUI({ subject, direction, answerMode }), [subject, direction, answerMode]);
```

But if `fillBlankCount` and `vocabCount` are not in the dependency array, the mode list will be stale when the pack changes. Always include **all** values that affect the result in the memo deps.

---

### ⚠️ R2. Context values that wrap localStorage must re-sync on external change

If you wrap `localStorage` in a React context, values written by one component won't trigger re-renders in other components unless you:
- Use a state variable (`useState`) rather than reading `localStorage` directly in render
- Or fire a custom storage event and listen for it

Reading `localStorage` in `useEffect` or render without a stable subscription means stale reads after pack switches.

---

### ⚠️ R3. Be explicit about what is "config" vs "derived"

**Config** (user preference, persisted): `answerMode`, `datasetId`, `stages`, `questionCount`  
**Derived** (computed at quiz start, not persisted): `resolvedModes`, `filteredFillBlankCount`, `maxQuestionCount`

In React, derived values belong in `useMemo`, not `useState`. Storing derived values in state creates synchronisation bugs — the state can be stale relative to the config it was derived from.

```js
// BAD — derived value stored in state, can go stale
const [modes, setModes] = useState([]);
useEffect(() => { setModes(resolveQuizModesForUI(...)); }, [answerMode]);

// GOOD — always current, never stale
const modes = useMemo(() => resolveQuizModesForUI({ answerMode, fillBlankCount, vocabCount }), 
  [answerMode, fillBlankCount, vocabCount]);
```

---

### ⚠️ R4. Async data loading needs explicit "pack not found" states

In this vanilla project, `loadUnifiedPack` used to throw on a missing pack ID. In React, async loaders that throw propagate to the nearest error boundary and take down the whole subtree.

Always model the "not found" case explicitly:

```js
// BAD — throws, crashes error boundary
const pack = await loadUnifiedPack(manifest, packId); // throws if not found

// GOOD — returns null, UI handles it
const pack = await loadUnifiedPackSafe(manifest, packId); // returns null if not found
if (!pack) return <FallbackPackView />;
```

---

### ⚠️ R5. Stage filters and question counts must be co-located

In a React app it is natural to compute `filteredWords` in one component/hook and `filteredFillBlankCount` in another. This recreates the same bug that caused the badge and the quiz to disagree — two independent computations of the same filter with potentially different inputs.

**Rule:** Extract all filtered counts into a single `useQuizScope` hook that is the single source of truth. Both the badge and the quiz-start logic should consume from that hook, not recompute independently.

```js
// One hook, one source of truth
const { filteredWords, filteredFillBlankItems, resolvedModes, maxQuestionCount } = useQuizScope({
  dataset, prefs, unifiedPack
});
```

---

### ⚠️ R6. `localStorage` hydration must happen before first render in Next.js / SSR

In Next.js, components hydrate on the server where `localStorage` is undefined. Reading it during the first render causes a hydration mismatch. Always gate `localStorage` reads behind a `useEffect` or `typeof window !== "undefined"` check.

---

---

### ⚠️ 5. Every new npm package MUST be added to the import map

**Mistake made (PR #83):** `admin-validate.js` imported `ajv` and `main.js` imported `fflate` as bare specifiers. These resolved fine via Vite bundling locally, but the **production site at learning-web-gnf4.onrender.com runs in source-served mode** — `python3 -m http.server` serving raw `src/` files, NOT the `dist/` build. The browser tried to resolve bare specifiers, found no entry in the import map, failed to load `main.js` entirely, and left the loading shell on screen permanently.

**Root cause:** The production server serves source files directly (confirmed by PR #75 which added an import map for `dompurify` and `marked`). Vite bundling only happens locally. There is no `public/` directory and `dist/` is gitignored — Vite's build output is never deployed.

**Rule:** Any bare npm import added to **any file in `src/`** must have a matching CDN ESM entry in the `<script type="importmap">` block in `index.html`.

```html
<!-- index.html — keep this in sync with every npm import in src/ -->
<script type="importmap">
  {
    "imports": {
      "dompurify": "https://cdn.jsdelivr.net/npm/dompurify@3.4.5/dist/purify.es.mjs",
      "marked":    "https://cdn.jsdelivr.net/npm/marked@18.0.3/lib/marked.esm.js",
      "fflate":    "https://cdn.jsdelivr.net/npm/fflate@0.8.2/esm/browser.js"
    }
  }
</script>
```

**Checklist for every new npm dependency:**
- [ ] Does the package have a standalone ESM browser build? (check jsDelivr / esm.sh)
- [ ] Is the CDN URL added to the import map in `index.html`?
- [ ] If the package has complex transitive deps, use `https://esm.sh/<pkg>@<ver>` (bundles everything)
- [ ] Prefer zero-dependency implementations where possible — avoids the CDN URL problem entirely

**Prefer custom code over npm packages for small utilities.** `admin-validate.js` was rewritten to use inline item-level checks instead of Ajv, reducing the dependency count to zero for that module.

---

### ⚠️ 6. `handleChange` fires on free-text inputs before `click` — never let it re-render

**Mistake made (PR #85):** `handleChange` listened on `document` for all `change` events. When a user typed in the quiz textarea and clicked **Check answer**, the browser fires events in this order:

1. `mousedown` on the button
2. `blur` on the textarea → **`change` fires** → `handleChange` → `renderApp()` rebuilds the DOM
3. `mouseup` + `click` on the button

By the time `case "quiz-check-typed"` ran, the DOM had already been replaced and `input.value` was `""`. The answer was graded as an empty string, and feedback appeared below the fold. The button appeared to do nothing.

**Rule:** Any free-text input (`<input>`, `<textarea>`) that does **not** directly control a persistent preference must be **explicitly excluded** from `handleChange`. Add a guard at the top:

```js
// BAD — change event on quiz textarea triggers a full re-render before click fires
async function handleChange(event) {
  const { id } = event.target;
  switch (id) {
    // ... no case for "quiz-typed-answer" → falls through to saveStoredState + renderApp()
    default: break;
  }
  saveStoredState(persisted);
  await renderApp(); // ← DOM wiped; textarea value already gone by the time click fires
}

// GOOD — bail out for fields that carry no persistent state
async function handleChange(event) {
  if (event.target.id === "quiz-typed-answer" || event.target.id === "quiz-gap-typed") return;
  // ...
}
```

**Checklist when adding a new free-text input field:**
- [ ] Does this field control a persisted preference? If not, add its `id` to the early-return guard in `handleChange`.
- [ ] If it does control a preference, handle it explicitly in a `case` and never rely on the default fall-through.
- [ ] Verify that clicking a submit button immediately after typing still reads the correct value.

---

### ⚠️ 7. Crossword grid — scroll jump and large-grid overflow

Two related bugs were introduced and re-introduced in the crossword. Document them here so they are never regressed again.

#### 7a. `focus()` without `preventScroll` jumps the page

When the user types a letter, `focusCrosswordCell()` moves focus to the next cell. The default `input.focus()` call causes the browser to scroll the page so the newly-focused cell is in the viewport. If the user has scrolled to the top of a tall grid this jumps them back down.

**Rule:** Always call `focus({ preventScroll: true })` in `focusCrosswordCell`:

```js
// WRONG
input.focus();

// CORRECT
input.focus({ preventScroll: true });
```

#### 7b. Resetting `transform` before measuring causes a scroll flash

`scaleCrosswordToFit()` shrinks the board using `transform: scale(x)`. An early version reset `transform = ""` before reading `board.scrollWidth`, assuming it needed the "natural" width. This caused a one-frame expansion of the board; even with `overflow: hidden` on the wrapper the browser sometimes scrolled to keep the focused cell in view during that flash.

**Rule:** `scrollWidth` and `offsetHeight` are **layout values — they are not affected by CSS `transform`**. Never reset `transform` just to measure them:

```js
// WRONG — resets transform, board briefly expands → scroll flash
board.style.transform = "";
const natural = board.scrollWidth;  // measure, then re-scale

// CORRECT — scrollWidth is always the unscaled layout width
const natural = board.scrollWidth;  // no reset needed
board.style.transform = `scale(${available / natural})`;
```

Only reset the transform when the board already fits (no scale needed):

```js
if (natural > available) {
  board.style.transform = `scale(${available / natural})`;
} else {
  board.style.transform = "";  // safe: board fits, no scroll risk
}
```

#### 7c. Use double `requestAnimationFrame` after `renderApp()`

Reading `board.scrollWidth` in the first rAF after `root.innerHTML = ...` can return 0 because the browser has not yet committed layout for the newly-inserted DOM. Use double rAF:

```js
requestAnimationFrame(() => requestAnimationFrame(scaleCrosswordToFit));
```

---

---

### ⚠️ 8. UI-only sentinel subjects must be guarded in every render function

**Mistake made (PR #89 — "My Packs" feature):** `MY_PACKS_SUBJECT = "my_packs"` was introduced as a UI sentinel stored in `prefs.*.subject`. It is not a real subject — it is a filter meaning "show all uploaded packs". Several render functions had "sanity-check" logic that snapped `prefs.subject` back to the real subject from the loaded dataset:

```js
// WRONG — snap-back overwrote the sentinel, re-showing curriculum pills
if (datasetSubject !== prefs.subject) {
  prefs.subject = datasetSubject; // "my_packs" → "geography"
}
```

Similarly, `renderReadingTab` had fallback logic that ran when `prefs.subject` didn't match the loaded group's subject — and since `"my_packs"` never matches any real subject, it silently reset the groupId to the first real passage group, then showed "No reading packs found" when the uploaded pack wasn't a passage pack.

**Rule:** Any sentinel value stored in `prefs.*.subject` (or any preference) **must be explicitly excluded from every consistency-check / snap-back block** in every render function:

```js
// CORRECT — guard every snap-back with the sentinel check
if (prefs.subject !== MY_PACKS_SUBJECT && datasetSubject !== prefs.subject) {
  prefs.subject = datasetSubject;
}
```

**Also required:** Every render function must gracefully fall back if the sentinel is stored but no matching uploads exist (e.g. after the user clears their uploads):

```js
// At the top of each render function:
if (prefs.subject === MY_PACKS_SUBJECT && !listUploadedRevisionPacks().length) {
  prefs.subject = "";          // reset to "unset" so the default kicks in
  saveStoredState(persisted);
}
if (!prefs.subject) prefs.subject = "language"; // normal default
```

**Checklist when adding a new sentinel subject/filter value:**
- [ ] Is it excluded from every snap-back / consistency-check block in all render functions?
- [ ] Does every render function have an "uploads empty → fall back" guard?
- [ ] Is the sentinel never written into the pack data itself (only into `prefs.*`)?
- [ ] Do all four tab render functions (vocab, quiz, crossword, builder, reading) have the guard?

---

### ⚠️ 9. Uploaded packs live in `manifest.revisionPacks`, not `manifest.packs`

**Mistake made (PR #89 — "My Packs" feature):** `data.js`'s `listDatasets`, `findDataset`, and `loadUnifiedPack` all only read from `manifest.packs` — the static JSON array loaded from disk. `hydrateManifest` (in `admin-storage.js`) injects uploaded packs into a *separate* array, `manifest.revisionPacks`, so uploaded packs were invisible to `findDataset` and fell back to the default core pack.

The Pack dropdown in the UI looked correct (it read from `revisionPacks` directly via `listUploadedRevisionPacks()`), but the quiz and vocab data loaded from the wrong pack — a silent mismatch that was hard to diagnose.

**Rule:** Any function in `data.js` that searches or lists datasets must look in **both** `manifest.packs` (static, capability-filtered) and `manifest.revisionPacks` (uploaded packs with `_uploaded: true`):

```js
// CORRECT — listDatasets includes uploaded packs
export function listDatasets(manifest) {
  const revision = packsWithCapability(manifest, "revision");
  const uploadedRevision = (manifest.revisionPacks || []).filter((p) => p._uploaded);
  return [manifest.core, ...revision, ...uploadedRevision].filter(Boolean).map(asDisplayPack);
}

// CORRECT — loadUnifiedPack falls back to revisionPacks for uploaded IDs
const pack =
  (manifest.packs || []).find((item) => item.id === packId) ||
  (manifest.revisionPacks || []).find((item) => item.id === packId && item._uploaded);
```

**Checklist when adding a new data loader that looks up a pack by ID:**
- [ ] Does it search both `manifest.packs` and `manifest.revisionPacks`?
- [ ] If the pack has an `uploaded://` path prefix, does `fetchJson` have a cache entry for it (registered by `registerPackInCache` at startup)?
- [ ] After a Vite HMR reload during dev, `jsonCache` is cleared — do a hard refresh (`Cmd+Shift+R`) to re-run `hydrateManifest` and repopulate the cache.

---

---

### ⚠️ 10. ZIP uploads: multiple files sharing the same `packId` silently overwrite each other

**Mistake made (PR #89 — Codex review):** The ZIP upload handler processed each JSON file independently and called `saveUploadedPack` once per file. `saveUploadedPack` stores pack blobs under `learningWeb.uploadedPack.${packId}` and replaces any existing metadata entry with the same `id`. A ZIP containing both `pack_unified.json` and `passages.json` with identical `packId` values caused the second file to silently overwrite the first — the revision pack disappeared after ZIP upload, leaving only the passage pack.

**Rule:** When processing a ZIP, group all parsed files by `packId` **before** saving. Merge the `items` arrays of any files that share a `packId` into one combined pack, then call `saveUploadedPack` exactly once per unique ID:

```js
// WRONG — processes files one-by-one; second file with same packId overwrites first
for (const { filename, parsed } of parsedFiles) {
  saveUploadedPack(parsed, filename); // 2nd call for same packId destroys the 1st
}

// CORRECT — merge duplicates first, then save once per unique packId
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

**Checklist for ZIP upload handlers:**
- [ ] Are files grouped by `packId` before any save call?
- [ ] Are `items` arrays merged when the same `packId` appears more than once?
- [ ] Does the merged entry correctly reflect all item types (so `resolveManifestSections` assigns it to both `revisionPacks` and `passageGroups` when needed)?

---

### ⚠️ 11. Uploaded packs for *all* manifest arrays must be included in their respective list functions

**Mistake made (PR #89 — Codex review):** We fixed `listDatasets` to include `manifest.revisionPacks` uploaded entries, but `listPassageGroups` was missed. It still used only `packsWithCapability(manifest, "passages")`, which reads `manifest.packs` (static). `hydrateManifest` injects uploaded passage packs into `manifest.passageGroups` — a different array — so they were completely invisible to `listPassageGroups`, `listPassagePacks`, `loadPassageUnifiedPack`, and the Reading tab's subject-card grid.

**Rule:** Every `list*` function in `data.js` that enumerates a manifest section must also include the corresponding uploaded array:

| Static source | Uploaded source | Function to fix |
|---|---|---|
| `manifest.packs` (capability `"revision"`) | `manifest.revisionPacks` (`_uploaded: true`) | `listDatasets` ✅ |
| `manifest.packs` (capability `"passages"`) | `manifest.passageGroups` (`_uploaded: true`) | `listPassageGroups` ✅ |
| `manifest.packs` (capability `"sentenceBuilder"`) | `manifest.sentenceBuilderPacks` (`_uploaded: true`) | `listSentenceBuilderPacks` — check if needed |

```js
// CORRECT pattern — apply to every list function
export function listPassageGroups(manifest) {
  const staticGroups = packsWithCapability(manifest, "passages");
  const uploadedGroups = (manifest.passageGroups || []).filter((p) => p._uploaded);
  return [...staticGroups, ...uploadedGroups];
}
```

**Checklist when adding a new manifest section or uploaded pack type:**
- [ ] Does the `list*` function for this section include the uploaded array?
- [ ] Does `hydrateManifest` inject into the same array name that `list*` reads?

---

### ⚠️ 12. Uploaded packs use `unifiedPath`; static packs may use a different path field

**Mistake made (PR #89 — Codex review):** Static passage groups store their JSON path in `pack.passagePath`. `loadPassageUnifiedPack` required `pack.passagePath` and threw `Error("No passagePath for pack: ...")` for uploaded packs, which only have `pack.unifiedPath` (set by `hydrateManifest`). The same mismatch applied to `listPassagePacks`, which returned `passagePath: pack.passagePath` — `undefined` for uploaded groups — causing the Reading tab to silently get no packs.

**Rule:** Any loader or helper that resolves a pack's JSON file path must accept **both** the static field name and `unifiedPath`:

```js
// WRONG — only works for static packs
if (!pack?.passagePath) throw new Error(`No passagePath for pack: ${groupId}`);
return fetchJson(`./${pack.passagePath}`);

// CORRECT — works for both static and uploaded packs
const path = pack?.passagePath || pack?.unifiedPath;
if (!path) throw new Error(`No path for pack: ${groupId}`);
return fetchJson(`./${path}`);
```

**Field name reference:**

| Pack type | Static field | Uploaded field (hydrateManifest) |
|---|---|---|
| Revision packs | `pack.unifiedPath` | `unifiedPath` (same ✅) |
| Passage groups | `pack.passagePath` | `unifiedPath` ← mismatch! |
| Sentence builder | `pack.unifiedPath` | `unifiedPath` (same ✅) |

**Checklist when writing a new loader for a manifest section:**
- [ ] Does the loader resolve `pack.passagePath || pack.unifiedPath` (or the section-appropriate fields)?
- [ ] Is `hydrateManifest` setting the same field name that the loader reads, OR is the loader accepting both?
- [ ] Is there a fallback / graceful error rather than a raw `throw` so one bad pack doesn't crash the whole tab?

---

### ⚠️ 13. Monolingual packs — `translations` field shadows `sourceWord`/`targetWord` when `srcCode === tgtCode`

**Mistake made (PR #90):** AI-generated Geography/History/Science packs used the `translations` field (meant for bilingual language packs) instead of `sourceWord`/`targetWord`. Because `srcCode === tgtCode === "en-GB"` in monolingual packs, `loadVocabItems` resolved both `word.de` and `word.en` from `translations["en-GB"]`, making the term equal to its own "definition". Quiz questions became useless: "Climate → choose Climate".

```js
// BAD — both de and en resolve to the same translations["en-GB"] value
const deVal = translations[srcCode] || d.sourceWord;   // "Climate"
const enVal = translations[tgtCode] || d.targetWord;   // "Climate" (same!)

// Result: word.de === word.en === "Climate"
// Quiz prompt: "Climate" → answer options include "Climate" ← meaningless
```

**Root cause:** The `translations` map has only one key (`"en-GB"`) in monolingual packs. When `srcCode === tgtCode`, both lookups hit the same key.

**Fix in `data.js`:** Detect monolingual packs and prefer `sourceWord`/`targetWord` over `translations`:

```js
// CORRECT — isMonoLingual flag prioritises the explicit definition fields
const isMonoLingual = srcCode === tgtCode;
const deVal = isMonoLingual
  ? (d.sourceWord || translations[srcCode] || Object.values(translations)[0] || "")
  : (translations[srcCode] || Object.values(translations)[0] || d.sourceWord || "");
const enVal = isMonoLingual
  ? (d.targetWord || translations[tgtCode] || Object.values(translations).slice(1)[0] || "")
  : (translations[tgtCode] || Object.values(translations).slice(1)[0] || d.targetWord || "");
```

**Pack schema rule:** Non-language packs (Geography, History, Science, Literature) **must not use the `translations` field**. Use `sourceWord` for the term and `targetWord` for the definition:

```json
// WRONG — non-language pack using translations
"data": {
  "partOfSpeech": "keyword",
  "translations": { "en-GB": "Climate" }
}

// CORRECT — non-language pack using sourceWord + targetWord
"data": {
  "partOfSpeech": "keyword",
  "sourceWord": "Climate",
  "targetWord": "The usual weather patterns of a place over a long time."
}
```

**Why it matters for quiz quality:** The quiz generates distractors by comparing `word.de` (term) to `word.en` (definition). If they are the same string, all four MCQ options are identical terms — the question teaches nothing and is trivially guessed or gameable.

**Checklist for monolingual pack authoring / AI generation:**
- [ ] Does every vocab item use `sourceWord` (term) and `targetWord` (definition)?
- [ ] Is `targetWord` different from `sourceWord`? (a definition, not a repeat)
- [ ] Is `translations` absent from every vocab item?
- [ ] Are `sourceLanguageCode` and `targetLanguageCode` both `"en-GB"`?

**Checklist when debugging "quiz shows same word as prompt and answer":**
- [ ] Open the pack JSON — do vocab items use `translations` instead of `sourceWord`/`targetWord`?
- [ ] Check `data.js` `loadVocabItems` — is the `isMonoLingual` guard in place?
- [ ] Do a hard refresh (`Cmd+Shift+R`) after any `data.js` fix — Vite HMR clears `jsonCache` but does not re-run `hydrateManifest`.

---

*Last updated: 2026-05-21*  
*Derived from Learning Web project post-mortem — PRs #55, #57, #58, #72, #83, #85, #89, #90*
