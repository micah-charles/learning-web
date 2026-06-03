"""
aqa_md_to_pack.py — Automatically parse AQA mark scheme markdown files
and generate Learning Web pack_unified.json files for ALL exam years.

Handles all 5 exam sittings: June 2022, June 2023, June 2024,
November 2020, November 2021.

Usage:
  python -m aqa_tools.aqa_md_to_pack \
    --markdown-root /path/to/markdown/aqa/unknown-qualification \
    --learning-web-dir /path/to/learning-web \
    --dry-run

  # Generate all years:
  python -m aqa_tools.aqa_md_to_pack \
    --markdown-root /Volumes/ExtremePro/LearningWebAIWorkspace/markdown/aqa/unknown-qualification \
    --learning-web-dir /Volumes/ExtremePro/AIWorkspace/learning-web
"""

from __future__ import annotations
import argparse, json, re, sys
from pathlib import Path
from collections import defaultdict


# ─── Religion detection ───────────────────────────────────────────────────────

RELIGION_MAP = {
    "buddhism":             "Buddhism",
    "christianity":         "Christianity",
    "catholic-christianity":"Catholic Christianity",
    "hinduism":             "Hinduism",
    "islam":                "Islam",
    "judaism":              "Judaism",
    "sikhism":              "Sikhism",
}

PAPER_LABEL_MAP = {
    "paper-1-option-1":     "Buddhism",
    "paper-1-option-2":     "Catholic Christianity",
    "paper-1-option-3":     "Christianity",
    "paper-1-option-4":     "Hinduism",
    "paper-1-option-5":     "Islam",
    "paper-1-option-6":     "Judaism",
    "paper-1-option-7":     "Sikhism",
    "paper-1-catholic":     "Catholic Christianity",
    "paper-1-section-a-option-1": "Buddhism (Section A)",
    "paper-1-section-a-option-2": "Christianity (Section A)",
    "paper-1-section-a-option-3": "Islam (Section A)",
    "paper-1-section-a-option-4": "Judaism (Section A)",
    "paper-1-section-b":    "Thematic Studies (Section B)",
    "paper-2a":             "Thematic Studies (Paper 2A)",
    "paper-2b":             "Thematic Studies (Paper 2B)",
    "paper-2x":             "Islam Perspectives (Paper 2X)",
    "paper-2y":             "Judaism Perspectives (Paper 2Y)",
}

def detect_religion_label(paper_dir: str) -> str:
    for key, label in PAPER_LABEL_MAP.items():
        if paper_dir.startswith(key):
            return label
    # fallback: extract from dir name
    for key, label in RELIGION_MAP.items():
        if key in paper_dir:
            return label.capitalize()
    return paper_dir.replace("-", " ").title()


def year_to_slug(exam_series: str) -> str:
    """'June 2022' → 'june_2022', 'November 2020' → 'november_2020'"""
    return exam_series.lower().replace(" ", "_")


def paper_to_id_slug(paper_dir: str) -> str:
    """'paper-1-option-1-the-study-of-religions-buddhism' → 'p1_opt1_buddhism'"""
    d = paper_dir
    d = re.sub(r"-the-study-of-religions", "", d)
    d = re.sub(r"-perspectives-on-faith", "", d)
    d = re.sub(r"-non-textual-studies", "_nts", d)
    d = re.sub(r"-textual-studies", "_ts", d)
    d = re.sub(r"section-a-", "sa_", d)
    d = re.sub(r"section-b-thematics-studies", "sb_thematic", d)
    d = re.sub(r"^paper-", "p", d)
    d = re.sub(r"-option-", "_opt", d)
    d = re.sub(r"-section-a", "_sa", d)
    d = re.sub(r"-", "_", d)
    return d[:40]


# ─── Markdown parser ──────────────────────────────────────────────────────────

_Q_HEADER = re.compile(r"^(?:###\s+)?(Q\d+\.\d+)\b", re.MULTILINE)
_ANSWER_LINE = re.compile(r"^Answer:\s*([A-D])\s*(.+)$", re.MULTILINE)
_BULLET = re.compile(r"^[•●]\s*(.+)$", re.MULTILINE)
_SCRIPTURE = re.compile(r"'([^']{15,}[.!?])'\s*[\(\[]([\w\s:,/]+)[\)\]]")
_ARGS_FOR = re.compile(r"^Arguments in support$", re.MULTILINE | re.IGNORECASE)
_ARGS_AGAINST = re.compile(r"^Arguments in support of (a\s+)?other (views?|points? of view)$",
                            re.MULTILINE | re.IGNORECASE)
_EXAM_SERIES = re.compile(r"\*(.*?202\d.*?)\*")
_MCQ_OPTS = re.compile(r"^([A-D])\s+(.+)$", re.MULTILINE)
_EVAL_STMT = re.compile(r"^['‘’“”′](.{15,})['‘’“”′]$",
                         re.MULTILINE)


def _clean(text: str) -> str:
    """Strip trailing markup/labels."""
    text = re.sub(r"MARK SCHEME.*?$", "", text, flags=re.MULTILINE)
    text = re.sub(r"^Target:.*?$", "", text, flags=re.MULTILINE)
    text = re.sub(r"^(First|Second) (way|belief|reason|teaching|contrast|purpose)$", "",
                  text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r"^(Simple|Detailed) explanation.*?$", "", text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r"^\*\*\[\d+ marks?\]\*\*$", "", text, flags=re.MULTILINE)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _bullets(block: str, max_n: int = 6) -> list[str]:
    """Extract bullet-point strings from a text block."""
    hits = _BULLET.findall(block)
    result = []
    for h in hits:
        # remove trailing cross-reference like "/ this will..."
        h = h.split(" / ")[0].strip()
        h = re.sub(r"\s+", " ", h)
        if len(h) > 20:
            result.append(h)
        if len(result) >= max_n:
            break
    return result


def _first_scripture(block: str) -> str:
    m = _SCRIPTURE.search(block)
    if m:
        return f"'{m.group(1).strip()}' ({m.group(2).strip()})"
    return ""


def _mcq_options(block: str) -> list[str]:
    return [t for _, t in _MCQ_OPTS.findall(block)]


def parse_mark_scheme(md_path: Path) -> dict:
    """
    Parse a mark scheme markdown into a structured dict.
    Returns {exam_series, questions: {qnum: {type, data...}}}
    """
    text = md_path.read_text(encoding="utf-8")

    # Exam series from header
    series_m = _EXAM_SERIES.search(text)
    exam_series = series_m.group(1).strip() if series_m else ""
    # Also from frontmatter
    fm_m = re.search(r"examSeries:\s*(.+)$", text, re.MULTILINE)
    if fm_m and not exam_series:
        exam_series = fm_m.group(1).strip()

    # Split by question headers
    splits = list(_Q_HEADER.finditer(text))
    if not splits:
        return {"exam_series": exam_series, "questions": {}}

    questions = {}
    for i, m in enumerate(splits):
        qnum = m.group(1)          # e.g. "Q1.1"
        start = m.end()
        end = splits[i + 1].start() if i + 1 < len(splits) else len(text)
        block = _clean(text[start:end])

        # Determine sub-question number
        sub = int(qnum.split(".")[1])

        if sub == 1:
            # MCQ
            ans_m = _ANSWER_LINE.search(block)
            questions[qnum] = {
                "type": "mcq",
                "question": _extract_question_text(block),
                "answer_letter": ans_m.group(1) if ans_m else "A",
                "answer_text": ans_m.group(2).strip() if ans_m else "",
                "options": _mcq_options(block),
            }

        elif sub == 2:
            bullets = _bullets(block, max_n=4)
            questions[qnum] = {
                "type": "give_two",
                "question": _extract_question_text(block),
                "points": bullets,
            }

        elif sub == 3:
            bullets = _bullets(block, max_n=4)
            questions[qnum] = {
                "type": "explain_two",
                "question": _extract_question_text(block),
                "points": bullets,
            }

        elif sub == 4:
            bullets = _bullets(block, max_n=4)
            scripture = _first_scripture(block)
            questions[qnum] = {
                "type": "explain_scripture",
                "question": _extract_question_text(block),
                "points": bullets,
                "scripture": scripture,
            }

        elif sub == 5:
            for_args, against_args, statement = _parse_evaluate(block)
            questions[qnum] = {
                "type": "evaluate",
                "statement": statement,
                "for": for_args,
                "against": against_args,
            }

        else:
            questions[qnum] = {"type": "unknown", "raw": block[:200]}

    return {"exam_series": exam_series, "questions": questions}


def _extract_question_text(block: str) -> str:
    """Extract the question text (first non-empty lines before any bullets/targets)."""
    lines = []
    for line in block.splitlines():
        stripped = line.strip()
        if not stripped:
            if lines:
                break
            continue
        if stripped.startswith("•") or stripped.startswith("Students may") or \
           stripped.startswith("A ") and len(stripped) < 50 and stripped[0] in "ABCD":
            break
        lines.append(stripped)
    return " ".join(lines[:4]).strip()


def _parse_evaluate(block: str) -> tuple[list[str], list[str], str]:
    """Return (for_args, against_args, statement) from a Q*.5 evaluate block."""
    # Find the statement
    statement = ""
    for line in block.splitlines():
        stripped = line.strip()
        if stripped.startswith("'") or stripped.startswith("‘") or \
           stripped.startswith("“") or stripped.startswith('"'):
            candidate = stripped.strip("'‘’“”\"")
            if len(candidate) > 20:
                statement = stripped
                break

    for_start = _ARGS_FOR.search(block)
    against_start = _ARGS_AGAINST.search(block)

    if for_start and against_start:
        for_block    = block[for_start.end():against_start.start()]
        against_block = block[against_start.end():]
    elif for_start:
        for_block = block[for_start.end():]
        against_block = ""
    else:
        for_block = block
        against_block = ""

    for_args     = _bullets(for_block, max_n=3)
    against_args = _bullets(against_block, max_n=3)
    return for_args, against_args, statement


# ─── Pack item builders ───────────────────────────────────────────────────────

LEVEL = "GCSE Year 10-11"


def _vocab(iid, src, tgt, topic, tags, ex=""):
    d = {"partOfSpeech": "keyword", "sourceWord": src, "targetWord": tgt}
    if ex:
        d["examples"] = {"en-GB": ex}
    return {"id": iid, "type": "vocab", "level": LEVEL,
            "topics": [topic], "tags": tags, "data": d}


def _sb(iid, prompt, answer, topic, tags):
    return {"id": iid, "type": "sentenceBuilder", "level": LEVEL,
            "topics": [topic], "tags": tags + ["sentence-builder"],
            "data": {"cardType": "model_answer", "prompt": prompt,
                     "answer": answer, "tiles": answer.split()}}


def _arg(iid, side, claim, detail, topic, tags):
    pfx = "FOR" if side == "for" else "AGAINST"
    return _vocab(iid, f"{pfx}: {claim}", detail, topic, tags + ["evaluate", "12-mark"])


def _psg(iid, title, text, topic, tags, qs):
    return {"id": iid, "type": "passage", "level": LEVEL, "topics": [topic],
            "tags": tags + ["reading"],
            "data": {"title": title, "sourceTitle": title,
                     "sourcePassage": text, "targetPassage": text,
                     "speechLanguage": "en-GB", "questions": qs}}


def _pq(iid, q, opts, ci):
    return {"id": iid, "questionType": "multiple_choice", "difficulty": "medium",
            "question": q, "options": opts, "correctOptionIndex": ci}


def _truncate(s: str, n: int = 90) -> str:
    return s[:n].rstrip() + ("…" if len(s) > n else "")


def questions_to_items(questions: dict, religion: str, pack_slug: str,
                        exam_series: str, tags: list[str]) -> list[dict]:
    """Convert parsed questions dict into Learning Web pack items."""
    items = []
    topic_beliefs   = f"{religion}: Beliefs"
    topic_practices = f"{religion}: Practices"
    topic_eval      = f"{religion}: Evaluate"

    def topic(qnum: str) -> str:
        section = int(qnum[1])     # Q1.x or Q2.x
        return topic_practices if section == 2 else topic_beliefs

    all_qnums = sorted(questions.keys(),
                       key=lambda q: (int(q[1]), int(q.split(".")[1])))

    # Track which sentence-builder items we create
    sb_items = []
    arg_items = []
    q1_5_statement = ""
    q2_5_statement = ""

    for qnum in all_qnums:
        q = questions[qnum]
        qtype = q.get("type", "unknown")
        tp = topic(qnum)
        base = f"{pack_slug}_{qnum.replace('.', '_').lower()}"

        if qtype == "mcq":
            answer_text = q.get("answer_text", "")
            if not answer_text:
                continue
            opts = q.get("options", [])
            distractors = [o for o in opts if o != answer_text]
            ex = f"AQA {exam_series} {qnum} (1 mark) — Answer: {q['answer_letter']} {answer_text}"
            if distractors:
                ex += f" | Distractors: {'; '.join(distractors[:3])}"
            items.append(_vocab(f"{base}_mcq",
                                f"MCQ: {_truncate(q['question'], 80)}",
                                f"{answer_text} — {_truncate(q['question'], 60)}",
                                tp, tags, ex))

        elif qtype in ("give_two", "explain_two", "explain_scripture"):
            pts = q.get("points", [])
            q_text = q.get("question", "")
            for i, pt in enumerate(pts[:2], 1):
                items.append(_vocab(f"{base}_pt{i}",
                                    f"{_truncate(q_text, 60)} ({i})",
                                    pt,
                                    tp, tags,
                                    f"AQA {exam_series} {qnum}"))
                # First point → sentence builder
                if i == 1 and len(pt.split()) >= 6:
                    # Create a simpler 6-8 word version for tiles
                    short = " ".join(pt.split()[:8]) + "."
                    sb_items.append(_sb(f"{base}_sb",
                                        f"Build a key point: {_truncate(q_text, 50)}",
                                        short, tp, tags))

            if qtype == "explain_scripture":
                scripture = q.get("scripture", "")
                if scripture:
                    items.append(_vocab(f"{base}_scripture",
                                        f"Scripture reference: {_truncate(q_text, 50)}",
                                        scripture, tp, tags,
                                        f"AQA {exam_series} {qnum} — source of authority"))

        elif qtype == "evaluate":
            stmt = q.get("statement", "")
            if "1" in qnum:
                q1_5_statement = stmt
            else:
                q2_5_statement = stmt

            for i, pt in enumerate(q.get("for", [])[:2], 1):
                # Use first sentence as claim, rest as detail
                sentences = [s.strip() for s in pt.split("/") if s.strip()]
                claim = sentences[0][:60] if sentences else pt[:60]
                detail = pt
                arg_items.append(_arg(f"{base}_for{i}", "for", claim, detail, tp, tags))

            for i, pt in enumerate(q.get("against", [])[:2], 1):
                sentences = [s.strip() for s in pt.split("/") if s.strip()]
                claim = sentences[0][:60] if sentences else pt[:60]
                detail = pt
                arg_items.append(_arg(f"{base}_against{i}", "against", claim, detail, tp, tags))

    # Add sentence builder items (up to 3)
    items.extend(sb_items[:3])

    # Add argument items
    items.extend(arg_items)

    # Generate a passage from the religion + year context
    stmt = q1_5_statement or q2_5_statement or ""
    passage_text = _generate_passage(religion, exam_series, stmt)
    items.append(_psg(f"{pack_slug}_passage",
                      f"{religion} — {exam_series} Overview",
                      passage_text,
                      topic_beliefs, tags,
                      _passage_questions(pack_slug, religion, questions)))

    return items


def _generate_passage(religion: str, exam_series: str, eval_stmt: str) -> str:
    """Generate a contextual passage paragraph for the reading section."""
    stmt_part = ""
    if eval_stmt:
        clean = eval_stmt.strip("'‘’“”\"")
        stmt_part = (f" One of the key evaluative questions for {exam_series} asks "
                     f"students to consider: {eval_stmt}. This requires understanding "
                     f"arguments on both sides before reaching a justified conclusion.")

    return (
        f"This pack covers the AQA GCSE Religious Studies examination for {religion}, "
        f"sitting: {exam_series}. The paper is divided into two sections: Beliefs and Practices. "
        f"In the Beliefs section, students are expected to demonstrate knowledge of core "
        f"{religion} teachings, explain how those beliefs influence followers today, and "
        f"evaluate significant statements using religious evidence. "
        f"In the Practices section, students explore how {religion} is lived out in worship, "
        f"festivals, community life, and ethical action. "
        f"Each section follows the same five-question structure: a 1-mark multiple choice "
        f"question, a 2-mark 'give two' question, a 4-mark 'explain two' question, a 5-mark "
        f"'explain and refer to scripture' question, and a 12-mark evaluate question worth "
        f"additional SPaG marks.{stmt_part} "
        f"Students should practise writing well-structured answers that include specific "
        f"religious teachings, use accurate terminology, and demonstrate understanding of "
        f"how beliefs shape the lives of believers today."
    )


def _passage_questions(pack_slug: str, religion: str, questions: dict) -> list[dict]:
    """Generate 3 comprehension MCQs from the parsed questions."""
    qs = []
    # Q1: about the paper structure
    qs.append(_pq(f"{pack_slug}_pq1",
                  "How many marks is the evaluate (Q*.5) question worth?",
                  ["4 marks", "5 marks", "10 marks", "12 marks"], 3))

    # Q2: about beliefs vs practices
    qs.append(_pq(f"{pack_slug}_pq2",
                  f"Which section of the {religion} paper covers festivals and worship?",
                  ["Beliefs", "Practices", "Evaluate", "Ethics"], 1))

    # Q3: from the actual MCQ if we have one
    q1_1 = questions.get("Q1.1") or questions.get("Q2.1")
    if q1_1 and q1_1.get("answer_text") and q1_1.get("options"):
        opts = q1_1["options"]
        answer = q1_1["answer_text"]
        correct_idx = opts.index(answer) if answer in opts else 0
        qs.append(_pq(f"{pack_slug}_pq3",
                      _truncate(q1_1.get("question", "Select the correct answer"), 80),
                      opts[:4] if len(opts) >= 4 else opts + ["Other"] * (4 - len(opts)),
                      correct_idx))
    else:
        qs.append(_pq(f"{pack_slug}_pq3",
                      "How many questions are in each section of the paper?",
                      ["3", "4", "5", "6"], 2))

    return qs


# ─── Manifest helpers ─────────────────────────────────────────────────────────

def make_entry(pack_id: str, display_name: str, unified_path: str,
               items: list[dict], exam_series: str, paper: str) -> dict:
    has_p = any(i["type"] == "passage" for i in items)
    caps  = ["revision"] + (["passages"] if has_p else [])
    wc    = sum(1 for i in items if i["type"] == "vocab")
    return {
        "id": pack_id,
        "subject": "religion",
        "curriculum": "gcse",
        "displayName": display_name,
        "topic": pack_id,
        "sourceLanguageCode": "en-GB",
        "targetLanguageCode": "en-GB",
        "sourceLanguageLabel": "English",
        "targetLanguageLabel": "English",
        "speechLanguage": "en-GB",
        "stageOptions": [],
        "unifiedPath": unified_path,
        "wordCount": wc,
        "sentenceCount": sum(1 for i in items if i["type"] == "sentenceBuilder"),
        "supportsSentences": any(i["type"] == "sentenceBuilder" for i in items),
        "capabilities": caps,
        "examSeries": exam_series,
        "paper": paper,
    }


# ─── Main pipeline ────────────────────────────────────────────────────────────

# Pack IDs already generated by the hardcoded scripts — skip these
SKIP_PACK_PREFIXES = {
    "gcse_rs_2024_christianity",
    "gcse_rs_2024_islam",
    "gcse_rs_2024_thematic_paper2a",
    "gcse_rs_2024_buddhism",
    "gcse_rs_2024_hinduism",
    "gcse_rs_2024_judaism",
    "gcse_rs_2024_sikhism",
    "gcse_rs_2024_islam_beliefs_practices",
    "gcse_rs_2024_catholic_christianity",
    "gcse_rs_2024_sa_buddhism",
    "gcse_rs_2024_sa_judaism",
    "gcse_rs_2024_p2b_textual",
    "gcse_rs_2024_p2x_islam",
    "gcse_rs_2024_p2y_judaism",
}


def process_all(markdown_root: Path, lw: Path, dry_run: bool = False,
                year_filter: str = "") -> None:
    manifest_path = lw / "data" / "generated" / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    existing_ids = {p["id"] for p in manifest.get("packs", [])}

    added = 0
    skipped = 0
    errors = []

    # Iterate over year dirs then paper dirs
    for year_dir in sorted(markdown_root.iterdir()):
        if not year_dir.is_dir():
            continue
        if year_filter and year_filter not in year_dir.name:
            continue

        year_name = year_dir.name   # e.g. "june-2024"

        for paper_dir in sorted(year_dir.iterdir()):
            if not paper_dir.is_dir():
                continue

            ms_path = paper_dir / "mark-scheme.md"
            if not ms_path.exists():
                continue

            religion_label = detect_religion_label(paper_dir.name)
            year_slug  = year_name.replace("-", "_")
            paper_slug = paper_to_id_slug(paper_dir.name)
            pack_id    = f"gcse_rs_{year_slug}_{paper_slug}"

            # Skip packs already generated by hardcoded scripts
            if pack_id in SKIP_PACK_PREFIXES or pack_id in existing_ids:
                skipped += 1
                continue

            try:
                parsed = parse_mark_scheme(ms_path)
                exam_series = parsed.get("exam_series", year_name.replace("-", " ").title())
                questions   = parsed.get("questions", {})

                if not questions:
                    print(f"  SKIP (no questions parsed): {pack_id}")
                    skipped += 1
                    continue

                tags = ["GCSE", "religion", "AQA", year_slug.replace("_", "-")]
                items = questions_to_items(questions, religion_label, pack_id,
                                           exam_series, tags)

                if not items:
                    print(f"  SKIP (no items): {pack_id}")
                    skipped += 1
                    continue

                display_name = f"AQA GCSE RS {exam_series} — {religion_label}"
                unified_path = f"data/Packs/gcse/religion/{pack_id}/pack_unified.json"
                out_dir  = lw / "data" / "Packs" / "gcse" / "religion" / pack_id
                out_file = out_dir / "pack_unified.json"

                pack_json = {
                    "schemaVersion": "1.1",
                    "packId": pack_id,
                    "subject": "religion",
                    "sourceLanguageCode": "en-GB",
                    "targetLanguageCode": "en-GB",
                    "speechLanguage": "en-GB",
                    "items": items,
                }

                from collections import Counter
                type_counts = dict(Counter(i["type"] for i in items))
                print(f"  {'[DRY]' if dry_run else 'WRITE'} {pack_id}: {type_counts} = {len(items)} items")

                if not dry_run:
                    out_dir.mkdir(parents=True, exist_ok=True)
                    out_file.write_text(
                        json.dumps(pack_json, indent=2, ensure_ascii=False),
                        encoding="utf-8"
                    )
                    entry = make_entry(pack_id, display_name, unified_path,
                                       items, exam_series, paper_dir.name)
                    manifest.setdefault("packs", []).append(entry)
                    existing_ids.add(pack_id)

                added += 1

            except Exception as e:
                print(f"  ERROR {pack_id}: {e}")
                errors.append((pack_id, str(e)))

    if not dry_run and added > 0:
        manifest_path.write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False),
            encoding="utf-8"
        )

    print(f"\n{'DRY RUN — ' if dry_run else ''}Done: {added} packs added, "
          f"{skipped} skipped, {len(errors)} errors.")
    if errors:
        print("Errors:")
        for pid, err in errors:
            print(f"  {pid}: {err}")


def main(argv=None):
    p = argparse.ArgumentParser(description="Parse AQA mark scheme markdown → Learning Web packs")
    p.add_argument("--markdown-root", required=True,
                   help="Path to markdown/aqa/unknown-qualification/")
    p.add_argument("--learning-web-dir", required=True)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--year", default="",
                   help="Filter to one exam year, e.g. 'june-2022'")
    args = p.parse_args(argv)

    process_all(
        markdown_root=Path(args.markdown_root),
        lw=Path(args.learning_web_dir),
        dry_run=args.dry_run,
        year_filter=args.year,
    )


if __name__ == "__main__":
    main()
