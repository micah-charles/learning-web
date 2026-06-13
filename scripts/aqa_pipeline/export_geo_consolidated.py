"""
export_geo_consolidated.py — Export two consolidated files from all 15 AQA Geography papers:

  1. consolidated_questions.json  — All 503+ questions with full attributes
  2. consolidated_geography.md    — Complete concatenated study notes

Usage:
  PYTHONPATH=scripts python3 -m aqa_pipeline.export_geo_consolidated \
    --markdown-root "markdown/aqa/unknown-qualification" \
    --learning-web-dir "/path/to/learning-web" \
    [--questions-out "path/questions.json"] \
    [--md-out "path/consolidated.md"]
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from aqa_pipeline.adaptive_ocr_parser import (
    AdaptiveQPParser,
    AdaptiveMSParser,
    parse_frontmatter,
)
from aqa_pipeline.aqa_generate_geography import (
    PAPERS,
    SERIES_FOLDER_MAP,
    _read_exam_series,
    generate_study_md,
)


def collect_all_questions(markdown_root: Path) -> dict:
    """Collect structured question data from every paper-series combo."""
    qp_parser = AdaptiveQPParser()
    ms_parser = AdaptiveMSParser()

    papers_data = []
    total_q = 0

    for paper_dir_name, paper_config in PAPERS.items():
        display_name = paper_config["display_name"]
        short_slug = paper_config["short_slug"]

        for series_folder, series_label in SERIES_FOLDER_MAP.items():
            paper_path = markdown_root / series_folder / paper_dir_name
            qp_path = paper_path / "question-paper.md"
            ms_path = paper_path / "mark-scheme.md"

            if not qp_path.exists() or not ms_path.exists():
                continue

            ms_text = ms_path.read_text(encoding="utf-8")
            qp_text = qp_path.read_text(encoding="utf-8")

            actual_series = _read_exam_series(ms_text, series_label)
            series_slug = series_folder.replace("-", "_")
            pack_id = f"gcse_geo_{short_slug}_{series_slug}"

            ms_data = ms_parser.parse(ms_text)
            qp_data = qp_parser.parse(qp_text)

            questions_list = []
            for q_id in sorted(ms_data["questions"].keys()):
                q = ms_data["questions"][q_id]
                qp_q = qp_data.get(q_id, {})
                q_text = qp_q.get("question_text", "")

                question = {
                    "id": f"{pack_id}_{q_id.lower().replace('.', '_')}",
                    "questionNumber": q_id,
                    "questionText": q_text,
                    "marks": q.get("marks", 0),
                    "isMCQ": q.get("is_mcq", False),
                    "mcqOptions": q.get("mcq_options", []),
                    "correctAnswer": q.get("answer_text", ""),
                    "answerLetter": q.get("answer_letter"),
                    "bulletPoints": q.get("bullet_points", []),
                }
                questions_list.append(question)

            papers_data.append({
                "packId": pack_id,
                "displayName": display_name,
                "series": actual_series,
                "topics": paper_config["topics"],
                "questions": questions_list,
            })
            total_q += len(questions_list)

    return {
        "metadata": {
            "subject": "Geography",
            "curriculum": "GCSE",
            "examBoard": "AQA",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "totalQuestions": total_q,
            "totalPapers": len(papers_data),
        },
        "papers": papers_data,
    }


def build_consolidated_md(markdown_root: Path) -> str:
    """Concatenate all generated study notes into one markdown file."""
    qp_parser = AdaptiveQPParser()
    ms_parser = AdaptiveMSParser()

    lines = []
    lines.append("# AQA GCSE Geography — Complete Study Notes")
    lines.append("")
    lines.append("> All 15 paper-series combinations from June 2022 to November 2021.")
    lines.append("")
    lines.append("---")
    lines.append("")

    for paper_dir_name, paper_config in PAPERS.items():
        display_name = paper_config["display_name"]
        short_slug = paper_config["short_slug"]

        for series_folder, series_label in SERIES_FOLDER_MAP.items():
            paper_path = markdown_root / series_folder / paper_dir_name
            qp_path = paper_path / "question-paper.md"
            ms_path = paper_path / "mark-scheme.md"

            if not qp_path.exists() or not ms_path.exists():
                continue

            ms_text = ms_path.read_text(encoding="utf-8")
            qp_text = qp_path.read_text(encoding="utf-8")

            actual_series = _read_exam_series(ms_text, series_label)

            ms_data = ms_parser.parse(ms_text)
            qp_data = qp_parser.parse(qp_text)

            md = generate_study_md(paper_dir_name, display_name, actual_series, ms_data, qp_data)
            lines.append(md)
            lines.append("")

    return "\n".join(lines)


def main(argv=None):
    p = argparse.ArgumentParser(description="Export consolidated AQA Geography files")
    p.add_argument("--markdown-root", required=True)
    p.add_argument("--learning-web-dir", required=True)
    p.add_argument("--questions-out", default=None)
    p.add_argument("--md-out", default=None)
    args = p.parse_args(argv)

    lw = Path(args.learning_web_dir)
    markdown_root = Path(args.markdown_root)

    questions_path = Path(args.questions_out) if args.questions_out else lw / "data" / "generated" / "consolidated_geography_questions.json"
    md_path = Path(args.md_out) if args.md_out else lw / "data" / "generated" / "consolidated_geography.md"

    print("Collecting question data...")
    data = collect_all_questions(markdown_root)
    questions_path.parent.mkdir(parents=True, exist_ok=True)
    questions_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  → {questions_path}")
    print(f"     {data['metadata']['totalQuestions']} questions across {data['metadata']['totalPapers']} papers")

    print("Building consolidated markdown...")
    md = build_consolidated_md(markdown_root)
    md_path.parent.mkdir(parents=True, exist_ok=True)
    md_path.write_text(md, encoding="utf-8")
    print(f"  → {md_path}")
    print(f"     {len(md.splitlines())} lines")

    print("Done.")


if __name__ == "__main__":
    main()
