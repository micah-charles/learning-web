#!/usr/bin/env python3
"""
migrate_science_study_notes.py

Copies KS3 Science study-book .md files from the study prompt repo into the
correct Learning Web pack directories, then patches manifest.json with a
`contentMdPath` field for each updated pack.

Source:
  /Volumes/ExtremePro/project/study/ks3-science-prompts/generated_packs/

Target pack root:
  /Volumes/ExtremePro/project/learning-web/data/Packs/ks3/science/

Manifest:
  /Volumes/ExtremePro/project/learning-web/data/generated/manifest.json

Usage:
  python3 scripts/migrate_science_study_notes.py           # dry-run (preview only)
  python3 scripts/migrate_science_study_notes.py --apply   # write files + patch manifest

The script is fully idempotent: running it twice produces the same result.
"""

import argparse
import json
import shutil
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).resolve().parent.parent           # learning-web/
SOURCE_ROOT = Path("/Volumes/ExtremePro/project/study/ks3-science-prompts/generated_packs")
PACK_ROOT   = REPO_ROOT / "data" / "Packs" / "ks3" / "science"
MANIFEST    = REPO_ROOT / "data" / "generated" / "manifest.json"

# Destination filename used inside every pack directory
DEST_FILENAME = "study_notes.md"

# ── Explicit mapping: source .md path (relative to SOURCE_ROOT) → pack id ────
#
# Key   = path relative to SOURCE_ROOT
# Value = manifest pack `id`
#
MAPPING = {
    # Biology
    "biology/01_cells_study_pack.md":
        "ks3_science_biology_cells",
    "biology/02_organisation_study_pack.md":
        "ks3_science_biology_organisation",
    "biology/03_infection_response_study_pack.md":
        "ks3_science_biology_infection_response",
    "biology/04_bioenergetics_study_pack.md":
        "ks3_science_biology_bioenergetics",
    "biology/05_ecosystems_study_pack.md":
        "ks3_science_biology_ecosystems",
    "biology/06_environment_study_pack.md":
        "ks3_science_biology_environment",
    "biology/07_reproduction_study_pack.md":
        "ks3_science_biology_reproduction",
    "biology/08_variation_inheritance_study_pack.md":
        "ks3_science_biology_variation_inheritance",

    # Chemistry
    "chemistry/01_chemistry_basics_study_pack.md":
        "ks3_science_chemistry_chemistry_basics",
    "chemistry/02_particles_study_pack.md":
        "ks3_science_chemistry_particles",
    "chemistry/03_atoms_elements_compounds_study_pack.md":
        "ks3_science_chemistry_atoms_elements_compounds",
    "chemistry/04_chemical_reactions_study_pack.md":
        "ks3_science_chemistry_chemical_reactions",
    "chemistry/05_earth_atmosphere_study_pack.md":
        "ks3_science_chemistry_earth_atmosphere",

    # Physics
    "physics/01_forces_study_pack.md":
        "ks3_science_physics_forces",
    "physics/02_energy_study_pack.md":
        "ks3_science_physics_energy",
    "physics/03_electricity_study_pack.md":
        "ks3_science_physics_electricity",
    "physics/04_space_study_pack.md":
        "ks3_science_physics_space",
    "physics/05_waves_study_pack.md":
        "ks3_science_physics_waves",
    "physics/06_magnetism_study_pack.md":
        "ks3_science_physics_magnetism",
    "physics/07_motion_pressure_study_pack.md":
        "ks3_science_physics_motion_pressure",

    # Working Scientifically
    "working_scientifically/01_scientific_investigation_study_pack.md":
        "ks3_science_working_scientifically_scientific_investigation",
    "working_scientifically/02_data_graphs_study_pack.md":
        "ks3_science_working_scientifically_data_graphs",
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def load_manifest():
    with open(MANIFEST, encoding="utf-8") as f:
        return json.load(f)

def save_manifest(data):
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

def pack_dir_from_id(pack_id):
    """Derive the pack directory name from a manifest id.

    Convention: ks3_science_<discipline>_<topic...>
    Pack dir:   data/Packs/ks3/science/<discipline>_<topic...>
    """
    # Strip the "ks3_science_" prefix and the rest is the folder name
    prefix = "ks3_science_"
    if not pack_id.startswith(prefix):
        raise ValueError(f"Unexpected pack id format: {pack_id!r}")
    folder_name = pack_id[len(prefix):]
    return PACK_ROOT / folder_name


# ── Main migration logic ──────────────────────────────────────────────────────

def run(apply: bool):
    mode = "APPLY" if apply else "DRY-RUN"
    print(f"\n{'='*60}")
    print(f"  KS3 Science Study Notes Migration  [{mode}]")
    print(f"{'='*60}\n")

    # Validate source root exists
    if not SOURCE_ROOT.exists():
        print(f"ERROR: Source root not found:\n  {SOURCE_ROOT}")
        return

    # Load manifest
    manifest = load_manifest()
    pack_index = {p["id"]: p for p in manifest.get("packs", [])}

    errors  = []
    actions = []   # list of (src, dst, pack_id, content_md_path)

    for rel_src, pack_id in MAPPING.items():
        src = SOURCE_ROOT / rel_src

        # Validate source file exists
        if not src.exists():
            errors.append(f"MISSING SOURCE: {src}")
            continue

        # Validate pack dir exists in learning-web
        pack_dir = pack_dir_from_id(pack_id)
        if not pack_dir.exists():
            errors.append(f"MISSING PACK DIR: {pack_dir}  (for {pack_id})")
            continue

        # Validate pack is registered in manifest
        if pack_id not in pack_index:
            errors.append(f"NOT IN MANIFEST: {pack_id}")
            continue

        dst = pack_dir / DEST_FILENAME
        # contentMdPath is relative to the repo root (matches unifiedPath convention)
        content_md_path = f"data/Packs/ks3/science/{pack_dir.name}/{DEST_FILENAME}"

        actions.append((src, dst, pack_id, content_md_path))

    # Print any errors
    if errors:
        print("ERRORS — these items will be skipped:\n")
        for e in errors:
            print(f"  ✗ {e}")
        print()

    # Preview / execute
    print(f"{'Pack ID':<55} {'Action'}")
    print("-" * 80)

    manifest_patches = 0

    for src, dst, pack_id, content_md_path in actions:
        already_has_path = pack_index[pack_id].get("contentMdPath") == content_md_path
        file_already_there = dst.exists()

        file_status = "exists" if file_already_there else "NEW"
        manifest_status = "already set" if already_has_path else "will patch"

        print(f"  {pack_id:<53}  file={file_status}  manifest={manifest_status}")
        print(f"    src: {src.relative_to(SOURCE_ROOT)}")
        print(f"    dst: {content_md_path}\n")

        if apply:
            shutil.copy2(src, dst)
            if not already_has_path:
                pack_index[pack_id]["contentMdPath"] = content_md_path
                manifest_patches += 1

    if not actions:
        print("  Nothing to do.\n")
        return

    print(f"\nTotal: {len(actions)} file(s)  |  {len(errors)} skipped  |  {manifest_patches if apply else '?'} manifest patch(es)")

    if apply:
        if manifest_patches:
            save_manifest(manifest)
            print(f"\nManifest saved → {MANIFEST}")
        else:
            print("\nManifest already up to date — not rewritten.")
        print("\nDone.")
    else:
        print("\nDry-run only. Run with --apply to execute.\n")


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write files and patch manifest.json (default is dry-run preview)",
    )
    args = parser.parse_args()
    run(apply=args.apply)
