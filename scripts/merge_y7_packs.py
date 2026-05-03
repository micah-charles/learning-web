#!/usr/bin/env python3
"""
merge_y7_packs.py
=================

Creates a single `y7_german_full/pack_unified.json` from all 11 Y7 German
vocab packs, tagging each item with its original pack name as a section topic.

Items from each pack keep their original data; a section topic (e.g. "colours",
"family", "school") is added to the item's topics array so the quiz can filter
by section.

Usage:
  python3 scripts/merge_y7_packs.py --apply   # write the file
  python3 scripts/merge_y7_packs.py           # dry run
"""

import argparse
import json
import os
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
MERGE_OUT = PROJECT_ROOT / "data" / "Packs" / "y7_german_full" / "pack_unified.json"

# All Y7 German packs to merge (in recommended study order)
Y7_PACKS = [
    "y7_birthdays_and_months",
    "y7_colours_and_appearance",
    "y7_days_and_times",
    "y7_school_subjects",
    "y7_teachers_and_possessives",
    "y7_family_and_age",
    "y7_speaking_family",
    "y7_pets",
    "y7_superpets",
    "tiffin01-09",
    "tiffin10-19",
]

# Section label for each pack (used as the item's section topic)
SECTION_LABELS = {
    "y7_birthdays_and_months":  "Birthdays & Months",
    "y7_colours_and_appearance": "Colours & Appearance",
    "y7_days_and_times":         "Days & Times",
    "y7_school_subjects":        "School Subjects",
    "y7_teachers_and_possessives": "Teachers & Possessives",
    "y7_family_and_age":         "Family & Age",
    "y7_speaking_family":        "Speaking: Family",
    "y7_pets":                   "Pets",
    "y7_superpets":              "Superpets",
    "tiffin01-09":               "Tiffin 01–09",
    "tiffin10-19":               "Tiffin 10–19",
}


def load_pack(pid):
    """Load a pack's pack_unified.json. Returns (pack_dict, error_msg)."""
    path = PROJECT_ROOT / "data" / "Packs" / pid / "pack_unified.json"
    if not path.exists():
        return None, f"File not found: {path}"
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f), None
    except json.JSONDecodeError as exc:
        return None, f"JSON error in {pid}: {exc}"


def merge_items(packs_data):
    """
    Merge all vocab/sentence/sequence/sort/gap items from the source packs.
    Each item gets an extra section topic added to its topics array.
    Returns the merged items list and a stats dict.
    """
    merged = []
    stats = {"vocab": 0, "sentence": 0, "sequence": 0, "sort": 0, "gap": 0, "skipped": 0}

    for pid, pack in packs_data:
        section = SECTION_LABELS.get(pid, pid.replace("_", " ").title())
        section_topic = section.lower()  # normalised lowercase topic key

        for item in pack.get("items", []):
            itype = item.get("type", "unknown")

            if itype in ("vocab", "sentence", "sequence", "categorySort", "fillBlank"):
                # Add section as a topic
                existing_topics = list(item.get("topics", []))
                if section_topic not in existing_topics:
                    item["topics"] = existing_topics + [section_topic]

                # Deduplicate topics
                seen = set()
                deduped = []
                for t in item["topics"]:
                    t = t.strip().lower()
                    if t and t not in seen:
                        seen.add(t)
                        deduped.append(t)
                item["topics"] = deduped

                merged.append(item)
                stats[itype] += 1
            else:
                stats["skipped"] += 1

    return merged, stats


def create_merged_pack(packs_data, merged_items):
    """
    Build the final merged pack dict.
    Uses the first pack's language metadata as the base.
    """
    first_pid, first_pack = packs_data[0]

    return {
        "packId":              "y7_german_full",
        "title":               "Y7 German — Full Course",
        "subtitle":            "All 11 Y7 German packs merged — colours, family, school, pets, time, and more",
        "subject":             "German",
        "level":              "Y7",
        "language":            "German",
        "topics":             list(SECTION_LABELS.values()),
        "tags":                ["Y7", "German", "beginner", "full-course"],
        "description":         "A complete Y7 German vocabulary course covering 11 topics: birthdays, colours, appearance, days, times, school subjects, teachers, possessives, family, age, pets, and more. All sourced from the Tiffin Project and custom Y7 packs.",
        "schemaVersion":       "1.1",
        "sourceLanguageLabel": first_pack.get("sourceLanguageLabel", "German"),
        "sourceLanguageCode":  first_pack.get("sourceLanguageCode", "de-DE"),
        "targetLanguageLabel": first_pack.get("targetLanguageLabel", "English"),
        "targetLanguageCode":  first_pack.get("targetLanguageCode", "en-GB"),
        "speechLanguage":      "de-DE",
        "items":               merged_items,
    }


def main():
    parser = argparse.ArgumentParser(description="Merge Y7 German packs into one y7_german_full pack.")
    parser.add_argument("--apply", action="store_true", help="Write the merged pack to disk (default is dry-run)")
    args = parser.parse_args()

    dry_run = not args.apply

    print("=" * 60)
    print("Merge Y7 German Packs → y7_german_full")
    print("=" * 60)
    print(f"Source packs: {len(Y7_PACKS)}")
    print()

    # Load all packs
    packs_data = []
    errors = []
    for pid in Y7_PACKS:
        pack, err = load_pack(pid)
        if err:
            errors.append(f"  ✗ {pid}: {err}")
            print(f"  ✗ {pid}: {err}")
        else:
            vocab = sum(1 for i in pack["items"] if i["type"] == "vocab")
            sents = sum(1 for i in pack["items"] if i["type"] == "sentence")
            print(f"  ✓ {pid:<40} vocab={vocab:>4}  sentences={sents:>4}")
            packs_data.append((pid, pack))

    if errors:
        print(f"\n{len(errors)} error(s) — cannot proceed.")
        sys.exit(1)

    print(f"\nMerging {len(packs_data)} packs...")

    # Merge
    merged_items, stats = merge_items(packs_data)

    # Build pack
    merged_pack = create_merged_pack(packs_data, merged_items)

    print(f"\nMerged pack stats:")
    for k, v in stats.items():
        if v:
            print(f"  {k:<10}: {v:>5}")
    print(f"\nTotal items: {len(merged_items)}")
    print(f"Pack ID:     {merged_pack['packId']}")
    print(f"Title:       {merged_pack['title']}")

    if dry_run:
        print(f"\n(Dry run — no files written)")
        print(f"  Run with --apply to write to:")
        print(f"  {MERGE_OUT}")
        return

    # Write
    MERGE_OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(MERGE_OUT, "w", encoding="utf-8") as f:
        json.dump(merged_pack, f, ensure_ascii=False, indent=2)

    print(f"\nWritten → {MERGE_OUT}")
    print(f"File size: {MERGE_OUT.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
