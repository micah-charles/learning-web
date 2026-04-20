#!/usr/bin/env python3
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
OUT_DIR = DATA_DIR / "generated"
OUT_PATH = OUT_DIR / "manifest.json"

ACRONYMS = {"bbc", "gcse", "dw", "y7", "y8", "y9", "y10", "y11"}


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def humanize_slug(value: str) -> str:
    parts = value.replace("_", " ").replace("-", " ").split()
    rendered = []
    for part in parts:
        lower = part.lower()
        if lower in ACRONYMS:
            rendered.append(lower.upper())
        else:
            rendered.append(lower.capitalize())
    return " ".join(rendered)


def count_json_records(path: Path) -> int:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return len(data)
    if isinstance(data, dict) and isinstance(data.get("passages"), list):
        return len(data["passages"])
    return 0


def count_jsonl_records(path: Path) -> int:
    return sum(1 for line in path.read_text(encoding="utf-8").splitlines() if line.strip())


def read_pack_meta(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def build_revision_packs() -> list[dict]:
    root = DATA_DIR / "Packs"
    packs = []
    if not root.exists():
        return packs

    for pack_dir in sorted(root.iterdir()):
        if not pack_dir.is_dir():
            continue
        vocab_path = pack_dir / "vocab.json"
        if not vocab_path.exists():
            continue
        meta = read_pack_meta(pack_dir / "pack.json")
        sentence_path = pack_dir / "sentences.jsonl"
        packs.append(
            {
                "id": pack_dir.name,
                "displayName": meta.get("display_name") or humanize_slug(pack_dir.name),
                "topic": meta.get("topic"),
                "sectionTitleEn": meta.get("section_title_en"),
                "sectionTitleDe": meta.get("section_title_de"),
                "topicEn": meta.get("topic_en"),
                "grammarFocusEn": meta.get("grammar_focus_en"),
                "quizBucket": meta.get("quiz_bucket"),
                "sourceLanguageLabel": meta.get("source_language_label", "German"),
                "sourceLanguageCode": meta.get("source_language_code", "de-DE"),
                "targetLanguageLabel": meta.get("target_language_label", "English"),
                "targetLanguageCode": meta.get("target_language_code", "en-GB"),
                "speechLanguage": meta.get("speech_language") or meta.get("source_language_code", "de-DE"),
                "supportsSentences": meta.get("supports_sentences", True),
                "mergeCoreSentences": meta.get("merge_core_sentences", True),
                "stageOptions": meta.get("stage_options") or [],
                "defaultQuizModes": meta.get("default_quiz_modes") or [],
                "vocabPath": rel(vocab_path),
                "sentencePath": rel(sentence_path) if sentence_path.exists() else None,
                "wordCount": count_json_records(vocab_path),
            }
        )
    return packs


def build_sentence_builder_packs() -> list[dict]:
    root = DATA_DIR / "SentenceBuilderPacks"
    packs = []
    if not root.exists():
        return packs

    for path in sorted(root.glob("*.jsonl")):
        packs.append(
            {
                "id": path.stem,
                "displayName": humanize_slug(path.stem),
                "path": rel(path),
                "cardCount": count_jsonl_records(path),
            }
        )
    return packs


def build_passage_groups() -> list[dict]:
    root = DATA_DIR / "PassagePacks"
    groups = []
    if not root.exists():
        return groups

    for group_dir in sorted(root.iterdir()):
        if not group_dir.is_dir():
            continue

        packs = []
        for path in sorted(group_dir.iterdir()):
            if path.suffix.lower() not in {".json", ".jsonl"}:
                continue
            if path.name.startswith("."):
                continue
            count = count_jsonl_records(path) if path.suffix.lower() == ".jsonl" else count_json_records(path)
            packs.append(
                {
                    "id": f"{group_dir.name}::{path.stem}",
                    "displayName": humanize_slug(path.stem),
                    "path": rel(path),
                    "resourceName": path.stem,
                    "fileType": path.suffix.lower().lstrip("."),
                    "passageCount": count,
                }
            )

        if packs:
            groups.append(
                {
                    "id": group_dir.name,
                    "displayName": humanize_slug(group_dir.name),
                    "packs": packs,
                }
            )
    return groups


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    core_vocab = DATA_DIR / "vocab.json"
    core_sentences = DATA_DIR / "gcse_sentences.jsonl"

    manifest = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "core": {
            "id": "core",
            "displayName": "Core GCSE",
            "vocabPath": rel(core_vocab),
            "sentencePath": rel(core_sentences),
            "wordCount": count_json_records(core_vocab),
            "sentenceCount": count_jsonl_records(core_sentences),
            "sourceLanguageLabel": "German",
            "sourceLanguageCode": "de-DE",
            "targetLanguageLabel": "English",
            "targetLanguageCode": "en-GB",
            "speechLanguage": "de-DE",
            "supportsSentences": True,
            "mergeCoreSentences": True,
            "stageOptions": [],
            "defaultQuizModes": [
                "englishWordChooseGerman",
                "englishSentenceBuildGerman",
                "germanSentenceBuildEnglish",
            ],
        },
        "revisionPacks": build_revision_packs(),
        "sentenceBuilderPacks": build_sentence_builder_packs(),
        "passageGroups": build_passage_groups(),
    }

    OUT_PATH.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
