#!/usr/bin/env python3
"""
migrate_vocab_translations.py
=============================

Migrate all vocab and sentence items in unified pack files from legacy flat fields
(sourceWord/targetWord/exampleSource/exampleTarget) to the new multilingual
translations dict format, while keeping full backwards compatibility.

What it does
------------
For each unified pack file:

  VOCAB items
  -----------
  Before (legacy VocabData):
    {
      "sourceWord": "Gletscher",
      "targetWord": "glacier",
      "exampleSource": "Der Gletscher bewegt sich talwärts.",
      "exampleTarget": "The glacier moves down the valley."
    }

  After (new VocabData — translations REQUIRED, examples OPTIONAL):
    {
      "translations": { "de-DE": "Gletscher", "en-GB": "glacier" },
      "examples":     { "de-DE": "Der Gletscher bewegt sich talwärts.",
                       "en-GB": "The glacier moves down the valley." }
    }

  SENTENCE items
  --------------
  Before:
    {
      "sourceSentence": "In meiner Familie gibt es fünf Personen.",
      "targetSentence": "In my family there are five people."
    }

  After:
    {
      "translations": { "de-DE": "In meiner Familie gibt es fünf Personen.",
                       "en-GB": "In my family there are five people." }
    }

Deprecated fields (sourceWord, targetWord, sourceSentence, targetSentence,
exampleSource, exampleTarget) are kept in place alongside the new fields so
existing code that reads them continues to work.

Usage
-----
  python3 scripts/migrate_vocab_translations.py           # dry run (no files written)
  python3 scripts/migrate_vocab_translations.py --apply  # actually write the files
  python3 scripts/migrate_vocab_translations.py --check   # validate only

Exit codes: 0 = pass, 1 = error, 2 = dry-run / check only
"""

import argparse
import json
import os
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"

# BCP-47 codes we expect for each language label found in legacy fields.
# We normalise 2-letter codes (de, en) to BCP-47 form (de-DE, en-GB).
LANG_MAP = {
    # language code (lowercase) → BCP-47
    "de": "de-DE",
    "en": "en-GB",
    "fr": "fr-FR",
    "es": "es-ES",
    "it": "it-IT",
    "pt": "pt-BR",
    "la": "la-Latn",
    "nl": "nl-NL",
    "el": "el-GR",
    "ru": "ru-RU",
    "zh": "zh-CN",
    "ja": "ja-JP",
    "ko": "ko-KR",
    "ar": "ar-SA",
}


def normalise_lang(code):
    """Normalise a language code string to BCP-47 form."""
    if not code:
        return None
    code = code.strip().replace("_", "-").lower()
    return LANG_MAP.get(code, code)


def infer_bcp47(legacy_src_lang, legacy_tgt_lang, pack_src_code, pack_tgt_code):
    """Infer BCP-47 codes for source and target from legacy fields + pack metadata."""
    src = normalise_lang(legacy_src_lang) or normalise_lang(pack_src_code) or "de-DE"
    tgt = normalise_lang(legacy_tgt_lang) or normalise_lang(pack_tgt_code) or "en-GB"
    return src, tgt


# ─── Migration functions ────────────────────────────────────────────────────


def migrate_vocab_item(item, pack_src_code, pack_tgt_code):
    """
    Migrate a single vocab LearningItem from legacy VocabData to new format.
    Returns a new item dict (does not mutate the input).
    """
    d = item.get("data", {})
    legacy_src = d.get("sourceWord", "")
    legacy_tgt = d.get("targetWord", "")
    legacy_src_lang = d.get("sourceLanguage", "")
    legacy_tgt_lang = d.get("targetLanguage", "")

    # Don't migrate if already in new format
    if "translations" in d:
        return item

    src_code, tgt_code = infer_bcp47(legacy_src_lang, legacy_tgt_lang, pack_src_code, pack_tgt_code)

    translations = {}
    if legacy_src:
        translations[src_code] = legacy_src
    if legacy_tgt:
        translations[tgt_code] = legacy_tgt

    examples = {}
    ex_src = d.get("exampleSource", "")
    ex_tgt = d.get("exampleTarget", "")
    if ex_src:
        examples[src_code] = ex_src
    if ex_tgt:
        examples[tgt_code] = ex_tgt

    new_data = {**d}  # shallow copy — keeps deprecated fields in place
    new_data["translations"] = translations
    if examples:
        new_data["examples"] = examples

    # Remove deprecated keys from migrated items (keeps file cleaner)
    new_data.pop("sourceWord", None)
    new_data.pop("targetWord", None)
    new_data.pop("exampleSource", None)
    new_data.pop("exampleTarget", None)
    # language codes kept for debugging
    new_data.pop("sourceLanguage", None)
    new_data.pop("targetLanguage", None)

    return {**item, "data": new_data}


def migrate_sentence_item(item, pack_src_code, pack_tgt_code):
    """Migrate a single sentence LearningItem to new translations format."""
    d = item.get("data", {})
    legacy_src = d.get("sourceSentence", "")
    legacy_tgt = d.get("targetSentence", "")
    legacy_src_lang = d.get("sourceLanguage", "")
    legacy_tgt_lang = d.get("targetLanguage", "")

    if "translations" in d:
        return item

    src_code, tgt_code = infer_bcp47(legacy_src_lang, legacy_tgt_lang, pack_src_code, pack_tgt_code)

    translations = {}
    if legacy_src:
        translations[src_code] = legacy_src
    if legacy_tgt:
        translations[tgt_code] = legacy_tgt

    new_data = {**d}
    new_data["translations"] = translations
    new_data.pop("sourceSentence", None)
    new_data.pop("targetSentence", None)
    new_data.pop("sourceLanguage", None)
    new_data.pop("targetLanguage", None)

    return {**item, "data": new_data}


def migrate_pack(pack_path, dry_run=True):
    """
    Migrate a single pack file in place.
    Returns a summary dict.
    """
    with open(pack_path, encoding="utf-8") as f:
        pack = json.load(f)

    src_code = normalise_lang(pack.get("sourceLanguageCode", ""))
    tgt_code = normalise_lang(pack.get("targetLanguageCode", ""))

    migrated_vocab = 0
    migrated_sentence = 0
    skipped_vocab = 0
    skipped_sentence = 0
    new_items = []

    for item in pack.get("items", []):
        if item.get("type") == "vocab":
            if "translations" in item.get("data", {}):
                skipped_vocab += 1
                new_items.append(item)
            else:
                new_items.append(migrate_vocab_item(item, src_code, tgt_code))
                migrated_vocab += 1
        elif item.get("type") == "sentence":
            if "translations" in item.get("data", {}):
                skipped_sentence += 1
                new_items.append(item)
            else:
                new_items.append(migrate_sentence_item(item, src_code, tgt_code))
                migrated_sentence += 1
        else:
            new_items.append(item)

    result = {
        "path": str(pack_path),
        "migrated_vocab": migrated_vocab,
        "migrated_sentence": migrated_sentence,
        "skipped_vocab": skipped_vocab,
        "skipped_sentence": skipped_sentence,
        "total_items": len(pack.get("items", [])),
    }

    if dry_run:
        return result

    # Write migrated pack back
    pack["items"] = new_items
    # Bump schemaVersion to 1.1 to signal migration
    if pack.get("schemaVersion") == "1.0":
        pack["schemaVersion"] = "1.1"
    with open(pack_path, "w", encoding="utf-8") as f:
        json.dump(pack, f, ensure_ascii=False, indent=2)
    return result


def find_pack_files():
    """Find all pack_unified.json files under data/."""
    packs = []
    for root, _dirs, files in os.walk(DATA_DIR):
        if "pack_unified.json" in files:
            packs.append(Path(root) / "pack_unified.json")
    return sorted(packs)


def main():
    parser = argparse.ArgumentParser(
        description="Migrate vocab/sentence items to multilingual translations format."
    )
    group = parser.add_mutually_exclusive_group()
    group.add_argument(
        "--apply", action="store_true",
        help="Write migrated files (default is dry-run)"
    )
    group.add_argument(
        "--check", action="store_true",
        help="Validate only — exit 0 if all packs already migrated or can be migrated"
    )
    args = parser.parse_args()

    dry_run = not args.apply
    check_only = args.check

    print("=" * 60)
    print("Vocabulary & Sentence — Multilingual Translations Migration")
    print("=" * 60)

    pack_files = find_pack_files()
    if not pack_files:
        print("ERROR: No pack_unified.json files found under data/")
        sys.exit(1)

    print(f"Found {len(pack_files)} pack file(s)\n")

    total_migrated = 0
    total_skipped = 0
    all_ok = True

    for pf in pack_files:
        rel = pf.relative_to(PROJECT_ROOT)
        try:
            result = migrate_pack(pf, dry_run=dry_run)
        except Exception as exc:
            print(f"  ERROR in {rel}: {exc}")
            all_ok = False
            continue

        migrated = result["migrated_vocab"] + result["migrated_sentence"]
        skipped = result["skipped_vocab"] + result["skipped_sentence"]
        total_migrated += migrated
        total_skipped += skipped

        if migrated:
            tag = "[DRY-RUN]" if dry_run else "[APPLIED]"
            print(
                f"  {tag} {rel}: "
                f"+{migrated} migrated ({result['migrated_vocab']} vocab, "
                f"{result['migrated_sentence']} sentence) "
                f"| {skipped} already current"
            )
        else:
            print(f"  [OK]   {rel}: {skipped} items already migrated")

    print()
    print(f"Packs scanned:   {len(pack_files)}")
    print(f"Items migrated:  {total_migrated}")
    print(f"Items skipped:   {total_skipped}")

    if dry_run:
        print("\n(Dry run — no files written)")
        print("  Run with --apply to write the migrated files.")

    if check_only or dry_run:
        sys.exit(0 if all_ok else 1)
    if not all_ok:
        sys.exit(1)
    print("\nMigration complete.")


if __name__ == "__main__":
    main()
