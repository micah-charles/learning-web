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

*Last updated: 2026-05-16*  
*Derived from Learning Web project post-mortem — PRs #55, #57, #58*
