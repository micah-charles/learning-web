"""
aqa_match_pairs.py — Stage 2 of the AQA past-paper pipeline.

Reads Stage 1 metadata and produces matched Question Paper + Mark Scheme pairs.
Does NOT access the AQA website or download any files.

Usage:
    python -m aqa_tools.aqa_match_pairs \
        --input "output/aqa_rs_all.csv" \
        --exam-series "June 2024" \
        --output-prefix "output/aqa_rs_june_2024_selected"
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

from .aqa_common import (
    build_component_key,
    detect_additional_material,
    detect_modified_type,
    now_iso,
    write_csv,
    write_json,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def _load_records(input_path: str) -> list[dict]:
    """Load records from a CSV or JSON file produced by Stage 1."""
    path = Path(input_path)
    if not path.exists():
        log.error("Input file not found: %s", input_path)
        sys.exit(1)

    if path.suffix.lower() == ".json":
        with path.open(encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict) and "records" in data:
            return data["records"]
        if isinstance(data, list):
            return data
        log.error("Unexpected JSON structure in %s", input_path)
        sys.exit(1)

    # CSV
    with path.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        return list(reader)


# ---------------------------------------------------------------------------
# Filtering helpers
# ---------------------------------------------------------------------------

def _is_true(value: Any) -> bool:
    """Coerce a CSV string or Python bool to bool."""
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in ("true", "1", "yes")


def _passes_include_paper(record: dict, include_papers: list[str]) -> bool:
    if not include_papers:
        return True
    title_lower = record.get("title", "").lower()
    component_key = record.get("component_key", "").lower()
    return any(p.lower() in title_lower or p.lower() in component_key for p in include_papers)


def _should_exclude(
    record: dict,
    exclude_modified: bool,
    exclude_examiner_reports: bool,
    exclude_additional: bool,
) -> tuple[bool, str]:
    """
    Return (should_exclude, reason).
    """
    rt = record.get("resource_type", "")
    title = record.get("title", "")

    if exclude_examiner_reports and rt == "examiner_report":
        return True, "examiner_report"

    if rt not in ("question_paper", "mark_scheme", "examiner_report"):
        if rt == "unknown":
            # unknown resource type — still include if title gives clues
            pass

    if exclude_modified:
        modified_type = record.get("modified_type") or detect_modified_type(title)
        if modified_type != "none":
            return True, f"modified:{modified_type}"

    if exclude_additional:
        is_additional = _is_true(record.get("is_insert_or_additional_material", False))
        if not is_additional:
            is_additional = detect_additional_material(title)
        if is_additional:
            return True, "additional_material"

    return False, ""


# ---------------------------------------------------------------------------
# Matching logic
# ---------------------------------------------------------------------------

def _normalise_series(value: str) -> str:
    return value.strip().lower()


def _best_record(records: list[dict]) -> dict:
    """
    From a list of candidate records for the same component/type, return the best one.
    Priority: non-modified > latest published date > has download_url.
    """
    non_modified = [r for r in records if detect_modified_type(r.get("title", "")) == "none"]
    pool = non_modified if non_modified else records

    def _sort_key(r: dict):
        has_url = 1 if r.get("download_url") else 0  # higher = better when sorted descending
        date = r.get("published_date_iso", "") or ""
        return (has_url, date)

    return sorted(pool, key=_sort_key, reverse=True)[0]


def match_pairs(
    records: list[dict],
    exam_series_filter: str = "",
    include_papers: list[str] | None = None,
    exclude_modified: bool = True,
    exclude_examiner_reports: bool = True,
    exclude_additional: bool = True,
    latest_only: bool = True,
    review_mode: bool = False,
) -> dict:
    """
    Core matching function.
    Returns a dict with keys: pairs, unmatched_qp, unmatched_ms, excluded.
    """
    include_papers = include_papers or []

    # Buckets
    qp_by_key: dict[str, list[dict]] = defaultdict(list)
    ms_by_key: dict[str, list[dict]] = defaultdict(list)
    excluded: list[dict] = []
    series_filter_norm = _normalise_series(exam_series_filter)

    for rec in records:
        # Exam-series filter
        if series_filter_norm:
            series_val = _normalise_series(
                rec.get("exam_series", "") or ""
            )
            if series_val and series_val != series_filter_norm:
                excluded.append({**rec, "_exclude_reason": f"series:{rec.get('exam_series','')}"})
                continue

        # Include-paper filter
        if not _passes_include_paper(rec, include_papers):
            excluded.append({**rec, "_exclude_reason": "include_paper_mismatch"})
            continue

        # Standard exclusion rules
        should_exclude, reason = _should_exclude(
            rec, exclude_modified, exclude_examiner_reports, exclude_additional
        )
        if should_exclude:
            excluded.append({**rec, "_exclude_reason": reason})
            continue

        rt = rec.get("resource_type", "")
        component_key = rec.get("component_key") or build_component_key(rec.get("title", ""))
        series = (rec.get("exam_series", "") or "").strip()

        # Group by (component_key, exam_series) so each year is matched separately
        bucket_key = (component_key, series)

        if rt == "question_paper":
            qp_by_key[bucket_key].append(rec)
        elif rt == "mark_scheme":
            ms_by_key[bucket_key].append(rec)
        else:
            # Attempt re-detection for unknown
            from .aqa_common import detect_resource_type
            rt2 = detect_resource_type(rec.get("title", ""))
            if rt2 == "question_paper":
                qp_by_key[bucket_key].append(rec)
            elif rt2 == "mark_scheme":
                ms_by_key[bucket_key].append(rec)
            else:
                excluded.append({**rec, "_exclude_reason": "unknown_resource_type"})

    # Match keys
    all_keys = set(qp_by_key.keys()) | set(ms_by_key.keys())
    pairs: list[dict] = []
    unmatched_qp: list[dict] = []
    unmatched_ms: list[dict] = []

    for bucket_key in sorted(all_keys):
        component_key, series = bucket_key
        qps = qp_by_key.get(bucket_key, [])
        mss = ms_by_key.get(bucket_key, [])

        best_qp = _best_record(qps) if qps else None
        best_ms = _best_record(mss) if mss else None

        if best_qp and best_ms:
            confidence = 1.0
            if len(component_key) < 15:
                confidence = 0.8

            display_title = _key_to_display(component_key)

            pairs.append({
                "matchStatus": "matched",
                "matchConfidence": confidence,
                "componentKey": component_key,
                "displayTitle": display_title,
                "examSeries": series or best_qp.get("exam_series", "") or best_ms.get("exam_series", ""),
                "questionPaper": _record_summary(best_qp),
                "markScheme": _record_summary(best_ms),
                "_qpCandidateCount": len(qps),
                "_msCandidateCount": len(mss),
            })
        elif best_qp and not best_ms:
            pair = {
                "matchStatus": "qp_only",
                "matchConfidence": 0.0,
                "componentKey": component_key,
                "displayTitle": _key_to_display(component_key),
                "examSeries": series or best_qp.get("exam_series", ""),
                "questionPaper": _record_summary(best_qp),
                "markScheme": None,
            }
            if review_mode:
                pairs.append(pair)
            else:
                unmatched_qp.append(best_qp)
        elif best_ms and not best_qp:
            pair = {
                "matchStatus": "ms_only",
                "matchConfidence": 0.0,
                "componentKey": component_key,
                "displayTitle": _key_to_display(component_key),
                "examSeries": series or best_ms.get("exam_series", ""),
                "questionPaper": None,
                "markScheme": _record_summary(best_ms),
            }
            if review_mode:
                pairs.append(pair)
            else:
                unmatched_ms.append(best_ms)

    log.info("Matched pairs:            %d", sum(1 for p in pairs if p["matchStatus"] == "matched"))
    log.info("Unmatched question papers: %d", len(unmatched_qp))
    log.info("Unmatched mark schemes:    %d", len(unmatched_ms))
    log.info("Excluded records:          %d", len(excluded))

    return {
        "pairs": pairs,
        "unmatched_qp": unmatched_qp,
        "unmatched_ms": unmatched_ms,
        "excluded": excluded,
    }


def _key_to_display(key: str) -> str:
    """Convert a component key slug back to a readable display title."""
    # Re-capitalise common words
    parts = key.replace("-", " ").split()
    cap_next = True
    result = []
    for p in parts:
        if cap_next or p.lower() in ("paper", "section", "option"):
            result.append(p.capitalize())
            cap_next = False
        else:
            result.append(p)
    return " ".join(result)


def _record_summary(r: dict) -> dict:
    """Return the fields needed for a pair entry."""
    return {
        "title": r.get("title", ""),
        "publishedDate": r.get("published_date", ""),
        "publishedDateIso": r.get("published_date_iso", ""),
        "fileSize": r.get("file_size", ""),
        "fileType": r.get("file_type", ""),
        "downloadUrl": r.get("download_url") or None,
        "detailUrl": r.get("detail_url") or None,
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _parse_args(argv=None) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Stage 2: Match AQA question papers with mark schemes."
    )
    p.add_argument("--input", required=True, help="CSV or JSON from Stage 1")
    p.add_argument("--exam-series", default="", help="Filter to a specific exam series, e.g. 'June 2024'")
    p.add_argument(
        "--include-paper",
        action="append",
        dest="include_papers",
        default=[],
        metavar="PAPER",
        help="Only include records matching this paper name (repeatable)",
    )
    p.add_argument("--exclude-modified", type=lambda x: x.lower() != "false", default=True)
    p.add_argument("--exclude-examiner-reports", type=lambda x: x.lower() != "false", default=True)
    p.add_argument("--exclude-additional-material", type=lambda x: x.lower() != "false", default=True)
    p.add_argument("--latest-only", type=lambda x: x.lower() != "false", default=True)
    p.add_argument("--output-prefix", required=True)
    p.add_argument(
        "--review-mode",
        action="store_true",
        help="Include unmatched QP and MS as separate pair entries in output",
    )
    return p.parse_args(argv)


def main(argv=None) -> None:
    args = _parse_args(argv)

    records = _load_records(args.input)
    log.info("Loaded %d records from %s", len(records), args.input)

    result = match_pairs(
        records=records,
        exam_series_filter=args.exam_series,
        include_papers=args.include_papers,
        exclude_modified=args.exclude_modified,
        exclude_examiner_reports=args.exclude_examiner_reports,
        exclude_additional=args.exclude_additional_material,
        latest_only=args.latest_only,
        review_mode=args.review_mode,
    )

    pairs = result["pairs"]
    unmatched_qp = result["unmatched_qp"]
    unmatched_ms = result["unmatched_ms"]
    excluded = result["excluded"]

    # --- JSON output ---
    prefix = Path(args.output_prefix)
    prefix.parent.mkdir(parents=True, exist_ok=True)

    payload = {
        "metadata": {
            "source": "AQA",
            "createdAt": now_iso(),
            "inputFile": args.input,
            "examSeries": args.exam_series,
            "selectionRules": {
                "excludeModified": args.exclude_modified,
                "excludeExaminerReports": args.exclude_examiner_reports,
                "excludeAdditionalMaterial": args.exclude_additional_material,
                "latestOnly": args.latest_only,
                "includePapers": args.include_papers,
            },
        },
        "pairs": pairs,
        "unmatchedQuestionPapers": [_record_summary(r) for r in unmatched_qp],
        "unmatchedMarkSchemes": [_record_summary(r) for r in unmatched_ms],
        "excludedRecords": excluded if args.review_mode else [],
    }
    write_json(str(prefix) + ".json", payload)
    log.info("Saved JSON: %s.json", args.output_prefix)

    # --- CSV output (one row per pair) ---
    csv_rows = []
    for pair in pairs:
        qp = pair.get("questionPaper") or {}
        ms = pair.get("markScheme") or {}
        csv_rows.append({
            "exam_series": pair.get("examSeries", ""),
            "component_key": pair["componentKey"],
            "display_title": pair["displayTitle"],
            "match_status": pair["matchStatus"],
            "match_confidence": pair["matchConfidence"],
            "question_paper_title": qp.get("title", ""),
            "question_paper_published_date": qp.get("publishedDateIso", ""),
            "question_paper_url": qp.get("downloadUrl", ""),
            "mark_scheme_title": ms.get("title", ""),
            "mark_scheme_published_date": ms.get("publishedDateIso", ""),
            "mark_scheme_url": ms.get("downloadUrl", ""),
        })

    write_csv(str(prefix) + ".csv", csv_rows)
    log.info("Saved CSV: %s.csv", args.output_prefix)

    matched_count = sum(1 for p in pairs if p["matchStatus"] == "matched")
    log.info("Done. %d matched pairs written to %s.*", matched_count, args.output_prefix)

    if args.review_mode:
        log.info("Review mode ON — inspect unmatched entries in the JSON file.")


if __name__ == "__main__":
    main()
