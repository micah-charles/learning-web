# Prompt Instruction: Keep Data Structure Docs Updated

Use this instruction for all future AI agents working in `learning-web`.

## Rule

Whenever you add, remove, rename, or repurpose:

- a feature
- a JSON file
- a JSONL file
- a manifest section
- a pack metadata field
- a field used by Vocabulary, Quiz, Reading, Builder, or Review

you must also update these two documents in the same task:

- `/Volumes/ExtremePro/project/learning-web/Doc/data-structure-summary.md`
- `/Volumes/ExtremePro/project/learning-web/Doc/data-structure-summary.html`

## Minimum update checklist

- confirm which feature uses the changed structure
- document the file path and file type
- document the fields the UI or runtime now relies on
- update examples if the shape changed
- update the feature-to-data mapping table
- if new packs or pack metadata affect runtime loading, mention whether the browser reads them directly or through `manifest.json`

## Manifest reminder

If the change affects:

- `data/Packs/*/pack.json`
- `data/Packs/*/vocab.json`
- `data/Packs/*/sentences.jsonl`
- `data/SentenceBuilderPacks/*`
- `data/PassagePacks/*`

also check whether `data/generated/manifest.json` needs to be rebuilt via the repo workflow.

## Do not skip this

The documentation is part of the feature change. A task is not complete until the docs above match the current structure.
