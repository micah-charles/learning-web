#!/usr/bin/env python3
"""
Read AQA GCSE RS OCR'd question papers + mark schemes, combine them into
study-ready markdown files, and update manifest.json to point to the new files.
"""
import json
import os
import re

MARKDOWN_ROOT = "/Volumes/ExtremePro/LearningWebAIWorkspace/markdown/aqa/unknown-qualification"
MANIFEST_PATH = "data/generated/manifest.json"
OUTPUT_DIR = "data/Packs/gcse/religion"
LEARNING_WEB_ROOT = "/tmp/learning-web"

SERIES_TO_FOLDER = {
    "june-2022": "june-2022",
    "june-2023": "june-2023",
    "june-2024": "june-2024",
    "november-2020": "november-2020",
    "november-2021": "november-2021",
}

def find_series_folder(exam_series):
    es = exam_series.lower()
    if "june 2024" in es: return "june-2024"
    if "june 2023" in es: return "june-2023"
    if "june 2022" in es: return "june-2022"
    if "november 2020" in es or "june 2020" in es: return "november-2020"
    if "november 2021" in es or "june 2021" in es: return "november-2021"
    return None

def find_paper_folder(series_folder, paper_field, source_papers):
    paper_lower = paper_field.lower().strip()

    HUMAN_TO_SLUG = {
        "paper 2a thematic studies": "paper-2a",
        "paper 2b textual studies": "paper-2b",
        "paper 2x section a": "paper-2x",
        "paper 2y section a": "paper-2y",
    }
    if paper_lower in HUMAN_TO_SLUG:
        slug = HUMAN_TO_SLUG[paper_lower]
        if series_folder in source_papers:
            for fn in source_papers[series_folder]:
                if fn.startswith(slug):
                    return fn

    if series_folder in source_papers:
        for fn in source_papers[series_folder]:
            if fn == paper_lower or fn == paper_lower.replace(" ", "-"):
                return fn
            pf_clean = paper_lower.replace(" ", "-")
            if fn.startswith(pf_clean):
                return fn

    if series_folder in source_papers:
        for fn in source_papers[series_folder]:
            ps = paper_lower.replace(" ", "-")
            if fn == ps or fn.startswith(ps):
                return fn
            pw = set(ps.split("-"))
            fw = set(fn.split("-"))
            common = pw & fw
            if len(common) >= 3 and ("section" in pw or "option" in pw):
                score = sum(1 for w in pw if w in fw)
                if score >= 4:
                    return fn
    return None

def strip_frontmatter(text):
    lines = text.split("\n")
    if lines and lines[0].strip() == "---":
        for i in range(1, len(lines)):
            if lines[i].strip() == "---":
                return "\n".join(lines[i+1:])
    return text

def parse_qp_questions(qp_body):
    """Parse question paper. Returns dict of {qid: {text, marks}}."""
    qp_body = strip_frontmatter(qp_body)
    questions = {}
    lines = qp_body.split("\n")
    current_q = None
    current_text = []
    current_marks = ""

    for line in lines:
        s = line.strip()
        qm = re.match(r'^(?:###\s+)?(Q\d+\.\d+)\b', s)
        if qm:
            if current_q:
                text = "\n".join(current_text).strip()
                if text and not text.startswith("Extra"):
                    questions[current_q] = {"text": text, "marks": current_marks}
            current_q = qm.group(1)
            rest = s[qm.end():].strip()
            current_text = [rest] if rest else []
            current_marks = ""
        elif current_q:
            # Capture marks line
            mm = re.match(r'^(\*\*)?\[(\d+)\s*marks?\](\*\*)?', s)
            if mm:
                current_marks = f"[{mm.group(2)} marks]"
                continue
            # Skip noise
            if re.match(r'^(Put a tick|Extra space|Question\s*\.|Copyright|For confidentiality|and AQA will|226G)', s):
                continue
            if s == "**":
                continue
            if re.match(r'^Question \d+ continues', s):
                continue
            # Skip section headers like "Q1 Buddhism: Beliefs"
            if re.match(r'^Q\d+\s(?!\.\d)', s):
                continue
            # Include substantive text lines
            if s:
                current_text.append(line.rstrip())

    if current_q and current_q not in questions:
        text = "\n".join(current_text).strip()
        if text:
            questions[current_q] = {"text": text, "marks": current_marks}

    return questions

def is_rubric_or_instruction(s):
    """Check if a line is rubric / grading / instruction text, not answer content."""
    patterns = [
        r'^Target:', r'^MARK SCHEME', r'^Level Criteria',
        r'^Simple explanation', r'^Detailed explanation',
        r'^One mark for each', r'^If students provide', r'^To be a',
        r'^Contrast may mean', r'^Maximum of Level',
        r'^Suggestion of two', r'^This is a level', r'^No other cause',
        r'^First (?:contrasting|belief|teaching|way)', r'^Second (?:contrasting|belief|teaching|way)',
        r'^Relevant and accurate reference',
        r'^Nothing worthy of credit',
        r'^In your answer you (?:should|:)',
        r'^\[SPaG', r'^\[Plus SPaG', r'^Students may include',
        r'^Q\d+\s(?!\.\d)', r'^#', r'^Extra space',
        r'^Question \d+ continues',
        r'^beliefs, practices', r'^influence on', r'^demonstrate knowledge',
        r'^considered for marking',
        r'^credit(?:ed)?:', r'^credit worthy',
        r'teaching\s*[–-]\s*\d+\s*mark',
        r'^If similar ways', r'^Allow up to',
        r'^Credit(?:ed)?\s', r'^Accept\s',
        r'^References?\s', r'^NB\s', r'^Do not accept',
        r'^Maximum of Level', r'^Recognition of different',
        # Level descriptor lines (start with number + level text)
        r'^\d\s+(?:A well-argued|Reasoned|Logical|Recognition|Point of view|Nothing worthy)',
        r'^\d\s+1–3', r'^\d\s+Nothing worthy', r'^0 Nothing worthy',
        # Continuation lines of level descriptors
        r'^Logical chains of reasoning',
        r'^A logical chain of reasoning',
        r'^References? to religion applied',
        r'^Clear reference to religion',
        r'^Point of view with reason',
        # Rubric continuation / cleanup
        r'^and influence', r'^and arguments must be credited',
        r'^evidence and arguments must be credited',
        r'^evidence and information',
        r'^but all other relevant points',
        r'^but all relevant evidence',
        r'^However, students may also',
        r'^Also credit',
        r'^understanding of relevant',
        r'^relevant evidence',
        # Very short rubric fragments
        r'^Similarities and differences',
        r'^demonstrate knowledge and understanding',
        r'^influence on individuals', r'^influence$',
        r'^evidence\.$',
    ]
    return any(re.match(p, s, re.IGNORECASE) for p in patterns)


def clean_joined_text(text):
    """Remove instruction/residue phrases from joined text."""
    # Remove trailing instruction fragments that leaked through line filtering
    text = re.sub(
        r'(?:should be chosen and explained\..*|Contrasts could be drawn.*|but only two different ways.*)',
        '', text
    )
    # Remove standalone instruction fragments
    text = re.sub(r'\b(?:etc\.)\s*$', '', text)
    text = text.strip()
    return text


def find_header_lines(lines, header):
    """Return indices of lines that match a header pattern exactly."""
    pat = re.compile(re.escape(header) + r'$', re.IGNORECASE)
    return [i for i, l in enumerate(lines) if pat.match(l.strip().rstrip(':'))]


def group_into_sections(lines):
    """Split a list of lines into logical sections based on headers.

    Returns list of dicts: {type: 'header'|'content', text: ..., lines: [...]}
    """
    # Find section headers
    header_indices = []
    for h in ['Arguments in support of other views', 'Arguments in support']:
        header_indices.extend((i, h) for i in find_header_lines(lines, h))

    # Sort by position
    header_indices.sort()

    if not header_indices:
        return [{'type': 'content', 'text': "\n".join(lines), 'lines': lines}]

    sections = []

    # Preamble (before first header)
    first_idx = header_indices[0][0]
    if first_idx > 0:
        pre_lines = lines[:first_idx]
        sections.append({'type': 'content', 'text': "\n".join(pre_lines), 'lines': pre_lines})

    for idx, (pos, hname) in enumerate(header_indices):
        # Add the header
        sections.append({'type': 'header', 'text': hname, 'lines': [lines[pos]]})

        # Content between this header and the next (or end)
        next_pos = header_indices[idx + 1][0] if idx + 1 < len(header_indices) else len(lines)
        content_lines = lines[pos + 1:next_pos]
        if content_lines:
            sections.append({'type': 'content', 'text': "\n".join(content_lines), 'lines': content_lines})

    return sections


def format_answer_text(raw_lines):
    """Convert raw MS answer lines into clean, well-formatted markdown.

    Handles multiple formats found in AQA mark schemes:
    - `/` separated inline points → bullet list
    - `•` prefixed lines → kept as bullet list
    - Section headers (Arguments in support, Sources of authority, religion names)
    - Bible quotes preserved as blockquotes
    - Instruction lines filtered out
    """
    if not raw_lines:
        return ""

    # First, split into FOR/AGAINST sections based on line-level headers
    sections = group_into_sections(raw_lines)

    result_parts = []

    for section in sections:
        if section['type'] == 'header':
            # Format header text
            h = section['text'].strip().rstrip(':')
            result_parts.append(f"\n**{h}:**")
            continue

        # Content section: join lines and strip
        text = " ".join(section['lines'])
        text = re.sub(r'  +', ' ', text)
        text = clean_joined_text(text)
        text = text.strip()

        if not text:
            continue

        # Check for per-religion sub-sections within content
        # (religion headers are on their own line in the original lines)
        sub_lines = section['lines']
        has_religion_header = False
        for line in sub_lines:
            ls = line.strip().rstrip(':')
            if ls in RELIGIONS:
                has_religion_header = True
                break

        if has_religion_header:
            # Process with religion splitting
            joined = " | ".join(s.strip() for s in sub_lines)
            sub_parts = split_religion_sections(joined)
            for sp in sub_parts:
                result_parts.append(sp)
        else:
            bullets = split_into_bullets(text)
            for b in bullets:
                result_parts.append(b)

    output = "\n".join(result_parts)
    output = re.sub(r'\n{3,}', '\n\n', output)
    return output.strip()


RELIGIONS = [
    "Buddhism", "Christianity", "Hinduism", "Islam",
    "Judaism", "Sikhism",
]


def split_lines_by_religion(lines):
    """Split a list of lines at religion-name headers.

    Returns list of dicts: {type: 'religion_header'|'content', name: ..., lines: [...]}
    """
    parts = []
    current_lines = []
    for line in lines:
        ls = line.strip().rstrip(':')
        if ls in RELIGIONS:
            if current_lines:
                parts.append({'type': 'content', 'lines': current_lines})
            parts.append({'type': 'religion_header', 'name': ls})
            current_lines = []
        else:
            current_lines.append(line)
    if current_lines:
        parts.append({'type': 'content', 'lines': current_lines})
    return parts


def format_content_as_bullets(text):
    """Convert text into markdown bullet points.

    Handles:
    - `•` prefixed lines (preserve as bullets)
    - ` / ` separated inline points (split into bullets)
    - `Sources of authority:` as a header with Bible quotes as blockquotes
    """
    text = text.strip()
    if not text:
        return []

    # Clean trailing etc.
    text = re.sub(r',?\s*etc\.?\s*\)?\s*$', '', text)
    text = text.strip()

    # Check for Sources of authority:
    soa_match = re.search(r'(Sources?\s+of\s+authority)\s*:?\s*', text, re.IGNORECASE)
    if soa_match:
        before = text[:soa_match.start()].strip()
        after = text[soa_match.end():].strip()
        parts = []

        if before:
            for s in split_by_separators(before):
                parts.append(f"- {s}")

        parts.append(f"\n**{soa_match.group(1)}:**")

        if after:
            quote_sections = re.split(r"('[^']+'\s*\([^)]+\))", after)
            for qs in quote_sections:
                qs = qs.strip()
                if not qs:
                    continue
                if qs.startswith("'") and '(' in qs and qs.endswith(')'):
                    parts.append(f"\n> {qs}")
                elif not is_instruction_text(qs):
                    for b in split_by_separators(qs):
                        parts.append(f"- {b}")
        return parts

    # Check for existing • bullets
    if '•' in text:
        bullet_sections = re.split(r'•\s*', text)
        result = []
        for bs in bullet_sections:
            bs = bs.strip()
            if bs and not is_instruction_text(bs):
                result.append(f"- {bs}")
        return result

    # Default: split by / separator
    result = []
    for s in split_by_separators(text):
        result.append(f"- {s}")
    return result


def format_answer_text(raw_lines):
    """Convert raw MS answer lines into clean, well-formatted markdown."""
    if not raw_lines:
        return ""

    # Split into FOR/AGAINST sections based on line-level headers
    sections = group_into_sections(raw_lines)
    result_parts = []

    for section in sections:
        if section['type'] == 'header':
            h = section['text'].strip().rstrip(':')
            result_parts.append(f"\n**{h}:**")
            continue

        # Content section: check for religion sub-headers
        content_lines = section['lines']
        rel_parts = split_lines_by_religion(content_lines)

        for rp in rel_parts:
            if rp['type'] == 'religion_header':
                result_parts.append(f"\n**{rp['name']}:**")
                continue

            # Join content lines into text
            text = " ".join(l.strip() for l in rp['lines'])
            text = re.sub(r'  +', ' ', text)
            text = clean_joined_text(text).strip()

            if text:
                bullets = format_content_as_bullets(text)
                for b in bullets:
                    result_parts.append(b)

    output = "\n".join(result_parts)
    output = re.sub(r'\n{3,}', '\n\n', output)
    return output.strip()


def split_by_separators(text):
    """Split text by ` / ` (space-slash-space) into individual points.

    Handles `/` inside parentheses by protecting them before splitting.
    """
    if not text.strip():
        return []

    # Protect / inside parentheses
    protected = {}
    def protect_parens(m):
        key = f"\x00PROTECT{len(protected)}\x00"
        protected[key] = m.group(0).replace('/', '\x00SLASH\x00')
        return key
    text = re.sub(r'\([^)]*\)', protect_parens, text)
    # Also protect / inside square brackets (Bible refs)
    text = re.sub(r'\[[^\]]*\]', protect_parens, text)

    # Split by ` / `
    splits = re.split(r'\s+/\s+', text)
    result = []
    for s in splits:
        # Restore protected slashes
        for key, val in protected.items():
            s = s.replace(key, val)
        s = s.replace('\x00SLASH\x00', '/')
        s = s.strip().strip(',').strip()
        if not s:
            continue
        # Clean up leading/trailing punctuation
        s = re.sub(r'^[,;.\s]+', '', s).strip()
        s = re.sub(r'[,;.\s]+$', '', s).strip()
        if not s:
            continue
        if is_instruction_text(s):
            continue
        # Capitalize first letter
        s = s[0].upper() + s[1:] if s and s[0].islower() else s
        result.append(s)
    return result


def is_instruction_text(s):
    """Check if a text fragment is examiner instruction, not answer content."""
    s_lower = s.lower().strip()
    patterns = [
        r'^accept\s', r'^credited?\s', r'^references?\s', r'^nb\s', r'^do not accept',
        r'^also credit', r'^allow up to', r'^maximum of',
        r'^students may include',
        r'^all (?:other )?relevant (?:points|evidence)',
        r'^but (?:all )?other relevant',
        r'^but all relevant evidence',
        r'^evidence and arguments',
        r'^two of the following',
    ]
    if any(re.match(p, s_lower) for p in patterns):
        return True

    # Fragments that are rubric residue
    if s_lower in ('etc', 'etc.', 'and', 'the', 'this is a level'):
        return True
    if re.match(r'^\d+\s+marks?', s_lower):
        return True

    return False


def parse_ms_answers(ms_body):
    """Parse mark scheme to extract answers per question."""
    ms_body = strip_frontmatter(ms_body)
    answers = {}

    sections = re.split(r'^(?:###\s+)?(Q\d+\.\d+)\b', ms_body, flags=re.MULTILINE)

    for i in range(1, len(sections), 2):
        qid = sections[i].strip()
        content = sections[i+1] if i+1 < len(sections) else ""
        lines = content.split("\n")

        # ---- STEP 1: Find content start ----
        # Locate the marks line, then skip all rubric/instruction lines
        # until we hit actual answer content

        # First find marks line
        marks_idx = -1
        for idx, line in enumerate(lines):
            if re.match(r'^(\*\*)?\[(\d+)\s*marks?\](\*\*)?', line.strip()):
                marks_idx = idx
                break

        if marks_idx == -1:
            continue

        # For MCQ, find Answer: quickly
        answer_line = None
        for idx in range(marks_idx + 1, len(lines)):
            s = lines[idx].strip()
            if re.match(r'^Answer:\s*[A-E]', s):
                answer_line = s
                break

        if answer_line:
            m = re.match(r'^Answer:\s*([A-E])\s*(.*)', answer_line)
            answers[qid] = f"**Answer: {m.group(1)}** {m.group(2).strip()}"
            continue

        # For non-MCQ: skip all rubric/instruction lines to find content start
        content_start = marks_idx + 1
        for idx in range(marks_idx + 1, len(lines)):
            s = lines[idx].strip()
            if not s:
                content_start = idx + 1
                continue
            # Skip rubric and instruction lines
            if is_rubric_or_instruction(s):
                content_start = idx + 1
                continue
            # Found content
            break

        # ---- STEP 2: Collect raw content ----
        raw_lines = []
        for line in lines[content_start:]:
            s = line.strip()
            if not s:
                continue
            # Skip instruction lines embedded in content
            if is_rubric_or_instruction(s):
                continue
            # Skip AQA page footer
            if re.match(r'^MARK SCHEME', s):
                continue
            # Skip standalone marks lines
            if re.match(r'^(\*\*)?\[(\d+)\s*marks?\](\*\*)?', s):
                continue
            # Skip MCQ option lines (A/B/C/D)
            if re.match(r'^[A-D]\s', s) and len(s) < 60:
                continue
            raw_lines.append(s)

        if not raw_lines:
            continue

        # ---- STEP 3: Format into clean markdown ----
        answers[qid] = format_answer_text(raw_lines)

    return answers

def combine_qa(pack, qp_questions, ms_answers):
    """Combine QP questions with MS answers into structured data."""
    result = []
    for qid, qdata in qp_questions.items():
        result.append({
            "id": qid,
            "question": qdata["text"],
            "marks": qdata.get("marks", ""),
            "answer": ms_answers.get(qid, ""),
        })
    return result

def format_study_markdown(pack, questions):
    """Format Q&A pairs into study-ready markdown."""
    lines = []

    # Title — clean up redundant "GCSE Religious Studies"
    title = pack['displayName']
    title = re.sub(r'\s*[—–-]\s*GCSE Religious Studies', '', title)
    lines.append(f"# {title}")
    lines.append("")

    # Clean exam series subtitle
    es_clean = ""
    if pack.get("examSeries"):
        es_clean = re.sub(r'\s*[—–-]\s*GCSE Religious Studies\s*$', '', pack["examSeries"])
    paper_label = pack.get("paper", "")
    # Convert folder-name-style paper to display label
    if paper_label and paper_label.startswith("paper-"):
        paper_label = paper_label.replace("-", " ").title()
        paper_label = re.sub(r'\s+', ' ', paper_label)
    sub_parts = [p for p in [es_clean, "AQA GCSE Religious Studies", paper_label] if p]
    if sub_parts:
        lines.append(f"*{' — '.join(sub_parts)}*")
        lines.append("")

    lines.append("---")
    lines.append("")

    if not questions:
        lines.append("*No questions available for this paper.*")
        lines.append("")
        return "\n".join(lines)

    for q in questions:
        qid = q["id"]
        qt = q["question"]
        marks = q["marks"]
        ans = q["answer"]

        # Build marks header
        marks_display = ""
        mm = re.search(r'\[(\d+)\s*marks?\]', marks)
        if mm:
            mval = mm.group(1)
            marks_display = f"[{mval} mark{'s' if int(mval) != 1 else ''}]"

        lines.append(f"## {qid} {marks_display}".rstrip())
        lines.append("")

        # Clean question text
        qt_clean = re.sub(r'\s*Put a tick.*correct answer\.', '', qt).strip()
        qt_clean = re.sub(r'\s*Question \d+ continues.*$', '', qt_clean).strip()
        if qt_clean:
            lines.append(qt_clean)
            lines.append("")

        if ans:
            lines.append("---")
            lines.append("")
            lines.append(ans)
            lines.append("")

    return "\n".join(lines)

def build_source_index(root):
    index = {}
    for series in os.listdir(root):
        sp = os.path.join(root, series)
        if not os.path.isdir(sp):
            continue
        index[series] = {}
        for paper in os.listdir(sp):
            pp = os.path.join(sp, paper)
            if not os.path.isdir(pp):
                continue
            qp = os.path.join(pp, "question-paper.md")
            ms = os.path.join(pp, "mark-scheme.md")
            if os.path.exists(qp) and os.path.exists(ms):
                index[series][paper] = {"qp": qp, "ms": ms}
    return index

def main():
    manifest_path = os.path.join(LEARNING_WEB_ROOT, MANIFEST_PATH)
    output_dir = os.path.join(LEARNING_WEB_ROOT, OUTPUT_DIR)

    print(f"Building source index from {MARKDOWN_ROOT}...")
    source_index = build_source_index(MARKDOWN_ROOT)
    for series, papers in source_index.items():
        print(f"  {series}: {len(papers)} papers")

    with open(manifest_path) as f:
        manifest = json.load(f)

    gcse_rs_packs = [p for p in manifest["packs"] if p["id"].startswith("gcse_rs_")]
    print(f"\nFound {len(gcse_rs_packs)} GCSE RS packs in manifest")

    matched = 0
    new_md_paths = {}

    for pack in gcse_rs_packs:
        pack_id = pack["id"]
        exam_series = pack.get("examSeries", "")
        paper_field = pack.get("paper", "")

        series_folder = find_series_folder(exam_series)
        if not series_folder:
            print(f"  WARNING: No series folder for {pack_id} ({exam_series!r})")
            continue

        if series_folder not in source_index:
            print(f"  WARNING: Series {series_folder} not in source index")
            continue

        paper_folder = find_paper_folder(series_folder, paper_field, source_index)
        if not paper_folder:
            print(f"  WARNING: No paper match for {pack_id} (paper={paper_field!r}) in {series_folder}")
            avail = list(source_index[series_folder].keys())
            print(f"    Available: {avail}")
            continue

        sources = source_index[series_folder][paper_folder]
        with open(sources["qp"]) as f:
            qp_text = f.read()
        with open(sources["ms"]) as f:
            ms_text = f.read()

        qp_qs = parse_qp_questions(qp_text)
        ms_as = parse_ms_answers(ms_text)
        questions = combine_qa(pack, qp_qs, ms_as)

        md_content = format_study_markdown(pack, questions)

        # Write to pack-id named file
        output_filename = f"{pack_id}.md"
        output_path = os.path.join(output_dir, output_filename)
        with open(output_path, "w") as f:
            f.write(md_content)

        shared_path = f"data/Packs/gcse/religion/{output_filename}"
        new_md_paths[pack_id] = shared_path

        print(f"  ✓ {pack_id} → {output_filename} ({len(questions)} Qs)")
        matched += 1

    print(f"\nMatched {matched}/{len(gcse_rs_packs)} packs")

    if matched > 0:
        updated = 0
        for pack in manifest["packs"]:
            if pack["id"] in new_md_paths:
                old = pack.get("contentMdPath", "")
                newp = new_md_paths[pack["id"]]
                if old != newp:
                    pack["contentMdPath"] = newp
                    updated += 1
        with open(manifest_path, "w") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"Updated {updated} manifest entries")

    print("Done!")

if __name__ == "__main__":
    main()
