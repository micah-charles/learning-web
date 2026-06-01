"""
aqa_common.py — Shared utilities for the AQA past-paper pipeline.
"""

from __future__ import annotations

import csv
import json
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


# ---------------------------------------------------------------------------
# Title normalisation helpers
# ---------------------------------------------------------------------------

_RESOURCE_TYPE_PREFIXES = re.compile(
    r"^\s*(question\s+paper|mark\s+scheme|examiner\s+report)\s*:\s*",
    re.IGNORECASE,
)

_EXAM_SERIES_SUFFIX = re.compile(
    r"\s*-\s*(january|june|november|march|october|november|summer|winter)\s+\d{4}"
    r"(\s*-\s*.+)?$",
    re.IGNORECASE,
)

_MODIFIED_PATTERNS = re.compile(
    r"\b(modified\s+a[34]\s+\d+pt|modified\s+a[34]|18\s*pt|36\s*pt"
    r"|large\s+print|modified)\b",
    re.IGNORECASE,
)

_ADDITIONAL_MATERIAL_PATTERNS = re.compile(
    r"\b(insert|transcript|source\s+booklet|resource\s+booklet"
    r"|pre[-\s]?release|additional\s+material)\b",
    re.IGNORECASE,
)

_WHITESPACE = re.compile(r"\s+")
_PUNCTUATION_FOR_KEY = re.compile(r"[^a-z0-9\s-]")


def normalise_title(title: str) -> str:
    """Strip resource-type prefix and exam-series suffix; collapse whitespace."""
    t = title.strip()
    t = _RESOURCE_TYPE_PREFIXES.sub("", t)
    t = _EXAM_SERIES_SUFFIX.sub("", t)
    t = _WHITESPACE.sub(" ", t)
    return t.strip()


def build_component_key(title: str) -> str:
    """
    Convert a normalised title into a lowercase dash-separated slug
    suitable for use as a stable component identifier.
    """
    t = normalise_title(title).lower()
    t = _PUNCTUATION_FOR_KEY.sub("", t)
    t = _WHITESPACE.sub("-", t)
    t = re.sub(r"-{2,}", "-", t)
    return t.strip("-")


def slugify(value: str) -> str:
    """
    Convert an arbitrary string to a safe filesystem slug.
    Uses Unicode normalisation, lowercasing, and replaces non-alphanumeric
    characters with hyphens.
    """
    value = unicodedata.normalize("NFKD", value)
    value = value.encode("ascii", "ignore").decode("ascii")
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-{2,}", "-", value)
    return value.strip("-")


def safe_filename(value: str) -> str:
    """Return a safe filename component (no path separators or special chars)."""
    return slugify(value)


# ---------------------------------------------------------------------------
# Resource type detection
# ---------------------------------------------------------------------------

_QP_PATTERN = re.compile(r"\bquestion\s+paper\b", re.IGNORECASE)
_MS_PATTERN = re.compile(r"\bmark\s+scheme\b", re.IGNORECASE)
_ER_PATTERN = re.compile(r"\bexaminer\s+report\b", re.IGNORECASE)


def detect_resource_type(title: str) -> str:
    """Return 'question_paper', 'mark_scheme', 'examiner_report', or 'unknown'."""
    if _QP_PATTERN.search(title):
        return "question_paper"
    if _MS_PATTERN.search(title):
        return "mark_scheme"
    if _ER_PATTERN.search(title):
        return "examiner_report"
    return "unknown"


# ---------------------------------------------------------------------------
# Exam series detection
# ---------------------------------------------------------------------------

_SERIES_PATTERN = re.compile(
    r"\b(january|june|november|march|october|summer|winter)\s+(\d{4})\b",
    re.IGNORECASE,
)


def detect_exam_series(title: str) -> str:
    """Extract exam series like 'June 2024' from a title string, or ''."""
    m = _SERIES_PATTERN.search(title)
    if m:
        return f"{m.group(1).capitalize()} {m.group(2)}"
    return ""


# ---------------------------------------------------------------------------
# Modified-paper detection
# ---------------------------------------------------------------------------

_MOD_A4_18 = re.compile(r"modified\s+a4\s+18\s*pt", re.IGNORECASE)
_MOD_A3_36 = re.compile(r"modified\s+a3\s+36\s*pt", re.IGNORECASE)
_MOD_A4 = re.compile(r"modified\s+a4", re.IGNORECASE)
_MOD_A3 = re.compile(r"modified\s+a3", re.IGNORECASE)
_MOD_18PT = re.compile(r"\b18\s*pt\b", re.IGNORECASE)
_MOD_36PT = re.compile(r"\b36\s*pt\b", re.IGNORECASE)
_MOD_LP = re.compile(r"\blarge\s+print\b", re.IGNORECASE)
_MOD_GENERIC = re.compile(r"\bmodified\b", re.IGNORECASE)


def detect_modified_type(title: str) -> str:
    """
    Return one of: 'none', 'modified-a4-18pt', 'modified-a3-36pt',
    'large-print', 'modified-unknown'.
    """
    if _MOD_A4_18.search(title) or _MOD_18PT.search(title):
        return "modified-a4-18pt"
    if _MOD_A3_36.search(title) or _MOD_36PT.search(title):
        return "modified-a3-36pt"
    if _MOD_LP.search(title):
        return "large-print"
    if _MOD_A4.search(title) or _MOD_A3.search(title) or _MOD_GENERIC.search(title):
        return "modified-unknown"
    return "none"


def detect_additional_material(title: str) -> bool:
    """Return True if the title refers to an insert, transcript, booklet, etc."""
    return bool(_ADDITIONAL_MATERIAL_PATTERNS.search(title))


# ---------------------------------------------------------------------------
# Date parsing
# ---------------------------------------------------------------------------

_DATE_FORMATS = [
    "%d %B %Y",      # 01 January 2024
    "%d %b %Y",      # 01 Jan 2024
    "%B %Y",         # January 2024
    "%b %Y",         # Jan 2024
    "%Y-%m-%d",      # 2024-01-15
    "%d/%m/%Y",      # 15/01/2024
]


def parse_published_date(value: str) -> str:
    """
    Parse a variety of date strings and return an ISO-8601 date string,
    or the original value if parsing fails.
    """
    if not value:
        return ""
    value = value.strip()
    for fmt in _DATE_FORMATS:
        try:
            dt = datetime.strptime(value, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    return value


# ---------------------------------------------------------------------------
# I/O helpers
# ---------------------------------------------------------------------------

def write_csv(path: str | Path, rows: list[dict[str, Any]]) -> None:
    """Write a list of dicts to a CSV file. Creates parent dirs as needed."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    fieldnames = list(rows[0].keys())
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def write_json(path: str | Path, data: Any, indent: int = 2) -> None:
    """Write data as pretty-printed JSON. Creates parent dirs as needed."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=indent, ensure_ascii=False, default=str)


def now_iso() -> str:
    """Return current UTC time as an ISO-8601 string."""
    return datetime.now(timezone.utc).isoformat()
