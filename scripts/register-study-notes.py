#!/usr/bin/env python3
"""Scan data/Packs for study_notes.md and register them in manifest.revisionPacks."""

import json, os, re, sys

ROOT = "/Users/charlestan/learning-web"
MANIFEST_PATH = os.path.join(ROOT, "data/generated/manifest.json")
PACKS_DIR = os.path.join(ROOT, "data/Packs")

# Load manifest
with open(MANIFEST_PATH) as f:
    manifest = json.load(f)

existing_packs = {p["id"]: p for p in manifest.get("packs", [])}
existing_rp = {p["id"]: p for p in manifest.get("revisionPacks", [])}

# Build set of contentMdPath already in revisionPacks
existing_rp_md_paths = set()
for p in manifest.get("revisionPacks", []):
    if p.get("contentMdPath"):
        existing_rp_md_paths.add(os.path.normpath(os.path.join(ROOT, p["contentMdPath"])))

new_entries = []
seen_pack_ids = set()

for root, dirs, files in os.walk(PACKS_DIR):
    for f in files:
        if f != "study_notes.md":
            continue
        md_path = os.path.join(root, f)
        md_path_norm = os.path.normpath(md_path)

        # Already in revisionPacks?
        if md_path_norm in existing_rp_md_paths:
            continue

        rel_path = os.path.relpath(md_path, ROOT)
        pack_dir = os.path.basename(root)
        rel_dir = os.path.relpath(root, PACKS_DIR)
        parts = rel_dir.split(os.sep)
        curriculum = parts[0] if len(parts) >= 1 else "other"
        subject = parts[1] if len(parts) >= 2 else "other"

        # Map subject aliases
        subject_map = {
            "religious_studies": "religious_studies",
            "religion": "religion",
        }

        # Check for existing packs entry for this pack_dir
        existing_entry = None
        for arr_name in ["packs", "revisionPacks"]:
            for p in manifest.get(arr_name, []):
                if p.get("id") == pack_dir:
                    existing_entry = p
                    break
                # Also check by unifiedPath directory
                up = p.get("unifiedPath", "")
                if up and os.path.basename(os.path.dirname(up)) == pack_dir:
                    existing_entry = p
                    break
                # Check by contentMdPath
                cmp = p.get("contentMdPath", "")
                if cmp and os.path.normpath(os.path.join(ROOT, cmp)) == md_path_norm:
                    existing_entry = p
                    break
            if existing_entry:
                break

        if existing_entry:
            # Use existing entry data, add contentMdPath
            entry = {
                "id": existing_entry.get("id", pack_dir),
                "displayName": existing_entry.get("displayName", pack_dir.replace("_", " ").title()),
                "subject": existing_entry.get("subject", subject),
                "curriculum": existing_entry.get("curriculum", curriculum),
                "contentMdPath": rel_path,
                "capabilities": existing_entry.get("capabilities", ["revision"]),
            }
            # Include other useful fields if present
            for field in ["topic", "sourceLanguageCode", "targetLanguageCode", "speechLanguage", "grammarFocusEn", "sourceLanguageLabel", "targetLanguageLabel"]:
                if field in existing_entry and field not in entry:
                    entry[field] = existing_entry[field]
        else:
            # Create minimal new entry
            # Generate display name from pack dir
            name_parts = pack_dir.replace("-", " ").replace("_", " ").split()
            display_parts = []
            curriculum_prefix = curriculum.replace("-", " ").title()
            for i, part in enumerate(name_parts):
                if part.lower() in ("ks3", "gcse", "usmsg"):
                    if part.lower() == "usmsg":
                        continue  # skip internal prefix
                    continue
                if part.lower() in ("a", "an", "the", "and", "of", "in", "to", "for"):
                    display_parts.append(part.lower())
                else:
                    display_parts.append(part.capitalize())
            display_name = f"{curriculum_prefix} — {' '.join(display_parts)}"

            entry = {
                "id": pack_dir,
                "displayName": display_name,
                "subject": subject,
                "curriculum": curriculum,
                "contentMdPath": rel_path,
                "capabilities": ["revision"],
            }

        # Avoid duplicates
        if entry["id"] in seen_pack_ids:
            continue
        if entry["id"] in existing_rp:
            # Update existing revisionPacks entry with contentMdPath if missing
            existing = existing_rp[entry["id"]]
            if not existing.get("contentMdPath"):
                existing["contentMdPath"] = rel_path
            continue

        seen_pack_ids.add(entry["id"])
        new_entries.append(entry)

if not new_entries:
    print("No new study_notes.md packs to register (all already in revisionPacks).")
else:
    # Initialize revisionPacks if needed
    if "revisionPacks" not in manifest:
        manifest["revisionPacks"] = []
    manifest["revisionPacks"].extend(new_entries)
    # Sort by id for consistency
    manifest["revisionPacks"].sort(key=lambda x: x.get("id", ""))

    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"Registered {len(new_entries)} new revisionPacks entries.")

# Final stats
total_rp = len(manifest.get("revisionPacks", []))
with_md = sum(1 for p in manifest.get("revisionPacks", []) if p.get("contentMdPath"))
print(f"revisionPacks total: {total_rp}, with contentMdPath: {with_md}")
