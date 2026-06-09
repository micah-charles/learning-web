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

ANSWER_MARKERS = [
    (r'^Answer:\s*([A-Z])\s*(.*)', lambda m: f"**Answer: {m.group(1)}** {m.group(2).strip()}"),
    (r'Arguments in support\s*$', lambda m: "\n**Arguments in support:**"),
    (r'Arguments in support of other views\s*$', lambda m: "\n**Arguments in support of other views:**"),
    (r'^(Possible teachings|Specific teachings)', lambda m: f"\n**{m.group(0)}**"),
]

def is_rubric_line(s):
    """Check if a line is rubric/grading text (not answer content)."""
    patterns = [
        r'^Target:', r'^MARK SCHEME', r'^Level Criteria',
        r'^Simple explanation', r'^Detailed explanation',
        r'^One mark for each', r'^If students provide', r'^To be a',
        r'^Contrast may mean', r'^Maximum of Level', r'^0 Nothing worthy',
        r'^Suggestion of two', r'^This is a level', r'^No other cause',
        r'^First\s', r'^Second\s', r'^Relevant and accurate reference',
        r'^A well-argued', r'^Reasoned consideration', r'^Logical chains',
        r'^Recognition of different', r'^Point of view with',
        r'^Nothing worthy of credit', r'^In your answer you should',
        r'^\[SPaG', r'^\[Plus SPaG', r'^Students may include',
        r'^Q\d+\s(?!\.\d)', r'^#', r'^Extra space',
        r'^Question \d+ continues', r'^\*\*.*GCSE Religious Studies\*$',
        r'^beliefs, practices', r'^influence on', r'^demonstrate knowledge',
        r'^considered for marking', r'^credited:', r'^credit worthy',
        r'teaching\s*[–-]\s*\d+\s*mark', r'^First teaching', r'^Second teaching',
    ]
    return any(re.match(p, s) for p in patterns)

def find_answer_start(lines, start_idx):
    """Find the index where real answer content begins (skip rubric)."""
    for i in range(start_idx, len(lines)):
        s = lines[i].strip()
        if not s:
            continue
        # Skip marks line itself
        if re.match(r'^(\*\*)?\[(\d+)\s*marks?\](\*\*)?', s):
            continue
        # Skip rubric
        if is_rubric_line(s):
            continue
        # Found something that might be answer content
        return i
    return len(lines)

def parse_ms_answers(ms_body):
    """Parse mark scheme to extract answers per question."""
    ms_body = strip_frontmatter(ms_body)
    answers = {}

    sections = re.split(r'^(?:###\s+)?(Q\d+\.\d+)\b', ms_body, flags=re.MULTILINE)

    for i in range(1, len(sections), 2):
        qid = sections[i].strip()
        content = sections[i+1] if i+1 < len(sections) else ""
        lines = content.split("\n")

        # Find where answer content starts
        answer_start = 0
        for idx, line in enumerate(lines):
            s = line.strip()
            if re.match(r'^(\*\*)?\[(\d+)\s*marks?\](\*\*)?', s):
                answer_start = idx + 1
                break

        # Find start of actual answer (skip rubric)
        answer_start = find_answer_start(lines, answer_start)

        # Extract answer content
        answer_parts = []
        for line in lines[answer_start:]:
            s = line.strip()
            if not s:
                continue

            # Check for answer markers
            matched = False
            for pattern, formatter in ANSWER_MARKERS:
                m = re.match(pattern, s)
                if m:
                    answer_parts.append(formatter(m))
                    matched = True
                    break
            if matched:
                continue

            # Skip rubric that might still appear within answer content
            if is_rubric_line(s):
                continue

            # Skip AQA page footer artifacts
            if re.match(r'^MARK SCHEME', s):
                continue
            if re.match(r'^(\*\*)?\[(\d+)\s*marks?\](\*\*)?', s):
                continue

            # Skip MCQ option lines (A/B/C/D) unless part of FOR/AGAINST
            if re.match(r'^[A-D]\s', s) and len(s) < 60:
                continue

            # Skip "credit worthy" type rubric that appears mid-content
            if re.search(r'credit worthy|cannot be credited|is credit worthy', s, re.I):
                continue

            # Keep meaningful content
            s_clean = re.sub(r'^\d+\s+', '', s) if re.match(r'^\d+\s', s) else s
            answer_parts.append(s_clean)

        if answer_parts:
            answers[qid] = "\n".join(answer_parts)

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
