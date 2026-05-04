#!/usr/bin/env python3
"""
generate_pack.py — call an AI (Anthropic, OpenAI, or Codex) to generate a Learning
Web pack, parse the response, validate it, and stage it for review.

The system prompt is loaded from `docs/pack-generation-prompt.md` (the
section between `## BEGIN PROMPT` / `## END PROMPT` markers). Template
variables (`{{SUBJECT}}`, `{{TOPIC}}`, etc.) are filled from CLI args.

Output is written to a staging folder (default: `generated_packs/<pack_id>/`)
so a human can review before promoting into `data/Packs/`,
`data/SentenceBuilderPacks/`, and `data/PassagePacks/`. The manifest is
intentionally NOT updated by this script — a separate merge step does that.

Usage examples
--------------

    # Anthropic (default), dry-run a History pack
    python3 scripts/generate_pack.py \\
        --subject history \\
        --topic "Norman Conquest" \\
        --level GCSE \\
        --pack-id norman_conquest \\
        --group-id ks3_history \\
        --curriculum "GCSE History — Medieval" \\
        --dry-run

    # OpenAI, with source materials (image + notes)
    python3 scripts/generate_pack.py \\
        --provider openai \\
        --subject geography \\
        --topic "Rivers" \\
        --level Y8 \\
        --pack-id ks3_geography_rivers \\
        --group-id ks3_geography \\
        --source ~/textbook_p47.jpg \\
        --source ~/notes.md

    # Folder of source materials — recursively picks up all supported
    # files (images + text), skipping hidden files. Cap is 20 per run;
    # override with LW_PACK_MAX_ATTACHMENTS env var.
    python3 scripts/generate_pack.py \\
        --subject history \\
        --topic "Tudors" \\
        --level GCSE \\
        --pack-id tudors \\
        --group-id ks3_history \\
        --source ~/curriculum/tudors/

    # Language pack (German)
    python3 scripts/generate_pack.py \\
        --subject language \\
        --topic "Y7 German Family and Pets" \\
        --level Y7 \\
        --pack-id y7_family_pets \\
        --group-id "" \\
        --source-label German --source-code de-DE \\
        --target-label English --target-code en-GB \\
        --speech-code de-DE

Environment
-----------

    ANTHROPIC_API_KEY   required when --provider anthropic
    OPENAI_API_KEY      required when --provider openai
    CODEX_API_KEY       required when --provider codex

Install
-------

    pip3 install anthropic openai --break-system-packages

    # Codex CLI (for --provider codex):
    npm i -g @openai/codex
    codex  # login / auth first

Exit codes
----------

    0  success, files written (or printed if --dry-run)
    1  invalid CLI args / missing prompt / missing API key
    2  AI call failed
    3  parse / validation failed (raw response saved to staging folder)
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


# ─── Constants ────────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).resolve().parents[1]
PROMPT_PATH = REPO_ROOT / "docs" / "pack-generation-prompt.md"
DEFAULT_OUT = REPO_ROOT / "generated_packs"

ALLOWED_SUBJECTS = {"language", "history", "geography", "science"}
SUPPORTED_IMAGE_TYPES = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                         ".gif": "image/gif", ".webp": "image/webp"}
SUPPORTED_TEXT_TYPES = {".txt", ".md", ".markdown", ".csv", ".json", ".yaml", ".yml"}

# Default models (override with --model). Choose strong-context, high-quality.
DEFAULT_ANTHROPIC_MODEL = "claude-opus-4-6"
DEFAULT_OPENAI_MODEL = "gpt-4o"

MAX_OUTPUT_TOKENS = 16384


# ─── CLI ──────────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        prog="generate_pack.py",
        description="Generate a Learning Web pack via Anthropic or OpenAI.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    # Template variables
    p.add_argument("--subject", required=True, choices=sorted(ALLOWED_SUBJECTS),
                   help="Subject bucket")
    p.add_argument("--topic", required=True, help="Topic title (e.g. 'The Black Death')")
    p.add_argument("--level", required=True, help="Year level (e.g. 'Y7', 'GCSE', 'KS3 / Year 7')")
    p.add_argument("--pack-id", required=True, help="snake_case pack ID")
    p.add_argument("--group-id", default="",
                   help="snake_case passage-group ID (empty = skip passage pack)")
    p.add_argument("--curriculum", default="",
                   help="Curriculum / exam context, e.g. 'AQA GCSE German Theme 1'")

    # Language settings — defaults appropriate for non-language subjects
    p.add_argument("--source-label", default="English",
                   help="Source language label (default: English)")
    p.add_argument("--source-code", default="en-GB",
                   help="BCP-47 source language code (default: en-GB)")
    p.add_argument("--target-label", default="English",
                   help="Target language label (default: English)")
    p.add_argument("--target-code", default="en-GB",
                   help="BCP-47 target language code (default: en-GB)")
    p.add_argument("--speech-code", default=None,
                   help="BCP-47 TTS code (default: same as --source-code)")

    # AI provider
    p.add_argument("--provider", choices=["anthropic", "openai", "codex"], default="anthropic",
                   help="AI provider (default: anthropic)")
    p.add_argument("--model", default=None,
                   help=f"Model override. Defaults: anthropic={DEFAULT_ANTHROPIC_MODEL}, "
                        f"openai={DEFAULT_OPENAI_MODEL}")

    # Source materials
    p.add_argument("--source", action="append", default=[], metavar="PATH",
                   help="Attach a source file or folder. Files: image (.png/.jpg/"
                        ".jpeg/.gif/.webp) or text (.txt/.md/.csv/.json/.yaml). "
                        "Folders: walked recursively, supported files attached, "
                        "hidden files skipped. Repeatable. Cap of 20 files per run "
                        "(override with LW_PACK_MAX_ATTACHMENTS env var).")

    # Output
    p.add_argument("--out", type=Path, default=DEFAULT_OUT,
                   help=f"Staging output directory (default: {DEFAULT_OUT.relative_to(REPO_ROOT)})")
    p.add_argument("--dry-run", action="store_true",
                   help="Print summary instead of writing files (raw response is still saved)")
    p.add_argument("--verbose", "-v", action="store_true",
                   help="Print the rendered prompt and full response")

    args = p.parse_args()
    if not args.speech_code:
        args.speech_code = args.source_code
    return args


# ─── Prompt loading + variable substitution ───────────────────────────────

def load_prompt_template() -> str:
    if not PROMPT_PATH.exists():
        die(f"Prompt template not found at {PROMPT_PATH}", code=1)
    text = PROMPT_PATH.read_text(encoding="utf-8")
    # Extract the section between `## BEGIN PROMPT` / `## END PROMPT`.
    match = re.search(
        r"^##\s+BEGIN\s+PROMPT\s*\n(.*?)\n^##\s+END\s+PROMPT\s*$",
        text, re.MULTILINE | re.DOTALL,
    )
    if not match:
        die("Prompt template missing '## BEGIN PROMPT' / '## END PROMPT' fences", code=1)
    return match.group(1).strip()


def render_prompt(template: str, args: argparse.Namespace) -> str:
    """Substitute {{TEMPLATE_VARIABLES}} in the prompt. Unknown variables are
    left untouched so the assistant can still see the placeholder convention."""
    subject_human = args.subject.capitalize()
    title = guess_title(args.topic, args.level)
    substitutions = {
        "{{SUBJECT}}": subject_human,
        "{{SUBJECT_LOWERCASE}}": args.subject,
        "{{TOPIC}}": args.topic,
        "{{LEVEL}}": args.level,
        "{{CURRICULUM_CONTEXT}}": args.curriculum or f"{subject_human} ({args.level})",
        "{{PACK_ID}}": args.pack_id,
        "{{GROUP_ID}}": args.group_id,
        "{{HUMAN_TITLE}}": title,
        "{{SHORT_SUBTITLE_OPTIONAL}}": "",
        "{{HUMAN_GROUP_TITLE}}": humanize_id(args.group_id) if args.group_id else "",
        "{{SOURCE_LABEL}}": args.source_label,
        "{{SOURCE_CODE}}": args.source_code,
        "{{TARGET_LABEL}}": args.target_label,
        "{{TARGET_CODE}}": args.target_code,
        "{{SPEECH_CODE}}": args.speech_code,
    }
    rendered = template
    for k, v in substitutions.items():
        rendered = rendered.replace(k, v)
    return rendered


def guess_title(topic: str, level: str) -> str:
    return f"{level} — {topic}" if level and level not in topic else topic


def humanize_id(slug: str) -> str:
    if not slug:
        return ""
    return " ".join(p.capitalize() for p in slug.replace("_", " ").split())


# ─── Source attachments ───────────────────────────────────────────────────

@dataclass
class Attachment:
    path: Path
    kind: str         # "image" or "text"
    mime: Optional[str]
    text: Optional[str]
    image_b64: Optional[str]


# Cap on attachments per run — guards against an accidentally huge folder.
# Override with LW_PACK_MAX_ATTACHMENTS env var.
DEFAULT_MAX_ATTACHMENTS = 20


def _is_supported_file(path: Path) -> bool:
    """True if a single file looks like something we know how to attach."""
    if not path.is_file():
        return False
    if path.name.startswith("."):
        return False
    suffix = path.suffix.lower()
    return suffix in SUPPORTED_IMAGE_TYPES or suffix in SUPPORTED_TEXT_TYPES


def _expand_source_paths(raw_paths: list[str]) -> list[Path]:
    """Resolve each --source argument to a list of concrete files. Each entry
    can be either a file or a directory:

      * file → kept as-is (errors if missing)
      * directory → recursively walked; supported files are included.
        Hidden files (starting with '.') are skipped. Unsupported types are
        skipped silently with a single summary warning to stderr.

    Order is preserved across multiple --source flags; within each directory
    files are sorted alphabetically for determinism.
    """
    expanded: list[Path] = []
    for raw in raw_paths:
        path = Path(raw).expanduser()
        if not path.exists():
            die(f"Source attachment not found: {path}", code=1)
        if path.is_file():
            expanded.append(path)
            continue
        if path.is_dir():
            picked: list[Path] = []
            skipped = 0
            for child in sorted(path.rglob("*")):
                if not child.is_file():
                    continue
                if any(part.startswith(".") for part in child.relative_to(path).parts):
                    continue  # skip hidden files / dot-folders
                if _is_supported_file(child):
                    picked.append(child)
                else:
                    skipped += 1
            if not picked:
                die(f"Source folder {path} contained no supported files "
                    f"(images: {sorted(SUPPORTED_IMAGE_TYPES)}; "
                    f"text: {sorted(SUPPORTED_TEXT_TYPES)})", code=1)
            print(f"  Expanded {path}/ → {len(picked)} file(s) "
                  f"({skipped} skipped as unsupported)", file=sys.stderr)
            expanded.extend(picked)
            continue
        die(f"Source path is neither file nor directory: {path}", code=1)
    return expanded


def load_attachments(paths: list[str]) -> list[Attachment]:
    files = _expand_source_paths(paths)

    cap_raw = os.environ.get("LW_PACK_MAX_ATTACHMENTS", str(DEFAULT_MAX_ATTACHMENTS))
    try:
        cap = int(cap_raw)
    except ValueError:
        cap = DEFAULT_MAX_ATTACHMENTS
    if len(files) > cap:
        die(f"{len(files)} attachments exceeds the safety cap of {cap}. "
            f"Narrow the --source path(s) or override with "
            f"LW_PACK_MAX_ATTACHMENTS={len(files)}.", code=1)

    attachments: list[Attachment] = []
    for path in files:
        suffix = path.suffix.lower()
        if suffix in SUPPORTED_IMAGE_TYPES:
            data = path.read_bytes()
            attachments.append(Attachment(
                path=path,
                kind="image",
                mime=SUPPORTED_IMAGE_TYPES[suffix],
                text=None,
                image_b64=base64.b64encode(data).decode("ascii"),
            ))
        elif suffix in SUPPORTED_TEXT_TYPES or path.is_file():
            attachments.append(Attachment(
                path=path,
                kind="text",
                mime=None,
                text=path.read_text(encoding="utf-8", errors="replace"),
                image_b64=None,
            ))
        else:
            die(f"Unsupported attachment type {suffix} for {path}", code=1)
    return attachments


# ─── Provider clients ─────────────────────────────────────────────────────

def call_anthropic(system_prompt: str, user_blocks: list, model: str) -> tuple[str, dict]:
    try:
        import anthropic  # type: ignore
    except ImportError:
        die("`anthropic` not installed. Run: pip3 install anthropic --break-system-packages", code=1)

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        die("ANTHROPIC_API_KEY not set", code=1)

    client = anthropic.Anthropic(api_key=api_key)
    print(f"→ Calling Anthropic ({model})…", file=sys.stderr)
    response = client.messages.create(
        model=model,
        max_tokens=MAX_OUTPUT_TOKENS,
        system=system_prompt,
        messages=[{"role": "user", "content": user_blocks}],
    )
    text = "".join(block.text for block in response.content if block.type == "text")
    meta = {
        "input_tokens": getattr(response.usage, "input_tokens", None),
        "output_tokens": getattr(response.usage, "output_tokens", None),
        "stop_reason": getattr(response, "stop_reason", None),
    }
    return text, meta


def call_openai(system_prompt: str, user_blocks: list, model: str) -> tuple[str, dict]:
    try:
        import openai  # type: ignore
    except ImportError:
        die("`openai` not installed. Run: pip3 install openai --break-system-packages", code=1)

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        die("OPENAI_API_KEY not set", code=1)

    # OpenAI's chat API uses a different content-block schema for images:
    # {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}
    converted: list = []
    for block in user_blocks:
        if block.get("type") == "image":
            src = block["source"]
            converted.append({
                "type": "image_url",
                "image_url": {"url": f"data:{src['media_type']};base64,{src['data']}"},
            })
        else:
            converted.append({"type": "text", "text": block["text"]})

    client = openai.OpenAI(api_key=api_key)
    print(f"→ Calling OpenAI ({model})…", file=sys.stderr)
    response = client.chat.completions.create(
        model=model,
        max_tokens=MAX_OUTPUT_TOKENS,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": converted},
        ],
    )
    text = response.choices[0].message.content or ""
    usage = response.usage
    meta = {
        "input_tokens": getattr(usage, "prompt_tokens", None),
        "output_tokens": getattr(usage, "completion_tokens", None),
        "stop_reason": response.choices[0].finish_reason,
    }
    return text, meta


def build_user_blocks(args: argparse.Namespace, attachments: list[Attachment]) -> list:
    """Build the user-message content blocks (Anthropic-shaped; the OpenAI
    adapter converts images to image_url blocks)."""
    blocks: list = []
    instruction = (
        f"Generate the pack as specified by the system prompt.\n\n"
        f"Subject:               {args.subject}\n"
        f"Topic:                 {args.topic}\n"
        f"Level:                 {args.level}\n"
        f"Curriculum context:    {args.curriculum or '—'}\n"
        f"Pack ID:               {args.pack_id}\n"
        f"Passage group ID:      {args.group_id or '(skip passage pack)'}\n"
        f"Source language:       {args.source_label} ({args.source_code})\n"
        f"Target language:       {args.target_label} ({args.target_code})\n"
        f"Speech language:       {args.speech_code}\n"
    )
    blocks.append({"type": "text", "text": instruction})

    for att in attachments:
        if att.kind == "image":
            blocks.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": att.mime,
                    "data": att.image_b64,
                },
            })
            blocks.append({"type": "text", "text": f"(Above: {att.path.name})"})
        else:
            blocks.append({
                "type": "text",
                "text": f"--- Attached source file: {att.path.name} ---\n{att.text}\n--- end ---",
            })

    if not args.group_id:
        blocks.append({
            "type": "text",
            "text": "Note: passage group ID was not provided. Skip the passage pack file.",
        })
    return blocks


# ─── Response parsing ─────────────────────────────────────────────────────

# Matches headers like:   FILE: data/Packs/foo/pack_unified.json
# followed by a fenced ```json ... ``` block. Tolerates leading whitespace,
# optional surrounding backticks/markdown emphasis on the FILE line, and any
# language tag on the fence (we accept ``` and ```json).
_FILE_BLOCK_RE = re.compile(
    r"""
    (?:^|\n)\s*(?:`+|\*+)?\s*FILE:\s*(?P<path>[^\n`*]+?)\s*(?:`+|\*+)?\s*\n
    \s*```(?:json)?\s*\n
    (?P<body>.*?)
    \n```
    """,
    re.DOTALL | re.VERBOSE | re.IGNORECASE,
)


@dataclass
class ParsedFile:
    declared_path: str    # e.g. "data/Packs/foo/pack_unified.json"
    body: str             # raw JSON string
    parsed: object        # parsed object (dict / list)


def parse_response(text: str) -> list[ParsedFile]:
    out: list[ParsedFile] = []
    for m in _FILE_BLOCK_RE.finditer(text):
        path = m.group("path").strip()
        body = m.group("body").strip()
        try:
            parsed = json.loads(body)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in FILE block for '{path}': {e}") from e
        out.append(ParsedFile(declared_path=path, body=body, parsed=parsed))
    return out


# ─── Validation ───────────────────────────────────────────────────────────

def validate_pack(parsed: object, expected_subject: str, expected_pack_id: Optional[str] = None,
                  context: str = "pack") -> list[str]:
    """Lightweight schema-1.1 sanity check. Returns a list of warnings (empty
    means clean). Does not enforce every rule — that's the runtime's job."""
    warnings: list[str] = []
    if not isinstance(parsed, dict):
        warnings.append(f"{context}: expected JSON object, got {type(parsed).__name__}")
        return warnings

    required = ["packId", "title", "schemaVersion", "items",
                "sourceLanguageCode", "targetLanguageCode"]
    for field in required:
        if field not in parsed:
            warnings.append(f"{context}: missing required field '{field}'")

    if parsed.get("schemaVersion") != "1.1":
        warnings.append(f"{context}: schemaVersion should be '1.1', got {parsed.get('schemaVersion')!r}")

    subject = parsed.get("subject")
    if subject not in ALLOWED_SUBJECTS:
        warnings.append(f"{context}: subject {subject!r} not in {sorted(ALLOWED_SUBJECTS)}")
    elif subject != expected_subject:
        warnings.append(f"{context}: subject {subject!r} disagrees with --subject {expected_subject!r}")

    if expected_pack_id and parsed.get("packId") != expected_pack_id:
        warnings.append(f"{context}: packId {parsed.get('packId')!r} disagrees with --pack-id {expected_pack_id!r}")

    items = parsed.get("items", [])
    if not isinstance(items, list) or not items:
        warnings.append(f"{context}: items[] missing or empty")
    else:
        seen_ids: set[str] = set()
        for i, item in enumerate(items):
            if not isinstance(item, dict):
                warnings.append(f"{context}: items[{i}] is not an object")
                continue
            for f in ("id", "type", "data"):
                if f not in item:
                    warnings.append(f"{context}: items[{i}] missing '{f}'")
            iid = item.get("id")
            if iid in seen_ids:
                warnings.append(f"{context}: duplicate item id {iid!r}")
            elif iid:
                seen_ids.add(iid)
    return warnings


def detect_role(declared_path: str) -> str:
    """Map a declared FILE path to its role for staging."""
    p = declared_path.lower()
    if "passagepacks" in p:
        return "passage"
    if "sentencebuilderpacks" in p:
        return "sentence_builder"
    if "manifest" in p:
        return "manifest"
    return "revision"


# ─── Output writing ───────────────────────────────────────────────────────

def stage_files(out_dir: Path, files: list[ParsedFile], raw_response: str,
                inputs_meta: dict, dry_run: bool) -> dict:
    summary: dict = {"out_dir": str(out_dir), "wrote": [], "skipped_dry_run": []}
    if dry_run:
        for f in files:
            summary["skipped_dry_run"].append({
                "role": detect_role(f.declared_path),
                "declared_path": f.declared_path,
                "items": len(f.parsed.get("items", [])) if isinstance(f.parsed, dict) else None,
            })
        # We still save raw response + inputs for debugging
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "raw_response.txt").write_text(raw_response, encoding="utf-8")
        (out_dir / "inputs.json").write_text(json.dumps(inputs_meta, indent=2), encoding="utf-8")
        summary["wrote"].extend(["raw_response.txt", "inputs.json"])
        return summary

    out_dir.mkdir(parents=True, exist_ok=True)
    role_filenames = {
        "revision":         "pack_unified.json",
        "sentence_builder": "sentence_builder_unified.json",
        "passage":          "passage_unified.json",
        "manifest":         "manifest_entries.json",
    }
    for f in files:
        role = detect_role(f.declared_path)
        filename = role_filenames.get(role, f"unknown_{len(summary['wrote'])}.json")
        target = out_dir / filename
        # Pretty-print
        if isinstance(f.parsed, (dict, list)):
            target.write_text(json.dumps(f.parsed, ensure_ascii=False, indent=2) + "\n",
                              encoding="utf-8")
        else:
            target.write_text(f.body, encoding="utf-8")
        summary["wrote"].append(filename)

    # Always save raw response + inputs for traceability
    (out_dir / "raw_response.txt").write_text(raw_response, encoding="utf-8")
    (out_dir / "inputs.json").write_text(json.dumps(inputs_meta, indent=2), encoding="utf-8")
    summary["wrote"].extend(["raw_response.txt", "inputs.json"])
    return summary


# ─── Helpers ──────────────────────────────────────────────────────────────

def die(msg: str, code: int = 1) -> None:
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(code)


def green(s): return f"\033[32m{s}\033[0m"
def red(s):   return f"\033[31m{s}\033[0m"
def dim(s):   return f"\033[2m{s}\033[0m"


# ─── Main ─────────────────────────────────────────────────────────────────


# ─── Codex prompt builder ─────────────────────────────────────────────────

def build_codex_prompt(args: argparse.Namespace, attachments: list) -> str:
    """Build the text prompt passed to `codex exec`.

    Loads the master template from:
      REPO_ROOT / "docs" / "pack-generation-prompt.md"

    Substitutes all determinable {{VARIABLES}} then appends:
      - Source file paths / content
      - Strict safety rules (write only to generated_packs/<pack_id>/)
      - STOP instruction

    Variables that cannot be derived from args (e.g. item counts) are left
    as-is so Codex fills them in as part of generation.
    """
    import re as _re
    import pathlib as _pathlib

    prompt_path = REPO_ROOT / "docs" / "pack-generation-prompt.md"
    if not prompt_path.exists():
        raise FileNotFoundError(
            "Master prompt file not found: "
            + str(prompt_path)
            + "\nDownload from:\n"
            + str(REPO_ROOT / "docs" / "pack-generation-prompt.md")
        )
    raw = prompt_path.read_text(encoding="utf-8")
    m = _re.search(
        r"(?:^## BEGIN PROMPT\s*\n)(.+?)(?:\s*^## END PROMPT)",
        raw,
        _re.DOTALL | _re.MULTILINE,
    )
    if m is None:
        raise ValueError(
            "Could not find BEGIN PROMPT / END PROMPT fences in " + str(prompt_path)
        )
    tmpl = m.group(1).rstrip()

    # ── Build variable substitutions ─────────────────────────────────────
    group_title = (
        args.level + " " + args.subject.capitalize() + " \u2014 " + args.topic
        if not args.group_id
        else args.group_id.replace("_", " ").title()
    )
    file_list = (
        "\n".join(f"- {att.path}  [{att.kind}]" for att in attachments)
        if attachments
        else "(no source files attached \u2014 generate from topic + level)"
    )

    subs = {
        "{{SUBJECT}}":              args.subject.capitalize(),
        "{{SUBJECT_LOWERCASE}}":    args.subject.lower(),
        "{{TOPIC}}":                args.topic,
        "{{LEVEL}}":                args.level,
        "{{CURRICULUM_CONTEXT}}":   (args.curriculum or "(not specified)"),
        "{{PACK_ID}}":              args.pack_id,
        "{{GROUP_ID}}":            (args.group_id or ""),
        "{{SOURCE_LABEL}}":        args.source_label,
        "{{SOURCE_CODE}}":         args.source_code,
        "{{TARGET_LABEL}}":        args.target_label,
        "{{TARGET_CODE}}":         args.target_code,
        "{{SPEECH_CODE}}":         (args.speech_code or args.source_code),
        # Derived
        "{{HUMAN_TITLE}}":          args.level + " " + args.subject.capitalize() + " \u2014 " + args.topic,
        "{{SHORT_SUBTITLE_OPTIONAL}}": "Revision pack for " + args.topic,
        "{{HUMAN_GROUP_TITLE}}":   group_title,
        # Source file listing
        "{{SOURCE_FILE_LIST}}":    file_list,
    }

    # Apply substitutions; leave unknown {{VARIABLES}} as-is
    def _repl(mo):
        return subs.get(mo.group(0), mo.group(0))

    prompt_text = _re.sub(r"\{\{[^}]+\}\}", _repl, tmpl)

    # ── Append source materials ───────────────────────────────────────────
    out_lines = [prompt_text, ""]
    out_lines.append("=" * 60)
    out_lines.append("SOURCE MATERIALS FOR THIS RUN")
    out_lines.append("=" * 60)

    if attachments:
        out_lines.append(
            "The following source files are available on disk. "
            "Read them directly from their paths."
        )
        out_lines.append("")
        for att in attachments:
            out_lines.append("  File: " + str(att.path) + "  [kind=" + att.kind + "]")
            if att.kind != "image":
                snippet = (att.text or "")
                limit = 4000
                for chunk in _chunk(snippet, 500):
                    out_lines.append("  " + chunk)
                if len(snippet) > limit:
                    out_lines.append(
                        "  [... " + str(len(snippet) - limit) + " more chars truncated ...]"
                    )
                out_lines.append("")
            else:
                out_lines.append(
                    "  [IMAGE FILE \u2014 describe what you see in this image for context]"
                )
                out_lines.append("  Image path: " + str(att.path))
                out_lines.append("")
    else:
        out_lines.append("No source files attached.")
        out_lines.append("Use your curriculum knowledge to fill gaps accurately.")
        out_lines.append("")

    # ── Append safety + output rules ─────────────────────────────────────
    out_lines.append("=" * 60)
    out_lines.append("OUTPUT RULES (STRICT \u2014 VIOLATION WILL CAUSE DATA LOSS)")
    out_lines.append("=" * 60)
    out_lines.append("")
    out_lines.append("Write ALL files to the STAGING FOLDER ONLY:")
    out_lines.append("  generated_packs/" + args.pack_id + "/")
    out_lines.append("")
    out_lines.append("PERMITTED files to create inside that folder:")
    out_lines.append("  generated_packs/" + args.pack_id + "/pack_unified.json")
    out_lines.append(
        "  generated_packs/" + args.pack_id + "/sentence_builder_unified.json"
    )
    out_lines.append("  generated_packs/" + args.pack_id + "/passage_unified.json")
    out_lines.append("  generated_packs/" + args.pack_id + "/generation_report.md")
    out_lines.append("")
    out_lines.append("NEVER write to any of these locations:")
    out_lines.append("  src/")
    out_lines.append("  data/")
    out_lines.append("  public/data/")
    out_lines.append("  manifest.json")
    out_lines.append("  docs/")
    out_lines.append("  Any existing pack folders")
    out_lines.append("")
    out_lines.append("After writing all files, STOP. Do not output any more text.")
    out_lines.append("")
    out_lines.append(
        "Do not modify manifest.json or any existing application files."
    )
    out_lines.append("")
    out_lines.append(
        'Valid JSON only. schemaVersion must be "1.1" on every pack header.'
    )
    out_lines.append("British English throughout. No invented dates or quotes.")
    out_lines.append("")

    return "\n".join(out_lines)


def _chunk(text: str, width: int = 500) -> list[str]:
    """Split text into chunks of at most `width` chars at whitespace boundaries."""
    words: list[str] = []
    current = ""
    for word in text.split():
        if len(current) + len(word) + 1 <= width:
            current = (current + " " + word).strip()
        else:
            if current:
                words.append(current)
            current = word
    if current:
        words.append(current)
    return words


# ─── Codex runner ─────────────────────────────────────────────────────────

def call_codex_agent(prompt: str, timeout: int = 1200) -> tuple[str, dict]:
    """Run `codex exec <prompt>` as a subprocess with real-time streaming output.

    Each line from Codex is printed immediately to stderr, prefixed with
    [Codex]. A heartbeat timer prints a "." to stderr every 60 seconds of
    silence so the caller knows the process is not stuck.

    Args:
        prompt:  The full text prompt for Codex.
        timeout: Seconds before killing the subprocess (default 1200 = 20 min).

    Returns:
        (stdout_text, meta_dict) — stdout_text is the full concatenated output.

    Raises:
        RuntimeError if the codex command is not found or returns non-zero.
    """
    import shutil as _shutil
    import subprocess as _subprocess
    import time as _time

    if not _shutil.which("codex"):
        raise RuntimeError(
            "Codex CLI not found. Install and login first:\n"
            "  npm i -g @openai/codex\n"
            "  codex\n"
            "Then set CODEX_API_KEY in your environment."
        )

    repo_root = str(REPO_ROOT)
    print(f"-> Calling Codex (streaming) in {repo_root}...", file=sys.stderr)
    print(f"  Prompt: {len(prompt):,} chars  |  Timeout: {timeout}s ({timeout // 60} min)", file=sys.stderr)
    print(f"  Streaming output below — one [Codex] line per line of output.", file=sys.stderr)
    print("-" * 60, file=sys.stderr)

    stdout_lines: list[str] = []
    heartbeat_interval = 60  # seconds between heartbeat dots

    try:
        process = _subprocess.Popen(
            ["codex", "exec", prompt],
            cwd=repo_root,
            stdout=_subprocess.PIPE,
            stderr=_subprocess.STDOUT,  # merge stderr into stdout stream
            text=True,
            bufsize=1,
        )

        last_seen = _time.time()
        first_line = True

        while True:
            line = process.stdout.readline()
            if line == "":
                break  # EOF

            line = line.rstrip()
            stdout_lines.append(line)

            if first_line and heartbeat_interval:
                # Give Codex a moment to start before enabling heartbeat
                first_line = False
                last_seen = _time.time()

            # Print every line immediately
            print(f"[Codex] {line}", file=sys.stderr)

            # Heartbeat: dot every heartbeat_interval seconds of silence
            if heartbeat_interval:
                now = _time.time()
                if now - last_seen >= heartbeat_interval:
                    elapsed = int(now - _time.time() + last_seen)  # rough gap
                    print(f"[Codex] ... (still running, {elapsed}s since last output)", file=sys.stderr)
                    last_seen = now

        process.wait(timeout=timeout)

    except _subprocess.TimeoutExpired:
        process.kill()
        process.wait()
        raise RuntimeError(
            f"Codex timed out after {timeout}s ({timeout // 60} min).\n"
            f"Output so far ({len(stdout_lines)} lines) saved to generated_packs/."
        ) from None
    except OSError as exc:
        raise RuntimeError(
            f"Failed to run `codex exec`: {exc}\n"
            "Make sure the Codex CLI is installed and on your PATH."
        ) from exc

    print("-" * 60, file=sys.stderr)
    if process.returncode != 0:
        raise RuntimeError(
            f"Codex exited with code {process.returncode}.\n"
            f"stdout: {stdout_lines[-1]!r}" if stdout_lines else "No stdout captured."
        )

    return "\n".join(stdout_lines), {"returncode": process.returncode, "timeout": timeout}


# ─── Post-Codex validation ────────────────────────────────────────────────

def check_codex_output(pack_id: str) -> list[str]:
    """Check that Codex wrote the expected files into the staging folder.

    Returns a list of warnings (empty = clean). Does not raise.
    """
    warnings: list[str] = []
    staging = REPO_ROOT / "generated_packs" / pack_id

    if not staging.exists():
        warnings.append(
            "Staging folder missing: " + str(staging) + "\n"
            "Codex may not have written any files."
        )
        return warnings

    pack_path = staging / "pack_unified.json"
    if not pack_path.exists():
        warnings.append(
            "Expected file not found: generated_packs/" + pack_id + "/pack_unified.json"
        )
    else:
        try:
            json.loads(pack_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            warnings.append(
                "Invalid JSON in generated_packs/" + pack_id + "/pack_unified.json: " + str(exc)
            )

    json_files = list(staging.glob("*.json"))
    if not json_files:
        warnings.append(
            "No .json files found in staging folder.\n"
            "Codex may not have created any pack files."
        )

    if not (staging / "generation_report.md").exists():
        warnings.append(
            "generation_report.md not found (optional but recommended)."
        )

    if staging.exists():
        print("\nStaging contents (" + str(staging) + "):", file=sys.stderr)
        for f in sorted(staging.iterdir()):
            size = f.stat().st_size
            note = ""
            if f.suffix == ".json":
                try:
                    d = json.loads(f.read_text(encoding="utf-8"))
                    note = "  [" + str(len(d.get("items", []))) + " items]" if isinstance(d, dict) else ""
                except Exception:
                    note = "  [invalid JSON]"
            print(f"  - {f.name}  ({size:,} bytes){note}", file=sys.stderr)

    return warnings



def main() -> int:
    args = parse_args()

    # 1. Load + render prompt
    prompt_template = load_prompt_template()
    rendered_prompt = render_prompt(prompt_template, args)
    if args.verbose:
        print(dim("--- system prompt (rendered) ---"), file=sys.stderr)
        print(rendered_prompt, file=sys.stderr)
        print(dim("--- end prompt ---"), file=sys.stderr)

    # 2. Load attachments
    attachments = load_attachments(args.source)
    if attachments:
        print(f"Attachments: {len(attachments)} ({', '.join(a.path.name for a in attachments)})",
              file=sys.stderr)

    # 3. Build user blocks + call provider
    user_blocks = build_user_blocks(args, attachments)
    model = args.model or (DEFAULT_ANTHROPIC_MODEL if args.provider == "anthropic"
                           else DEFAULT_OPENAI_MODEL)
    try:
        if args.provider == "anthropic":
            response_text, api_meta = call_anthropic(rendered_prompt, user_blocks, model)
        elif args.provider == "openai":
            response_text, api_meta = call_openai(rendered_prompt, user_blocks, model)
        elif args.provider == "codex":
            codex_prompt = build_codex_prompt(args, attachments)
            if args.verbose:
                print(dim("--- codex prompt ---"), file=sys.stderr)
                print(codex_prompt[:2000], file=sys.stderr)
                print(dim("... [truncated]"), file=sys.stderr)
                print(dim("--- end prompt ---"), file=sys.stderr)
            codex_out, codex_meta = call_codex_agent(codex_prompt)
            response_text = codex_out
            api_meta = {"provider": "codex", **codex_meta}
        else:
            die(f"Unknown provider: {args.provider}", code=1)
    except SystemExit:
        raise
    except Exception as e:
        die(f"AI call failed: {e}", code=2)

    print(f"  ← {api_meta.get('input_tokens')} input tokens, "
          f"{api_meta.get('output_tokens')} output tokens, "
          f"stop_reason={api_meta.get('stop_reason')}", file=sys.stderr)

    if args.verbose:
        print(dim("--- raw response ---"), file=sys.stderr)
        print(response_text, file=sys.stderr)
        print(dim("--- end response ---"), file=sys.stderr)

    # 4. Parse + validate
    out_dir = (args.out / args.pack_id).resolve()
    inputs_meta = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "provider": args.provider,
        "model": model,
        "args": {k: (str(v) if isinstance(v, Path) else v) for k, v in vars(args).items() if k != "source"},
        "sources": [str(a.path) for a in attachments],
        "api_meta": {k: v for k, v in api_meta.items() if k != "cwd"},
    }

    try:
        files = parse_response(response_text)
    except ValueError as e:
        # Save the raw response so the user can salvage manually
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "raw_response.txt").write_text(response_text, encoding="utf-8")
        (out_dir / "inputs.json").write_text(json.dumps(inputs_meta, indent=2), encoding="utf-8")
        die(f"Failed to parse response: {e}\n"
            f"Raw response saved to {out_dir / 'raw_response.txt'}", code=3)

    if not files:
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "raw_response.txt").write_text(response_text, encoding="utf-8")
        (out_dir / "inputs.json").write_text(json.dumps(inputs_meta, indent=2), encoding="utf-8")
        die(f"No FILE blocks found in response.\n"
            f"Raw response saved to {out_dir / 'raw_response.txt'}", code=3)

    print(f"\nParsed {len(files)} file block(s):", file=sys.stderr)
    all_warnings: list[str] = []
    for f in files:
        role = detect_role(f.declared_path)
        items = len(f.parsed.get("items", [])) if isinstance(f.parsed, dict) and "items" in f.parsed else "—"
        print(f"  • [{role}] {f.declared_path} ({items} items)", file=sys.stderr)
        if role in ("revision", "sentence_builder", "passage"):
            warnings = validate_pack(
                f.parsed,
                expected_subject=args.subject,
                expected_pack_id=args.pack_id if role == "revision" else None,
                context=role,
            )
            for w in warnings:
                print(f"    {red('!')} {w}", file=sys.stderr)
            all_warnings.extend(warnings)

    # 5. Stage
    summary = stage_files(out_dir, files, response_text, inputs_meta, args.dry_run)

    print("", file=sys.stderr)
    if args.dry_run:
        print(green("Dry-run complete. Files NOT written."), file=sys.stderr)
        for entry in summary["skipped_dry_run"]:
            print(f"  would write: {entry['declared_path']} → {entry['role']}.json "
                  f"({entry['items']} items)", file=sys.stderr)
    else:
        print(green(f"Wrote {len(summary['wrote'])} file(s) to {out_dir}"), file=sys.stderr)
        for name in summary["wrote"]:
            print(f"  • {name}", file=sys.stderr)

    if all_warnings:
        print("", file=sys.stderr)
        print(red(f"{len(all_warnings)} validation warning(s) above. Review before promoting."),
              file=sys.stderr)
        # Don't fail the run on warnings — they're advisory.

    # ── Codex post-check ────────────────────────────────────────────────
    if args.provider == "codex":
        print("", file=sys.stderr)
        print(dim("--- Codex post-check ---"), file=sys.stderr)
        codex_warnings = check_codex_output(args.pack_id)
        for w in codex_warnings:
            print(f"  {red("!")} {w}", file=sys.stderr)
        if not codex_warnings:
            print(f"  {green('+')} Staging folder looks good.", file=sys.stderr)

        print("", file=sys.stderr)
        print(green("Codex generation completed."), file=sys.stderr)
        print("Staging folder: generated_packs/" + args.pack_id, file=sys.stderr)
        print("", file=sys.stderr)
        print("Next step:", file=sys.stderr)
        print("  python3 scripts/validate_pack.py generated_packs/" + args.pack_id, file=sys.stderr)
        print("  python3 scripts/promote_pack.py generated_packs/" + args.pack_id, file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
