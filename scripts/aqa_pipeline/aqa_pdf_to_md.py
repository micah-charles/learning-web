"""
aqa_pdf_to_md.py — Smart PDF → Markdown converter for AQA past papers.

Converts AQA question papers and mark schemes into clean, structured Markdown
that AI can parse efficiently to reconstruct questions, options, and answers
for Learning Web pack building.

Strategy (in order):
  1. pdfplumber  — layout-aware text extraction (best for digital PDFs)
  2. PyMuPDF     — fallback with block-level structure
  3. pytesseract — OCR fallback for scanned/image pages

Usage:
    # Single file
    python -m aqa_tools.aqa_pdf_to_md \
        --input "downloads/aqa/.../question-paper.pdf" \
        --output "markdown/question-paper.md"

    # Batch: process all PDFs in the downloads tree
    python -m aqa_tools.aqa_pdf_to_md \
        --input-dir "downloads/aqa" \
        --output-dir "markdown/aqa" \
        --workers 1

    # From selected pairs JSON (processes all downloaded files)
    python -m aqa_tools.aqa_pdf_to_md \
        --pairs "output/aqa_rs_all_selected.json" \
        --download-dir "downloads/aqa" \
        --output-dir "markdown/aqa"
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

log = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)


# ---------------------------------------------------------------------------
# AQA structural patterns
# ---------------------------------------------------------------------------

# Question numbers: "0 1", "01", "1", "Question 1"
_QN_PATTERN = re.compile(
    r"^(?:Question\s+)?(\d{1,2})\s*$|"           # standalone: "1" or "Question 1"
    r"^(0\s*\d)\s*$|"                             # AQA spaced: "0 1", "0 2"
    r"^(\d{1,2})\s+\(",                           # "1 (a)"
    re.MULTILINE,
)

# Sub-question: "0 1 . 1", "1(a)", "(a)", "1.1"
_SUBQ_PATTERN = re.compile(
    r"^(?:0\s*\d\s*\.\s*\d+|"                    # AQA spaced: "0 1 . 1"
    r"\d{1,2}\s*\([a-z]\)|"                       # "1(a)"
    r"\([a-z]\)|"                                  # "(a)"
    r"\d{1,2}\s*\.\s*[a-z\d])\s*$",              # "1.a" or "1.1"
    re.MULTILINE | re.IGNORECASE,
)

# Marks: "[2 marks]", "(2 marks)", "[2]", "2 marks"
_MARKS_PATTERN = re.compile(
    r"\[(\d+)\s+marks?\]|"
    r"\((\d+)\s+marks?\)|"
    r"\[(\d+)\](?=\s|$)",
    re.IGNORECASE,
)

# Mark scheme level descriptors
_LEVEL_PATTERN = re.compile(
    r"^Level\s+(\d+)\s*[:\-–]?\s*\[?(\d+)[\-–](\d+)\s*marks?\]?",
    re.IGNORECASE | re.MULTILINE,
)

# AQA page headers/footers to strip
_HEADER_FOOTER_PATTERNS = [
    re.compile(r"^(IB/|Turn over|Do not write|G/[A-Z]+|AQA\s+GCSE)", re.IGNORECASE | re.MULTILINE),
    re.compile(r"^\s*\d+\s*$", re.MULTILINE),                          # bare page numbers
    re.compile(r"^\s*(Copyright|©)\s+\d{4}", re.IGNORECASE | re.MULTILINE),
    re.compile(r"^Permission to reproduce.*$", re.IGNORECASE | re.MULTILINE),
    re.compile(r"^.*Ofqual.*$", re.IGNORECASE | re.MULTILINE),
    re.compile(r"^Version \d+.*$", re.IGNORECASE | re.MULTILINE),
    re.compile(r"^\s*Please turn over\s*$", re.IGNORECASE | re.MULTILINE),
    re.compile(r"^\s*END OF QUESTIONS\s*$", re.IGNORECASE | re.MULTILINE),
]

# MCQ option lines: "A  Some text", "□ A  text", "● A  text"
_OPTION_PATTERN = re.compile(
    r"^[□●○◉☐☑]?\s*([A-D])\s{2,}(.+)$",
    re.MULTILINE,
)

# Indicative content / mark scheme section headers
_MS_SECTION_PATTERNS = [
    re.compile(r"^(Indicative\s+content)", re.IGNORECASE | re.MULTILINE),
    re.compile(r"^(Level\s+of\s+response)", re.IGNORECASE | re.MULTILINE),
    re.compile(r"^(Marking\s+(guidance|grid|notes?))", re.IGNORECASE | re.MULTILINE),
    re.compile(r"^(Accept|Award|Credit|Allow)", re.IGNORECASE | re.MULTILINE),
    re.compile(r"^(Do\s+not\s+accept|Do\s+not\s+credit)", re.IGNORECASE | re.MULTILINE),
    re.compile(r"^AO\d[\s/]", re.MULTILINE),
]

# Blank answer line indicators (dotted lines, underscores)
_ANSWER_LINE = re.compile(r"^[._\s]{10,}$", re.MULTILINE)


# ---------------------------------------------------------------------------
# PDF text extraction
# ---------------------------------------------------------------------------

def _extract_with_pdfplumber(pdf_path: Path) -> list[str]:
    """
    Extract text per page using pdfplumber.
    Preserves relative layout using character position data.
    Returns list of page text strings.
    """
    try:
        import pdfplumber
    except ImportError:
        return []

    pages = []
    try:
        with pdfplumber.open(str(pdf_path)) as pdf:
            for page in pdf.pages:
                w, h = page.width, page.height
                # Crop away the right ~18% — AQA "For Examiner's Use" column
                # and the left ~4% — page border/binding margin
                # Crop: strip left binding margin (4%) and right "For Examiner" column (last 10%)
                cropped = page.crop((w * 0.04, 0, w * 0.90, h))
                text = cropped.extract_text(
                    x_tolerance=3,
                    y_tolerance=3,
                    layout=False,
                ) or ""
                pages.append(text)
    except Exception as e:
        log.warning("pdfplumber failed on %s: %s", pdf_path.name, e)
        return []
    return pages


def _extract_with_pymupdf(pdf_path: Path) -> list[str]:
    """
    Extract text per page using PyMuPDF (fitz).
    Uses block-level extraction to preserve reading order.
    """
    try:
        import fitz
    except ImportError:
        return []

    pages = []
    try:
        doc = fitz.open(str(pdf_path))
        for page in doc:
            # "blocks" mode returns text in reading order with coordinates
            blocks = page.get_text("blocks", sort=True)
            lines = []
            prev_y = None
            for b in blocks:
                x0, y0, x1, y1, text, block_no, block_type = b
                if block_type != 0:  # 0 = text block
                    continue
                # Insert blank line between blocks that are vertically separated
                if prev_y is not None and y0 - prev_y > 20:
                    lines.append("")
                block_text = text.strip()
                if block_text:
                    lines.append(block_text)
                prev_y = y1
            pages.append("\n".join(lines))
        doc.close()
    except Exception as e:
        log.warning("PyMuPDF failed on %s: %s", pdf_path.name, e)
        return []
    return pages


def _extract_with_ocr(pdf_path: Path, dpi: int = 200) -> list[str]:
    """
    OCR fallback using pytesseract for scanned/image-only pages.
    Only used when both pdfplumber and PyMuPDF return empty/minimal text.
    """
    try:
        from pdf2image import convert_from_path
        import pytesseract
    except ImportError:
        log.warning("OCR fallback unavailable — install pdf2image and pytesseract.")
        return []

    pages = []
    try:
        images = convert_from_path(str(pdf_path), dpi=dpi)
        for img in images:
            text = pytesseract.image_to_string(img, lang="eng", config="--psm 6")
            pages.append(text)
    except Exception as e:
        log.warning("OCR failed on %s: %s", pdf_path.name, e)
        return []
    return pages


def _is_mostly_empty(text: str, threshold: int = 50) -> bool:
    """Return True if extracted text is too sparse to be useful."""
    return len(text.strip()) < threshold


def extract_pages(pdf_path: Path) -> list[str]:
    """
    Extract text from all pages using the best available method.
    Automatically falls back through pdfplumber → PyMuPDF → OCR.
    """
    # Try pdfplumber first
    pages = _extract_with_pdfplumber(pdf_path)
    if pages and not all(_is_mostly_empty(p) for p in pages):
        log.info("  Extraction: pdfplumber (%d pages)", len(pages))
        return pages

    # Fallback to PyMuPDF
    pages = _extract_with_pymupdf(pdf_path)
    if pages and not all(_is_mostly_empty(p) for p in pages):
        log.info("  Extraction: PyMuPDF (%d pages)", len(pages))
        return pages

    # Final fallback: OCR
    log.info("  Extraction: OCR fallback (%s)", pdf_path.name)
    pages = _extract_with_ocr(pdf_path)
    return pages


# ---------------------------------------------------------------------------
# Text cleaning
# ---------------------------------------------------------------------------

# Patterns for marginal/column noise in AQA two-column PDFs
_MARGIN_NOISE = re.compile(
    r"(outside\s+the\s*\n?\s*box|For\s+Examiner[''']?s?\s+Use|"
    r"Question\s+Mark\s*\n|Do\s+not\s+write\s+outside|"
    r"ANSWER\s+IN\s+THE\s+SPACES\s+PROVIDED|"
    r"There are no questions printed on this page|"
    r"Additional page,?\s+if required|"
    r"Write the question numbers in the left.hand margin)",
    re.IGNORECASE | re.MULTILINE,
)

# Truncated bracket artifacts from page-crop: lone "[", "[1", "[S" etc.
_TRUNCATED_BRACKET = re.compile(r"^\[[\dSPI]?\s*$", re.MULTILINE)

# PDF generation artefact lines: "IB", "Tu", "G/", bare numbers after cropping
_ARTEFACT_LINES = re.compile(r"^(IB|Tu|G/[A-Z]+|\*\s*\*|[A-Z]{1,3}\d*/?[A-Z\d]*)$", re.MULTILINE)

_COVER_PAGE_END = re.compile(
    r"(Q\d[\d.]*\s+\w|^\s*Q1[\.\s]|Section \d|^\*\s+\*)",
    re.MULTILINE,
)


def clean_page_text(text: str) -> str:
    """Remove AQA headers, footers, margin noise, and layout artefacts."""
    text = _MARGIN_NOISE.sub("", text)
    text = _TRUNCATED_BRACKET.sub("", text)
    text = _ARTEFACT_LINES.sub("", text)

    lines = text.splitlines()
    cleaned = []
    for line in lines:
        stripped = line.strip()
        skip = False
        for pat in _HEADER_FOOTER_PATTERNS:
            if pat.match(stripped):
                skip = True
                break
        # Drop lines that are purely whitespace/box-drawing chars
        if not skip and re.match(r"^[\s*|_\-=]+$", stripped) and len(stripped) < 5:
            skip = True
        if not skip:
            cleaned.append(stripped if stripped else "")
    return "\n".join(cleaned)


def strip_cover_page(full_text: str) -> str:
    """
    Remove the AQA cover/instruction page that precedes actual questions.
    Keeps everything from the first question reference onward.
    """
    # Find first occurrence of a question reference like Q1.1 or "Q1 "
    m = re.search(r"\bQ1[\.\s]", full_text)
    if m and m.start() > 200:  # only strip if there's substantial preamble
        return full_text[m.start():]
    return full_text


def clean_answer_lines(text: str) -> str:
    """Replace dotted answer lines with a standard placeholder."""
    return _ANSWER_LINE.sub("", text)  # remove entirely — AI doesn't need them


def normalise_whitespace(text: str) -> str:
    """Collapse runs of blank lines to at most two."""
    return re.sub(r"\n{3,}", "\n\n", text)


def normalise_aqa_question_numbers(text: str) -> str:
    """
    AQA prints question numbers as spaced digits: "0 1" = Q1, "0 1 . 1" = Q1.1
    Normalise these to "Q1" and "Q1.1" for readability.
    """
    # "0 1 . 2" → "Q1.2"
    text = re.sub(
        r"\b0\s*(\d)\s*\.\s*(\d+)\b",
        lambda m: f"Q{m.group(1)}.{m.group(2)}",
        text,
    )
    # "0 1" → "Q1"
    text = re.sub(r"\b0\s*(\d)\b", lambda m: f"Q{m.group(1)}", text)
    return text


# ---------------------------------------------------------------------------
# Document-type detection
# ---------------------------------------------------------------------------

def detect_doc_type(pages: list[str]) -> str:
    """
    Return 'question_paper', 'mark_scheme', or 'unknown'
    based on content of first two pages.
    """
    sample = "\n".join(pages[:2]).lower()
    if "mark scheme" in sample:
        return "mark_scheme"
    if "question paper" in sample or "answer all questions" in sample:
        return "question_paper"
    return "unknown"


def detect_paper_meta(pages: list[str]) -> dict:
    """Extract paper title, exam series, and component code from page text."""
    meta: dict = {
        "paperTitle": "",
        "examSeries": "",
        "componentCode": "",
        "qualification": "",
        "subject": "Religious Studies",
    }
    sample = "\n".join(pages[:2])

    # Exam series
    series_m = re.search(
        r"\b(january|june|november|march|october|summer|winter)\s+(\d{4})\b",
        sample,
        re.IGNORECASE,
    )
    if series_m:
        meta["examSeries"] = f"{series_m.group(1).capitalize()} {series_m.group(2)}"

    # Component code (AQA: 8062xx pattern)
    code_m = re.search(r"\b(806[12]\d{1,2}[A-Z]?)\b", sample)
    if code_m:
        meta["componentCode"] = code_m.group(1)

    # Qualification
    if re.search(r"gcse", sample, re.IGNORECASE):
        meta["qualification"] = "GCSE Religious Studies"

    # Paper title from first substantial heading
    for line in sample.splitlines():
        line = line.strip()
        if len(line) > 20 and re.search(r"paper\s+[12]", line, re.IGNORECASE):
            meta["paperTitle"] = line
            break

    return meta


# ---------------------------------------------------------------------------
# Question paper structure parser
# ---------------------------------------------------------------------------

def _normalise_marks(text: str) -> str:
    """Rewrite marks references to a standard inline format."""
    def _repl(m):
        marks = m.group(1) or m.group(2) or m.group(3)
        return f"**[{marks} marks]**"
    return _MARKS_PATTERN.sub(_repl, text)


def _detect_mcq_options(block: str) -> list[tuple[str, str]]:
    """Return list of (letter, text) MCQ options if present."""
    return _OPTION_PATTERN.findall(block)


def parse_question_paper(pages: list[str]) -> list[dict]:
    """
    Parse question paper pages into structured question blocks.

    Returns list of dicts:
      { qnum, subnum, text, marks, options, raw_text }
    """
    full_text = "\n".join(
        normalise_aqa_question_numbers(clean_answer_lines(clean_page_text(p)))
        for p in pages
    )
    full_text = normalise_whitespace(strip_cover_page(full_text))

    questions = []
    current_q: dict | None = None
    current_sub: dict | None = None
    pending_lines: list[str] = []

    def _flush_pending():
        nonlocal pending_lines
        text = "\n".join(pending_lines).strip()
        pending_lines = []
        return text

    def _save_sub():
        nonlocal current_sub
        if current_sub is not None:
            text = _flush_pending()
            current_sub["text"] = text
            marks_m = _MARKS_PATTERN.search(text)
            if marks_m:
                current_sub["marks"] = int(
                    marks_m.group(1) or marks_m.group(2) or marks_m.group(3)
                )
            options = _detect_mcq_options(text)
            if options:
                current_sub["options"] = [{"letter": l, "text": t} for l, t in options]
            if current_q is not None:
                current_q["subquestions"].append(current_sub)
            current_sub = None

    def _save_q():
        nonlocal current_q
        _save_sub()
        if current_q is not None:
            if not current_q.get("text"):
                current_q["text"] = _flush_pending()
            questions.append(current_q)
            current_q = None

    for line in full_text.splitlines():
        stripped = line.strip()

        # Detect top-level question number: "Q1", "Q2", ...
        q_match = re.match(r"^Q(\d{1,2})\s*$", stripped)
        if q_match:
            _save_q()
            qnum = int(q_match.group(1))
            current_q = {
                "qnum": qnum,
                "text": "",
                "marks": None,
                "subquestions": [],
            }
            continue

        # Detect sub-question: "Q1.1", "1(a)", "(a)"
        sub_match = re.match(
            r"^Q?(\d{0,2})[.\s]?([a-d]|\d{1,2})\s*(?:\(([a-d])\))?\s*$",
            stripped,
            re.IGNORECASE,
        )
        if sub_match and current_q is not None and len(stripped) <= 8:
            _save_sub()
            sub_label = stripped
            current_sub = {
                "sublabel": sub_label,
                "text": "",
                "marks": None,
                "options": [],
            }
            continue

        # Accumulate lines into pending buffer
        if stripped:
            pending_lines.append(stripped)
        else:
            if pending_lines:
                pending_lines.append("")  # preserve paragraph breaks

    _save_q()

    # If no structured questions found, fall back to raw blocks
    if not questions:
        questions = _fallback_blocks(full_text, "question_paper")

    return questions


# ---------------------------------------------------------------------------
# Mark scheme structure parser
# ---------------------------------------------------------------------------

def parse_mark_scheme(pages: list[str]) -> list[dict]:
    """
    Parse mark scheme pages into structured answer blocks.

    Returns list of dicts:
      { qnum, subnum, indicative_content, levels, total_marks, raw_text }
    """
    full_text = "\n".join(
        normalise_aqa_question_numbers(clean_answer_lines(clean_page_text(p)))
        for p in pages
    )
    full_text = normalise_whitespace(strip_cover_page(full_text))

    questions: list[dict] = []
    current: dict | None = None
    buffer: list[str] = []

    def _flush():
        nonlocal current, buffer
        if current is not None:
            raw = "\n".join(buffer).strip()
            current["raw_text"] = raw
            # Extract level descriptors
            levels = []
            for m in _LEVEL_PATTERN.finditer(raw):
                levels.append({
                    "level": int(m.group(1)),
                    "marksMin": int(m.group(2)),
                    "marksMax": int(m.group(3)),
                })
            current["levels"] = levels
            # Extract indicative content section
            ic_match = re.search(
                r"Indicative content\s*\n(.*?)(?=\nLevel\s+\d|\Z)",
                raw,
                re.DOTALL | re.IGNORECASE,
            )
            if ic_match:
                current["indicative_content"] = ic_match.group(1).strip()
            questions.append(current)
        current = None
        buffer = []

    for line in full_text.splitlines():
        stripped = line.strip()

        q_match = re.match(r"^Q(\d{1,2})(?:\s*\(([a-z])\))?\s*$", stripped)
        if q_match:
            _flush()
            current = {
                "qnum": int(q_match.group(1)),
                "sublabel": q_match.group(2) or "",
                "levels": [],
                "indicative_content": "",
                "raw_text": "",
                "total_marks": None,
            }
            continue

        if current is not None:
            buffer.append(stripped)
            # Pick up total marks
            marks_m = _MARKS_PATTERN.search(stripped)
            if marks_m and current["total_marks"] is None:
                current["total_marks"] = int(
                    marks_m.group(1) or marks_m.group(2) or marks_m.group(3)
                )

    _flush()

    if not questions:
        questions = _fallback_blocks(full_text, "mark_scheme")

    return questions


# ---------------------------------------------------------------------------
# Fallback: raw block extraction
# ---------------------------------------------------------------------------

def _fallback_blocks(text: str, doc_type: str) -> list[dict]:
    """
    When structured parsing finds nothing, return raw text as a single block.
    AI can still read this — it's just less structured.
    """
    return [{
        "qnum": 0,
        "text": text,
        "raw_text": text,
        "_fallback": True,
        "doc_type": doc_type,
    }]


# ---------------------------------------------------------------------------
# Markdown renderer
# ---------------------------------------------------------------------------

def render_question_paper_md(questions: list[dict], meta: dict, source_path: str) -> str:
    """Render parsed questions as clean Markdown."""
    lines = [
        "---",
        "type: question_paper",
        f"source: {source_path}",
        f"subject: {meta.get('subject', 'Religious Studies')}",
        f"qualification: {meta.get('qualification', 'GCSE Religious Studies')}",
        f"examSeries: {meta.get('examSeries', '')}",
        f"paperTitle: {meta.get('paperTitle', '')}",
        f"componentCode: {meta.get('componentCode', '')}",
        f"convertedAt: {datetime.now(timezone.utc).isoformat()}",
        "---",
        "",
        "# Question Paper",
        "",
    ]

    if meta.get("paperTitle"):
        lines += [f"**{meta['paperTitle']}**", ""]
    if meta.get("examSeries"):
        lines += [f"*{meta['examSeries']} — {meta.get('qualification', '')}*", ""]

    for q in questions:
        if q.get("_fallback"):
            # For fallback, post-process inline Q-numbers into headings
            text = q.get("text", "")
            text = _inline_qnumbers_to_headings(text)
            text = _normalise_marks(text)
            lines.append(text)
            continue

        qnum = q.get("qnum", "")
        qtext = _normalise_marks(q.get("text", "")).strip()
        lines += [f"## Question {qnum}", ""]
        if qtext:
            lines += [qtext, ""]

        for sub in q.get("subquestions", []):
            sublabel = sub.get("sublabel", "")
            subtext = _normalise_marks(sub.get("text", "")).strip()
            lines += [f"### {sublabel}", ""]
            if subtext:
                lines += [subtext, ""]
            for opt in sub.get("options", []):
                lines.append(f"- **{opt['letter']}** {opt['text']}")
            if sub.get("options"):
                lines.append("")

    return "\n".join(lines)


def _inline_qnumbers_to_headings(text: str) -> str:
    """
    Convert inline AQA question references to Markdown headings.
    e.g. "Q1.1 Which one..." → "### Q1.1\n\nWhich one..."
    """
    # Top-level: "Q1 " alone on a line or followed by text
    text = re.sub(
        r"(?m)^(Q\d{1,2})\s*$",
        lambda m: f"\n## {m.group(1)}\n",
        text,
    )
    # Sub-question inline: "Q1.1 Question text [1 mark]"
    text = re.sub(
        r"(?m)^\s*(Q\d{1,2}\.\d+)\s+(.)",
        lambda m: f"\n### {m.group(1)}\n\n{m.group(2)}",
        text,
    )
    return text


def render_mark_scheme_md(questions: list[dict], meta: dict, source_path: str) -> str:
    """Render parsed mark scheme as Markdown."""
    lines = []

    lines += [
        "---",
        f"type: mark_scheme",
        f"source: {source_path}",
        f"subject: {meta.get('subject', 'Religious Studies')}",
        f"qualification: {meta.get('qualification', 'GCSE Religious Studies')}",
        f"examSeries: {meta.get('examSeries', '')}",
        f"paperTitle: {meta.get('paperTitle', '')}",
        f"componentCode: {meta.get('componentCode', '')}",
        f"convertedAt: {datetime.now(timezone.utc).isoformat()}",
        "---",
        "",
        "# Mark Scheme",
        "",
    ]

    if meta.get("paperTitle"):
        lines.append(f"**{meta['paperTitle']}**")
        lines.append("")
    if meta.get("examSeries"):
        lines.append(f"*{meta['examSeries']} — {meta.get('qualification', '')}*")
        lines.append("")

    for q in questions:
        if q.get("_fallback"):
            text = q.get("text", q.get("raw_text", ""))
            text = _inline_qnumbers_to_headings(text)
            text = _normalise_marks(text)
            lines.append(text)
            continue

        qnum = q.get("qnum", "")
        sublabel = q.get("sublabel", "")
        heading = f"Question {qnum}"
        if sublabel:
            heading += f"({sublabel})"
        if q.get("total_marks"):
            heading += f" — {q['total_marks']} marks"

        lines.append(f"## {heading}")
        lines.append("")

        ic = q.get("indicative_content", "").strip()
        if ic:
            lines.append("### Indicative Content")
            lines.append("")
            # Format as bullet points if not already
            for ic_line in ic.splitlines():
                ic_line = ic_line.strip()
                if not ic_line:
                    lines.append("")
                elif ic_line.startswith(("•", "-", "*")):
                    lines.append(ic_line)
                else:
                    lines.append(f"- {ic_line}")
            lines.append("")

        levels = q.get("levels", [])
        if levels:
            lines.append("### Level Descriptors")
            lines.append("")
            for lvl in levels:
                lines.append(
                    f"**Level {lvl['level']}** ({lvl['marksMin']}–{lvl['marksMax']} marks)"
                )
            lines.append("")

        # Include raw text as a fenced block for AI fallback reading
        raw = q.get("raw_text", "").strip()
        if raw and not ic and not levels:
            lines.append(raw)
            lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main convert function
# ---------------------------------------------------------------------------

def convert_pdf(
    pdf_path: Path,
    output_path: Path,
    doc_type_override: Optional[str] = None,
) -> dict:
    """
    Convert a single PDF to Markdown.
    Returns a result dict with status, path, and metadata.
    """
    log.info("Converting: %s", pdf_path.name)

    if not pdf_path.exists():
        log.error("File not found: %s", pdf_path)
        return {"status": "error", "error": "file_not_found", "path": str(pdf_path)}

    pages = extract_pages(pdf_path)
    if not pages or all(_is_mostly_empty(p) for p in pages):
        log.warning("  No text extracted from %s", pdf_path.name)
        return {"status": "empty", "path": str(pdf_path)}

    doc_type = doc_type_override or detect_doc_type(pages)
    meta = detect_paper_meta(pages)
    log.info("  Type: %s | Series: %s | Code: %s", doc_type, meta["examSeries"], meta["componentCode"])

    if doc_type == "mark_scheme":
        questions = parse_mark_scheme(pages)
        md = render_mark_scheme_md(questions, meta, str(pdf_path))
    else:
        # Skip cover page (page 0) — AQA question papers always start with instructions
        content_pages = pages[1:] if len(pages) > 1 else pages
        questions = parse_question_paper(content_pages)
        md = render_question_paper_md(questions, meta, str(pdf_path))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(md, encoding="utf-8")
    log.info("  → %s (%d chars)", output_path, len(md))

    return {
        "status": "ok",
        "path": str(output_path),
        "docType": doc_type,
        "examSeries": meta["examSeries"],
        "componentCode": meta["componentCode"],
        "pages": len(pages),
        "questionCount": len(questions),
        "charCount": len(md),
    }


# ---------------------------------------------------------------------------
# Batch processing
# ---------------------------------------------------------------------------

def convert_directory(
    input_dir: Path,
    output_dir: Path,
    overwrite: bool = False,
) -> list[dict]:
    """Find all PDFs under input_dir and convert each to Markdown."""
    pdfs = sorted(input_dir.rglob("*.pdf"))
    log.info("Found %d PDFs under %s", len(pdfs), input_dir)

    results = []
    for pdf in pdfs:
        # Mirror folder structure under output_dir
        rel = pdf.relative_to(input_dir)
        out = (output_dir / rel).with_suffix(".md")

        if out.exists() and not overwrite:
            log.info("SKIP (exists): %s", out)
            results.append({"status": "skipped", "path": str(out)})
            continue

        # Infer doc type from filename
        doc_type = None
        if "question-paper" in pdf.name.lower() or "qp" in pdf.name.lower():
            doc_type = "question_paper"
        elif "mark-scheme" in pdf.name.lower() or "ms" in pdf.name.lower():
            doc_type = "mark_scheme"

        result = convert_pdf(pdf, out, doc_type_override=doc_type)
        results.append(result)

    return results


def convert_from_pairs_json(
    pairs_json: Path,
    download_dir: Path,
    output_dir: Path,
    overwrite: bool = False,
) -> list[dict]:
    """
    Use the selected_pairs JSON to find downloaded PDFs and convert them.
    Only processes files that exist on disk.
    """
    with pairs_json.open(encoding="utf-8") as f:
        data = json.load(f)

    meta_global = data.get("metadata", {})
    qualification = meta_global.get("qualification", "")
    pairs = [p for p in data.get("pairs", []) if p.get("matchStatus") == "matched"]

    from .aqa_common import slugify
    results = []

    for pair in pairs:
        component_key = pair.get("componentKey", "")
        exam_series = pair.get("examSeries", "")
        qual_slug = slugify(qualification) if qualification else "unknown-qualification"
        series_slug = slugify(exam_series) if exam_series else "unknown-series"
        folder = download_dir / qual_slug / series_slug / component_key

        for file_role, filename in [("question_paper", "question-paper.pdf"),
                                     ("mark_scheme", "mark-scheme.pdf")]:
            pdf_path = folder / filename
            if not pdf_path.exists():
                log.warning("PDF not found (not yet downloaded?): %s", pdf_path)
                continue

            out = (output_dir / qual_slug / series_slug / component_key / filename).with_suffix(".md")
            if out.exists() and not overwrite:
                log.info("SKIP (exists): %s", out.name)
                continue

            result = convert_pdf(pdf_path, out, doc_type_override=file_role)
            results.append(result)

    return results


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _parse_args(argv=None) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Smart PDF → Markdown converter for AQA past papers."
    )
    mode = p.add_mutually_exclusive_group(required=True)
    mode.add_argument("--input", help="Single PDF file to convert")
    mode.add_argument("--input-dir", help="Directory of PDFs to batch-convert")
    mode.add_argument("--pairs", help="selected_pairs JSON from Stage 2")

    p.add_argument("--output", help="Output .md file (for --input mode)")
    p.add_argument("--output-dir", default="markdown/aqa", help="Output directory")
    p.add_argument("--download-dir", default="downloads/aqa", help="Downloads root (for --pairs mode)")
    p.add_argument("--overwrite", action="store_true", help="Re-convert existing .md files")
    p.add_argument("--doc-type", choices=["question_paper", "mark_scheme"],
                   help="Force document type (auto-detected by default)")
    return p.parse_args(argv)


def main(argv=None) -> None:
    args = _parse_args(argv)

    if args.input:
        pdf = Path(args.input)
        out = Path(args.output) if args.output else pdf.with_suffix(".md")
        result = convert_pdf(pdf, out, doc_type_override=args.doc_type)
        if result["status"] == "ok":
            log.info("Done: %s", result["path"])
        else:
            log.error("Failed: %s", result)
            sys.exit(1)

    elif args.input_dir:
        results = convert_directory(
            Path(args.input_dir),
            Path(args.output_dir),
            overwrite=args.overwrite,
        )
        ok = sum(1 for r in results if r["status"] == "ok")
        log.info("Converted %d / %d PDFs", ok, len(results))

    elif args.pairs:
        results = convert_from_pairs_json(
            Path(args.pairs),
            Path(args.download_dir),
            Path(args.output_dir),
            overwrite=args.overwrite,
        )
        ok = sum(1 for r in results if r["status"] == "ok")
        log.info("Converted %d PDFs", ok)


if __name__ == "__main__":
    main()
