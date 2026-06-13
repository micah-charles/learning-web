"""
deploy_geo_packs.py — Deploy enriched Geography question data into individual
pack_unified.json files and register them in the manifest.

Reads the ChatGPT-enriched consolidated JSON and creates proper Learning Web
pack files for each of the 15 AQA Geography paper-series combinations.

Usage:
  PYTHONPATH=scripts python3 -m aqa_pipeline.deploy_geo_packs \
    --learning-web-dir "/path/to/learning-web" \
    [--enriched-json "path/to/enriched.json"]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


GEO_CURRICULUM = "gcse"
GEO_SUBJECT = "geography"

SERIES_MAP = {
    "june_2022": "June 2022",
    "june_2023": "June 2023",
    "june_2024": "June 2024",
    "november_2020": "November 2020",
    "november_2021": "November 2021",
}


def load_enriched_json(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def load_manifest(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_manifest(path: Path, manifest: dict) -> None:
    path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def normalize_mcq_answer(raw_answer: str, options: list[str], correct_index: int) -> str:
    answer = re.sub(r'^The correct answer is\s+', '', raw_answer, flags=re.IGNORECASE).strip()
    if options and answer not in options:
        if correct_index < len(options):
            answer = options[correct_index]
    return answer


def derive_series(pack_id: str) -> str:
    for key, label in SERIES_MAP.items():
        if pack_id.endswith(key):
            return label
    return "Unknown"


def series_slug(series: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", series.lower()).strip("-")


def build_items(paper: dict, pack_id: str, series: str) -> list[dict]:
    items = []
    topics = paper.get("topics", [])
    slug = series_slug(series)
    tags = ["GCSE", "geography", "AQA", slug]
    display_name = derive_display_name(pack_id, paper["displayName"], series)

    for q in paper.get("questions", []):
        q_id = q["questionNumber"]
        base_id = f"{pack_id}_{q_id.lower().replace('.', '_')}"
        sa = q.get("studentAnswer", {})
        is_mcq = bool(q.get("isMCQ"))

        if is_mcq:
            options = q.get("mcqOptions", []) or []
            raw_answer = sa.get("modelAnswer", q.get("correctAnswer", "") or "")
            answer = normalize_mcq_answer(raw_answer, options, q.get("correctOptionIndex", 0))
            items.append({
                "id": f"{base_id}_mcq",
                "type": "multipleChoice",
                "level": "GCSE Year 10-11",
                "topics": topics,
                "tags": tags,
                "data": {
                    "question": q.get("questionText", ""),
                    "answer": answer,
                    "options": options,
                },
            })
        else:
            key_points = sa.get("keyPoints", [])
            target = sa.get("modelAnswer", q.get("correctAnswer", ""))
            if key_points:
                target = " | ".join(key_points)
            items.append({
                "id": f"{base_id}_kw",
                "type": "vocab",
                "level": "GCSE Year 10-11",
                "topics": topics,
                "tags": tags,
                "data": {
                    "partOfSpeech": "keyword",
                    "sourceWord": f"{q_id}: {q.get('questionText', '')} ({(q.get('marks', 0))} marks)",
                    "targetWord": target,
                    "examples": {
                        "en-GB": display_name,
                    },
                },
            })

    return items


def derive_display_name(pack_id: str, paper_display_name: str, series: str) -> str:
    """Standardized naming matching RS convention: AQA GCSE Geography <series> — Paper <N>: <Name>"""
    return f"AQA GCSE Geography {series} — {paper_display_name}"


def generate_study_notes(paper: dict, series: str) -> str:
    """Generate clean study notes from enriched question data."""
    lines = []
    lines.append(f"# AQA GCSE Geography — {paper['displayName']}")
    lines.append("")
    lines.append(f"*{series}*")
    lines.append("")
    lines.append("---")
    lines.append("")

    for q in paper.get("questions", []):
        q_id = q["questionNumber"]
        q_text = q.get("questionText", f"Question {q_id}")
        sa = q.get("studentAnswer", {})

        lines.append(f"## {q_id}: {q_text}")
        lines.append("")

        if q.get("isMCQ") and q.get("mcqOptions"):
            lines.append("**Options:**")
            for opt in q["mcqOptions"]:
                lines.append(f"- {opt}")
            lines.append("")

        model_answer = sa.get("modelAnswer", q.get("correctAnswer", ""))
        if model_answer:
            lines.append("**Model Answer:**")
            lines.append("")
            for para in model_answer.split("\n"):
                para = para.strip()
                if para:
                    lines.append(para)
                    lines.append("")

        key_points = sa.get("keyPoints", [])
        if key_points:
            lines.append("**Key Points:**")
            for kp in key_points:
                lines.append(f"- {kp}")
            lines.append("")

        exam_technique = sa.get("examTechnique", "")
        if exam_technique:
            lines.append("**Exam Technique:**")
            lines.append("")
            lines.append(exam_technique)
            lines.append("")

        marks = q.get("marks", 0)
        lines.append(f"*[{marks} marks]*")
        lines.append("")
        lines.append("---")
        lines.append("")

    return "\n".join(lines)


def deploy(lw: Path, enriched_path: Path) -> None:
    data = load_enriched_json(enriched_path)

    manifest_path = lw / "data" / "generated" / "manifest.json"
    manifest = load_manifest(manifest_path)

    existing_ids = {e["id"] for e in manifest.get("packs", [])}
    new_entries = []
    updated_ids = []

    for paper in data["papers"]:
        pack_id = paper["packId"]
        paper_display_name = paper["displayName"]
        series = derive_series(pack_id)
        display_name = derive_display_name(pack_id, paper_display_name, series)

        print(f"\n{'='*60}")
        print(f"{display_name}")

        questions = paper.get("questions", [])
        if not questions:
            print(f"  No questions, skipping.")
            continue

        items = build_items(paper, pack_id, series)

        pack = {
            "schemaVersion": "1.1",
            "packId": pack_id,
            "subject": GEO_SUBJECT,
            "title": display_name,
            "sourceLanguageCode": "en-GB",
            "targetLanguageCode": "en-GB",
            "speechLanguage": "en-GB",
            "items": items,
        }

        pack_dir = lw / "data" / "Packs" / GEO_CURRICULUM / GEO_SUBJECT / pack_id
        pack_dir.mkdir(parents=True, exist_ok=True)
        pack_path = pack_dir / "pack_unified.json"
        pack_path.write_text(json.dumps(pack, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"  → pack_unified.json ({len(items)} items)")

        # Generate study notes directly from enriched data
        study_md = generate_study_notes(paper, series)
        md_path = pack_dir / "study_notes.md"
        md_path.write_text(study_md, encoding="utf-8")
        md_path_rel = f"data/Packs/gcse/geography/{pack_id}/study_notes.md"
        print(f"  → study_notes.md")

        # Register or update manifest entry
        mcq_count = sum(1 for i in items if i["type"] == "multipleChoice")
        kw_count = sum(1 for i in items if i["type"] == "vocab")
        entry = {
            "id": pack_id,
            "displayName": display_name,
            "subject": GEO_SUBJECT,
            "curriculum": GEO_CURRICULUM,
            "level": "GCSE Year 10-11",
            "capabilities": ["revision"],
            "unifiedPath": f"data/Packs/gcse/geography/{pack_id}/pack_unified.json",
            "sourceLanguageCode": "en-GB",
            "targetLanguageCode": "en-GB",
            "speechLanguage": "en-GB",
            "contentMdPath": md_path_rel,
            "wordCount": mcq_count + kw_count,
        }
        if pack_id not in existing_ids:
            new_entries.append(entry)
            existing_ids.add(pack_id)
        else:
            # Update existing entry in-place
            for i, e in enumerate(manifest["packs"]):
                if e["id"] == pack_id:
                    manifest["packs"][i] = entry
                    break
            updated_ids.append(pack_id)

    if new_entries:
        manifest["packs"].extend(new_entries)
    if new_entries or updated_ids:
        save_manifest(manifest_path, manifest)
        print(f"\n{'='*60}")
        if new_entries:
            print(f"MANIFEST: {len(new_entries)} new entries registered")
            for e in new_entries:
                print(f"  + {e['id']}: {e['displayName']}")
        if updated_ids:
            print(f"MANIFEST: {len(updated_ids)} existing entries updated")
            for pid in updated_ids:
                print(f"  ~ {pid}")
    else:
        print(f"\n  All packs already registered.")


def main(argv=None):
    p = argparse.ArgumentParser(description="Deploy Geography packs")
    p.add_argument("--learning-web-dir", required=True)
    p.add_argument("--enriched-json", default=None)
    args = p.parse_args(argv)

    lw = Path(args.learning_web_dir)
    enriched_path = Path(args.enriched_json) if args.enriched_json else \
        lw / "data" / "generated" / "consolidated_geography_questions_student_model_answers.json"

    deploy(lw, enriched_path)


if __name__ == "__main__":
    main()
