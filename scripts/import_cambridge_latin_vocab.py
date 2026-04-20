#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
PACK_DIR = DATA_DIR / "Packs" / "cambridge_latin_stages"
CSV_PATH = Path("/Users/charlestan/learning/generated/cambridge-latin-vocab/all_stages.csv")

def strip_stage_suffix(value: str) -> str:
    return re.sub(r"\^\d+$", "", value.strip())


def split_compound_text(value: str) -> list[str]:
    text = value.strip()
    if not text or text == "-":
        return []

    variants = [text]
    parts = re.split(r"[;,]", text)
    for part in parts:
        cleaned = part.strip().strip('"').strip("'")
        if cleaned:
            variants.append(cleaned)
    return dedupe(variants)


def dedupe(items: list[str]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for item in items:
        key = item.strip()
        if not key:
            continue
        lowered = key.casefold()
        if lowered in seen:
            continue
        seen.add(lowered)
        output.append(key)
    return output


def parse_latin_answers(raw: str) -> list[str]:
    if not raw or raw == "-":
        return []
    variants = [strip_stage_suffix(chunk) for chunk in raw.split(":")]
    return dedupe(variants)


def normalize_slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.casefold()).strip("_") or "general"


def make_record(row: dict[str, str]) -> dict:
    stage = int(row["stage"])
    stage_label = f"Stage {stage}"
    part_of_speech = row["part_of_speech"].strip()
    part_code = row["part_of_speech_code"].strip()
    notes = row["notes_raw"].strip()
    english = row["english"].strip()
    latin = row["latin"].strip()
    pos_slug = normalize_slug(part_of_speech)

    tags = [
        stage_label,
        "Latin",
        f"stage:{stage}",
        f"cat:stage_{stage:02d}",
        f"pos:{part_code}",
    ]
    categories = [
        f"stage_{stage:02d}",
        "cambridge_latin_course",
        pos_slug,
    ]

    return {
        "id": f"clc_stage_{stage:02d}_{int(row['id']):04d}",
        "de": latin,
        "en": english,
        "pos": part_code,
        "part_of_speech": part_of_speech,
        "topic": part_of_speech,
        "tags": tags,
        "level": stage_label,
        "categories": categories,
        "stage": stage,
        "stage_label": stage_label,
        "headword": latin,
        "english_equivalent": english,
        "accepted_answers": parse_latin_answers(row["accepted_answers_raw"].strip()),
        "accepted_translations": split_compound_text(english),
        "notes": None if notes == "-" else notes,
    }


def main() -> None:
    if not CSV_PATH.exists():
        raise SystemExit(f"Missing source CSV: {CSV_PATH}")

    with CSV_PATH.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        records = [make_record(row) for row in reader]

    stage_options = sorted({record["stage"] for record in records})

    PACK_DIR.mkdir(parents=True, exist_ok=True)

    vocab_path = PACK_DIR / "vocab.json"
    pack_path = PACK_DIR / "pack.json"

    vocab_path.write_text(
        json.dumps(records, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    pack_meta = {
        "display_name": "Cambridge Latin Stages 1-12",
        "topic": "latin_vocab",
        "topic_en": "Cambridge Latin Course vocabulary",
        "grammar_focus_en": "Stage-based Latin to English and English to Latin vocabulary practice",
        "quiz_bucket": "cambridge_latin_stages",
        "source_language_label": "Latin",
        "source_language_code": "la",
        "target_language_label": "English",
        "target_language_code": "en-GB",
        "speech_language": "la",
        "supports_sentences": False,
        "merge_core_sentences": False,
        "stage_options": stage_options,
        "default_quiz_modes": [
            "englishWordChooseGerman",
            "germanWordChooseEnglish",
            "englishWordTypeGerman",
            "germanWordTypeEnglish",
        ],
        "source_file": str(CSV_PATH),
        "word_count": len(records),
    }
    pack_path.write_text(
        json.dumps(pack_meta, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    print(f"Wrote {vocab_path}")
    print(f"Wrote {pack_path}")


if __name__ == "__main__":
    main()
