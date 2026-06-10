#!/usr/bin/env python3
"""
validate_pack.py
Validate a single pack_unified.json or passages.json file against schema v1.1.

Usage:
    python3 scripts/validate_pack.py <path-to-pack-file> [<path> ...]

Exit codes: 0 = pass, 1 = errors found

Examples:
    python3 scripts/validate_pack.py data/Packs/ks3/geography/glaciation/pack_unified.json
    python3 scripts/validate_pack.py data/Packs/ks3/geography/glaciation/passages.json
    python3 scripts/validate_pack.py data/Packs/ks3/geography/glaciation/*.json
"""

import json
import sys
from pathlib import Path

VALID_ITEM_TYPES = {
    "vocab", "sentence", "sequence", "categorySort",
    "fillBlank", "sentenceBuilder", "passage",
}

VALID_SUBJECTS = {"language", "history", "geography", "science", "literature", "computing", "religion", "other"}
VALID_SCHEMA_VERSIONS = {"1.0", "1.1"}
VALID_Q_TYPES = {
    # canonical types
    "open", "multiple_choice",
    # semantic labels (treated as open by the app)
    "fact", "inference", "grammar", "explanation", "comprehension",
    # legacy aliases (avoid in new packs)
    "mcq", "choice",
}
POS_ABBREVIATIONS = {"n", "v", "a", "d", "r", "p", "c", "i"}


# ── helpers ───────────────────────────────────────────────────────────────────

def err(errors, msg):
    errors.append(msg)


def warn(warnings, msg):
    warnings.append(msg)


def is_language_pack(pack):
    src = pack.get("sourceLanguageCode", "")
    tgt = pack.get("targetLanguageCode", "")
    return bool(src and tgt and src != tgt)


# ── per-type item validators ──────────────────────────────────────────────────

def check_vocab(iid, data, is_lang, errors, warnings):
    has_translations = isinstance(data.get("translations"), dict) and len(data["translations"]) >= 1
    has_legacy = bool(data.get("sourceWord")) and bool(data.get("targetWord"))

    if not (has_translations or has_legacy):
        err(errors, f"{iid} (vocab): must have data.translations or both sourceWord + targetWord")
        return

    # Same-word check: error for non-language packs (broken definition),
    # warning for language packs (cognates like April/April are valid).
    src_word = (
        list(data["translations"].values())[0] if has_translations
        else data.get("sourceWord", "")
    )
    tgt_word = (
        list(data["translations"].values())[-1] if has_translations
        else data.get("targetWord", "")
    )
    if src_word and tgt_word and src_word.strip().lower() == tgt_word.strip().lower():
        if is_lang:
            warn(warnings, f"{iid} (vocab): source and target translations are identical ('{src_word}') — cognate or missing translation?")
        else:
            err(errors, f"{iid} (vocab): targetWord equals sourceWord — write a real definition")

    # partOfSpeech abbreviation check for language packs
    pos = data.get("partOfSpeech") or data.get("pos") or ""
    if is_lang and pos.strip().lower() in POS_ABBREVIATIONS:
        err(errors, f"{iid} (vocab): partOfSpeech '{pos}' is an abbreviation — use full word (noun, verb, adjective…)")

    # Non-language packs should not use 'keyword' check is a reminder, not an error
    if not is_lang and pos and pos != "keyword":
        warn(warnings, f"{iid} (vocab): non-language pack partOfSpeech should be 'keyword', got '{pos}'")


def check_sentence(iid, data, errors):
    has_translations = isinstance(data.get("translations"), dict) and len(data["translations"]) >= 1
    has_legacy = bool(data.get("sourceSentence")) and bool(data.get("targetSentence"))
    if not (has_translations or has_legacy):
        err(errors, f"{iid} (sentence): must have data.translations or both sourceSentence + targetSentence")


def check_sequence(iid, data, errors):
    if not data.get("title"):
        err(errors, f"{iid} (sequence): missing data.title")
    items = data.get("items")
    if not isinstance(items, list):
        err(errors, f"{iid} (sequence): data.items must be a list")
    elif len(items) < 2:
        err(errors, f"{iid} (sequence): data.items must have at least 2 steps, got {len(items)}")


def check_category_sort(iid, data, errors):
    cats = data.get("categories")
    pairs = data.get("pairs") or data.get("items")
    if not isinstance(cats, list) or len(cats) < 2:
        err(errors, f"{iid} (categorySort): data.categories must be a list of at least 2 values")
    if not isinstance(pairs, list) or len(pairs) < 2:
        err(errors, f"{iid} (categorySort): data.pairs must be a list of at least 2 items")
        return
    cat_set = set(cats) if isinstance(cats, list) else set()
    for pi, pair in enumerate(pairs):
        if not isinstance(pair, dict):
            err(errors, f"{iid} (categorySort): pairs[{pi}] must be an object")
            continue
        if not pair.get("text"):
            err(errors, f"{iid} (categorySort): pairs[{pi}] missing 'text'")
        if not pair.get("category"):
            err(errors, f"{iid} (categorySort): pairs[{pi}] missing 'category'")
        elif cat_set and pair["category"] not in cat_set:
            err(errors, f"{iid} (categorySort): pairs[{pi}] category '{pair['category']}' not in categories list")


def check_fill_blank(iid, data, is_lang, errors):
    sentence = data.get("sentence", "")
    if not sentence:
        err(errors, f"{iid} (fillBlank): missing data.sentence")
    elif "____" not in sentence and not is_lang:
        err(errors, f"{iid} (fillBlank): data.sentence must contain '____' as the gap placeholder")
    if not data.get("answer"):
        err(errors, f"{iid} (fillBlank): missing data.answer")
    options = data.get("options")
    if options is not None:
        if not isinstance(options, list) or len(options) < 2:
            err(errors, f"{iid} (fillBlank): data.options must be a list of at least 2 choices")
        elif data.get("answer") and data["answer"] not in options:
            err(errors, f"{iid} (fillBlank): data.answer '{data['answer']}' not found in data.options")


def check_sentence_builder(iid, data, errors):
    if not data.get("answer"):
        err(errors, f"{iid} (sentenceBuilder): missing data.answer")
    tiles = data.get("tiles")
    if not isinstance(tiles, list) or len(tiles) < 2:
        err(errors, f"{iid} (sentenceBuilder): data.tiles must be a list of at least 2 tokens")
        return
    reconstructed = " ".join(str(t) for t in tiles)
    answer = data.get("answer", "")
    if answer and reconstructed != answer:
        err(errors, (
            f"{iid} (sentenceBuilder): tiles joined != answer\n"
            f"    tiles:  '{reconstructed}'\n"
            f"    answer: '{answer}'"
        ))


def check_passage(iid, data, errors, warnings):
    if not data.get("sourcePassage"):
        err(errors, f"{iid} (passage): missing data.sourcePassage")
    questions = data.get("questions", [])
    if not isinstance(questions, list):
        err(errors, f"{iid} (passage): data.questions must be a list")
        return
    if len(questions) == 0:
        warn(warnings, f"{iid} (passage): no questions defined")
    for qi, q in enumerate(questions):
        if not isinstance(q, dict):
            err(errors, f"{iid} (passage): questions[{qi}] must be an object")
            continue
        if not q.get("id"):
            err(errors, f"{iid} (passage): questions[{qi}] missing 'id'")
        if not q.get("question"):
            err(errors, f"{iid} (passage): questions[{qi}] missing 'question' (canonical field — not 'questionText' or 'question_en')")
        qt = q.get("questionType", "open")
        if qt not in VALID_Q_TYPES:
            warn(warnings, f"{iid} (passage): questions[{qi}] unusual questionType '{qt}'")
        if qt in ("multiple_choice", "mcq", "choice"):
            opts = q.get("options", [])
            if not isinstance(opts, list) or len(opts) < 2:
                err(errors, f"{iid} (passage): questions[{qi}] MCQ must have at least 2 options")
            idx = q.get("correctOptionIndex")
            if idx is None:
                err(errors, f"{iid} (passage): questions[{qi}] MCQ missing correctOptionIndex")
            elif not isinstance(idx, int) or idx < 0 or (isinstance(opts, list) and idx >= len(opts)):
                err(errors, f"{iid} (passage): questions[{qi}] correctOptionIndex {idx} out of range")


# ── main pack validator ───────────────────────────────────────────────────────

def validate_file(path: Path) -> tuple[list[str], list[str]]:
    errors = []
    warnings = []
    prefix = str(path)

    # ── load ──────────────────────────────────────────────────────────────────
    if not path.exists():
        return [f"{prefix}: file not found"], []

    try:
        pack = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        return [f"{prefix}: invalid JSON — {e}"], []

    if not isinstance(pack, dict):
        return [f"{prefix}: top-level value must be a JSON object"], []

    # ── header checks ─────────────────────────────────────────────────────────
    for field in ("packId", "schemaVersion", "sourceLanguageCode"):
        if not pack.get(field):
            err(errors, f"header: missing or empty '{field}'")

    sv = pack.get("schemaVersion")
    if sv and sv not in VALID_SCHEMA_VERSIONS:
        err(errors, f"header: schemaVersion '{sv}' not in {VALID_SCHEMA_VERSIONS}")

    subj = pack.get("subject", "")
    if subj and subj not in VALID_SUBJECTS:
        err(errors, f"header: subject '{subj}' must be one of {sorted(VALID_SUBJECTS)}")
    if subj != subj.lower():
        err(errors, f"header: subject '{subj}' must be lowercase")

    items = pack.get("items")
    if not isinstance(items, list):
        err(errors, "header: 'items' must be an array")
        return [f"{prefix}: " + e for e in errors], warnings

    if len(items) == 0:
        warn(warnings, "header: 'items' array is empty")

    is_lang = is_language_pack(pack)

    # ── per-item checks ───────────────────────────────────────────────────────
    seen_ids = {}
    type_counts = {}

    for i, item in enumerate(items):
        if not isinstance(item, dict):
            err(errors, f"items[{i}]: must be an object")
            continue

        iid = item.get("id") or f"items[{i}]"

        # Duplicate ID check
        if item.get("id"):
            if item["id"] in seen_ids:
                err(errors, f"{iid}: duplicate id (also at index {seen_ids[item['id']]})")
            else:
                seen_ids[item["id"]] = i
        else:
            err(errors, f"items[{i}]: missing 'id'")

        itype = item.get("type")
        if not itype:
            err(errors, f"{iid}: missing 'type'")
            continue
        if itype not in VALID_ITEM_TYPES:
            err(errors, f"{iid}: unknown type '{itype}' — valid: {sorted(VALID_ITEM_TYPES)}")
            continue

        type_counts[itype] = type_counts.get(itype, 0) + 1

        data = item.get("data")
        if not isinstance(data, dict):
            err(errors, f"{iid}: 'data' must be an object, got {type(data).__name__}")
            continue

        if itype == "vocab":
            check_vocab(iid, data, is_lang, errors, warnings)
        elif itype == "sentence":
            check_sentence(iid, data, errors)
        elif itype == "sequence":
            check_sequence(iid, data, errors)
        elif itype == "categorySort":
            check_category_sort(iid, data, errors)
        elif itype == "fillBlank":
            check_fill_blank(iid, data, is_lang, errors)
        elif itype == "sentenceBuilder":
            check_sentence_builder(iid, data, errors)
        elif itype == "passage":
            check_passage(iid, data, errors, warnings)

    # ── summary ───────────────────────────────────────────────────────────────
    if not errors:
        counts_str = ", ".join(f"{v} {k}" for k, v in sorted(type_counts.items()))
        print(f"  ✓ {path}  ({len(items)} items: {counts_str})")

    return (
        [f"{prefix}: " + e for e in errors],
        [f"{prefix}: " + w for w in warnings],
    )


# ── entry point ───────────────────────────────────────────────────────────────

def main():
    paths = [Path(a) for a in sys.argv[1:]]

    if not paths:
        print(__doc__)
        sys.exit(0)

    all_errors = []
    all_warnings = []

    for p in paths:
        errs, warns = validate_file(p)
        all_errors.extend(errs)
        all_warnings.extend(warns)

    if all_warnings:
        print("\nWarnings:")
        for w in all_warnings:
            print(f"  ⚠ {w}")

    if all_errors:
        print(f"\nFAIL — {len(all_errors)} error(s):")
        for e in all_errors:
            print(f"  ✗ {e}")
        sys.exit(1)

    print(f"\nPASS — {len(paths)} file(s) validated, 0 errors")
    sys.exit(0)


if __name__ == "__main__":
    main()
