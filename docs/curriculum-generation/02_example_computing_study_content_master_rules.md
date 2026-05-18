# KS3 Computing Learning Web — Master General Rules

## Purpose
Generate high-quality KS3 Computing study packs for the British curriculum.
Packs must support:
- revision
- MCQs
- fillBlank questions
- reading comprehension
- algorithm/code interpretation
- diagram and flowchart interpretation
- exam-style questions
- interactive learning

## Audience
- Year 7–9 students
- KS3 British curriculum
- UK English spelling

## Pack Length
Target:
6,000–10,000 words per topic pack.

## Writing Style
Use:
- clear explanations
- technically accurate terminology
- age-appropriate vocabulary
- concise paragraphs
- structured headings

Avoid:
- university-level detail (OS internals, advanced theory)
- unnecessary jargon without definition
- American spelling
- referencing specific versions of Python, Scratch or other tools

## Required Sections
Include:
- Key knowledge
- Key vocabulary
- Common misconceptions
- Real-world examples
- Diagram / code interpretation
- Exam-style questions
- Model answers
- Revision checklist

## Computing Vocabulary Rule
Use correct computing terminology.
Define:
- processes
- data types
- units (bits, bytes, KB, MB, GB, TB)
- computing meanings for ambiguous words (e.g. "register", "protocol", "field")

Always distinguish:
- hardware vs software
- data vs information
- the Internet vs the World Wide Web
- lossy vs lossless compression

## Programming Syntax Rule
When writing pseudocode:
- Use OCR-style or AQA-style pseudocode conventions
- Indent nested structures consistently
- Annotate meaning, do not just show code

When writing Python examples:
- Keep examples short (< 20 lines)
- Use KS3-appropriate constructs only (no classes, decorators, generators)
- Comment every key line

Avoid mixing pseudocode and Python in the same block without clear labelling.

## Algorithm Rule
Always present algorithms with:
- a plain-English description
- a pseudocode or flowchart representation
- a step-by-step trace through an example input

Trace tables must include:
- variable columns
- output column
- step numbers

## Flowchart Rule
Use ASCII flowcharts where possible.
Label shapes clearly:
- OVAL: start / end
- RECTANGLE: process
- DIAMOND: decision (with YES/NO branches)
- PARALLELOGRAM: input / output

Example:

    [START]
       |
    [Input N]
       |
    <N > 0?> -- NO --> [Print "Invalid"]
       |                     |
      YES                 [END]
       |
    [Print N]
       |
    [END]

## Data Representation Rule
Always show conversion worked examples step by step.
For binary:
- show column headers (128 | 64 | 32 | 16 | 8 | 4 | 2 | 1)
- show filled values row beneath

For hexadecimal:
- show nibble split from binary
- show hex digit mapping

## Diagram / Stimulus Rule
Questions may contain:
- flowchart
- traceTable
- pseudocode
- networkDiagram
- hardwareDiagram
- binaryTable
- logicGateDiagram
- databaseTable
- asciiArtDiagram

Use monospaced ASCII diagrams where appropriate.

## MCQ Rule
MCQs should:
- test understanding, not recall alone
- use plausible distractors based on common misconceptions
- include at least one misconception-based wrong answer
- use realistic computing language

## Model Answer Rule
Model answers should:
- use full computing vocabulary
- explain reasoning (not just state facts)
- demonstrate KS3 level expectations
- for programming questions: include annotated code

## Exam-Style Question Rule
Include a mix of:
- 1-mark recall questions
- 2–3-mark explain/describe questions
- 4–6-mark extended response or trace/evaluate questions

Label each question clearly with mark allocation.

## Markdown Formatting Rule
Use:
- clear headings (##, ###)
- bullet points for lists
- tables for comparisons
- code blocks (``` python or ``` pseudocode) for all code/algorithms
- inline backticks for single terms like `variable`, `loop`, `RAM`

## Output Compatibility
Content should support:
- Learning Web
- interactive quizzes
- AI-generated JSON question packs
- revision games
- fillBlank and MCQ rendering
