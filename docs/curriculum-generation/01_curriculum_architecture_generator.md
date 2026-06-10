# Learning Web Curriculum Architecture Generator

You are an expert UK curriculum architect and AI prompt engineer.

Your task is to design a COMPLETE modular prompt architecture for generating educational study packs for the Learning Web platform.

The architecture must support:
- AI-generated revision packs
- interactive quizzes
- MCQs
- fillBlank questions
- comprehension tasks
- diagram/source interpretation
- exam-style questions
- model answers
- revision checklists

The system must be:
- scalable
- modular
- reusable
- AI-generation-friendly
- Codex-compatible
- suitable for batch generation pipelines

---

# Subject

Generate the architecture for:

SUBJECT_NAME_HERE

Target curriculum:
- UK National Curriculum
- KS3 by default unless otherwise specified

Target audience:
- Year 7–9 students
- British curriculum
- UK English

---

# Required Output

Generate ALL of the following:

## 1. Folder Structure

Generate a complete recommended folder structure.

Example format:

subject-prompts/
│
├── 00_master_general_rules.md (please copy from /Volumes/ExtremePro/project/study/ks3-science-prompts/00_master_general_rules.md)
│
├── topic_group/
│   ├── 01_topic.md
│   ├── 02_topic.md
│
└── generated-packs/

The structure should:
- follow realistic UK curriculum organisation
- separate topic domains logically
- remain modular
- support future GCSE expansion

---

## 2. Master Rules File Design

Generate:
- the recommended contents of:
  00_master_general_rules.md

This file must contain ONLY:
- shared educational rules
- formatting rules
- question-generation rules
- curriculum-wide standards
- markdown rules
- stimulus/diagram rules
- exam-question rules
- model-answer rules

It must NOT contain:
- topic-specific knowledge

---

## 3. Topic Prompt Files

For EACH topic:
- generate:
  - filename
  - topic purpose
  - required knowledge
  - required skills
  - required vocabulary
  - misconceptions
  - required diagram/source/data types
  - recommended question styles

Each topic file should be:
- lightweight
- modular
- reusable
- non-duplicative

Avoid repeating master rules.

---

## 4. Learning Web Compatibility

The architecture must support:
- AI-generated packs
- JSON generation
- interactive revision
- quiz systems
- future game modes

Recommend:
- stimulus structures
- reusable rendering concepts
- schema-safe approaches

Do NOT overengineer the schema.

Prefer:
data.stimulus

instead of many custom item types.

---

## 5. Stimulus / Diagram Support

Recommend appropriate stimulus types for this subject.

Examples:
- asciiDiagram
- timeline
- mapExtract
- graph
- sourceExtract
- historicalSource
- equationBlock
- table
- scientificDiagram

Explain:
- which are most important
- how they should render
- how AI should generate them

---

## 6. Subject-Specific Educational Requirements

Identify:
- unique subject requirements
- special assessment styles
- common misconceptions
- progression requirements
- GCSE bridging considerations

---

## 7. Long-Term Scalability Recommendations

Explain:
- how the architecture can scale into GCSE
- how to avoid technical debt
- how to keep prompt files maintainable
- how to keep AI outputs consistent

---

# Output Style

Be:
- practical
- implementation-oriented
- technically structured
- curriculum-aware
- modular-system focused

Avoid:
- generic teaching theory
- vague educational philosophy
- overcomplicated architectures

Focus on:
- reusable AI prompt systems
- scalable educational content generation
- Learning Web integration
- Codex/LLM batch generation workflows