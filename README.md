# Learning Web

Browser-based study app ported from the local Swift `learningGerman` project.

## Included in this first web version

- vocabulary browser with pack/year/search filters
- quiz flow with mixed question modes
- stage-aware language packs, including Latin <-> English vocab drills
- reading practice from passage packs
- sentence builder drill
- local progress, mastered-word tracking, and review lists

## Source data

The app reuses the copied seed data under `data/` from:

- `/Users/charlestan/project/learningGerman/Sources/LearningGermanCore/Resources/Seed`

It can also import additional datasets into the shared web format. The Cambridge Latin vocab import reads:

- `/Users/charlestan/learning/generated/cambridge-latin-vocab/all_stages.csv`

## Run locally

1. Generate the data manifest:

```bash
python3 scripts/generate_manifest.py
```

If you want to refresh the Cambridge Latin dataset first:

```bash
python3 scripts/import_cambridge_latin_vocab.py
```

2. Start a local web server:

```bash
python3 -m http.server 4173
```

3. Open:

```text
http://127.0.0.1:4173
```

## Notes

- Progress is stored in browser `localStorage`.
- The original `Maze` and `Story` tabs are not ported yet.
- This project is dependency-light on purpose so it is easy to keep in git and open from iPad/iMac without a build step.
