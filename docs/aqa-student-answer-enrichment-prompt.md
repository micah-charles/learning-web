# AQA Student Model Answer Enrichment — Prompt & Workflow

> How to enrich consolidated AQA question data with student-facing model answers using ChatGPT.
> Applies to: Geography, History, RS, and any future AQA subject.

---

## 1. When to run enrichment

After generating the **consolidated questions JSON** (e.g. `consolidated_geography_questions.json`), you run enrichment to add `studentAnswer` fields before deploying packs.

**Prerequisites:**
- Consolidated JSON with `questions[]` array (each with `questionNumber`, `questionText`, `correctAnswer`, `isMCQ`, `marks`, etc.)
- Consolidated markdown with full study notes (for ChatGPT context)

---

## 2. Input preparation

The input JSON must have this structure:

```json
{
  "papers": [
    {
      "id": "gcse_geo_p1_physical_environment_june_2022",
      "displayName": "Paper 1: Living with the Physical Environment (June 2022)",
      "series": "June 2022",
      "questions": [
        {
          "questionNumber": "Q1.1",
          "questionText": "Which one of the following events is not an example of a natural hazard?",
          "marks": 1,
          "isMCQ": true,
          "mcqOptions": ["A: Earthquake", "B: Flood", "C: Tsunami", "D: Oil spill"],
          "correctAnswer": "D: Oil spill",
          "correctOptionIndex": 3,
          "markSchemeContent": "D: Oil spill\nNo credit if two or more answers are shaded.\nAO1 – 1 mark\n*[0 marks]*"
        }
      ]
    }
  ]
}
```

---

## 3. ChatGPT system prompt

```
You are an expert GCSE Geography examiner and tutor. Your task is to enrich a
consolidated AQA GCSE Geography question dataset with student-facing model
answers. The data contains questions from 15 paper-series combinations across 3
papers (Physical Environment, Human Environment, Geographical Applications).

For each question, add a `studentAnswer` object containing:

Fields to add:
- answerType: "mcq" | "short_response" | "extended_response"
  - mcq: questions with isMCQ=true or 1 mark MCQs
  - short_response: 1-4 mark short-answer questions
  - extended_response: 6+ mark extended writing questions
- modelAnswer: student-facing answer rewritten from mark scheme content.
  For MCQs: the correct option letter and text.
  For short response: 1-2 clear bullet points rewritten from mark scheme.
  For extended response (6+ marks): a top-band (7-9 marks / 6-8 marks)
  model paragraph that a student could write, using GCSE geography
  terminology, with named examples where relevant.
- modelAnswerLevel: "concise GCSE answer" (for short_response/mcq) or
  "top-band GCSE style" (for extended_response)
- keyPoints: array of 3-6 key bullet points summarising what a good answer
  includes. Extract from mark scheme bullet lists + level descriptors.
- examTechnique: 1-2 sentences specific to this question type. Mention:
  command words, mark allocation, AO requirements, common mistakes, or
  time management tips where relevant.
- sentenceBuilderCandidates: array of 3-8 short sentence fragments
  (5-15 words each) that represent key points from the answer. These
  will be used as tiles in a sentence builder exercise. Each fragment
  should be a complete thought that stands alone. For extended response
  answers, include topic sentences, evidence sentences, and evaluation
  sentences.
- confidence: "high" (answer is clear from mark scheme) or "medium"
  (best reconstruction from available data)
- source: "derived_from_mark_scheme_auto_enrichment"
```

---

## 4. User message pattern

Send the consolidated JSON as the user message. Optionally also include the consolidated markdown file for additional context.

**Important:** Instruct ChatGPT to return the **complete enriched JSON**, not just a summary. Every question must retain its original fields plus the new `studentAnswer` object.

---

## 5. Output validation

After enrichment, verify:

1. **All 503 questions** have `studentAnswer` — no question should be missing it
2. **Item type counts** roughly match expectations (MCQ ~40, short_response ~338, extended_response ~125)
3. **No hallucinated content** — modelAnswer should be grounded in the mark scheme, not invented
4. **sentenceBuilderCandidates** are sentence-level (5-15 words), NOT word-by-word tiles. The deployment script (`deploy_geo_packs.py`) strips sentenceBuilder items because these candidates don't reconstruct the full answer.

---

## 6. Output format

```json
{
  "papers": [
    {
      "id": "gcse_geo_p1_physical_environment_june_2022",
      "displayName": "Paper 1: Living with the Physical Environment (June 2022)",
      "series": "June 2022",
      "questions": [
        {
          "questionNumber": "Q1.1",
          "questionText": "...",
          "marks": 1,
          "isMCQ": true,
          "mcqOptions": [...],
          "correctAnswer": "...",
          "correctOptionIndex": 3,
          "markSchemeContent": "...",
          "studentAnswer": {
            "answerType": "mcq",
            "modelAnswer": "D: Oil spill",
            "modelAnswerLevel": "concise GCSE answer",
            "keyPoints": [
              "A natural hazard is a natural event that threatens people or property",
              "Earthquakes, floods, and tsunamis are all natural hazards",
              "Oil spills are caused by human activity, not natural processes"
            ],
            "examTechnique": "This is a 1-mark multiple choice question. Read all options carefully before selecting — some distractors may be plausible but incorrect. Shade only one answer.",
            "sentenceBuilderCandidates": [
              "A natural hazard threatens people or property.",
              "Oil spills are caused by human activity."
            ],
            "confidence": "high",
            "source": "derived_from_mark_scheme_auto_enrichment"
          }
        }
      ]
    }
  ]
}
```

---

## 7. Files

| File | Purpose | Git status |
|------|---------|-----------|
| `data/generated/consolidated_<subject>_questions.json` | Input: pre-enrichment consolidated questions | **gitignored** — regenerated by pipeline |
| `data/generated/consolidated_<subject>_questions_student_model_answers.json` | Output: enriched JSON with studentAnswer fields | **tracked** — ChatGPT output, can't regenerate |
| `data/generated/student_model_answer_enrichment_report.md` | Auto-generated report after enrichment | **gitignored** — regenerated by pipeline |
| `docs/aqa-student-answer-enrichment-prompt.md` | This file — the prompt template + workflow | **tracked** |

---

## 8. Notes

- ChatGPT enrichment is a **one-time manual step** — there is no automated script that calls the ChatGPT API. Copy the input JSON, paste into ChatGPT with the system prompt above, and save the response.
- Large datasets (~503 questions for Geography) may exceed ChatGPT's output token limit. If truncated, ask ChatGPT to continue from where it stopped, providing the last successfully enriched question as context.
- The enrichment report is auto-generated by `export_geo_consolidated.py` (or a post-processing script) that compares input vs output.
- After enrichment, run `deploy_geo_packs.py` to produce per-paper `pack_unified.json` files.
