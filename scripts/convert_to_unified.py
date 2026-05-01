#!/usr/bin/env python3
"""
convert_to_unified.py

Converts all existing learning-web pack files into the unified pack format.

Usage:
    python3 scripts/convert_to_unified.py

Output:
    data/core_unified.json
    data/Packs/[pack_id]/pack_unified.json  (one per revision pack)
"""

import json
import os
from pathlib import Path

BASE = Path("/Volumes/ExtremePro/project/learning-web")
MANIFEST_PATH = BASE / "data" / "generated" / "manifest.json"
OUT_DIR = BASE / "data"


def load_json(path):
    """Load JSON file, return None if missing."""
    if not Path(path).exists():
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def load_jsonl(path):
    """Load JSONL file, return list of objects, empty list if missing."""
    if not Path(path).exists():
        return []
    lines = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                lines.append(json.loads(line))
    return lines


def slugify(text):
    """Basic slug: lowercase, spaces to underscores."""
    return text.lower().replace(" ", "_").replace("-", "_")


# ─── Core pack conversion ────────────────────────────────────────────

def convert_core_pack(manifest):
    """Convert the core vocab + gcse_sentences into data/core_unified.json."""
    core = manifest["core"]

    items = []

    # Core vocab.json
    vocab = load_json(BASE / core["vocabPath"])
    if vocab:
        for entry in vocab:
            items.append({
                "id": entry.get("id", f"vocab_core_{len(items)}"),
                "type": "vocab",
                "level": entry.get("level"),
                "topics": [entry.get("topic")] if entry.get("topic") else [],
                "tags": entry.get("tags", []),
                "data": {
                    "sourceLanguage": core.get("sourceLanguageCode", "de-DE").split("-")[0],
                    "targetLanguage": core.get("targetLanguageCode", "en-GB").split("-")[0],
                    "sourceWord": entry.get("de") or entry.get("sourceWord", ""),
                    "targetWord": entry.get("en") or entry.get("targetWord", ""),
                    "partOfSpeech": entry.get("pos") or entry.get("part_of_speech"),
                    "gender": entry.get("gender"),
                    "plural": entry.get("plural"),
                    "exampleSource": entry.get("exampleDe"),
                    "exampleTarget": entry.get("exampleEn"),
                }
            })

    # Core gcse_sentences.jsonl
    if core.get("sentencePath"):
        sentences = load_jsonl(BASE / core["sentencePath"])
        for entry in sentences:
            items.append({
                "id": entry.get("id", f"sent_core_{len(items)}"),
                "type": "sentence",
                "level": entry.get("level"),
                "topics": entry.get("topics", []),
                "tags": [],
                "data": {
                    "sourceLanguage": core.get("sourceLanguageCode", "de-DE").split("-")[0],
                    "targetLanguage": core.get("targetLanguageCode", "en-GB").split("-")[0],
                    "sourceSentence": entry.get("de") or entry.get("sourceSentence", ""),
                    "targetSentence": entry.get("en") or entry.get("targetSentence", ""),
                }
            })

    pack = {
        "packId": core["id"],
        "title": core.get("displayName", "Core GCSE"),
        "subject": "German",
        "level": "ALL",
        "language": "German",
        "topics": ["GCSE"],
        "tags": [],
        "description": core.get("displayName", ""),
        "schemaVersion": "1.0",
        "sourceLanguageLabel": core.get("sourceLanguageLabel", "German"),
        "sourceLanguageCode": core.get("sourceLanguageCode", "de-DE"),
        "targetLanguageLabel": core.get("targetLanguageLabel", "English"),
        "targetLanguageCode": core.get("targetLanguageCode", "en-GB"),
        "speechLanguage": core.get("speechLanguage", "de-DE"),
        "items": items,
    }

    out_path = OUT_DIR / "core_unified.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(pack, f, ensure_ascii=False, indent=2)

    print(f"  ✓ core_unified.json — {len(items)} items ({len([i for i in items if i['type']=='vocab'])} vocab, {len([i for i in items if i['type']=='sentence'])} sentences)")


# ─── Revision pack conversion ─────────────────────────────────────────

def convert_revision_pack(pack_meta):
    """Convert a single revision pack to pack_unified.json."""
    pack_dir = BASE / "data" / "Packs" / pack_meta["id"]
    items = []

    # --- Vocab (required for all packs)
    vocab = load_json(BASE / pack_meta["vocabPath"])
    if vocab:
        for entry in vocab:
            items.append({
                "id": entry.get("id", f"vocab_{len(items)}"),
                "type": "vocab",
                "level": entry.get("level"),
                "topics": [entry.get("topic")] if entry.get("topic") else [],
                "tags": entry.get("tags", []),
                "data": {
                    "sourceLanguage": pack_meta.get("sourceLanguageCode", "en-GB").split("-")[0],
                    "targetLanguage": pack_meta.get("targetLanguageCode", "en-GB").split("-")[0],
                    "sourceWord": entry.get("de") or entry.get("sourceWord", ""),
                    "targetWord": entry.get("en") or entry.get("targetWord", ""),
                    "partOfSpeech": entry.get("pos") or entry.get("part_of_speech"),
                    "gender": entry.get("gender"),
                    "plural": entry.get("plural"),
                    "exampleSource": entry.get("exampleDe"),
                    "exampleTarget": entry.get("exampleEn"),
                }
            })

    # --- Sentences (JSONL)
    if pack_meta.get("sentencePath"):
        sentences = load_jsonl(BASE / pack_meta["sentencePath"])
        for entry in sentences:
            items.append({
                "id": entry.get("id", f"sent_{len(items)}"),
                "type": "sentence",
                "level": entry.get("level"),
                "topics": entry.get("topics", []),
                "tags": [],
                "data": {
                    "sourceLanguage": pack_meta.get("sourceLanguageCode", "de-DE").split("-")[0],
                    "targetLanguage": pack_meta.get("targetLanguageCode", "en-GB").split("-")[0],
                    "sourceSentence": entry.get("de") or entry.get("sourceSentence", ""),
                    "targetSentence": entry.get("en") or entry.get("targetSentence", ""),
                }
            })

    # --- Sequence ordering
    if pack_meta.get("sequencePath"):
        sequences = load_jsonl(BASE / pack_meta["sequencePath"])
        for entry in sequences:
            items.append({
                "id": entry.get("id", f"seq_{len(items)}"),
                "type": "sequence",
                "level": pack_meta.get("level"),
                "topics": pack_meta.get("topics", "").split(",") if pack_meta.get("topics") else [],
                "tags": [],
                "data": {
                    "title": entry.get("title", ""),
                    "instruction": entry.get("instruction", ""),
                    "items": entry.get("items", []),
                    "shuffle": True,
                }
            })

    # --- Category sort
    if pack_meta.get("categorySortPath"):
        sorts = load_jsonl(BASE / pack_meta["categorySortPath"])
        for entry in sorts:
            # Rename 'items' to 'pairs' (key is 'pairs' in schema)
            raw_items = entry.get("items", [])
            pairs = []
            for raw in raw_items:
                if isinstance(raw, dict):
                    pairs.append({"text": raw.get("text", ""), "category": raw.get("category", "")})
                else:
                    pairs.append({"text": str(raw), "category": ""})
            items.append({
                "id": entry.get("id", f"cat_{len(items)}"),
                "type": "categorySort",
                "level": pack_meta.get("level"),
                "topics": pack_meta.get("topics", "").split(",") if pack_meta.get("topics") else [],
                "tags": [],
                "data": {
                    "title": entry.get("title", ""),
                    "instruction": entry.get("instruction", ""),
                    "categories": entry.get("categories", []),
                    "pairs": pairs,
                }
            })

    # --- Fill in the blank
    if pack_meta.get("fillBlankPath"):
        gaps = load_jsonl(BASE / pack_meta["fillBlankPath"])
        for entry in gaps:
            items.append({
                "id": entry.get("id", f"gap_{len(items)}"),
                "type": "fillBlank",
                "level": pack_meta.get("level"),
                "topics": pack_meta.get("topics", "").split(",") if pack_meta.get("topics") else [],
                "tags": [],
                "data": {
                    "sentence": entry.get("sentence", ""),
                    "answer": entry.get("answer", ""),
                    "hint": entry.get("hint"),
                }
            })

    # Build pack object
    pack = {
        "packId": pack_meta["id"],
        "title": pack_meta.get("displayName", pack_meta["id"]),
        "subject": pack_meta.get("sourceLanguageLabel", "Unknown"),
        "level": pack_meta.get("level", "Y7"),
        "language": pack_meta.get("sourceLanguageLabel", "English"),
        "topics": pack_meta.get("topics", "").split(",") if pack_meta.get("topics") else [],
        "tags": [],
        "description": pack_meta.get("grammarFocusEn") or pack_meta.get("topicEn") or "",
        "schemaVersion": "1.0",
        "sourceLanguageLabel": pack_meta.get("sourceLanguageLabel", "German"),
        "sourceLanguageCode": pack_meta.get("sourceLanguageCode", "de-DE"),
        "targetLanguageLabel": pack_meta.get("targetLanguageLabel", "English"),
        "targetLanguageCode": pack_meta.get("targetLanguageCode", "en-GB"),
        "speechLanguage": pack_meta.get("speechLanguage", "de-DE"),
        "items": items,
    }

    out_path = pack_dir / "pack_unified.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(pack, f, ensure_ascii=False, indent=2)

    type_counts = {}
    for item in items:
        type_counts[item["type"]] = type_counts.get(item["type"], 0) + 1
    counts_str = ", ".join(f"{v} {k}" for k, v in sorted(type_counts.items()))
    print(f"  ✓ {pack_meta['id']} — {len(items)} items ({counts_str})")
    return len(items)


# ─── Sentence builder packs ───────────────────────────────────────────

def convert_sentence_builder_packs(manifest):
    """Convert SentenceBuilderPacks/*.jsonl into per-pack pack_unified.json files."""
    sb_packs = manifest.get("sentenceBuilderPacks", [])
    if not sb_packs:
        print("  (no sentence builder packs in manifest)")
        return

    for sb_pack in sb_packs:
        pack_path = BASE / sb_pack["path"]
        if not pack_path.exists():
            print(f"  ✗ {sb_pack['id']} — file not found: {sb_pack['path']}")
            continue

        entries = load_jsonl(pack_path)
        items = []
        for entry in entries:
            items.append({
                "id": entry.get("id", f"sb_{len(items)}"),
                "type": "sentenceBuilder",
                "level": entry.get("level"),
                "topics": [],
                "tags": [entry.get("type", "")],
                "data": {
                    "cardType": entry.get("type", "unknown"),
                    "prompt": entry.get("prompt", ""),
                    "answer": entry.get("answer", ""),
                    "tiles": entry.get("tiles", []),
                }
            })

        # Write to a pack_unified.json in the same directory
        pack_dir = pack_path.parent
        pack = {
            "packId": sb_pack["id"],
            "title": sb_pack.get("displayName", sb_pack["id"]),
            "subject": "History",
            "level": "Y7",
            "language": "English",
            "topics": ["History"],
            "tags": [],
            "description": f"Sentence builder pack: {sb_pack.get('displayName', '')}",
            "schemaVersion": "1.0",
            "sourceLanguageLabel": "English",
            "sourceLanguageCode": "en-GB",
            "targetLanguageLabel": "English",
            "targetLanguageCode": "en-GB",
            "speechLanguage": "en-GB",
            "items": items,
        }

        out_path = pack_dir / "pack_unified.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(pack, f, ensure_ascii=False, indent=2)

        print(f"  ✓ sentenceBuilder/{sb_pack['id']} — {len(items)} items")


# ─── Main ─────────────────────────────────────────────────────────────

def main():
    manifest = load_json(MANIFEST_PATH)
    if not manifest:
        print(f"ERROR: Could not load manifest at {MANIFEST_PATH}")
        return

    print("=" * 60)
    print("Converting learning-web to unified pack format")
    print("=" * 60)

    # Core pack
    print("\n[Core pack]")
    convert_core_pack(manifest)

    # Revision packs
    print("\n[Revision packs]")
    total = 0
    for pack_meta in manifest.get("revisionPacks", []):
        n = convert_revision_pack(pack_meta)
        total += n

    # Sentence builder packs
    print("\n[Sentence builder packs]")
    convert_sentence_builder_packs(manifest)

    print(f"\n{'=' * 60}")
    print(f"Done. Total items converted: {total} (excl. sentence builder)")


if __name__ == "__main__":
    main()