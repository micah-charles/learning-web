# AGENTS.md — AI Agent Operating Rules

> **Read `CLAUDE.md` first.** It contains all schema rules, manifest structure,
> item types, UI conventions, and common bugs. This file covers only the
> agent-specific workflow on top of that.

---

## 0. Architecture awareness

**Read `docs/ARCHITECTURE.md` at least once before doing any work.** It explains:
- How the data pipeline (AQA collection → PDF → Markdown → packs → enrichment → deployment) works end-to-end
- How the Study Book system, FoxChild Tutor, and SEO pages connect to the manifest
- Which scripts produce which outputs and where they're consumed
- The relationship between `pack_unified.json`, `study_notes.md`, `passages.json`, and manifest entries

Understanding this structure prevents mistakes like creating packs without `study_notes.md` (which breaks the tutor search index and SEO pages), or forgetting `contentMdPath` in the manifest.

---

## 1. Pack generation workflow

When generating a new pack:

1. **Read** `docs/pack-generation-prompt.md` for the full generation spec.
2. **Read** `docs/data-structures.md` for the current schema reference.
3. **Create** the pack file at the correct path (see §3 below).
4. **Register** the pack in `data/generated/manifest.json` — include `contentMdPath` if a `study_notes.md` exists.
5. **Run the validator** — do not consider the pack done until it passes:
   ```bash
   python3 scripts/validate_pack.py data/Packs/<curriculum>/<subject>/<id>/pack_unified.json
   ```
6. **Do not modify** live app files (`src/`, `styles.css`, `index.html`) unless explicitly instructed.

---

## 2. Mandatory validation gate

Every generated pack **must pass `scripts/validate_pack.py` before being committed.**

Common failures to fix before running:
- `targetWord` equals `sourceWord` in a vocab item — write a real definition
- `partOfSpeech` uses abbreviation (`n`, `v`) instead of full word (`noun`, `verb`)
- Item is missing `id` or `type`
- Pack header missing `packId`, `schemaVersion`, or `sourceLanguageCode`
- Duplicate item `id` values within the pack

---

## 3. Where to put generated files

```
data/Packs/<curriculum>/<subject>/<id>/
  pack_unified.json    ← vocab, multipleChoice, fillBlank, sequence, categorySort items (REQUIRED)
  passages.json        ← passage items (only if the pack has reading content)
  study_notes.md       ← study book markdown (for StudyBookDrawer + tutor index + SEO pages)
```

data/SentenceBuilderPacks/<id>/
  pack_unified.json    ← sentenceBuilder items only

Valid values: `curriculum` = `ks3` | `gcse` | `other` · `subject` = `language` | `history` | `geography` | `science` | `literature`

Use `multipleChoice` for standalone authored MCQ prompts, such as grammar questions with fixed options. Use `fillBlank` only for cloze prompts containing a `____` blank.

⚠ **Never write to `generated_packs/`** — it is gitignored and the app will never load it.

---

## 4. Manifest registration

Add one entry to `data/generated/manifest.json` under `packs[]` per topic folder:

```json
{
  "id": "glaciation_1",
  "displayName": "Glaciation",
  "subject": "geography",
  "curriculum": "ks3",
  "capabilities": ["revision"],
  "unifiedPath": "data/Packs/ks3/geography/glaciation_1/pack_unified.json",
  "sourceLanguageCode": "en-GB",
  "targetLanguageCode": "en-GB",
  "wordCount": 32
}
```

Add `"passagePath"` and include `"passages"` in `capabilities` when a `passages.json` exists:

```json
{
  "capabilities": ["revision", "passages"],
  "passagePath": "data/Packs/ks3/geography/glaciation_1/passages.json"
}
```

**Always include `contentMdPath` when a `study_notes.md` exists** — this enables three downstream features:

| Feature | What uses it |
|---------|-------------|
| Study Book drawer | Loads and renders markdown at runtime |
| FoxChild Tutor indexer | `build-studybook-index.js` chunks by heading for tutor search |
| SEO pages | `generate-seo-pages.mjs` generates per-pack study book HTML |

Without `contentMdPath`, the pack will have no study book button, the tutor cannot search its content, and SEO pages won't include it.

```json
{
  "contentMdPath": "data/Packs/gcse/geography/gcse_geo_p1_physical_environment_june_2022/study_notes.md"
}
```

**Always verify `id` is unique** across all entries in `packs[]`.

---

## 5. Cross-system awareness

When creating or modifying packs, remember these downstream systems:

- **Study Book**: requires `contentMdPath` in manifest + `study_notes.md` with `##` headings in pack dir
- **FoxChild Tutor**: rebuilds `public/search/studybook-index.json` at build time from ALL `contentMdPath` files
- **SEO pages**: regenerated at build time from ALL `contentMdPath` files — any new pack with study notes automatically appears
- **Subject pages**: grouped by `subject` field in manifest — geography packs appear under /revision/subjects/geography/

If you modify a `study_notes.md`, the tutor index and SEO pages will pick up changes on the next `npm run build`.

---

## 6. AQA pipeline — enrichment workflow

For AQA past-paper subjects (Geography, RS, History):

1. Generate consolidated JSON + study notes using the subject-specific generator
2. Export consolidated JSON with `export_geo_consolidated.py` (Geography) or equivalent
3. Enrich with ChatGPT using the prompt in `docs/aqa-student-answer-enrichment-prompt.md`:
   - Send consolidated JSON as user message
   - ChatGPT adds `studentAnswer` fields (modelAnswer, keyPoints, examTechnique, etc.)
   - Save to `consolidated_<subject>_questions_student_model_answers.json`
4. Deploy with `deploy_geo_packs.py` (Geography) or equivalent:
   - Splits enriched JSON into per-paper `pack_unified.json`
   - Copies `study_notes.md` into each pack directory
   - Registers in manifest with `contentMdPath`
5. Validate every pack with `scripts/validate_pack.py`
6. Run `npm run build` to regenerate tutor index + SEO pages

---

## 7. Branch and PR conventions

- Branch name: `codex/<short-description>`
- One logical change per PR — keep PRs small
- Push to `origin` and open PR against `main` via `gh pr create`
- **Never auto-merge** — wait for the repo owner to review and approve

---

## 8. QA behaviour configuration rule

When changing any user-facing behaviour, check whether the Learning Web QA
engine expectations must also change.

Product behaviour config:
- `src/config/learningBehaviourConfig.js`

QA behaviour config:
- `qa/config/qa-behaviour.config.json`

Validation command:
- `npm run qa:config-check`

Examples that require QA config review:
- Sentence Builder expected rounds change
- Quiz question count or supported options change
- Progressive Learning adds, removes, or reorders steps
- Voice practice is enabled, disabled, or changes retry behaviour
- Study Book image or split-view behaviour changes
- Onboarding presets or first-run flow change
- Mobile game controls or navigation behaviour change

Do not leave product behaviour and QA expectations out of sync.

## 9. Playwright QA rule

When adding or changing user-facing functionality, add or update Playwright
coverage where practical.

Learning Web Playwright QA is local-first:

- Automatic GitHub Actions execution on `push`, `pull_request`, and nightly
  schedule is disabled.
- The workflow may remain in GitHub as manual-only `workflow_dispatch`.
- Do not remove the QA engine, configs, fixtures, scripts, or Playwright setup
  unless the user explicitly asks for that.
- Default expectation: run Playwright locally before merging important changes.

Prefer stable selectors:
- `data-testid`
- semantic roles
- user-visible labels that are intentionally stable

Avoid fragile selectors:
- CSS class names
- visual position
- `nth-child`
- styling-dependent layout assumptions

Run the appropriate checks before shipping:
- `npm ci`
- `npx playwright install`
- `npm run qa:config-check`
- `npm run qa:smoke`
- `npm run qa:data-sample`
- `npm run qa:full` for broad regression coverage

Useful manual variants:
- `npm run build && npm run qa:smoke`
- `QA_USE_LOCAL_SERVER=false QA_BASE_URL=https://www.foxchildidea.com npm run qa:smoke`

## 10. Data-driven QA rule

For data-driven features, tests should read pack JSON and resolve answers from
the same source data the app uses.

Do not hardcode answers unless a test is explicitly using a dedicated fixture
pack created for that purpose.
