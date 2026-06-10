# AGENTS.md — AI Agent Operating Rules

> **Read `CLAUDE.md` first.** It contains all schema rules, manifest structure,
> item types, UI conventions, and common bugs. This file covers only the
> agent-specific workflow on top of that.

---

## 1. Pack generation workflow

When generating a new pack:

1. **Read** `docs/pack-generation-prompt.md` for the full generation spec.
2. **Read** `docs/data-structures.md` for the current schema reference.
3. **Create** the pack file at the correct path (see §3 below).
4. **Register** the pack in `data/generated/manifest.json`.
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
  pack_unified.json    ← vocab, multipleChoice, fillBlank, sequence, categorySort items
  passages.json        ← passage items (only if the pack has reading content)

data/SentenceBuilderPacks/<id>/
  pack_unified.json    ← sentenceBuilder items only
```

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

**Always verify `id` is unique** across all entries in `packs[]`.

---

## 5. Branch and PR conventions

- Branch name: `codex/<short-description>`
- One logical change per PR — keep PRs small
- Push to `origin` and open PR against `main` via `gh pr create`
- **Never auto-merge** — wait for the repo owner to review and approve
