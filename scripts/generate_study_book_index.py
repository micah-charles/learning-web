#!/usr/bin/env python3
from __future__ import annotations

import argparse
import html
import json
import re
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import quote


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "data" / "generated" / "manifest.json"
DEFAULT_OUT_DIR = ROOT / "public" / "study-books"
DEFAULT_BASE_URL = "https://www.foxchildidea.com"

SUBJECT_LABELS = {
    "language": "Language",
    "history": "History",
    "geography": "Geography",
    "science": "Science",
    "literature": "Literature",
    "computing": "Computing",
    "religion": "Religion",
    "other": "Other",
}

CURRICULUM_LABELS = {
    "ks3": "KS3",
    "ks3-england": "England KS3",
    "gcse": "GCSE",
    "aqa-gcse-8035": "AQA GCSE Geography 8035",
    "us-middle-school": "US Middle School",
    "other": "Other",
}


@dataclass(frozen=True)
class StudyBook:
    id: str
    title: str
    subject: str
    curriculum: str
    content_path: str
    pack_path: str
    capabilities: tuple[str, ...]
    word_count: int | None
    passage_count: int | None
    extra_files: tuple[dict, ...]
    group: str
    order: int | None
    kind: str
    required: str
    option_group_note: str
    concept_tags: tuple[str, ...]
    coverage_ids: tuple[str, ...]
    related_packs: tuple[dict, ...]


def slug(value: str) -> str:
    text = (value or "other").strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "other"


def url_for(path: str, base_url: str) -> str:
    path = path.replace("\\", "/").lstrip("/")
    encoded = "/".join(quote(part) for part in path.split("/"))
    return f"{base_url.rstrip('/')}/{encoded}"


def rel_url(path: str) -> str:
    path = path.replace("\\", "/").lstrip("/")
    return "/" + "/".join(quote(part) for part in path.split("/"))


def human_label(value: str, labels: dict[str, str]) -> str:
    if value in labels:
        return labels[value]
    return " ".join(part.capitalize() for part in re.split(r"[-_]+", value or "other") if part)


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def iter_manifest_objects(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from iter_manifest_objects(child)
    elif isinstance(value, list):
        for child in value:
            yield from iter_manifest_objects(child)


def collect_study_books(manifest: dict, include_missing: bool = False) -> tuple[list[StudyBook], list[str]]:
    books: list[StudyBook] = []
    skipped: list[str] = []
    seen: set[tuple[str, str]] = set()
    manifest_objects = list(iter_manifest_objects(manifest))
    pack_lookup = {
        entry.get("id"): entry for entry in manifest_objects
        if entry.get("id") and (entry.get("unifiedPath") or entry.get("passagePath"))
    }

    for entry in iter_manifest_objects(manifest):
        content_path = entry.get("contentMdPath")
        extra_files = entry.get("extraMdFiles") or []
        if not content_path and not extra_files:
            continue

        primary_exists = bool(content_path and (ROOT / content_path).exists())
        extra_existing = [
            extra for extra in extra_files
            if isinstance(extra, dict) and extra.get("path") and (ROOT / extra["path"]).exists()
        ]
        if not include_missing and not primary_exists and not extra_existing:
            skipped.append(entry.get("id") or content_path or "<unknown>")
            continue

        key = (entry.get("id") or content_path or "", content_path or "")
        if key in seen:
            continue
        seen.add(key)

        subject = entry.get("subject") or "other"
        curriculum = entry.get("curriculum") or "other"
        title = entry.get("displayName") or entry.get("name") or entry.get("title") or entry.get("id") or content_path
        entry_id = entry.get("id") or slug(title)
        related_packs = []
        for related_id in entry.get("relatedPackIds") or []:
            related = pack_lookup.get(related_id)
            if related:
                pack_path = related.get("unifiedPath") or related.get("passagePath") or ""
                related_packs.append({
                    "id": related_id,
                    "title": related.get("displayName") or related_id,
                    "path": pack_path,
                    "kind": "past-paper" if related_id.startswith("gcse_geo_") else "practice-pack",
                })
        kind = entry.get("studyBookKind") or (
            "past-paper" if subject == "geography" and entry.get("curriculum") == "gcse" and str(entry_id).startswith("gcse_geo_")
            else "study-notes"
        )
        books.append(
            StudyBook(
                id=entry_id,
                title=title,
                subject=subject,
                curriculum=curriculum,
                content_path=content_path or extra_existing[0]["path"],
                pack_path=entry.get("unifiedPath") or entry.get("path") or entry.get("passagePath") or "",
                capabilities=tuple(entry.get("capabilities") or []),
                word_count=entry.get("wordCount"),
                passage_count=entry.get("passageCount"),
                extra_files=tuple(extra_existing if not include_missing else extra_files),
                group=entry.get("group") or "",
                order=entry.get("order") if isinstance(entry.get("order"), int) else None,
                kind=kind,
                required=entry.get("required") or "",
                option_group_note=entry.get("optionGroupNote") or "",
                concept_tags=tuple(entry.get("conceptTags") or []),
                coverage_ids=tuple(entry.get("coverageIds") or []),
                related_packs=tuple(related_packs),
            )
        )

    books.sort(key=lambda b: (b.subject, b.curriculum, b.group.lower(), b.order if b.order is not None else 10000, b.title.lower(), b.id))
    return books, skipped


def book_to_json(book: StudyBook, base_url: str) -> dict:
    result = {
        "id": book.id,
        "title": book.title,
        "subject": book.subject,
        "subjectLabel": human_label(book.subject, SUBJECT_LABELS),
        "curriculum": book.curriculum,
        "curriculumLabel": human_label(book.curriculum, CURRICULUM_LABELS),
        "capabilities": list(book.capabilities),
        "wordCount": book.word_count,
        "passageCount": book.passage_count,
        "studyBookPath": book.content_path,
        "studyBookUrl": url_for(book.content_path, base_url),
        "studyBookRelativeUrl": rel_url(book.content_path),
        "packPath": book.pack_path,
        "packUrl": url_for(book.pack_path, base_url) if book.pack_path else "",
        "packRelativeUrl": rel_url(book.pack_path) if book.pack_path else "",
        "extraFiles": [
            {
                "title": extra.get("title") or Path(extra.get("path", "")).stem,
                "path": extra.get("path", ""),
                "url": url_for(extra.get("path", ""), base_url),
                "relativeUrl": rel_url(extra.get("path", "")),
            }
            for extra in book.extra_files
        ],
    }
    if book.subject == "geography":
        result.update({
            "group": book.group,
            "order": book.order,
            "studyBookKind": book.kind,
            "required": book.required,
            "optionGroupNote": book.option_group_note,
            "conceptTags": list(book.concept_tags),
            "coverageIds": list(book.coverage_ids),
            "relatedPracticePacks": [
                {
                    **related,
                    "url": url_for(related["path"], base_url) if related.get("path") else "",
                    "relativeUrl": rel_url(related["path"]) if related.get("path") else "",
                }
                for related in book.related_packs
            ],
            "articleUrl": url_for(f"revision/studybook/{book.subject}/{slug(book.id)}/", base_url),
        })
    return result


def html_page(title: str, body: str, books: list[StudyBook] | None = None) -> str:
    pack_count = 0
    if books:
        pack_count = len(books)
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html.escape(title)}</title>
  <link rel="stylesheet" href="/revision/revision.css" />
  <style>
    :root {{ color-scheme: light; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }}
    body {{ margin: 0; background: #fbf7ef; color: #2f281f; }}
    main {{ width: min(1080px, calc(100% - 32px)); margin: 0 auto; padding: 32px 0 48px; }}
    header {{ margin-bottom: 24px; }}
    h1 {{ font-size: clamp(1.8rem, 3vw, 2.6rem); margin: 0 0 8px; }}
    h2 {{ margin-top: 28px; border-bottom: 1px solid #e5dccd; padding-bottom: 8px; }}
    p {{ line-height: 1.55; }}
    a {{ color: #146c78; text-decoration-thickness: 0.08em; }}
    .muted {{ color: #766f67; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }}
    .card {{ background: #fffdfa; border: 1px solid #e7dccb; border-radius: 8px; padding: 14px 16px; box-shadow: 0 8px 20px rgba(62, 49, 30, 0.06); }}
    .book-list {{ list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }}
    .book {{ background: #fffdfa; border: 1px solid #e7dccb; border-radius: 8px; padding: 12px 14px; }}
    .meta {{ display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; font-size: 0.86rem; color: #766f67; }}
    .pill {{ border: 1px solid #d8cbb8; border-radius: 999px; padding: 2px 8px; background: #fff7e8; }}
    code {{ background: #f2eadf; padding: 2px 5px; border-radius: 5px; }}
  </style>
</head>
<body>
  <div class="sb-page">
    <header class="sb-page-header">
      <a href="/" class="sb-page-logo">
        <img src="/revision/logo.png" alt="" class="seo-logo-img" />
        FoxChild@Learn
      </a>
      <nav class="sb-page-nav">
        <a href="/">Home</a>
        <a href="/revision/subjects/">Subjects</a>
        <a href="/study-books/">Study Books</a>
      </nav>
    </header>
    <header class="lw-app-header lw-app-header--seo" style="background:radial-gradient(circle at 20% 55%, rgba(255,255,255,0.10), transparent 40%), radial-gradient(circle at 85% 20%, rgba(237,184,50,0.18), transparent 30%), linear-gradient(135deg, rgba(43,126,133,0.85) 0%, rgba(61,158,165,0.80) 45%, rgba(79,179,186,0.74) 100%), url(/revision/hero-bg.jpg) center / cover no-repeat">
      <div class="lw-header-inner">
        <div class="lw-header-mascot">
          <img src="/revision/logo.png" alt="FoxChild Idea - Fox Tutor and Girl Tutor" class="lw-mascot-img" />
          <a class="lw-social-badge" href="https://www.facebook.com/profile.php?id=61589170294693" target="_blank" rel="noopener noreferrer" title="Visit FoxChildIdea on Facebook" aria-label="Visit FoxChildIdea on Facebook">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.887v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
          </a>
        </div>
        <div class="lw-hero-copy">
          <div class="lw-hero-brand-block">
            <p class="lw-hero-eyebrow">POWERED BY FOXCHILD IDEA</p>
            <h1 class="lw-hero-title"><span style="color:#fff">FoxChild</span><span style="color:#e8841a">@Learn</span></h1>
            <p class="lw-hero-sub">Your cosy space for learning, practising, and growing — powered by curiosity and AI.</p>
          </div>
          <div class="lw-hero-right-col">
            <div class="lw-hero-counts">
              <span class="lw-hero-count-badge">📦 {pack_count} packs</span>
            </div>
            <a href="/" class="lw-hero-promo">
              <span class="lw-hero-promo-title">✦ AI Learning Pack Creator</span>
              <span class="lw-hero-promo-sub">Build your own quizzes, readings, and revision packs with AI — then upload the JSON in My Packs.</span>
            </a>
          </div>
        </div>
      </div>
    </header>
    <main class="seo-main">
{body}
    </main>
    <footer class="seo-footer">
      <p>&copy; FoxChild Idea. <a href="/">Return to the interactive Learning Web app</a></p>
    </footer>
  </div>
</body>
</html>
"""


def render_root_index(books: list[StudyBook], base_url: str) -> str:
    by_subject: dict[str, list[StudyBook]] = defaultdict(list)
    for book in books:
        by_subject[book.subject].append(book)

    cards = []
    for subject in sorted(by_subject, key=lambda s: human_label(s, SUBJECT_LABELS)):
        label = human_label(subject, SUBJECT_LABELS)
        subject_slug = slug(subject)
        count = len(by_subject[subject])
        curricula = sorted({b.curriculum for b in by_subject[subject]}, key=lambda c: human_label(c, CURRICULUM_LABELS))
        cards.append(
            f"""<article class="card">
  <h2>{html.escape(label)}</h2>
  <p class="muted">{count} study books across {len(curricula)} curriculum group(s).</p>
  <p><a href="./{subject_slug}/">Open {html.escape(label)} index</a></p>
  <p><a href="./{subject_slug}/index.json">JSON</a> · <a href="./{subject_slug}/all.md">Combined Markdown</a></p>
</article>"""
        )

    body = f"""<header>
  <p class="muted">FoxChild@Learn source index</p>
  <h1>Study Book Index</h1>
  <p>This static index lists every available Study Book source file published by the Learning Web manifest. Use the JSON or Markdown links as source material for AI question generation.</p>
  <p class="muted">Canonical base URL: <code>{html.escape(base_url.rstrip("/"))}</code></p>
  <p><a href="./index.json">Machine-readable JSON</a> · <a href="./all.md">All subjects Markdown index</a></p>
</header>
<section class="grid">
{''.join(cards)}
</section>"""
    return html_page("FoxChild@Learn Study Book Index", body, books)


def render_subject_index(subject: str, books: list[StudyBook]) -> str:
    if subject == "geography":
        return render_geography_index(books)
    label = human_label(subject, SUBJECT_LABELS)
    by_curriculum: dict[str, list[StudyBook]] = defaultdict(list)
    for book in books:
        by_curriculum[book.curriculum].append(book)

    sections = []
    for curriculum in sorted(by_curriculum, key=lambda c: human_label(c, CURRICULUM_LABELS)):
        curriculum_books = sorted(by_curriculum[curriculum], key=lambda b: b.title.lower())
        curriculum_label = human_label(curriculum, CURRICULUM_LABELS)
        items = "\n".join(render_book_item(book) for book in curriculum_books)
        curriculum_slug = slug(curriculum)
        sections.append(
            f"""<section>
  <h2>{html.escape(curriculum_label)}</h2>
  <p><a href="./{curriculum_slug}.json">JSON for {html.escape(curriculum_label)}</a> · <a href="./{curriculum_slug}.md">Combined Markdown for {html.escape(curriculum_label)}</a></p>
  <ul class="book-list">
    {items}
  </ul>
</section>"""
        )

    body = f"""<header>
  <p><a href="../">All Study Books</a></p>
  <p class="muted">FoxChild@Learn source index</p>
  <h1>{html.escape(label)} Study Books</h1>
  <p>{len(books)} available Study Book source file(s).</p>
  <p><a href="./index.json">Subject JSON</a> · <a href="./all.md">Combined subject Markdown</a></p>
</header>
{''.join(sections)}"""
    return html_page(f"FoxChild@Learn {label} Study Books", body, books)


def render_geography_index(books: list[StudyBook]) -> str:
    curriculum_tabs = [
        ("us-middle-school", "US Middle School"),
        ("ks3-england", "England KS3"),
        ("aqa-gcse-8035", "AQA GCSE Geography 8035"),
    ]
    past_papers = [book for book in books if book.kind == "past-paper"]
    guide_panels = []
    tab_buttons = []

    def ordered(items: list[StudyBook]) -> list[StudyBook]:
        return sorted(items, key=lambda book: (book.order if book.order is not None else 10000, book.title.lower()))

    for index, (curriculum, label) in enumerate(curriculum_tabs):
        selected = index == 0
        tab_buttons.append(
            f'<button class="curriculum-tab" id="tab-{curriculum}" role="tab" aria-selected="{"true" if selected else "false"}" aria-controls="panel-{curriculum}" tabindex="{"0" if selected else "-1"}" data-curriculum="{curriculum}">{html.escape(label)} <span class="tab-count">{sum(1 for book in books if book.curriculum == curriculum)}</span></button>'
        )
        items = ordered([book for book in books if book.curriculum == curriculum])
        group_sections = []
        groups: dict[str, list[StudyBook]] = defaultdict(list)
        for book in items:
            groups[book.group or ("Topic guides" if book.kind == "topic-guide" else "Study notes")].append(book)
        for group_name, group_books in groups.items():
            group_sections.append(
                f'<section class="chapter-group"><h3>{html.escape(group_name)}</h3><ol class="book-list">{"".join(render_book_item(book) for book in ordered(group_books))}</ol></section>'
            )
        guide_panels.append(
            f'<div class="curriculum-panel" id="panel-{curriculum}" role="tabpanel" aria-labelledby="tab-{curriculum}" data-testid="panel-{curriculum}" data-curriculum-panel="{curriculum}"{" hidden" if not selected else ""}>{"".join(group_sections)}</div>'
        )

    paper_items = "".join(render_book_item(book) for book in sorted(past_papers, key=lambda book: book.title.lower()))
    body = f"""<header>
  <p><a href="../">All Study Books</a></p>
  <p class="muted">Curriculum topic guides and practice resources</p>
  <h1>Geography Study Books</h1>
  <p>Choose a curriculum to browse its chapter list. Each topic opens as a readable Study Book article; existing revision and past-paper packs remain available as separate practice resources.</p>
  <p class="catalogue-summary">{len(books) - len(past_papers)} topic guides and {len(past_papers)} GCSE past-paper note packs.</p>
</header>
<nav class="curriculum-tabs" role="tablist" aria-label="Geography curriculum" data-testid="geography-curriculum-tabs">{"".join(tab_buttons)}</nav>
<div class="curriculum-panels">{"".join(guide_panels)}</div>
<details class="past-paper-group" data-testid="geography-past-paper-group">
  <summary>GCSE past-paper notes <span class="tab-count">{len(past_papers)}</span></summary>
  <p class="muted">Question-by-question notes from existing exam sittings. These remain separate from the AQA GCSE topic guides above.</p>
  <ol class="book-list">{paper_items}</ol>
</details>
<script>
  (() => {{
    const tabs = Array.from(document.querySelectorAll('[data-curriculum]'));
    const panels = Array.from(document.querySelectorAll('[data-curriculum-panel]'));
    function selectTab(tab, focus = false) {{
      const curriculum = tab.dataset.curriculum;
      tabs.forEach((candidate) => {{
        const selected = candidate === tab;
        candidate.setAttribute('aria-selected', String(selected));
        candidate.tabIndex = selected ? 0 : -1;
      }});
      panels.forEach((panel) => {{ panel.hidden = panel.dataset.curriculumPanel !== curriculum; }});
      if (focus) tab.focus();
    }}
    tabs.forEach((tab, index) => {{
      tab.addEventListener('click', () => selectTab(tab));
      tab.addEventListener('keydown', (event) => {{
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
        selectTab(tabs[next], true);
      }});
    }});
  }})();
</script>
<style>
  .curriculum-tabs {{ display: flex; gap: 8px; overflow-x: auto; padding: 4px 2px 12px; border-bottom: 1px solid #e5dccd; }}
  .curriculum-tab {{ flex: 0 0 auto; border: 1px solid #d8cbb8; border-radius: 999px; padding: 10px 14px; background: #fffdfa; color: #2f281f; font: inherit; cursor: pointer; }}
  .curriculum-tab[aria-selected="true"] {{ background: #146c78; border-color: #146c78; color: white; }}
  .curriculum-tab:focus-visible {{ outline: 3px solid #edb832; outline-offset: 2px; }}
  .tab-count {{ display: inline-block; margin-left: 5px; font-size: .82em; opacity: .8; }}
  .curriculum-panel[hidden] {{ display: none; }}
  .chapter-group h3 {{ margin: 18px 0 10px; }}
  .past-paper-group {{ margin-top: 30px; border: 1px solid #e7dccb; border-radius: 10px; padding: 14px; background: #f7f0e5; }}
  .past-paper-group summary {{ cursor: pointer; font-weight: 700; }}
  @media (max-width: 620px) {{ main {{ width: min(calc(100% - 24px), 1080px); padding-top: 20px; }} .curriculum-tab {{ white-space: nowrap; }} .book {{ padding: 12px; }} }}
</style>"""
    return html_page("FoxChild@Learn Geography Study Books", body, books)


def render_book_item(book: StudyBook) -> str:
    if book.subject != "geography":
        meta = [
            human_label(book.curriculum, CURRICULUM_LABELS),
            f"{book.word_count} words" if book.word_count is not None else "",
            f"{book.passage_count} passages" if book.passage_count is not None else "",
        ]
        meta_html = "".join(f'<span class="pill">{html.escape(value)}</span>' for value in meta if value)
        links = [f'<a href="/{html.escape(book.content_path)}">Study notes</a>']
        if book.pack_path:
            links.append(f'<a href="/{html.escape(book.pack_path)}">Pack JSON</a>')
        return f"""<li class="book">
  <strong>{html.escape(book.title)}</strong>
  <div class="meta">{meta_html}</div>
  <p>{' · '.join(links)}</p>
</li>"""
    meta = [
        human_label(book.curriculum, CURRICULUM_LABELS),
        f"{book.word_count} words" if book.word_count is not None else "",
        f"{book.passage_count} passages" if book.passage_count is not None else "",
    ]
    meta_html = "".join(f'<span class="pill">{html.escape(value)}</span>' for value in meta if value)
    article_href = f"/revision/studybook/{book.subject}/{slug(book.id)}/"
    links = [f'<a href="{html.escape(article_href)}">Open Study Book</a>', f'<a href="/{html.escape(book.content_path)}">Markdown</a>']
    if book.pack_path:
        links.append(f'<a href="/{html.escape(book.pack_path)}">Pack JSON</a>')
    status = ""
    if book.required == "option":
        text = book.option_group_note or "School choice"
        status = f'<span class="pill option-pill">Option · {html.escape(text)}</span>'
    elif book.required == "required":
        status = '<span class="pill">Required</span>'
    related_links = ""
    if book.related_packs:
        related_links = "<p class=\"practice-links\"><strong>Related practice:</strong> " + " · ".join(
            f'<a href="/{html.escape(pack["path"])}">{html.escape(pack["title"])}</a>'
            for pack in book.related_packs
        ) + "</p>"
    related_html = f"  {related_links}\n" if related_links else ""
    return f"""<li class="book">
  <strong>{html.escape(book.title)}</strong>
  <div class="meta">{meta_html}{status}</div>
  <p>{' · '.join(links)}</p>
{related_html}</li>"""


def render_markdown(title: str, books: list[StudyBook], include_content: bool) -> str:
    lines = [
        f"# {title}",
        "",
        "Generated from `data/generated/manifest.json`.",
        "",
    ]
    for book in sorted(books, key=lambda b: (b.curriculum, b.title.lower())):
        lines.extend(
            [
                f"## {book.title}",
                "",
                f"- Pack ID: `{book.id}`",
                f"- Subject: `{book.subject}`",
                f"- Curriculum: `{book.curriculum}`",
                f"- Study notes: `/{book.content_path}`",
            ]
        )
        if book.pack_path:
            lines.append(f"- Pack JSON: `/{book.pack_path}`")
        lines.append("")
        if include_content:
            source_path = ROOT / book.content_path
            if source_path.exists():
                lines.extend(["### Source Content", "", source_path.read_text(encoding="utf-8").strip(), ""])
    return "\n".join(lines).rstrip() + "\n"


def write_json(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_outputs(books: list[StudyBook], out_dir: Path, base_url: str, generated_at: str) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    by_subject: dict[str, list[StudyBook]] = defaultdict(list)
    for book in books:
        by_subject[book.subject].append(book)

    root_json = {
        "generatedAt": generated_at,
        "baseUrl": base_url.rstrip("/"),
        "totalStudyBooks": len(books),
        "subjects": [],
        "studyBooks": [book_to_json(book, base_url) for book in books],
    }

    for subject in sorted(by_subject, key=lambda s: human_label(s, SUBJECT_LABELS)):
        subject_books = by_subject[subject]
        subject_slug = slug(subject)
        subject_dir = out_dir / subject_slug
        subject_dir.mkdir(parents=True, exist_ok=True)
        subject_label = human_label(subject, SUBJECT_LABELS)
        curricula = sorted({b.curriculum for b in subject_books}, key=lambda c: human_label(c, CURRICULUM_LABELS))

        root_json["subjects"].append(
            {
                "id": subject,
                "label": subject_label,
                "count": len(subject_books),
                "url": url_for(f"study-books/{subject_slug}/", base_url),
                "jsonUrl": url_for(f"study-books/{subject_slug}/index.json", base_url),
                "markdownUrl": url_for(f"study-books/{subject_slug}/all.md", base_url),
                "curricula": [
                    {
                        "id": curriculum,
                        "label": human_label(curriculum, CURRICULUM_LABELS),
                        "count": sum(1 for b in subject_books if b.curriculum == curriculum),
                        "jsonUrl": url_for(f"study-books/{subject_slug}/{slug(curriculum)}.json", base_url),
                        "markdownUrl": url_for(f"study-books/{subject_slug}/{slug(curriculum)}.md", base_url),
                    }
                    for curriculum in curricula
                ],
            }
        )

        subject_json = {
            "generatedAt": generated_at,
            "baseUrl": base_url.rstrip("/"),
            "subject": subject,
            "subjectLabel": subject_label,
            "totalStudyBooks": len(subject_books),
            "studyBooks": [book_to_json(book, base_url) for book in subject_books],
        }
        (subject_dir / "index.html").write_text(render_subject_index(subject, subject_books), encoding="utf-8")
        write_json(subject_dir / "index.json", subject_json)
        (subject_dir / "all.md").write_text(render_markdown(f"{subject_label} Study Books", subject_books, True), encoding="utf-8")

        for curriculum in curricula:
            curriculum_books = [b for b in subject_books if b.curriculum == curriculum]
            curriculum_slug = slug(curriculum)
            curriculum_label = human_label(curriculum, CURRICULUM_LABELS)
            curriculum_json = {
                "generatedAt": generated_at,
                "baseUrl": base_url.rstrip("/"),
                "subject": subject,
                "subjectLabel": subject_label,
                "curriculum": curriculum,
                "curriculumLabel": curriculum_label,
                "totalStudyBooks": len(curriculum_books),
                "studyBooks": [book_to_json(book, base_url) for book in curriculum_books],
            }
            write_json(subject_dir / f"{curriculum_slug}.json", curriculum_json)
            (subject_dir / f"{curriculum_slug}.md").write_text(
                render_markdown(f"{curriculum_label} {subject_label} Study Books", curriculum_books, True),
                encoding="utf-8",
            )

    (out_dir / "index.html").write_text(render_root_index(books, base_url), encoding="utf-8")
    write_json(out_dir / "index.json", root_json)
    (out_dir / "all.md").write_text(render_markdown("All Study Books", books, False), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate static Study Book indexes from the Learning Web manifest.")
    parser.add_argument("--manifest", type=Path, default=MANIFEST_PATH, help="Path to data/generated/manifest.json.")
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR, help="Output directory for generated public files.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Canonical public site URL used in generated JSON.")
    parser.add_argument("--include-missing", action="store_true", help="Include manifest entries even if their markdown files are missing locally.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    manifest = read_json(args.manifest)
    books, skipped = collect_study_books(manifest, include_missing=args.include_missing)
    generated_at = manifest.get("generatedAt") or "unknown"
    write_outputs(books, args.out_dir, args.base_url, generated_at)
    print(f"Wrote Study Book index for {len(books)} books to {args.out_dir}")
    if skipped:
        print(f"Skipped {len(skipped)} entries without local Study Book files")


if __name__ == "__main__":
    main()
