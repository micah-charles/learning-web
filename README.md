# Learning Web

Learning Web is a browser-based study app built to turn everyday learning materials into interactive revision tools.

## Personal Story

This project began as a practical tool to help my son study more efficiently. Over time, it evolved into a broader platform for personalised learning powered by technology and AI.

Originally inspired by supporting my child's academic journey, I wanted a better way to turn school materials into efficient and enjoyable revision resources tailored to his specific needs.

Rather than relying on generic one-size-fits-all learning apps, Learning Web focuses on custom content. It enables parents, teachers, and students to create learning games and revision tools directly from their own study materials.

## Vision

Learning Web is a personal education platform designed to transform everyday study materials into interactive learning experiences.

The goal is to help students learn faster and smarter by converting textbooks, worksheets, PDFs, images, and notes into engaging revision tools such as:

- multiple choice quizzes
- flashcards
- vocabulary trainers
- exam revision packs
- progress tracking
- AI-generated practice questions
- personalised learning packs

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

Runtime study packs are loaded through unified JSON files such as
`data/Packs/[pack]/pack_unified.json`. Vocabulary and sentence items can include
language-agnostic `translations` and `examples` objects keyed by BCP-47 language
codes, for example:

```json
{
  "type": "vocab",
  "data": {
    "sourceLang": "de-DE",
    "targetLang": "en-GB",
    "translations": {
      "de-DE": "das Eis",
      "en-GB": "ice"
    },
    "examples": {
      "de-DE": "Das Eis ist kalt.",
      "en-GB": "The ice is cold."
    }
  }
}
```

Use standard ISO 639 / BCP-47 codes such as `de-DE`, `en-GB`, `en-US`, `fr-FR`,
or `la`. Legacy source files can still feed the conversion scripts, but app
runtime should use manifest `unifiedPath` entries.

Learning Web can also import additional datasets into the shared web format. The Cambridge Latin vocab import reads:

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
