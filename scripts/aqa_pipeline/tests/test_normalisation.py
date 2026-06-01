"""
Unit tests for aqa_common normalisation helpers.
Run with: python -m pytest tests/
"""

import sys
import os

# Put the scripts/ dir on the path so `aqa_pipeline` resolves as a package.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import pytest
from aqa_pipeline.aqa_common import (
    build_component_key,
    detect_additional_material,
    detect_exam_series,
    detect_modified_type,
    detect_resource_type,
    normalise_title,
    parse_published_date,
    slugify,
)


# ---------------------------------------------------------------------------
# normalise_title
# ---------------------------------------------------------------------------

class TestNormaliseTitle:
    def test_strips_question_paper_prefix(self):
        t = "Question paper: Paper 1 Section A Option 2 The study of religions (Christianity)"
        assert normalise_title(t) == "Paper 1 Section A Option 2 The study of religions (Christianity)"

    def test_strips_mark_scheme_prefix(self):
        t = "Mark scheme: Paper 1 Section A Option 2 The study of religions (Christianity)"
        assert normalise_title(t) == "Paper 1 Section A Option 2 The study of religions (Christianity)"

    def test_strips_examiner_report_prefix(self):
        t = "Examiner report: Paper 2 - June 2024 - Religious Studies"
        result = normalise_title(t)
        assert "Examiner report" not in result

    def test_strips_exam_series_suffix(self):
        t = "Question paper: Paper 1 - June 2024 - Religious Studies"
        result = normalise_title(t)
        assert "June 2024" not in result
        assert "Religious Studies" not in result

    def test_preserves_content_between_prefix_and_suffix(self):
        t = "Mark scheme: Paper 2 Section B Option 1 (Islam) - June 2023 - Religious Studies"
        result = normalise_title(t)
        assert "Paper 2 Section B Option 1 (Islam)" in result

    def test_handles_missing_prefix_and_suffix(self):
        t = "Paper 1 Section A"
        assert normalise_title(t) == "Paper 1 Section A"

    def test_collapses_whitespace(self):
        t = "Question paper:   Paper 1   "
        assert "  " not in normalise_title(t)


# ---------------------------------------------------------------------------
# build_component_key
# ---------------------------------------------------------------------------

class TestBuildComponentKey:
    def test_qp_and_ms_produce_same_key(self):
        qp = "Question paper: Paper 1 Section A Option 2 The study of religions (Christianity) - June 2024 - Religious Studies"
        ms = "Mark scheme: Paper 1 Section A Option 2 The study of religions (Christianity) - June 2024 - Religious Studies"
        assert build_component_key(qp) == build_component_key(ms)

    def test_key_is_lowercase(self):
        key = build_component_key("Paper 1 Section A")
        assert key == key.lower()

    def test_key_uses_hyphens(self):
        key = build_component_key("Paper 1 Section A Option 2")
        assert " " not in key

    def test_key_has_no_trailing_hyphens(self):
        key = build_component_key("Paper 1 Section A")
        assert not key.startswith("-")
        assert not key.endswith("-")

    def test_different_papers_produce_different_keys(self):
        k1 = build_component_key("Paper 1 Section A Option 2 Christianity")
        k2 = build_component_key("Paper 1 Section A Option 3 Islam")
        assert k1 != k2

    def test_parentheses_stripped(self):
        key = build_component_key("Paper 1 (Christianity)")
        assert "(" not in key
        assert ")" not in key


# ---------------------------------------------------------------------------
# detect_resource_type
# ---------------------------------------------------------------------------

class TestDetectResourceType:
    def test_question_paper(self):
        assert detect_resource_type("Question paper: Paper 1") == "question_paper"

    def test_mark_scheme(self):
        assert detect_resource_type("Mark scheme: Paper 2") == "mark_scheme"

    def test_examiner_report(self):
        assert detect_resource_type("Examiner report: General") == "examiner_report"

    def test_unknown(self):
        assert detect_resource_type("Some random document") == "unknown"

    def test_case_insensitive(self):
        assert detect_resource_type("QUESTION PAPER Paper 1") == "question_paper"
        assert detect_resource_type("mark scheme paper 2") == "mark_scheme"


# ---------------------------------------------------------------------------
# detect_exam_series
# ---------------------------------------------------------------------------

class TestDetectExamSeries:
    def test_june_2024(self):
        assert detect_exam_series("Paper 1 - June 2024 - Religious Studies") == "June 2024"

    def test_january_2023(self):
        assert detect_exam_series("Mark scheme January 2023") == "January 2023"

    def test_no_series(self):
        assert detect_exam_series("Paper 1 Section A") == ""

    def test_extracts_from_middle(self):
        result = detect_exam_series("GCSE June 2022 Paper 1")
        assert result == "June 2022"


# ---------------------------------------------------------------------------
# detect_modified_type
# ---------------------------------------------------------------------------

class TestDetectModifiedType:
    def test_none_for_normal_paper(self):
        assert detect_modified_type("Question paper: Paper 1") == "none"

    def test_a4_18pt(self):
        assert detect_modified_type("Question paper Modified A4 18pt Paper 1") == "modified-a4-18pt"

    def test_a3_36pt(self):
        assert detect_modified_type("Question paper Modified A3 36pt Paper 1") == "modified-a3-36pt"

    def test_large_print(self):
        assert detect_modified_type("Paper 1 large print version") == "large-print"

    def test_generic_modified(self):
        result = detect_modified_type("Modified question paper Paper 2")
        assert result in ("modified-unknown", "modified-a4-18pt", "modified-a3-36pt", "large-print")
        # Should NOT be "none"
        assert result != "none"

    def test_18pt_alone(self):
        assert detect_modified_type("Paper 1 18pt version") == "modified-a4-18pt"


# ---------------------------------------------------------------------------
# detect_additional_material
# ---------------------------------------------------------------------------

class TestDetectAdditionalMaterial:
    def test_insert(self):
        assert detect_additional_material("Paper 1 Insert") is True

    def test_transcript(self):
        assert detect_additional_material("Listening transcript June 2024") is True

    def test_source_booklet(self):
        assert detect_additional_material("Source booklet Paper 2") is True

    def test_resource_booklet(self):
        assert detect_additional_material("Resource booklet") is True

    def test_pre_release(self):
        assert detect_additional_material("Pre-release material") is True

    def test_normal_paper(self):
        assert detect_additional_material("Question paper: Paper 1") is False


# ---------------------------------------------------------------------------
# parse_published_date
# ---------------------------------------------------------------------------

class TestParsePublishedDate:
    def test_full_date(self):
        assert parse_published_date("15 January 2024") == "2024-01-15"

    def test_iso_date_passthrough(self):
        assert parse_published_date("2024-06-15") == "2024-06-15"

    def test_month_year_only(self):
        result = parse_published_date("June 2024")
        assert result.startswith("2024-06")

    def test_empty_string(self):
        assert parse_published_date("") == ""

    def test_abbreviated_month(self):
        assert parse_published_date("01 Jan 2024") == "2024-01-01"

    def test_unrecognised_returns_original(self):
        assert parse_published_date("not a date") == "not a date"


# ---------------------------------------------------------------------------
# slugify
# ---------------------------------------------------------------------------

class TestSlugify:
    def test_basic(self):
        assert slugify("GCSE Religious Studies") == "gcse-religious-studies"

    def test_special_chars(self):
        assert slugify("Paper 1 (Option 2)") == "paper-1-option-2"

    def test_no_double_hyphens(self):
        result = slugify("Paper  1 -- Section A")
        assert "--" not in result

    def test_no_leading_trailing_hyphens(self):
        result = slugify("  Paper 1  ")
        assert not result.startswith("-")
        assert not result.endswith("-")
