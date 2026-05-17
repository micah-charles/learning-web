# Learning Web

Learning Web is a browser-based study app built to turn everyday learning materials into interactive revision tools.

![Learning Web overview](docs/images/learning-web-overview.png)

## About This Project

This project started from a very simple personal idea:

**Can AI help parents and students turn their own study materials into interactive revision exercises automatically?**

When helping my child revise subjects like Geography, German, and History, I noticed that most revision is still very passive — reading notes repeatedly, memorising vocabulary lists, or manually creating questions.

At the same time, modern AI models are already very good at understanding educational content.

So I started building an experimental local-first learning platform called Learning Web.

The goal is not to replace teachers or schools.

The goal is to make revision more interactive, more personalised, and easier for families to create themselves.

## Why This Project Matters

Many AI education projects focus on cloud platforms, enterprise systems, or futuristic AI marketing concepts.

This project focuses on something smaller but practical:

**Helping ordinary families create their own interactive revision content using AI on their local machine.**

The long-term vision is to allow anyone — even without programming experience — to generate personalised learning activities from their own materials with minimal effort.

The project is still experimental and evolving, but it already demonstrates how AI can assist in transforming raw educational content into reusable learning experiences.

## In Progress

The platform is currently under active development, with ongoing work focused on:

- smarter AI-generated question packs
- multi-language learning support
- a growing library of game-based learning modes

## Long-Term Mission

To make personalised, high-quality learning tools accessible to every family, turning ordinary study materials into engaging digital learning experiences.

## Included in this first web version

- vocabulary browser with pack/year/search filters
- quiz flow with mixed question modes
- stage-aware language packs, including Latin <-> English vocab drills
- reading practice from passage packs
- sentence builder drill
- local progress, mastered-word tracking, and review lists

## Source data

The app reuses the copied seed data under `data/` from:

- the original local Swift `learningGerman` seed resources

It can also import additional datasets into the shared web format. The Cambridge Latin vocab import reads:

- `generated/cambridge-latin-vocab/all_stages.csv`

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
