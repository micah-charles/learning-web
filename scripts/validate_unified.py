#!/usr/bin/env python3
"""
validate_unified.py
Validates that every pack in manifest.json has a valid unifiedPath
and that every unified pack file passes schema validation.

Usage:
    python3 scripts/validate_unified.py

Exit codes: 0 = all valid, 1 = errors found
"""

import json, sys
from pathlib import Path

BASE = Path("/Volumes/ExtremePro/project/learning-web")
MANIFEST_PATH = BASE / "data" / "generated" / "manifest.json"

VALID_ITEM_TYPES = {"vocab", "sentence", "sequence", "categorySort", "fillBlank", "sentenceBuilder", "passage"}
VALID_Q_TYPES = {"open", "mcq", "choice", "typing", "gap"}


def load_json(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return None
    except json.JSONDecodeError as e:
        print(f"  ✗ JSON error in {path}: {e}")
        return None


def check_pack(pack_id, unified_path):
    errors = []
    full = BASE / unified_path
    if not full.exists():
        return [f"  ✗ {pack_id}: file not found: {unified_path}"]

    pack = load_json(full)
    if pack is None:
        return [f"  ✗ {pack_id}: could not load {unified_path}"]

    for field in ("packId", "title", "schemaVersion"):
        if not pack.get(field):
            errors.append(f"  ✗ {pack_id}: missing top-level field '{field}'")

    schema_v = pack.get("schemaVersion")
    if schema_v not in ("1.0", "1.1"):
        errors.append(f"  ✗ {pack_id}: unexpected schemaVersion '{schema_v}' (expected '1.0' or '1.1')")

    items = pack.get("items")
    if not isinstance(items, list):
        errors.append(f"  ✗ {pack_id}: 'items' must be an array, got {type(items).__name__}")
        return errors

    for field in ("sourceLanguageCode",):
        if not pack.get(field):
            errors.append(f"  ✗ {pack_id}: missing '{field}'")

    for i, item in enumerate(items):
        iid = item.get("id", f"{pack_id}[{i}]")
        itype = item.get("type")
        data = item.get("data")

        if not itype:
            errors.append(f"  ✗ {iid}: item missing 'type'"); continue
        if itype not in VALID_ITEM_TYPES:
            errors.append(f"  ✗ {iid}: unknown item type '{itype}'"); continue
        if not isinstance(data, dict):
            errors.append(f"  ✗ {iid}: 'data' must be an object"); continue

        if itype == "vocab":
            # Accept either new 'translations' dict or legacy sourceWord/targetWord
            has_translations = isinstance(data.get("translations"), dict) and len(data.get("translations", {})) >= 1
            has_legacy = bool(data.get("sourceWord") and data.get("targetWord"))
            if not (has_translations or has_legacy):
                errors.append(f"  ✗ {iid} (vocab): must have data.translations or both data.sourceWord and data.targetWord")
        elif itype == "sentence":
            # Accept either new 'translations' dict or legacy sourceSentence/targetSentence
            has_translations = isinstance(data.get("translations"), dict) and len(data.get("translations", {})) >= 1
            has_legacy = bool(data.get("sourceSentence") and data.get("targetSentence"))
            if not (has_translations or has_legacy):
                errors.append(f"  ✗ {iid} (sentence): must have data.translations or both data.sourceSentence and data.targetSentence")
        elif itype == "sequence":
            if not isinstance(data.get("items"), list):
                errors.append(f"  ✗ {iid} (sequence): data.items must be a list")
        elif itype == "categorySort":
            if not isinstance(data.get("pairs"), list):
                errors.append(f"  ✗ {iid} (categorySort): data.pairs must be a list")
            if not isinstance(data.get("categories"), list):
                errors.append(f"  ✗ {iid} (categorySort): data.categories must be a list")
        elif itype == "fillBlank":
            if not data.get("sentence"): errors.append(f"  ✗ {iid} (fillBlank): missing data.sentence")
            if not data.get("answer"): errors.append(f"  ✗ {iid} (fillBlank): missing data.answer")
        elif itype == "sentenceBuilder":
            if not data.get("tiles"): errors.append(f"  ✗ {iid} (sentenceBuilder): missing data.tiles")
        elif itype == "passage":
            if not data.get("sourcePassage"): errors.append(f"  ✗ {iid} (passage): missing data.sourcePassage")
            qs = data.get("questions", [])
            if not isinstance(qs, list):
                errors.append(f"  ✗ {iid} (passage): data.questions must be a list")
            else:
                for qi, q in enumerate(qs):
                    qt = q.get("questionType") or q.get("type", "open")
                    if qt not in VALID_Q_TYPES:
                        errors.append(f"  ⚠ {iid}.question[{qi}]: unusual questionType '{qt}'")

    if errors:
        return errors

    counts = {}
    for item in items:
        counts[item.get("type", "?")] = counts.get(item["type"], 0) + 1
    cs = ", ".join(f"{v} {k}" for k, v in sorted(counts.items()))
    print(f"  ✓ {pack_id} — {len(items)} items ({cs})")
    return []


def main():
    print("=" * 60)
    print("Validating unified schema compliance")
    print("=" * 60)

    manifest = load_json(str(MANIFEST_PATH))
    if not manifest:
        print(f"ERROR: Could not load manifest at {MANIFEST_PATH}")
        sys.exit(1)
    print(f"\nManifest: {MANIFEST_PATH}\n")

    all_errors = []

    # Core
    print("[Core pack]")
    core_up = manifest.get("coreUnifiedPath", "data/core_unified.json")
    core = load_json(str(BASE / core_up))
    if core:
        print(f"  ✓ core — {len(core.get('items', []))} items")
    else:
        all_errors.append(f"  ✗ core: failed to load {core_up}")

    # Revision packs
    print("\n[Revision packs]")
    for p in manifest.get("revisionPacks", []):
        pid = p["id"]
        up = p.get("unifiedPath")
        if not up:
            all_errors.append(f"  ✗ {pid}: missing unifiedPath")
            continue
        all_errors.extend(check_pack(pid, up))

    # Sentence builder packs
    print("\n[Sentence builder packs]")
    sbs = manifest.get("sentenceBuilderPacks", [])
    if not sbs:
        print("  (none defined)")
    for sb in sbs:
        pid = sb["id"]
        up = sb.get("unifiedPath")
        if not up:
            all_errors.append(f"  ✗ sb:{pid}: missing unifiedPath"); continue
        all_errors.extend(check_pack(pid, up))

    # Passage groups
    print("\n[Passage packs]")
    for g in manifest.get("passageGroups", []):
        gid = g["id"]
        up = g.get("unifiedPath")
        if not up:
            all_errors.append(f"  ✗ group:{gid}: missing unifiedPath"); continue
        full = BASE / up
        if not full.exists():
            all_errors.append(f"  ✗ group:{gid}: file not found: {up}"); continue
        pack = load_json(str(full))
        if pack:
            print(f"  ✓ passages/{gid} — {len(pack.get('items', []))} passages")
        else:
            all_errors.append(f"  ✗ passages/{gid}: could not load {up}")

    print(f"\n{'=' * 60}")
    if all_errors:
        print(f"FAIL — {len(all_errors)} error(s):\n")
        for e in all_errors: print(e)
        sys.exit(1)
    total = 1 + len(manifest.get("revisionPacks", [])) + len(manifest.get("sentenceBuilderPacks", [])) + len(manifest.get("passageGroups", []))
    print(f"PASS — {total} pack(s) validated, 0 errors")
    sys.exit(0)


if __name__ == "__main__":
    main()
