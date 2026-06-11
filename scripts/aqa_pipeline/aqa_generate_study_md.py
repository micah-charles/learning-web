#!/usr/bin/env python3
"""
Pipeline step: generate Q&A study markdown from AQA QP/MS OCR output.

Usage:
  python3 -m aqa_pipeline.aqa_generate_study_md \\
    --markdown-root "/path/to/markdown/aqa/unknown-qualification" \\
    --subject history \\
    --learning-web-dir "/path/to/learning-web" \\
    [--dry-run]
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path


SUBJECT_CONFIG = {
    "religion": {
        "curriculum": "gcse",
        "pack_id_prefix": "gcse_rs_",
        "display_name_template": "{topic} ({series})",
        "series_folder_map": {
            "june-2022": "June 2022",
            "june-2023": "June 2023",
            "june-2024": "June 2024",
            "november-2020": "November 2020",
            "november-2021": "November 2021",
        },
        "question_format": "rs",
    },
    "history": {
        "curriculum": "gcse",
        "pack_id_prefix": "gcse_hist_",
        "display_name_template": "{topic} ({series})",
        "series_folder_map": {
            "june-2022": "June 2022",
            "june-2023": "June 2023",
            "june-2024": "June 2024",
            "november-2020": "November 2020",
            "november-2021": "November 2021",
        },
        "question_format": "flat",
    },
}


def strip_frontmatter(text):
    return re.sub(r'^---.*?---\s*', '', text, flags=re.DOTALL)


def parse_qp_rs(text):
    questions = {}
    text = strip_frontmatter(text)
    pattern = re.compile(r'^###\s*(Q\d+\.\d+)\s*$', re.MULTILINE)
    matches = list(pattern.finditer(text))
    for i, match in enumerate(matches):
        q_id = match.group(1)
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        raw = text[start:end].strip()
        q_text = re.sub(r'\*\*\[.*?\]\*\*', '', raw).strip()
        questions[q_id] = q_text
    return questions


def parse_qp_flat(text):
    questions = {}
    text = strip_frontmatter(text)
    pattern = re.compile(r'^Q(\d+)\s', re.MULTILINE)
    matches = list(pattern.finditer(text))
    for i, match in enumerate(matches):
        q_num = int(match.group(1))
        q_id = f"Q{q_num}"
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        raw = text[start:end].strip()
        q_text = re.sub(r'\*\*\[.*?\]\*\*', '', raw).strip()
        if q_text.startswith(f'Q{q_num} '):
            q_text = q_text[len(f'Q{q_num} '):]
        lines = q_text.split('\n')
        clean_lines = []
        for line in lines:
            s = line.strip()
            if not s:
                continue
            if re.match(r'(Extra space|Question \.|number \.|For confidentiality|AQA will be happy|Copyright ©|Copyright information|\[\d+g\d+/\S+\]|\d+g\d+/\S+|End of questions|END OF QUESTIONS|\[Turn over\]|Turn over|Do not write outside|each live examination)', s):
                continue
            clean_lines.append(line)
        questions[q_id] = '\n'.join(clean_lines)
    return questions


RUBRIC_KEYWORDS = [
    'The indicative content is designed to exemplify',
    'All historically relevant and valid answers should be credited',
    'Target Analyse',
    'Target Demonstrate',
    'Target Explain',
    'Target: ',
    'Level ',
    'Extends Level',
    'Students may progress from',
    'Students either submit no evidence',
    'Students demonstrate',
    'Students are likely to',
    'Students identify',
    'Students may include',
    'Students recognise and provide',
    '1 mark for each',
    'If students provide more',
    'First way',
    'First belief',
    'First contrasting way',
    'Second way',
    'Second belief',
    'Second contrasting way',
    'Simple explanation',
    'Detailed explanation',
    'To be a .detailed explanation.',
    'Contrasting may mean',
    'If similar beliefs',
    'Put a tick',
    'Tick one box',
    'Extra space',
    'Question .',
    'number .',
    'Copyright information',
    'For confidentiality purposes',
    'AQA will be happy',
    'Copyright ©',
    'MARK SCHEME',
    '[Turn over]',
    'Turn over for',
    'Do not write outside the box',
    'End of questions',
    'END OF QUESTIONS',
    'Level Criteria Marks',
    'A well-argued response',
    'Reasoned consideration',
    'Logical chains of reasoning',
    'Recognition of different',
    'Point of view with reason',
    'Nothing worthy of credit',
    'Maximum of Level',
    'Examiners are reminded',
    'When establishing a mark',
    'Answers may assert',
    'There may be undeveloped',
    'In addition to a Level',
    'Answer demonstrates',
    'answers show understanding',
    'support for one',
    'both interpretation',
    'case is made by assertion',
    'recognition of agreement',
    'AO1:',
    'AO2:',
    'AO4',
    'AO1a', 'AO2a',
    'AO3a', 'AO3b',
    'AO4a', 'AO4b', 'AO4c', 'AO4d', 'AO4e', 'AO4f',
    'Reference to religion',
    'exemplar answer',
    'should be credited',
    'credited:',
    'their content',
    'reasoning to explain',
    'supported by factual',
    'extended reasoning',
    'contextual knowledge',
    'relevant to the question',
    'based on their',
    'identify relevant',
    'features in each',
    'mark for each',
    'More than two',
    'Demonstrate',
    'Evaluate',
    'considering two or more',
    'and when deciding',
    'and arriving at a sustained',
    'knowledge and understanding of the key',
    'Available for free',
    'download from www',
    'web address',
    'evidence of judgement',
    'generic',
    '© AQA',
    'levels of response',
    'weak performance',
    'rewarded for weak',
    'their time of writing',
    'the ways in which',
    'explanation of the complexities',
    'establishing a mark',
    'strong performance in',
    'one mark should be',
    'knowledge and understanding',
    'Answer is presented',
    'sharply-focused coherence',
    'coherence and logical structure;',
    'Answer may suggest',
    'Answers arguing',
    'structured, substantiated',
    'with some substantiation',
    'Students may offer',
    'Spelling, punctuation and grammar',
    'Performance descriptor',
    'spell and punctuate',
    'Learners use rules of grammar',
    'No marks',
    'Question Q',
    'showing a simple understanding',
    'demonstrates specific',
    'a well-substantiated',
    'for a full description',
    'answer requires',
    'features of each',
    'explanation of another view',
    'Learners use a',
    'any errors do not significantly hinder',
    'awarded • The learner',
    'levels of response marking',
    'Example response 1',
    'Example response 2',
    'Example response 3',
    'This indicates',
]


def is_rubric_line(line):
    stripped = line.strip()
    if not stripped:
        return False
    for kw in RUBRIC_KEYWORDS:
        if kw in stripped:
            return True
    return False


def extract_section(text, q_id):
    if '.' in q_id:
        pattern = re.compile(rf'^###\s*{re.escape(q_id)}\s*$', re.MULTILINE)
    else:
        q_num = q_id.replace('Q', '')
        pattern = re.compile(rf'^Q{re.escape(q_num)}\s', re.MULTILINE)
    match = pattern.search(text)
    if not match:
        return None
    start = match.start()
    if '.' in q_id:
        next_pattern = re.compile(r'^###\s*Q\d+\.\d+\s*$', re.MULTILINE)
    else:
        next_pattern = re.compile(r'^Q\d+\s', re.MULTILINE)
    next_match = next_pattern.search(text, start + len(match.group()))
    end = next_match.start() if next_match else len(text)
    return text[start:end]


def extract_ms_answers_rs(text, questions):
    text = strip_frontmatter(text)
    answers = {}
    for q_id in questions:
        section = extract_section(text, q_id)
        if not section:
            answers[q_id] = ''
            continue
        lines = section.split('\n')
        kept = []
        capture = False
        for line in lines:
            stripped = line.strip()
            if not stripped:
                if capture:
                    kept.append('')
                continue
            if stripped.startswith('Answer:'):
                kept.append(stripped)
                capture = True
                continue
            if is_rubric_line(stripped):
                capture = True
                continue
            if capture:
                kept.append(stripped)
        answers[q_id] = '\n'.join(kept).strip()
    return answers


def extract_ms_answers_flat(text, questions):
    text = strip_frontmatter(text)
    answers = {}
    for q_id in questions:
        section = extract_section(text, q_id)
        if not section:
            answers[q_id] = ''
            continue
        q_num = q_id.replace('Q', '')
        lines = section.split('\n')
        kept = []
        past_question = False
        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            if not past_question:
                if re.match(rf'^Q{q_num}\s', stripped):
                    continue
                if re.match(r'^\[.*?marks\]', stripped) or re.match(r'^\*\*\[.*?\].*?\*\*$', stripped):
                    continue
                if re.match(r'^The indicative content', stripped):
                    past_question = True
                    continue
                if re.match(r'^All historically relevant', stripped):
                    past_question = True
                    continue
                continue
            if is_rubric_line(stripped):
                continue
            if re.match(r'^Q\d+\s', stripped):
                break
            if re.match(r'^\[.*?marks\]', stripped):
                continue
            kept.append(stripped)
        answers[q_id] = '\n'.join(kept).strip()
    return answers


ANSWER_NOISE_KEYWORDS = [
    'content', 'knowledge/understanding',
    'relevant to the question', 'might be related', 'this level is likely',
    'Students recognise and provide', 'reasons for differences',
    'reasoning to explain', 'reasoning and supporting',
    'evaluation, supported',
    'features in each', 'identify relevant', 'based on their',
    'supported by factual', 'extended reasoning', 'contextual knowledge',
    'periods studied',
    'Demonstrate',
    'Evaluate interpretations',
    'and when deciding on a level',
    'considering two or more',
    'and arriving at a sustained judgement',
    'AO1a', 'AO1b', 'AO1c', 'AO2a', 'AO2b', 'AO2c',
    'AO3', 'AO4a', 'AO4b', 'AO4c', 'AO4d',
    'understanding related to',
    'interpretation(s). Related',
    'knowledge and understanding',
    'time, group, social',
    'or economic impact',
    'supported by knowledge and',
    'circumstances, and access',
    'circumstances, access',
    'provenance, context',
    'the ways in which events were problematic',
    'description of the changes',
    'nature of the relationship',
    'sequence of events',
    'demonstrate relevant knowledge',
    'Answer demonstrates',
    'issues identified',
    'events identified',
    'learners spell and punctuate',
    'rules of grammar',
    'range of specialist terms',
    'performance level',
    'severely hinder meaning',
]


def clean_answer_line(line):
    stripped = line.strip()
    if not stripped:
        return False
    if re.match(r'^\d+g\d+/', stripped):
        return False
    if len(stripped.split()) <= 2:
        if not stripped.startswith('For example') and not stripped.startswith('•'):
            return False
    if stripped.startswith('•') and len(stripped.split()) < 8:
        text_after_bullet = stripped.lstrip('• ').lstrip()
        if text_after_bullet and text_after_bullet[0].islower():
            return False
    for kw in ANSWER_NOISE_KEYWORDS:
        if kw in stripped:
            return False
    return True


def format_answer_text(text):
    if not text:
        return text
    lines = text.split('\n')
    formatted = []
    for line in lines:
        stripped = line.strip()
        if not clean_answer_line(stripped):
            continue
        if stripped.startswith('Answer:'):
            formatted.append(stripped)
        elif stripped.startswith('For example,'):
            formatted.append(stripped)
        elif stripped.startswith('•'):
            if clean_answer_line(stripped):
                formatted.append(stripped)
            continue
        elif stripped.startswith('Arguments in support'):
            formatted.append('')
            formatted.append(f'**{stripped}**')
            formatted.append('')
        elif stripped.startswith('Sources of authority'):
            formatted.append('')
            formatted.append(f'> **{stripped}**')
            formatted.append('')
        else:
            if stripped[0].isupper() and ' and/or ' in stripped:
                lines_list = re.split(r'\s*/\s*', stripped)
                if len(lines_list) > 1 and all(len(l) > 5 for l in lines_list):
                    for item in lines_list:
                        item = item.strip()
                        if item and not item.endswith('.') and not item.endswith(','):
                            item = item + '.'
                        formatted.append(f'• {item}')
                    continue
            formatted.append(stripped)
    return '\n'.join(formatted)


def slugify(text):
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')


def get_topic_from_paper_name(paper_dir_name):
    name = paper_dir_name
    for prefix in [
        'paper-1-section-a-option-', 'paper-1-section-b-option-',
        'paper-2-section-a-option-', 'paper-2-section-b-option-',
        'paper-1-option-', 'paper-2-option-',
        'paper-2a-section-b-', 'paper-2b-section-b-', 'paper-2y-section-a-',
        'paper-1-section-a-', 'paper-1-section-b-',
        'paper-2a-', 'paper-2b-', 'paper-2y-',
        'paper-1-', 'paper-2-',
    ]:
        if name.startswith(prefix):
            name = name[len(prefix):]
            break
    name = name.replace('-', ' ').title()
    name = re.sub(r'\s+', ' ', name).strip()
    return name


def generate_study_md(qp_questions, ms_answers, paper_title, series_label):
    lines = []
    lines.append(f"# {paper_title}")
    lines.append(f"")
    lines.append(f"*{series_label}*")
    lines.append("")
    for q_id in sorted(qp_questions.keys()):
        q_text = qp_questions[q_id]
        q_title = q_text.split('\n')[0] if q_text else ''
        lines.append(f"## {q_id}: {q_title}")
        lines.append("")
        rest = '\n'.join(q_text.split('\n')[1:]) if '\n' in q_text else ''
        if rest:
            rest_clean = rest.strip()
            if rest_clean:
                lines.append(rest_clean)
                lines.append("")
        answer = ms_answers.get(q_id, '')
        if answer:
            lines.append("**Answer:**")
            lines.append("")
            formatted = format_answer_text(answer)
            lines.append(formatted)
            lines.append("")
        else:
            lines.append("*No answer found in mark scheme.*")
            lines.append("")
        lines.append("---")
        lines.append("")
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description='Generate Q&A study markdown from AQA QP/MS OCR output')
    parser.add_argument('--markdown-root', required=True, help='Root directory of OCR markdown files')
    parser.add_argument('--subject', required=True, choices=['religion', 'history'], help='Subject to process')
    parser.add_argument('--learning-web-dir', default='/Users/charlestan/learning-web', help='Learning web project root')
    parser.add_argument('--dry-run', action='store_true', help='Preview changes without writing files')
    args = parser.parse_args()

    config = SUBJECT_CONFIG[args.subject]
    markdown_root = Path(args.markdown_root)
    learning_web_dir = Path(args.learning_web_dir)

    out_dir = learning_web_dir / 'data' / 'Packs' / config['curriculum'] / args.subject
    out_dir.mkdir(parents=True, exist_ok=True)

    all_new_entries = []
    total_files = 0

    for series_folder, series_label in config['series_folder_map'].items():
        series_path = markdown_root / series_folder
        if not series_path.exists():
            print(f"Warning: Series folder not found: {series_path}")
            continue

        print(f"\nSeries: {series_label} ({series_folder})")

        for paper_dir in sorted(series_path.iterdir()):
            if not paper_dir.is_dir():
                continue

            qp_path = paper_dir / 'question-paper.md'
            ms_path = paper_dir / 'mark-scheme.md'
            if not qp_path.exists() or not ms_path.exists():
                print(f"  Skipping {paper_dir.name}: missing QP or MS")
                continue

            qp_text = qp_path.read_text(encoding='utf-8')
            ms_text = ms_path.read_text(encoding='utf-8')

            series_from_ms = re.search(r'examSeries:\s*(.*)', ms_text)
            actual_series = series_from_ms.group(1).strip() if series_from_ms else series_label

            if config['question_format'] == 'rs':
                qp_questions = parse_qp_rs(qp_text)
                ms_answers = extract_ms_answers_rs(ms_text, qp_questions)
            else:
                qp_questions = parse_qp_flat(qp_text)
                ms_answers = extract_ms_answers_flat(ms_text, qp_questions)

            if not qp_questions:
                print(f"  Warning: No questions found in {qp_path.name}")
                continue

            paper_title_match = re.search(r'paperTitle:\s*(.*)', qp_text)
            paper_title = paper_title_match.group(1).strip() if paper_title_match else get_topic_from_paper_name(paper_dir.name)
            topic_name = get_topic_from_paper_name(paper_dir.name)
            topic_slug = slugify(topic_name)

            md_content = generate_study_md(qp_questions, ms_answers, paper_title, actual_series)

            out_filename = f"{config['pack_id_prefix']}{topic_slug}_{series_folder.replace('-', '_')}.md"
            out_path = out_dir / out_filename

            if args.dry_run:
                print(f"  [dry-run] Would create: {out_path.relative_to(learning_web_dir)}")
                print(f"            Paper: {paper_title}")
                print(f"            Questions: {len(qp_questions)}")
            else:
                out_path.write_text(md_content, encoding='utf-8')
                print(f"  Created: {out_path.relative_to(learning_web_dir)} ({len(qp_questions)} questions)")

            total_files += 1

            pack_id = f"{config['pack_id_prefix']}{topic_slug}_{series_folder.replace('-', '_')}"
            display_name = config['display_name_template'].format(topic=topic_name, series=actual_series)

            entry = {
                "id": pack_id,
                "displayName": display_name,
                "subject": args.subject,
                "curriculum": config['curriculum'],
                "topic": topic_name,
                "sourceLanguageCode": "en-GB",
                "targetLanguageCode": "en-GB",
                "speechLanguage": "en-GB",
                "capabilities": ["revision"],
                "contentMdPath": f"data/Packs/{config['curriculum']}/{args.subject}/{out_filename}",
            }
            all_new_entries.append(entry)

    manifest_path = learning_web_dir / 'data' / 'generated' / 'manifest.json'
    with open(manifest_path, encoding='utf-8') as f:
        manifest = json.load(f)

    existing_ids = {p['id'] for p in manifest.get('revisionPacks', [])}
    added = 0
    for entry in all_new_entries:
        if entry['id'] not in existing_ids:
            if args.dry_run:
                print(f"  [manifest] + {entry['id']}")
            else:
                manifest['revisionPacks'].append(entry)
            existing_ids.add(entry['id'])
            added += 1

    if not args.dry_run:
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"\n{'[DRY-RUN] ' if args.dry_run else ''}Summary:")
    print(f"  Files generated: {total_files}")
    print(f"  New manifest entries: {added}")
    if not args.dry_run:
        print(f"  Output directory: {out_dir}")
        print(f"  Manifest: {manifest_path}")


if __name__ == '__main__':
    main()
