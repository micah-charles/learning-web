# Learning Web Curriculum Prompt Enrichment

Use this prompt after the initial curriculum architecture has created:

- `00_master_general_rules.md`
- topic-group subfolders
- lightweight per-topic `.md` prompt files

The purpose is to enrich each topic prompt so that a later AI agent can generate full study-pack markdown without needing to guess topic scope, required knowledge, misconceptions, stimulus types, or assessment style.

This is a generic enrichment prompt. Replace the placeholders before running it.

---

## BEGIN PROMPT

You are an expert UK curriculum designer, subject specialist, and AI prompt engineer.

Your task is to enrich the topic-specific prompt files inside a curriculum prompt architecture folder.

The enriched prompts will later be used by AI agents to generate complete Learning Web study-pack markdown files, following the rules in `00_master_general_rules.md`.

## Inputs

Subject prompt root:

```text
{{SUBJECT_PROMPT_ROOT}}
```

Master rules file:

```text
{{MASTER_RULES_FILE}}
```

Topic prompt folders to enrich:

```text
{{TOPIC_FOLDERS}}
```

Target curriculum:

```text
{{TARGET_CURRICULUM}}
```

Target audience:

```text
{{TARGET_AUDIENCE}}
```

## Goal

Review every topic `.md` file inside the topic folders and rewrite it as a richer, topic-specific generation prompt.

Do not generate the final study-pack content.

Instead, generate or update the instructions that another AI agent should follow when it later creates the final study pack.

## Required Enriched Topic Structure

Each topic file must use this structure:

```md
# Topic-Specific Prompt Extension: <Topic Title>

Use this file together with `00_master_general_rules.md`. Generate a complete <curriculum/subject> study pack about <topic>.

## Topic Purpose

...

## Required Knowledge

Cover:
- ...

## Required Skills

Students should practise:
- ...

## Required Vocabulary

Include and define:
- ...

## Required Sources / Stimulus Material

Include:
- ...

## Required Diagram / Stimulus Types

Include:
- ...

## Common Misconceptions

Correct:
- ...

## Recommended Question Styles

Include:
- ...

## Quality Check

...
```

If a subject needs a more specific heading, adapt only the heading text while keeping the same purpose. For example:

- `## Required Sacred Texts / Source Material`
- `## Required Data / Graph Stimulus`
- `## Required Code / Diagram Stimulus`
- `## Required Historical Sources`

## Enrichment Rules

For each topic, make the prompt:

- specific enough that an AI agent knows exactly what content to generate
- aligned to UK KS3 unless the folder clearly targets another curriculum
- suitable for Year 7-9 students unless otherwise stated
- compatible with Learning Web study-pack generation
- reusable for batch generation
- written in UK English
- clear, modular and not bloated

Do not copy the full master rules into every topic prompt.

Do not generate lesson content, quizzes, answers, or full explanations.

Do not add unsupported technical schema requirements.

Do not overfit to one textbook unless the topic folder is explicitly textbook-based.

## What To Add

For each topic, enrich the current prompt with:

1. A precise topic purpose
2. Concrete knowledge coverage
3. Skills students should practise
4. Vocabulary that must be defined in the final pack
5. Suitable source, data, diagram, scenario or stimulus types
6. Misconceptions the final pack must correct
7. Question styles the final pack should include
8. A topic-specific quality check

## Learning Web Compatibility

When choosing stimulus and question styles, prefer content that can later become:

- `vocab`
- `fillBlank`
- `sequence`
- `categorySort`
- `passage`
- source interpretation questions
- data interpretation questions
- scenario reasoning questions
- comparison questions
- short-answer and extended-answer questions

Use generic stimulus names such as:

- `sourceExtract`
- `quoteBlock`
- `table`
- `comparisonGrid`
- `timeline`
- `mapExtract`
- `dataTable`
- `asciiDiagram`
- `scenarioCard`
- `flowDiagram`
- `imageDescription`

Do not invent a new JSON schema.

## Subject-Specific Care

Apply subject-specific judgement.

For history:
- require chronology, sources, interpretations, causes, consequences, change, continuity and significance.

For geography:
- require processes, places, maps, data, diagrams, case studies and human/physical links.

For science:
- require key concepts, practical skills, variables, diagrams, equations where appropriate, data handling and misconceptions.

For religious studies:
- require respectful comparison, lived practice, sacred texts/sources, ethical reasoning and worldview diversity.

For computing:
- require algorithms, pseudocode, code/diagram interpretation, trace tables, data representation and real-world examples.

For literature or English:
- require text evidence, inference, themes, character, context, language analysis and model analytical paragraphs.

If the subject is not listed, infer the equivalent curriculum-specific needs.

## Accuracy and Safety

Be careful with sensitive content.

Avoid:

- stereotypes
- sensational language
- invented quotations attributed to real people
- one-sided moral claims
- culturally narrow assumptions
- unsupported factual claims
- unnecessary adult detail for KS3

If a topic involves religion, identity, conflict, discrimination, health, death, violence or politics, keep the wording age-appropriate, balanced and respectful.

## File Editing Instructions

Rewrite the topic prompt files in place.

Preserve:

- folder structure
- filenames
- numbering
- the master rules file
- architecture files

Do not edit generated output folders unless explicitly instructed.

Do not move files.

After enrichment, verify:

- every topic file has the required enriched headings
- no topic prompt is still generic
- no topic file accidentally contains full generated study-pack content
- filenames and folder structure remain unchanged

## Final Response

After editing, report:

- number of topic files enriched
- folders covered
- any files skipped and why
- verification performed
- next command to generate full study-pack markdown, if known

## END PROMPT

---

## Placeholder Example

```text
{{SUBJECT_PROMPT_ROOT}} = <path-to-subject-prompt-root>
{{MASTER_RULES_FILE}} = <path-to-subject-prompt-root>/00_master_general_rules.md
{{TOPIC_FOLDERS}} = 01_world_religions, 02_ethics_and_philosophy, 03_religion_and_society
{{TARGET_CURRICULUM}} = UK KS3 Religious Studies / Religious Education
{{TARGET_AUDIENCE}} = Year 7-9 students
```

## Batch Generation Context

After enrichment, full markdown study packs can usually be generated with the content generation script:

```bash
python3 <path-to-generate-contents-script>/generate_contents.py \
  --prompts-root <subject-prompt-root> \
  --master-prompt <subject-prompt-root>/00_master_general_rules.md \
  --prompt-mode combined \
  --output-dir <subject-prompt-root>/generated_contents \
  --model gpt-5.5
```

Use `--topic-dir` repeatedly if the root contains non-topic markdown files that should be excluded.
