# Manifest Registration Guide

> How to correctly register a pack so it appears in the Learning Web app.
> Read this **before** editing `data/generated/manifest.json`.

---

## The single most important rule

Static pack files (in `data/Packs/`, `data/SentenceBuilderPacks/`, `data/PassagePacks/`)
must be registered in **`manifest.packs[]`** — NOT in `manifest.revisionPacks[]`.

| Array | Who uses it | When to write here |
|---|---|---|
| `manifest.packs[]` | `listDatasets()` in `data.js` — all UI tabs | **Always** for static JSON packs |
| `manifest.revisionPacks[]` | Admin tab upload injection only | **Never** for static packs |
| `manifest.sentenceBuilderPacks[]` | Builder tab | Sentence builder packs only |

`manifest.revisionPacks` is populated at runtime by the Admin tab when a user
uploads a pack. It is **not read by `listDatasets()`** for static files. Putting
a pack there causes it to pass validation but be invisible to every UI filter.

---

## Canonical entry shape — `manifest.packs[]`

Copy this template and fill in all fields:

```json
{
  "id": "pack_snake_case_id",
  "curriculum": "ks3",
  "subject": "geography",
  "displayName": "KS3 Geography — Coasts",
  "sourceLanguageLabel": "English",
  "sourceLanguageCode": "en-GB",
  "targetLanguageLabel": "English",
  "targetLanguageCode": "en-GB",
  "speechLanguage": "en-GB",
  "stageOptions": [],
  "unifiedPath": "data/Packs/ks3/geography/coasts/pack_unified.json",
  "wordCount": 46,
  "sentenceCount": 0,
  "supportsSentences": false,
  "capabilities": ["revision", "passages"],
  "passagePath": "data/Packs/ks3/geography/coasts/passages.json",
  "contentMdPath": "data/Packs/ks3/geography/coasts/study_notes.md"
}
```

### Field reference

| Field | Required | Notes |
|---|---|---|
| `id` | ✓ | Unique across all entries. Snake_case. |
| `curriculum` | ✓ | `"ks3"` · `"us-middle-school"` · `"other"` |
| `subject` | ✓ | `"geography"` · `"history"` · `"science"` · `"literature"` · `"computing"` · `"religion"` · `"language"` · `"other"` |
| `displayName` | ✓ | Shown in the pack dropdown |
| `sourceLanguageCode` | ✓ | BCP-47, e.g. `"en-GB"`, `"en-US"`, `"de-DE"` |
| `targetLanguageCode` | ✓ | Usually same as source for non-language packs |
| `speechLanguage` | ✓ | BCP-47 for TTS voice. Use `"en-US"` for US content, `"en-GB"` for UK, `"de-DE"` for German. |
| `unifiedPath` | ✓ | Path from repo root to `pack_unified.json` |
| `wordCount` | ✓ | Count of `type: "vocab"` items |
| `capabilities` | ✓ | Always include `"revision"`. Add `"passages"` if a `passages.json` exists. |
| `passagePath` | if passages | Path to `passages.json` — required when `"passages"` is in capabilities |
| `contentMdPath` | if study notes | Path to `study_notes.md` — enables Study Book tab |
| `stageOptions` | ✓ | `[]` for most packs. Cambridge Latin only: `[1, 2, 3, ...]` |
| `sentenceCount` | optional | Count of `type: "sentence"` items |
| `supportsSentences` | optional | `false` unless the pack has sentence items |

### `capabilities` values

```json
["revision"]                    // vocab/quiz/multipleChoice/fillBlank/sequence/categorySort only
["revision", "passages"]        // + reading passages
["revision", "passages", "crossword"]   // + crossword (auto-detected from vocab count)
```

---

## Sentence builder packs — `manifest.sentenceBuilderPacks[]`

Sentence builder packs live in `data/SentenceBuilderPacks/` and have their
own manifest section. They are **separate** from `manifest.packs[]`.

```json
{
  "id": "my_pack_builder",
  "displayName": "My Pack — Builder",
  "subject": "geography",
  "curriculum": "us-middle-school",
  "unifiedPath": "data/SentenceBuilderPacks/my_pack/pack_unified.json",
  "cardCount": 22
}
```

---

## Step-by-step: registering a new pack

1. **Place files** in the correct directory:
   ```
   data/Packs/<curriculum>/<subject>/<packId>/pack_unified.json
   data/Packs/<curriculum>/<subject>/<packId>/passages.json      (if applicable)
   data/Packs/<curriculum>/<subject>/<packId>/study_notes.md     (if applicable)
   ```

2. **Add entry to `manifest.packs[]`** using the template above.
   - Set `capabilities` based on which files exist.
   - Set `passagePath` if `passages.json` exists.
   - Set `contentMdPath` if `study_notes.md` exists.

3. **Add sentence builder entry** to `manifest.sentenceBuilderPacks[]` if applicable.

4. **Validate:**
   ```bash
   python3 scripts/validate_pack.py data/Packs/<curriculum>/<subject>/<packId>/*.json
   python3 scripts/validate_unified.py
   ```
   > ⚠ `validate_unified.py` checks `revisionPacks` — passing it does **not**
   > confirm the pack is visible to `listDatasets()`. Always check `manifest.packs[]`.

5. **Verify `id` is unique** across all entries in `manifest.packs[]`.

---

## Common mistakes

| Mistake | Symptom | Fix |
|---|---|---|
| Entry added to `revisionPacks` instead of `packs` | Passes validation; pack invisible to all UI curriculum filters | Move entry to `manifest.packs[]` |
| Missing `capabilities` field | Pack not returned by `listDatasets()` | Add `"capabilities": ["revision"]` |
| `passagePath` missing but `"passages"` in capabilities | Reading tab can't load passages | Add `passagePath` pointing to `passages.json` |
| Wrong `speechLanguage` | TTS plays wrong accent | `"en-US"` for US, `"en-GB"` for UK, `"de-DE"` for German |
| `contentMdPath` missing | Study Book shows no content | Add path to `study_notes.md` |
| Pack in `data/` but not in `manifest.packs[]` | Pack never appears | Register it |

---

## Validators — what each one checks

| Script | Checks |
|---|---|
| `validate_pack.py` | Individual JSON file schema (item types, required fields, question structure) |
| `validate_unified.py` | `manifest.revisionPacks[]` + `manifest.passageGroups[]` paths exist and load |

Neither validator checks `manifest.packs[]` directly. A pack can pass both
validators and still be invisible if it is in the wrong manifest array.

To verify a pack is truly registered, check:
```bash
python3 -c "
import json
m = json.load(open('data/generated/manifest.json'))
ids = [p['id'] for p in m.get('packs', [])]
print('usmsg packs:', [i for i in ids if 'usmsg' in i])
"
```
