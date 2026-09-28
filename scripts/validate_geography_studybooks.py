#!/usr/bin/env python3
"""Validate Geography Study Book registration, curriculum coverage and outputs."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data/generated/manifest.json"
MATRIX = ROOT / "docs/curriculum-generation/geography/coverage-matrix.json"
QUEUE = ROOT / "docs/curriculum-generation/geography/image-generation-queue.md"
WORD_TARGETS = ROOT / "docs/curriculum-generation/geography/word-targets.md"
INDEX_JSON = ROOT / "public/study-books/geography/index.json"
INDEX_HTML = ROOT / "public/study-books/geography/index.html"
SEARCH_INDEX = ROOT / "public/search/studybook-index.json"


def fail(message: str):
    raise SystemExit(f"Geography Study Book validation failed: {message}")


def all_objects(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from all_objects(child)
    elif isinstance(value, list):
        for child in value:
            yield from all_objects(child)


def main():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    matrix = json.loads(MATRIX.read_text(encoding="utf-8"))
    studies = [entry for entry in manifest.get("studyBooks", []) if entry.get("subject") == "geography" and entry.get("studyBookKind") == "topic-guide"]
    ids = [entry.get("id") for entry in studies]
    if len(ids) != len(set(ids)):
        fail("topic guide IDs are not unique")
    if len([item for item in studies if item.get("curriculum") == "us-middle-school"]) != 18:
        fail("expected 18 registered US Middle School Geography guides")
    if len([item for item in studies if item.get("curriculum") == "ks3-england"]) != 15:
        fail("expected 15 England KS3 topic guides")
    if len([item for item in studies if item.get("curriculum") == "aqa-gcse-8035"]) != 21:
        fail("expected 21 AQA GCSE 8035 topic guides")

    all_manifest_objects = list(all_objects(manifest))
    available_ids = {item.get("id") for item in all_manifest_objects if item.get("id")}
    for entry in studies:
        path = entry.get("contentMdPath")
        file = ROOT / (path or "__missing__")
        if not path or not file.is_file():
            fail(f"missing note file for {entry.get('id')}: {path}")
        target = entry.get("targetWordCount")
        if entry.get("curriculum") in {"ks3-england", "aqa-gcse-8035"} and (
            not isinstance(target, dict) or not isinstance(target.get("min"), int)
            or not isinstance(target.get("max"), int) or target["min"] >= target["max"]
        ):
            fail(f"missing or invalid word target for {entry.get('id')}")
        note = file.read_text(encoding="utf-8")
        if entry.get("curriculum") in {"ks3-england", "aqa-gcse-8035"}:
            # Image alt text and static asset paths are not part of the prose word target.
            prose = re.sub(r"(?m)^!\[[^\]]*\]\([^\n]*\)\s*$", "", note)
            prose = re.sub(r"<[^>]+>", " ", prose)
            word_count = len(prose.split())
            if not target["min"] <= word_count <= target["max"]:
                fail(f"word count for {entry['id']} is {word_count}, outside {target['min']}–{target['max']}")
            required_headings = ["Required knowledge", "Key vocabulary", "How the geography works", "Place example", "Maps, data and evidence", "Common misconception", "Self-check", "Revision points", "Curriculum alignment", "Sources"]
            section_headings = [re.sub(r"^\d+\.\s*", "", line[3:].strip()) for line in note.splitlines() if line.startswith("## ")]
            missing_headings = [required for required in required_headings if not any(actual.lower().startswith(required.lower()) for actual in section_headings)]
            if missing_headings:
                fail(f"incomplete note sections in {entry['id']}: {', '.join(missing_headings)}")
        for related_id in entry.get("relatedPackIds", []):
            if related_id not in available_ids:
                fail(f"unresolved related practice pack {related_id} in {entry['id']}")
            pack = next((item for item in all_manifest_objects if item.get("id") == related_id and (item.get("unifiedPath") or item.get("passagePath"))), None)
            pack_path = (pack or {}).get("unifiedPath") or (pack or {}).get("passagePath")
            if not pack_path or not (ROOT / pack_path).is_file():
                fail(f"related practice pack file missing for {related_id}")

    topic_by_id = {topic["id"]: topic for topic in matrix["topics"]}
    for outcome in matrix["ks3Outcomes"]:
        if not any(outcome in topic["coverageIds"] for topic in matrix["topics"] if topic["curriculum"] == "ks3-england"):
            fail(f"unmapped England KS3 outcome {outcome}")
    for section in matrix["aqaRequiredSections"]:
        if not any(section in topic["coverageIds"] and topic["status"] == "required" for topic in matrix["topics"] if topic["curriculum"] == "aqa-gcse-8035"):
            fail(f"unmapped required AQA section {section}")
    for group, option_ids in matrix["aqaOptionGroups"].items():
        if not option_ids or any(topic_id not in topic_by_id or topic_by_id[topic_id]["status"] != "option" or topic_by_id[topic_id]["optionGroup"] != group for topic_id in option_ids):
            fail(f"invalid option group {group}")
    for topic in matrix["topics"]:
        manifest_entry = next((entry for entry in studies if entry.get("id") == topic["id"]), None)
        if manifest_entry is None or manifest_entry.get("contentMdPath") != topic["contentMdPath"]:
            fail(f"coverage map/catalogue mismatch for {topic['id']}")

    queue = QUEUE.read_text(encoding="utf-8")
    anchors = re.findall(r"^\| `([^`]+)` \|.*?\| \[`([^`]+\.md#[^`]+)`\]\(", queue, flags=re.MULTILINE)
    if not anchors:
        fail("image queue contains no anchored briefs")
    queued_ids = [topic_id for topic_id, _ in anchors]
    expected_image_ids = {entry["id"] for entry in studies if entry.get("curriculum") in {"ks3-england", "aqa-gcse-8035"}}
    if len(queued_ids) != len(set(queued_ids)):
        fail("image queue contains duplicate topic briefs")
    if set(queued_ids) != expected_image_ids:
        missing = sorted(expected_image_ids - set(queued_ids))
        unexpected = sorted(set(queued_ids) - expected_image_ids)
        fail(f"image queue coverage mismatch; missing={missing}, unexpected={unexpected}")
    for topic_id, note_anchor in anchors:
        note_path, anchor = note_anchor.split("#", 1)
        note = (ROOT / note_path).read_text(encoding="utf-8")
        if f'id="{anchor}"' not in note:
            fail(f"image anchor does not resolve: {topic_id} → {note_anchor}")
        image_paths = re.findall(r"(?m)^!\[[^\]]*\]\((/data/StudyBooks/england/geography/images/[^)]+\.png)\)\s*$", note)
        if len(image_paths) != 1:
            fail(f"expected exactly one embedded curriculum image for {topic_id}; found {len(image_paths)}")
        image_file = ROOT / image_paths[0].lstrip("/")
        if not image_file.is_file():
            fail(f"embedded image file is missing for {topic_id}: {image_paths[0]}")

    if any("| Planned |" in line for line in queue.splitlines() if line.startswith("| `")):
        fail("one or more queued curriculum images have not been generated and embedded")

    if not INDEX_JSON.is_file() or not INDEX_HTML.is_file() or not SEARCH_INDEX.is_file() or not WORD_TARGETS.is_file():
        fail("generated catalogue or search output is missing; run build:study-books and build:studybook-index")
    catalogue = json.loads(INDEX_JSON.read_text(encoding="utf-8"))
    indexed_ids = {book["id"] for book in catalogue["studyBooks"]}
    if not set(ids).issubset(indexed_ids):
        fail("generated Geography catalogue omits one or more curriculum guides")
    indexed_books = {book["id"]: book for book in catalogue["studyBooks"]}
    for entry in studies:
        if entry["curriculum"] in {"ks3-england", "aqa-gcse-8035"}:
            article_url = indexed_books[entry["id"]].get("articleUrl")
            if not article_url or "/revision/studybook/geography/" not in article_url:
                fail(f"article route missing from generated catalogue for {entry['id']}")
    html = INDEX_HTML.read_text(encoding="utf-8")
    for tab_id in ("us-middle-school", "ks3-england", "aqa-gcse-8035"):
        if f'data-curriculum="{tab_id}"' not in html:
            fail(f"Geography curriculum tab is missing: {tab_id}")
    if "GCSE past-paper notes" not in html:
        fail("GCSE past-paper group is missing")
    search = json.loads(SEARCH_INDEX.read_text(encoding="utf-8"))
    search_ids = {chunk.get("packId") for chunk in search.get("chunks", [])}
    if not set(ids).issubset(search_ids):
        fail("study-book search index omits one or more curriculum guides")

    print(f"Validated {len(studies)} Geography guides, {len(matrix['ks3Outcomes'])} KS3 outcomes, {len(matrix['aqaRequiredSections'])} required AQA coverage IDs, {len(anchors)} image briefs and catalogue/search outputs.")


if __name__ == "__main__":
    main()
