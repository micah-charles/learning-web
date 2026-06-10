"""
Unit tests for aqa_match_pairs matching logic.
Run with: python -m pytest tests/
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest
from aqa_pipeline.aqa_match_pairs import match_pairs


# ---------------------------------------------------------------------------
# Fixture helpers
# ---------------------------------------------------------------------------

def _make_record(
    title: str,
    resource_type: str,
    exam_series: str = "June 2024",
    published_date_iso: str = "2024-06-01",
    download_url: str = "https://cdn.aqa.org.uk/fake.pdf",
    is_modified: bool = False,
    modified_type: str = "none",
    is_insert: bool = False,
) -> dict:
    from aqa_pipeline.aqa_common import build_component_key, normalise_title
    return {
        "title": title,
        "resource_type": resource_type,
        "exam_series": exam_series,
        "published_date_iso": published_date_iso,
        "download_url": download_url,
        "is_modified": str(is_modified),
        "modified_type": modified_type,
        "is_insert_or_additional_material": str(is_insert),
        "component_key": build_component_key(title),
        "normalised_title": normalise_title(title),
        "file_size": "500KB",
        "file_type": "PDF",
        "published_date": "01 June 2024",
        "detail_url": None,
    }


_QP_TITLE = "Question paper: Paper 1 Section A Option 2 The study of religions (Christianity) - June 2024 - Religious Studies"
_MS_TITLE = "Mark scheme: Paper 1 Section A Option 2 The study of religions (Christianity) - June 2024 - Religious Studies"
_ER_TITLE = "Examiner report: Paper 1 - June 2024 - Religious Studies"
_MOD_TITLE = "Question paper: Paper 1 Modified A4 18pt - June 2024 - Religious Studies"
_INSERT_TITLE = "Paper 1 Insert - June 2024 - Religious Studies"


# ---------------------------------------------------------------------------
# Basic matching
# ---------------------------------------------------------------------------

class TestBasicMatching:
    def test_matched_pair(self):
        records = [
            _make_record(_QP_TITLE, "question_paper"),
            _make_record(_MS_TITLE, "mark_scheme"),
        ]
        result = match_pairs(records)
        assert len(result["pairs"]) == 1
        pair = result["pairs"][0]
        assert pair["matchStatus"] == "matched"
        assert pair["matchConfidence"] == 1.0
        assert pair["questionPaper"] is not None
        assert pair["markScheme"] is not None

    def test_unmatched_qp_when_no_ms(self):
        records = [_make_record(_QP_TITLE, "question_paper")]
        result = match_pairs(records)
        assert len(result["pairs"]) == 0
        assert len(result["unmatched_qp"]) == 1

    def test_unmatched_ms_when_no_qp(self):
        records = [_make_record(_MS_TITLE, "mark_scheme")]
        result = match_pairs(records)
        assert len(result["pairs"]) == 0
        assert len(result["unmatched_ms"]) == 1

    def test_multiple_pairs(self):
        qp2 = "Question paper: Paper 1 Section A Option 3 The study of religions (Islam) - June 2024 - RS"
        ms2 = "Mark scheme: Paper 1 Section A Option 3 The study of religions (Islam) - June 2024 - RS"
        records = [
            _make_record(_QP_TITLE, "question_paper"),
            _make_record(_MS_TITLE, "mark_scheme"),
            _make_record(qp2, "question_paper"),
            _make_record(ms2, "mark_scheme"),
        ]
        result = match_pairs(records)
        matched = [p for p in result["pairs"] if p["matchStatus"] == "matched"]
        assert len(matched) == 2


# ---------------------------------------------------------------------------
# Exclusion rules
# ---------------------------------------------------------------------------

class TestExclusions:
    def test_examiner_report_excluded_by_default(self):
        records = [
            _make_record(_QP_TITLE, "question_paper"),
            _make_record(_MS_TITLE, "mark_scheme"),
            _make_record(_ER_TITLE, "examiner_report"),
        ]
        result = match_pairs(records, exclude_examiner_reports=True)
        excluded_reasons = [r.get("_exclude_reason") for r in result["excluded"]]
        assert "examiner_report" in excluded_reasons

    def test_modified_paper_excluded_by_default(self):
        records = [
            _make_record(_MOD_TITLE, "question_paper", modified_type="modified-a4-18pt", is_modified=True),
            _make_record(_MS_TITLE, "mark_scheme"),
        ]
        result = match_pairs(records, exclude_modified=True)
        # The modified QP should be excluded
        excluded_reasons = [r.get("_exclude_reason") for r in result["excluded"]]
        assert any("modified" in str(r) for r in excluded_reasons)

    def test_modified_paper_included_when_flag_off(self):
        records = [
            _make_record(_MOD_TITLE, "question_paper"),
            _make_record(_MS_TITLE, "mark_scheme"),
        ]
        result = match_pairs(records, exclude_modified=False)
        # Should produce at least something — the modified QP and MS may or may not share key
        assert len(result["excluded"]) == 0 or all(
            "modified" not in str(r.get("_exclude_reason", "")) for r in result["excluded"]
        )

    def test_insert_excluded_by_default(self):
        records = [
            _make_record(_QP_TITLE, "question_paper"),
            _make_record(_MS_TITLE, "mark_scheme"),
            _make_record(_INSERT_TITLE, "unknown", is_insert=True),
        ]
        result = match_pairs(records, exclude_additional=True)
        excluded_reasons = [r.get("_exclude_reason") for r in result["excluded"]]
        assert "additional_material" in excluded_reasons


# ---------------------------------------------------------------------------
# Exam series filtering
# ---------------------------------------------------------------------------

class TestExamSeriesFilter:
    def test_filter_to_june_2024(self):
        records = [
            _make_record(_QP_TITLE, "question_paper", exam_series="June 2024"),
            _make_record(_MS_TITLE, "mark_scheme", exam_series="June 2024"),
            _make_record(
                "Question paper: Paper 1 - November 2023 - RS",
                "question_paper",
                exam_series="November 2023",
            ),
        ]
        result = match_pairs(records, exam_series_filter="June 2024")
        # November 2023 QP should be excluded
        excluded_reasons = [r.get("_exclude_reason", "") for r in result["excluded"]]
        assert any("series" in r for r in excluded_reasons)

    def test_no_filter_includes_all_series(self):
        records = [
            _make_record(_QP_TITLE, "question_paper", exam_series="June 2024"),
            _make_record(_MS_TITLE, "mark_scheme", exam_series="June 2024"),
        ]
        result = match_pairs(records, exam_series_filter="")
        assert len(result["pairs"]) == 1


# ---------------------------------------------------------------------------
# Review mode
# ---------------------------------------------------------------------------

class TestReviewMode:
    def test_review_mode_includes_unmatched_as_pairs(self):
        records = [_make_record(_QP_TITLE, "question_paper")]
        result = match_pairs(records, review_mode=True)
        # QP-only should appear in pairs in review mode
        qp_only = [p for p in result["pairs"] if p["matchStatus"] == "qp_only"]
        assert len(qp_only) == 1

    def test_non_review_mode_excludes_unmatched_from_pairs(self):
        records = [_make_record(_QP_TITLE, "question_paper")]
        result = match_pairs(records, review_mode=False)
        qp_only = [p for p in result["pairs"] if p["matchStatus"] == "qp_only"]
        assert len(qp_only) == 0
        assert len(result["unmatched_qp"]) == 1


# ---------------------------------------------------------------------------
# Deduplication / best-record selection
# ---------------------------------------------------------------------------

class TestBestRecordSelection:
    def test_prefers_later_published_date(self):
        records = [
            _make_record(_QP_TITLE, "question_paper", published_date_iso="2024-06-01"),
            _make_record(_QP_TITLE, "question_paper", published_date_iso="2024-07-01"),
            _make_record(_MS_TITLE, "mark_scheme"),
        ]
        result = match_pairs(records)
        assert len(result["pairs"]) == 1
        qp = result["pairs"][0]["questionPaper"]
        assert qp["publishedDateIso"] == "2024-07-01"

    def test_prefers_record_with_download_url(self):
        records = [
            _make_record(_QP_TITLE, "question_paper", download_url=None),
            _make_record(_QP_TITLE, "question_paper", download_url="https://cdn.aqa.org.uk/fake.pdf"),
            _make_record(_MS_TITLE, "mark_scheme"),
        ]
        result = match_pairs(records)
        assert len(result["pairs"]) == 1
        assert result["pairs"][0]["questionPaper"]["downloadUrl"] is not None


# ---------------------------------------------------------------------------
# Include-paper filter
# ---------------------------------------------------------------------------

class TestIncludePaperFilter:
    def test_include_paper_1_only(self):
        qp2 = "Question paper: Paper 2 Thematic studies - June 2024 - RS"
        ms2 = "Mark scheme: Paper 2 Thematic studies - June 2024 - RS"
        records = [
            _make_record(_QP_TITLE, "question_paper"),
            _make_record(_MS_TITLE, "mark_scheme"),
            _make_record(qp2, "question_paper"),
            _make_record(ms2, "mark_scheme"),
        ]
        result = match_pairs(records, include_papers=["Paper 1"])
        matched = [p for p in result["pairs"] if p["matchStatus"] == "matched"]
        # Only Paper 1 pair should match
        for p in matched:
            assert "paper-1" in p["componentKey"] or "paper 1" in p["displayTitle"].lower()
