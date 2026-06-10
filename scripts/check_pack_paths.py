#!/usr/bin/env python3
"""
check_pack_paths.py
Verify that all pack files live in the correct folder structure.

Usage:
    python3 scripts/check_pack_paths.py [--root <repo-root>]

Exit codes: 0 = pass, 1 = errors found

Rules enforced
──────────────
1. data/PassagePacks/   must not exist (directory removed in PR #60)
2. data/_legacy/        must not exist (removed in PR #60)
3. data/SentenceBuilderPacks/  must contain only <id>/ sub-directories,
   not loose *.json files at the top level (old flat *_unified.json pattern)
4. data/Packs/  must follow <curriculum>/<subject>/<id>/ depth —
   only pack_unified.json and passages.json are valid filenames inside a pack folder
5. data/SentenceBuilderPacks/<id>/  must contain only pack_unified.json
"""

import sys
import argparse
from pathlib import Path

BANNED_DIRS = ["PassagePacks", "_legacy"]
VALID_PACK_FILENAMES = {"pack_unified.json", "passages.json"}
VALID_CURRICULA = {"ks3", "gcse", "other"}
VALID_SUBJECTS  = {"language", "history", "geography", "science", "literature"}


def err(errors, msg):
    errors.append(msg)


def check(root: Path) -> list[str]:
    errors = []
    data = root / "data"

    if not data.is_dir():
        return [f"data/ directory not found under {root}"]

    # ── Rule 1 & 2: banned top-level directories ──────────────────────────────
    for name in BANNED_DIRS:
        target = data / name
        if target.is_dir():
            real_files = [f for f in target.rglob("*") if f.is_file() and f.name != ".DS_Store"]
            if real_files:
                err(errors, (
                    f"Banned directory contains files: data/{name}/\n"
                    f"  First offender: {real_files[0].relative_to(root)}\n"
                    f"  (This directory should have been deleted in PR #60)"
                ))

    # ── Rule 3: no loose *.json directly in SentenceBuilderPacks/ ─────────────
    sb_root = data / "SentenceBuilderPacks"
    if sb_root.is_dir():
        for item in sb_root.iterdir():
            if item.is_file() and item.suffix == ".json" and item.name != ".DS_Store":
                err(errors, (
                    f"Flat JSON in SentenceBuilderPacks/: {item.relative_to(root)}\n"
                    f"  Move to SentenceBuilderPacks/{item.stem.removesuffix('_unified')}/pack_unified.json"
                ))

        # ── Rule 5: each SentenceBuilderPacks/<id>/ should contain only pack_unified.json
        for pack_dir in sb_root.iterdir():
            if not pack_dir.is_dir():
                continue
            for f in pack_dir.iterdir():
                if f.is_file() and f.name != "pack_unified.json":
                    err(errors, (
                        f"Unexpected file in SentenceBuilderPacks/{pack_dir.name}/: {f.name}\n"
                        f"  Only pack_unified.json is valid here"
                    ))

    # ── Rule 4: data/Packs/ structure ─────────────────────────────────────────
    packs_root = data / "Packs"
    if packs_root.is_dir():
        for curriculum_dir in packs_root.iterdir():
            if not curriculum_dir.is_dir():
                continue

            if curriculum_dir.name not in VALID_CURRICULA:
                err(errors, (
                    f"Unknown curriculum folder: data/Packs/{curriculum_dir.name}/\n"
                    f"  Valid values: {sorted(VALID_CURRICULA)}"
                ))
                continue

            for subject_dir in curriculum_dir.iterdir():
                if not subject_dir.is_dir():
                    continue

                if subject_dir.name not in VALID_SUBJECTS:
                    err(errors, (
                        f"Unknown subject folder: data/Packs/{curriculum_dir.name}/{subject_dir.name}/\n"
                        f"  Valid values: {sorted(VALID_SUBJECTS)}"
                    ))
                    continue

                for pack_dir in subject_dir.iterdir():
                    if not pack_dir.is_dir():
                        if pack_dir.name == ".DS_Store":
                            continue
                        err(errors, (
                            f"Loose file inside subject folder: {pack_dir.relative_to(root)}\n"
                            f"  All packs must live in their own sub-directory"
                        ))
                        continue

                    for f in pack_dir.iterdir():
                        if f.is_file() and f.suffix == ".json" and f.name not in VALID_PACK_FILENAMES and f.name != ".DS_Store":
                            err(errors, (
                                f"Unexpected JSON filename in pack folder: {f.relative_to(root)}\n"
                                f"  Only {sorted(VALID_PACK_FILENAMES)} are valid here"
                            ))

    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".", help="Repo root directory (default: cwd)")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    errors = check(root)

    if errors:
        print(f"\nFAIL — {len(errors)} path error(s):")
        for e in errors:
            print(f"  ✗ {e}")
        sys.exit(1)

    print("PASS — folder structure is clean, 0 path errors")
    sys.exit(0)


if __name__ == "__main__":
    main()
