"""
aqa_generate_geography.py — Generate AQA GCSE Geography study notes
and reviewable question data using adaptive OCR parsing.

Two-step output:
  1. study_notes.md per paper — readable Q&A study guide
  2. review_data/<paper>_questions_for_review.md — all proposed questions
     in plain text for ChatGPT to review and correct

Usage:
  PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_generate_geography \
    --markdown-root "markdown/aqa/unknown-qualification" \
    --learning-web-dir "/path/to/learning-web" \
    [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path
from collections import defaultdict

from aqa_pipeline.adaptive_ocr_parser import (
    AdaptiveQPParser,
    AdaptiveMSParser,
    detect_ms_format,
    parse_frontmatter,
    is_rubric_line,
)


PAPERS = {
    "paper-1-living-with-the-physical-environment": {
        "display_name": "Paper 1: Living with the Physical Environment",
        "short_slug": "p1_physical_environment",
        "topics": ["The challenge of natural hazards", "The living world", "Physical landscapes in the UK"],
    },
    "paper-2-challenges-in-the-human-environment": {
        "display_name": "Paper 2: Challenges in the Human Environment",
        "short_slug": "p2_human_environment",
        "topics": ["Urban issues and challenges", "The changing economic world", "Resource management"],
    },
    "paper-3-geographical-applications": {
        "display_name": "Paper 3: Geographical Applications",
        "short_slug": "p3_geographical_applications",
        "topics": ["Issue evaluation", "Fieldwork", "Geographical skills"],
    },
}

SERIES_FOLDER_MAP = {
    "june-2022": "June 2022",
    "june-2023": "June 2023",
    "june-2024": "June 2024",
    "november-2020": "November 2020",
    "november-2021": "November 2021",
}


def _read_exam_series(text: str, fallback: str) -> str:
    fm = parse_frontmatter(text)
    series = fm.get("examSeries", "")
    return series if series else fallback


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')


def generate_study_md(paper_name: str, display_name: str, exam_series: str,
                       ms_data: dict, qp_data: dict) -> str:
    """Generate a readable study_notes.md for one paper."""
    lines = []
    lines.append(f"# AQA GCSE Geography — {display_name}")
    lines.append("")
    lines.append(f"*{exam_series}*")
    lines.append("")
    lines.append("---")
    lines.append("")

    for q_id in sorted(ms_data["questions"].keys()):
        q = ms_data["questions"][q_id]
        qp_q = qp_data.get(q_id, {})

        q_text = qp_q.get("question_text", "")
        if not q_text:
            q_text = f"Question {q_id}"

        lines.append(f"## {q_id}: {q_text}")
        lines.append("")

        if q["is_mcq"] and q["mcq_options"]:
            lines.append("**Options:**")
            for opt in q["mcq_options"]:
                lines.append(f"- {opt}")
            lines.append("")

        if q["answer_text"]:
            lines.append("**Answer:**")
            lines.append("")
            if q["is_mcq"] and q["answer_letter"]:
                lines.append(f"**{q['answer_letter']})** {q['answer_text']}")
            else:
                lines.append(q["answer_text"])
            lines.append("")

        if q["bullet_points"]:
            lines.append("**Key points:**")
            for bp in q["bullet_points"]:
                lines.append(f"- {bp}")
            lines.append("")

        marks = q.get("marks", 0)
        lines.append(f"*[{marks} marks]*")
        lines.append("")
        lines.append("---")
        lines.append("")

    return "\n".join(lines)


def generate_review_data(paper_name: str, display_name: str, exam_series: str,
                          ms_data: dict, qp_data: dict) -> str:
    """Generate a reviewable question data file for ChatGPT review."""
    lines = []
    lines.append("=" * 70)
    lines.append("AQA GCSE GEOGRAPHY — REVIEW DATA")
    lines.append("=" * 70)
    lines.append("")
    lines.append(f"Paper: {display_name}")
    lines.append(f"Series: {exam_series}")
    lines.append(f"Total questions: {len(ms_data['questions'])}")
    lines.append("")
    lines.append("=" * 70)
    lines.append("")
    lines.append("INSTRUCTIONS FOR REVIEW:")
    lines.append("Please review each proposed question below. For each, check:")
    lines.append("  1. Is the answer factually correct?")
    lines.append("  2. Are the distractors (for MCQs) plausible?")
    lines.append("  3. Does the question test geographical knowledge?")
    lines.append("  4. Is the wording clear and unambiguous?")
    lines.append("")
    lines.append("Mark each question as: [OK] / [EDIT] / [REMOVE]")
    lines.append("")
    lines.append("=" * 70)
    lines.append("")

    for q_id in sorted(ms_data["questions"].keys()):
        q = ms_data["questions"][q_id]
        qp_q = qp_data.get(q_id, {})

        lines.append("-" * 60)
        lines.append(f"QUESTION {q_id} ({q.get('marks', 0)} marks)")
        lines.append("-" * 60)
        lines.append("")
        lines.append("REVIEW STATUS: [ ]")
        lines.append("")

        q_text = qp_q.get("question_text", "")

        if q["is_mcq"]:
            lines.append("TYPE: multipleChoice")
            lines.append("")
            lines.append(f"QUESTION TEXT: {q_text}")
            lines.append("")
            if q["mcq_options"]:
                lines.append("OPTIONS:")
                for i, opt in enumerate(q["mcq_options"]):
                    marker = "✓" if q["answer_letter"] and chr(65 + i) == q["answer_letter"] else " "
                    letter = chr(65 + i)
                    lines.append(f"  [{marker}] {letter}. {opt}")
            lines.append("")
            if q["answer_text"]:
                lines.append(f"CORRECT ANSWER: {q['answer_letter']}) {q['answer_text']}")
            lines.append("")
            lines.append("PROPOSED MCQ STRUCTURE:")
            lines.append("```")
            lines.append("{")
            lines.append(f'  "question": "{q_text}",')
            lines.append(f'  "answer": "{q["answer_text"]}",')
            if q["mcq_options"]:
                lines.append(f'  "options": {json.dumps(q["mcq_options"])}')
            lines.append("}")
            lines.append("```")
        else:
            lines.append("TYPE: knowledge / short answer")
            lines.append("")
            lines.append(f"QUESTION TEXT: {q_text}")
            lines.append("")
            if q["answer_text"]:
                lines.append("MODEL ANSWER:")
                lines.append(q["answer_text"])
                lines.append("")
            if q["bullet_points"]:
                lines.append("KEY POINTS:")
                for bp in q["bullet_points"]:
                    lines.append(f"  - {bp}")
                lines.append("")
            lines.append("PROPOSED MCQ (convert knowledge point to multiple choice):")
            lines.append("```")
            if q["bullet_points"]:
                first_point = q["bullet_points"][0]
                lines.append("{")
                lines.append(f'  "question": "Which statement about this topic is correct?",')
                lines.append(f'  "answer": "{first_point}",')
                lines.append(f'  "options": ["{first_point}", "(distractor 1)", "(distractor 2)", "(distractor 3)"]')
                lines.append("}")
            lines.append("```")

        lines.append("")
        lines.append("REVIEW NOTES: ")
        lines.append("")
        lines.append("-" * 60)
        lines.append("")

    total_q = len(ms_data["questions"])
    total_mcqs = sum(1 for q in ms_data["questions"].values() if q["is_mcq"])
    total_knowledge = total_q - total_mcqs
    lines.append("")
    lines.append("=" * 70)
    lines.append("SUMMARY")
    lines.append("=" * 70)
    lines.append(f"  Total questions: {total_q}")
    lines.append(f"  MCQs: {total_mcqs}")
    lines.append(f"  Knowledge/short answer: {total_knowledge}")
    lines.append(f"  Estimated MCQ items (after conversion): {total_mcqs + total_knowledge}")
    lines.append("")
    lines.append("=" * 70)

    return "\n".join(lines)


def process_all(markdown_root: Path, lw: Path, dry_run: bool = False) -> None:
    base_dir = lw / "data" / "Packs" / "gcse" / "geography"
    review_dir = lw / "data" / "generated" / "geography_review_data"
    if not dry_run:
        base_dir.mkdir(parents=True, exist_ok=True)
        review_dir.mkdir(parents=True, exist_ok=True)

    total_files = 0
    all_new_entries = []

    qp_parser = AdaptiveQPParser()
    ms_parser = AdaptiveMSParser()

    for paper_dir_name, paper_config in PAPERS.items():
        display_name = paper_config["display_name"]
        short_slug = paper_config["short_slug"]
        topic_list = paper_config["topics"]

        for series_folder, series_label in SERIES_FOLDER_MAP.items():
            paper_path = markdown_root / series_folder / paper_dir_name
            qp_path = paper_path / "question-paper.md"
            ms_path = paper_path / "mark-scheme.md"

            if not qp_path.exists() or not ms_path.exists():
                continue

            print(f"\n{'='*60}")
            print(f"{display_name} — {series_label}")
            print(f"{'='*60}")

            ms_text = ms_path.read_text(encoding="utf-8")
            qp_text = qp_path.read_text(encoding="utf-8")

            actual_series = _read_exam_series(ms_text, series_label)
            ms_fmt = detect_ms_format(ms_text)

            # Parse with adaptive parsers
            ms_data = ms_parser.parse(ms_text)

            if not ms_data["questions"]:
                print(f"  No questions found in mark scheme, skipping.")
                continue

            # Get expected Q IDs from mark scheme
            expected_q_ids = list(ms_data["questions"].keys())

            # Parse QP, using expected IDs for cross-validation
            qp_data = qp_parser.parse(qp_text, expected_q_ids=expected_q_ids)

            # Report parsing stats
            qp_ids = set(qp_data.keys())
            ms_ids = set(ms_data["questions"].keys())
            matched = qp_ids & ms_ids
            qp_only = qp_ids - ms_ids
            ms_only = ms_ids - qp_ids

            print(f"  MS format: {ms_fmt}")
            print(f"  MS questions: {len(ms_ids)}, QP questions: {len(qp_ids)}")
            print(f"  Matched: {len(matched)}")
            if qp_only:
                print(f"  QP-only Q IDs: {sorted(qp_only)[:5]}...")
            if ms_only:
                print(f"  MS-only Q IDs (no QP text): {sorted(ms_only)[:5]}...")

            # Merge QP question text into MS data
            for q_id, q_info in ms_data["questions"].items():
                if q_id in qp_data:
                    q_info["question_text"] = qp_data[q_id].get("question_text", "")

            # Generate study_notes.md
            study_md = generate_study_md(paper_dir_name, display_name, actual_series, ms_data, qp_data)

            series_slug = series_folder.replace("-", "_")
            pack_id = f"gcse_geo_{short_slug}_{series_slug}"
            study_filename = f"{pack_id}.md"
            study_path = base_dir / study_filename

            if not dry_run:
                study_path.write_text(study_md, encoding="utf-8")
            print(f"  [1] study_notes: {study_path.relative_to(lw)}")

            # Generate reviewable question data
            review_data = generate_review_data(paper_dir_name, display_name, actual_series, ms_data, qp_data)

            review_filename = f"{pack_id}_questions_for_review.md"
            review_path = review_dir / review_filename

            if not dry_run:
                review_path.write_text(review_data, encoding="utf-8")
            print(f"  [2] review data: {review_path.relative_to(lw)}")
            print(f"      Questions: {len(ms_data['questions'])}")

            total_files += 1

            all_new_entries.append({
                "id": pack_id,
                "displayName": f"{display_name} ({actual_series})",
                "subject": "geography",
                "curriculum": "gcse",
                "topics": topic_list,
                "sourceLanguageCode": "en-GB",
                "targetLanguageCode": "en-GB",
                "speechLanguage": "en-GB",
                "capabilities": ["revision"],
                "contentMdPath": f"data/Packs/gcse/geography/{study_filename}",
                "reviewDataPath": f"data/generated/geography_review_data/{review_filename}",
                "series": actual_series,
                "paper": display_name,
            })

    print(f"\n{'='*60}")
    print(f"SUMMARY")
    print(f"{'='*60}")
    print(f"  Files generated: {total_files}")
    if all_new_entries:
        print(f"\n  Manifest entries ready for registration:")
        for entry in all_new_entries:
            print(f"    - {entry['id']}: {entry['displayName']}")

    if not dry_run:
        print(f"\n  Study notes: {base_dir}")
        print(f"  Review data: {review_dir}")


def main(argv=None):
    p = argparse.ArgumentParser(description="Generate AQA GCSE Geography study notes + review data")
    p.add_argument("--markdown-root", required=True,
                   help="Path to markdown/aqa/unknown-qualification/")
    p.add_argument("--learning-web-dir", required=True)
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args(argv)

    process_all(
        markdown_root=Path(args.markdown_root),
        lw=Path(args.learning_web_dir),
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()
