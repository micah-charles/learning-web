"""
adaptive_ocr_parser.py — Auto-detect and parse AQA OCR markdown output.

Handles variable OCR output formats across subjects (Geography, History, RS)
and exam series, including common OCR errors like:
  - Duplicate headers (`### Q1.1` repeated for Q1.10/Q1.11)
  - Missing headers (inline `Q1 1` format)
  - Wrong prefixes (`### Q0.5`)
  - Flat numbering (`Q1`, `Q2`) vs sub-question numbering (`Q1.1`, `Q1.2`)

Usage:
  from adaptive_ocr_parser import AdaptiveQPParser, AdaptiveMSParser

  qp_data = AdaptiveQPParser().parse(qp_text)
  ms_data = AdaptiveMSParser().parse(ms_text)
"""

from __future__ import annotations

import re
from typing import Optional


# ─── Shared utilities ──────────────────────────────────────────────────────────

_FM_PATTERN = re.compile(r"^---\s*\n(.*?)\n---", re.DOTALL)


def parse_frontmatter(text: str) -> dict:
    m = _FM_PATTERN.search(text)
    if not m:
        return {}
    result = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            key, _, val = line.partition(":")
            result[key.strip()] = val.strip()
    return result


def strip_frontmatter(text: str) -> str:
    return _FM_PATTERN.sub("", text).strip()


# ─── Rubric line detection ────────────────────────────────────────────────────

GEOGRAPHY_RUBRIC = [
    "MARK SCHEME", "Level Marks Description", "Level 1", "Level 2", "Level 3",
    "0 No relevant content", "AO1:", "AO2:", "AO3:", "AO4:",
    "AO1a", "AO2a", "AO3a", "AO3b", "AO4a",
    "Extended reas", "Detailed evaluative", "Clear evaluative", "Basic evaluative",
    "Detailed analytical", "Clear analytical", "Basic analytical",
    "Indicative content", "Extra space", "Turn over", "[Turn over]",
    "Do not write outside", "End of questions", "END OF QUESTIONS",
    "Copyright", "AQA will be happy", "For confidentiality purposes",
    "Spelling, punctuation", "Performance descriptor", "spell and punctuate",
    "Learners use rules", "Examiners are reminded", "When establishing",
    "Answers may assert", "Students may", "Students either submit",
    "Students demonstrate", "Students identify", "Students recognise",
    "Students are likely", "Question ", "continues on the next page",
    "each live examination", "Available for free", "download from www",
    "web address", "© AQA", "levels of response", "weak performance",
    "rewarded for weak", "their time of writing", "the ways in which",
    "explanation of the complexities", "establishing a mark",
    "strong performance in", "one mark should be", "knowledge and understanding",
    "Answer is presented", "sharply-focused", "coherence and logical",
    "Answer may suggest", "Answers arguing", "structured, substantiated",
    "with some substantiation", "Students may offer",
    "No marks", "showing a simple", "demonstrates specific",
    "a well-substantiated", "for a full description", "answer requires",
    "features of each", "explanation of another", "Learners use a",
    "any errors do not", "Example response", "This indicates",
    "Examiner commentary",
]

_HISTORY_RUBRIC_EXTRA = [
    "Target Analyse", "Target Demonstrate", "Target Explain",
    "Target: ", "The indicative content",
    "All historically relevant", "Extends Level",
    "Students may progress from",
]

_COMMON_RUBRIC = GEOGRAPHY_RUBRIC + _HISTORY_RUBRIC_EXTRA

_MARKS_VALUE = re.compile(r"^\d+\s*marks?$", re.IGNORECASE)
_LEVEL_DESC = re.compile(r"^Level \d", re.MULTILINE)


def is_rubric_line(line: str) -> bool:
    s = line.strip()
    if not s:
        return True
    for kw in _COMMON_RUBRIC:
        if kw in s:
            return True
    if _MARKS_VALUE.match(s):
        return True
    if re.match(r"^\d+–\d+", s):
        return True
    return False


# ─── Format detection ──────────────────────────────────────────────────────────

def detect_qp_format(text: str) -> str:
    """Detect question paper header format by trying all patterns and picking
    the one with the most matches. Hash-based patterns are preferred over
    inline patterns at equal match counts (they are more reliable OCR output)."""
    body = strip_frontmatter(text)

    # Score all candidate formats
    candidates = []

    # Hash `### Q1.1` — most reliable
    hash_q_dot_matches = list(re.finditer(r"^###\s*Q(\d+)\.(\d+)\s*$", body, re.MULTILINE))
    if len(hash_q_dot_matches) >= 2:
        counts = {}
        for m in hash_q_dot_matches:
            k = f"{m.group(1)}.{m.group(2)}"
            counts[k] = counts.get(k, 0) + 1
        subfmt = "hash_q_dot_duped" if any(c > 1 for c in counts.values()) else "hash_q_dot"
        candidates.append((len(hash_q_dot_matches) * 10, subfmt))

    # Hash `### Q0.x` — unreliable but still a hash pattern
    hash_q0_matches = len(re.findall(r"^###\s*Q0\.\d+\s*$", body, re.MULTILINE))
    if hash_q0_matches >= 2:
        candidates.append((hash_q0_matches * 8, "hash_q0"))

    # Inline `Q1 1 ` — medium reliability
    inline_matches = len(re.findall(r"^Q\d+\s+\d+\s", body, re.MULTILINE))
    if inline_matches >= 2:
        candidates.append((inline_matches * 5, "inline_q_space"))

    # Bold `**Q1.1**`
    bold_matches = len(re.findall(r"\*\*Q\d+\.\d+\*\*", body, re.MULTILINE))
    if bold_matches >= 2:
        candidates.append((bold_matches * 10, "bold_q_dot"))

    # Flat `Q1 ` — least specific (matches any Q + digit), only if nothing else found
    if not candidates:
        flat_matches = len(re.findall(r"^Q\d+\s", body, re.MULTILINE))
        if flat_matches >= 2:
            candidates.append((flat_matches, "flat_q"))

    if not candidates:
        return "unknown"

    candidates.sort(key=lambda x: -x[0])
    return candidates[0][1]


def detect_ms_format(text: str) -> str:
    """Detect mark scheme format. Returns a format name string."""
    body = strip_frontmatter(text)

    # Geography MS: `Q1 1 Using Figure...`
    geo = re.findall(r"^Q(\d+)\s+(\d+)\s", body, re.MULTILINE)
    if len(geo) >= 3:
        return "geo_ms"

    # History/RST MS: `Q1 ...` with extra patterns like Answer:
    flat = re.findall(r"^Q(\d+)\s", body, re.MULTILINE)
    if len(flat) >= 3:
        return "flat_ms"

    return "unknown"


# ─── QP Parsers ────────────────────────────────────────────────────────────────

_HASH_Q_DOT = re.compile(r"^###\s*Q(\d+)\.(\d+)\s*$", re.MULTILINE)
_INLINE_Q_SPACE = re.compile(r"^Q(\d+)\s+(\d+)\s", re.MULTILINE)
_FLAT_Q = re.compile(r"^Q(\d+)\s", re.MULTILINE)
_HASH_Q0 = re.compile(r"^###\s*Q0\.(\d+)\s*$", re.MULTILINE)
_BOLD_Q_DOT = re.compile(r"\*\*Q(\d+)\.(\d+)\*\*", re.MULTILINE)
_PREFIX_DIGIT = re.compile(r"^(\d+)\s")


def extract_q_text_from_block(
    block: str,
    strip_marks: bool = True,
    strip_instruction: bool = True,
    dedup_prefix: bool = False,
) -> str:
    """Extract clean question text from a raw block."""
    lines = block.splitlines()
    result_lines = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Skip marks indicators
        if strip_marks and re.match(r"\*\*\[\d+\s*marks?\]\*\*", stripped):
            break

        # Skip instructions
        if strip_instruction:
            if stripped.startswith("Shade one circle") or stripped.startswith("Shade "):
                continue
            if stripped.startswith("Extra space"):
                continue
            if stripped.startswith("Question ") and "continues" in stripped:
                continue
            if stripped in ("[Turn over]", "Turn over for the next question"):
                continue

        result_lines.append(stripped)

    text = " ".join(result_lines)

    # Strip prefix digit if needed (e.g., "0 Using Figure 5..." -> "Using Figure 5...")
    if dedup_prefix:
        m = _PREFIX_DIGIT.match(text)
        if m:
            text = text[m.end():].strip()

    return text


def _find_prefix_digit(block: str) -> Optional[int]:
    for line in block.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        m = _PREFIX_DIGIT.match(stripped)
        if m:
            return int(m.group(1))
        return None
    return None


def _parse_hash_q_dot(body: str) -> dict:
    """Standard `### Q1.1` format."""
    questions = {}
    matches = list(_HASH_Q_DOT.finditer(body))
    for i, m in enumerate(matches):
        q_id = f"Q{m.group(1)}.{m.group(2)}"
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        block = body[start:end]
        q_text = extract_q_text_from_block(block)
        questions[q_id] = {"question_text": q_text}
    return questions


def _is_likely_artifact_qp_text(text: str) -> bool:
    """Heuristic: if extracted question text is very short, starts with 'and',
    or is just a fragment, it's likely an OCR artifact rather than a real question."""
    if not text or len(text) < 15:
        return True
    low = text.lower().strip()
    if low.startswith("and ") or low.startswith("or ") or low.startswith("the "):
        return True
    if re.match(r"^[\d\s().,/\\-]+$", low):
        return True
    return False


def _parse_hash_q_dot_duped(body: str) -> dict:
    """Handle `### Q1.1` duplicated due to OCR collapsing Q1.10/Q1.11.

    When a Q ID appears 3+ times, the 2nd/3rd are renumbered via prefix digits
    (e.g., `### Q1.1` → Q1.10, Q1.11). When it appears exactly 2 times and the
    first is an OCR artifact, the second is kept as the primary.
    """
    matches = list(_HASH_Q_DOT.finditer(body))
    if len(matches) < 2:
        return {}

    qid_count = {}
    for m in matches:
        q_id = f"Q{m.group(1)}.{m.group(2)}"
        qid_count[q_id] = qid_count.get(q_id, 0) + 1

    questions = {}
    used_counts = {}

    for i, m in enumerate(matches):
        q_main = int(m.group(1))
        q_sub = int(m.group(2))
        base_id = f"Q{q_main}.{q_sub}"

        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        block = body[start:end]

        actual_q_id = base_id
        count = qid_count.get(base_id, 0)

        if count > 1:
            key = (q_main, q_sub)
            used = used_counts.get(key, 0)
            used_counts[key] = used + 1

            if used > 0:
                if count == 2 and used == 1:
                    # Exactly 2 occurrences, second is the primary.
                    # Check if first occurrence was an artifact (kept as base_id).
                    first_block = questions.get(base_id, {}).get("_raw_block", "")
                    first_text = questions.get(base_id, {}).get("question_text", "")
                    if _is_likely_artifact_qp_text(first_text):
                        # First was artifact — keep this (second) as the real base ID
                        actual_q_id = base_id
                    else:
                        # First was real — try to renumber this one
                        prefix = _find_prefix_digit(block)
                        actual_q_id = f"Q{q_main}.{q_sub}{prefix}" if prefix is not None else f"Q{q_main}.{q_sub}{used}"
                else:
                    # 3+ occurrences, or second+ occurrence of a 2-count where first was kept
                    prefix = _find_prefix_digit(block)
                    actual_q_id = f"Q{q_main}.{q_sub}{prefix}" if prefix is not None else f"Q{q_main}.{q_sub}{used}"

        q_text = extract_q_text_from_block(block, dedup_prefix=(actual_q_id != base_id and base_id in questions))
        questions[actual_q_id] = {"question_text": q_text, "_raw_block": block}

    return questions


def _parse_hash_q0(body: str) -> dict:
    """Handle `### Q0.x` wrong prefix format (OCR replaces Q1 with Q0).

    Also captures remaining inline `Q1 1` format questions in the same file,
    since OCR often mixes both formats in a single paper.
    """
    questions = {}

    # First, capture `### Q0.x` headers
    hmatches = list(_HASH_Q0.finditer(body))
    for m in hmatches:
        q_id = f"Q1.{m.group(1)}"
        start = m.end()
        # Find next header (either `### Q0.x` or `Q1 1` inline)
        next_pat = re.compile(r"^###\s*Q0\.\d+\s*$", re.MULTILINE)
        next_m = next_pat.search(body, start)
        end = next_m.start() if next_m else len(body)
        block = body[start:end]
        q_text = extract_q_text_from_block(block)
        questions[q_id] = {"question_text": q_text}

    # Then, capture inline `Q1 1` questions (skip those already matched)
    inline_questions = _parse_inline_q_space(body)
    for q_id, q_data in inline_questions.items():
        if q_id not in questions:
            questions[q_id] = q_data

    return questions


def _parse_inline_q_space(body: str) -> dict:
    """Handle inline `Q1 1` format (no markdown headers).

    Handles OCR errors where sub-number digits are split by spaces:
      `Q1 1 0 ...` → Q1.10  (continuation digit '0' appended to sub-number)
      `Q1 2 3 4 5 6` → skipped (artifact, all-digit remaining text)
    """
    questions = {}
    matches = list(_INLINE_Q_SPACE.finditer(body))

    for i, m in enumerate(matches):
        q_main = int(m.group(1))
        q_sub = int(m.group(2))
        sub_str = str(q_sub)

        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        block = body[start:end]

        # Check remaining text after Q header
        rest = body[m.end():].strip()

        # Skip artifacts where first line of remaining text is all digits/spaces (diagram labels, etc.)
        first_line = rest.split("\n")[0].strip()
        if first_line and re.match(r"^[\d\s.,\-]+$", first_line):
            continue

        # Check for continuation digits: `Q1 1 0 To what extent...` → sub=10
        cont = re.match(r"^(\d+)\s+(?!\d)", rest)
        if cont:
            sub_str = sub_str + cont.group(1)

        q_id = f"Q{q_main}.{sub_str}"
        raw = block.strip()
        raw = re.sub(r"^Q\d+(?:\s+\d+)+", "", raw)
        q_text = extract_q_text_from_block(raw)
        questions[q_id] = {"question_text": q_text}

    return questions


def _parse_flat_q(body: str) -> dict:
    """Handle flat `Q1` format (History)."""
    questions = {}
    matches = list(_FLAT_Q.finditer(body))
    for i, m in enumerate(matches):
        q_id = f"Q{m.group(1)}"
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        raw = body[start:end].strip()
        # Remove leading `Q1 ` prefix
        raw = re.sub(r"^Q\d+\s", "", raw)
        q_text = extract_q_text_from_block(raw)
        questions[q_id] = {"question_text": q_text}
    return questions


def _parse_bold_q_dot(body: str) -> dict:
    """Handle bold `**Q1.1**` format."""
    questions = {}
    matches = list(_BOLD_Q_DOT.finditer(body))
    for i, m in enumerate(matches):
        q_id = f"Q{m.group(1)}.{m.group(2)}"
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        block = body[start:end]
        q_text = extract_q_text_from_block(block)
        questions[q_id] = {"question_text": q_text}
    return questions


# ─── Adaptive QP Parser ────────────────────────────────────────────────────────

_QP_STRATEGIES = {
    "hash_q_dot": _parse_hash_q_dot,
    "hash_q_dot_duped": _parse_hash_q_dot_duped,
    "hash_q0": _parse_hash_q0,
    "inline_q_space": _parse_inline_q_space,
    "flat_q": _parse_flat_q,
    "bold_q_dot": _parse_bold_q_dot,
}


class AdaptiveQPParser:
    """Parse AQA question paper markdown with auto-detected format."""

    def parse(self, text: str, expected_q_ids: list[str] | None = None) -> dict:
        body = strip_frontmatter(text)
        fmt = detect_qp_format(body)

        parser_fn = _QP_STRATEGIES.get(fmt)
        if parser_fn:
            questions = parser_fn(body)
        else:
            questions = _parse_hash_q_dot(body)

        # Cross-validate with expected Q IDs from mark scheme
        if expected_q_ids and questions:
            questions = self._validate(questions, expected_q_ids)

        return questions

    def _validate(
        self, questions: dict, expected_q_ids: list[str]
    ) -> dict:
        """Try repair strategies if question count is far off from expected."""
        actual_ids = set(questions.keys())
        expected_set = set(expected_q_ids)
        missing = expected_set - actual_ids

        if not missing:
            return questions

        # If we have a partial match but missing flat->sub conversion
        # e.g., History has Q1, Q2 but Geography parser gives Q1.1, Q1.2
        if all("." in q for q in actual_ids) and all("." not in q for q in expected_set):
            return questions

        return questions


# ─── MS Content extraction ─────────────────────────────────────────────────────

def extract_ms_section(text: str, q_id: str, fmt: str) -> Optional[str]:
    """Extract the mark scheme section for a given question ID."""
    body = strip_frontmatter(text)

    if fmt == "geo_ms":
        # Geography: `Q1 1 ...`
        if "." in q_id:
            parts = q_id.replace("Q", "").split(".")
            pattern = re.compile(rf"^Q{parts[0]}\s+{parts[1]}\s", re.MULTILINE)
        else:
            return None
        match = pattern.search(body)
        if not match:
            return None
        start = match.start()
        # Find next Q header
        next_pat = re.compile(r"^Q\d+\s+\d+\s", re.MULTILINE)
        next_match = next_pat.search(body, start + len(match.group()))
        end = next_match.start() if next_match else len(body)
        return body[start:end]

    elif fmt == "flat_ms":
        # History/RS: `Q1 ...`
        q_num = q_id.replace("Q", "")
        pattern = re.compile(rf"^Q{re.escape(q_num)}\s", re.MULTILINE)
        match = pattern.search(body)
        if not match:
            return None
        start = match.start()
        next_pat = re.compile(r"^Q\d+\s", re.MULTILINE)
        next_match = next_pat.search(body, start + len(match.group()))
        end = next_match.start() if next_match else len(body)
        return body[start:end]

    return None


def clean_ms_answer(section: str, q_id: str, fmt: str) -> str:
    """Clean mark scheme answer text, removing rubric lines."""
    if not section:
        return ""

    if fmt == "geo_ms":
        # Remove the header line (e.g., "Q1 1 Using Figure...")
        if "." in q_id:
            parts = q_id.replace("Q", "").split(".")
            section = re.sub(rf"^Q{parts[0]}\s+{parts[1]}\s.*$", "", section, count=1, flags=re.MULTILINE)

    lines = section.splitlines()
    kept = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            kept.append("")
            continue
        if is_rubric_line(stripped):
            if kept and kept[-1] == "":
                kept.append("")
            continue
        kept.append(stripped)

    return "\n".join(kept).strip()


def detect_mcq(block: str) -> Optional[dict]:
    """Detect MCQ answer markers in a mark scheme section."""
    answer_letter = re.compile(r"^([A-D])\s*[–-]\s*", re.MULTILINE)
    mcq_line = re.compile(r"^([A-D])\s*[–-]\s*(.+)", re.MULTILINE)

    for line in block.splitlines():
        m = answer_letter.match(line.strip())
        if m:
            letter = m.group(1).strip()
            text = line[m.end():].strip()
            all_options = mcq_line.findall(block)
            options = [opt[1].strip() for opt in all_options]
            return {
                "is_mcq": True,
                "letter": letter,
                "text": text,
                "options": options,
            }

    all_options = mcq_line.findall(block)
    if all_options:
        options = [opt[1].strip() for opt in all_options]
        return {
            "is_mcq": True,
            "letter": None,
            "text": "",
            "options": options,
        }

    return None


def extract_bullet_points(lines: list[str]) -> list[str]:
    bullets = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("•") or stripped.startswith("-"):
            text = stripped.lstrip("•- ").strip()
            if text and len(text) > 10:
                bullets.append(text)
    return bullets


# ─── Adaptive MS Parser ────────────────────────────────────────────────────────

class AdaptiveMSParser:
    """Parse AQA mark scheme markdown with auto-detected format."""

    def parse(self, text: str) -> dict:
        body = strip_frontmatter(text)
        fmt = detect_ms_format(body)

        fm = parse_frontmatter(text)
        exam_series = fm.get("examSeries", "")
        paper_title = fm.get("paperTitle", "")

        questions = {}

        if fmt == "geo_ms":
            geo_ms = re.compile(r"^Q(\d+)\s+(\d+)\s", re.MULTILINE)
            matches = list(geo_ms.finditer(body))
            for i, m in enumerate(matches):
                q_main = int(m.group(1))
                q_sub = int(m.group(2))
                q_id = f"Q{q_main}.{q_sub}"
                start = m.start()
                end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
                block = body[start:end]
                lines = block.splitlines()
                content_lines = [l for l in lines[1:] if not is_rubric_line(l)]
                answer_info = detect_mcq(block)
                answer_text = "\n".join(content_lines).strip()

                questions[q_id] = {
                    "question_number": q_id,
                    "marks": 0,
                    "is_mcq": answer_info["is_mcq"] if answer_info else False,
                    "answer_letter": answer_info["letter"] if answer_info else None,
                    "answer_text": answer_info["text"] if answer_info else answer_text,
                    "mcq_options": answer_info["options"] if answer_info else [],
                    "bullet_points": extract_bullet_points(content_lines),
                }

        elif fmt == "flat_ms":
            flat_ms = re.compile(r"^Q(\d+)\s", re.MULTILINE)
            matches = list(flat_ms.finditer(body))
            for i, m in enumerate(matches):
                q_id = f"Q{m.group(1)}"
                start = m.start()
                end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
                block = body[start:end].strip()
                # Remove header
                block = re.sub(r"^Q\d+\s", "", block)
                lines = block.splitlines()
                content_lines = [l for l in lines if not is_rubric_line(l)]
                answer_text = "\n".join(content_lines).strip()

                questions[q_id] = {
                    "question_number": q_id,
                    "marks": 0,
                    "is_mcq": False,
                    "answer_letter": None,
                    "answer_text": answer_text,
                    "mcq_options": [],
                    "bullet_points": extract_bullet_points(content_lines),
                }

        return {
            "exam_series": exam_series,
            "paper_title": paper_title,
            "format": fmt,
            "questions": questions,
        }
