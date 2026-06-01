"""
aqa_collect_listing.py — Stage 1 of the AQA past-paper pipeline.

Collects metadata and download links from the AQA past-paper finder page.
Does NOT download any PDFs.

Usage:
    PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_collect_listing \
        --url "https://www.aqa.org.uk/find-past-papers-and-mark-schemes?..." \
        --output-prefix "output/aqa_rs_all"

    PYTHONPATH=scripts python3 -m aqa_pipeline.aqa_collect_listing \
        --subject "Religious Studies" \
        --qualification "GCSE Religious Studies" \
        --output-prefix "output/aqa_rs_all"
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
import time
import urllib.parse
from pathlib import Path

from playwright.sync_api import sync_playwright, Page, TimeoutError as PWTimeout

from .aqa_common import (
    build_component_key,
    detect_additional_material,
    detect_exam_series,
    detect_modified_type,
    detect_resource_type,
    normalise_title,
    now_iso,
    parse_published_date,
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
# AQA URL builder
# ---------------------------------------------------------------------------

AQA_BASE = "https://www.aqa.org.uk/find-past-papers-and-mark-schemes"

DEFAULT_RESOURCE_TYPES = "Question papers,Mark schemes,Examiner reports"


def build_aqa_url(
    subject: str,
    qualification: str,
    spec_code: str = "All Specifications",
    exam_series: str = "",
    resource_types: str = DEFAULT_RESOURCE_TYPES,
) -> str:
    """Build an AQA past-paper finder URL from filter parameters."""
    rt_encoded = ";".join(r.strip() for r in resource_types.split(","))
    collapse = "subject,qualification,specCode,examSeries"

    params: dict[str, str] = {
        "subject": subject,
        "qualification": qualification,
        "specCode": spec_code,
        "collapse": collapse,
        "secondaryResourceType": rt_encoded,
    }
    if exam_series:
        params["examSeries"] = exam_series

    return AQA_BASE + "?" + urllib.parse.urlencode(params, quote_via=urllib.parse.quote)


# ---------------------------------------------------------------------------
# Playwright scraper
# ---------------------------------------------------------------------------

AQA_ORIGIN = "https://www.aqa.org.uk"


def _wait_for_results(page: Page, timeout: int = 30_000) -> None:
    """Wait until at least one AQA result card anchor is visible."""
    try:
        # AQA 2024 structure: card divs whose id starts with "sample-papers-and-mark-schemes"
        # Each card contains an <a aria-label="..."> with href="/files/..."
        page.wait_for_selector(
            "div[id^='sample-papers-and-mark-schemes'] a[aria-label],"
            "a[href*='/files/'][aria-label]",
            timeout=timeout,
            state="attached",
        )
    except PWTimeout:
        log.warning("Timed out waiting for result cards — page may be empty or structure changed.")


def _extract_cards(page: Page, page_number: int, source_url: str, scraped_at: str) -> list[dict]:
    """
    Extract all result cards from the current AQA page.

    AQA (2024) renders results as:
      <div id="sample-papers-and-mark-schemes.{year}.{month}.{code}_PDF" ...>
        <a aria-label="{full title}" href="/files/{path}.pdf">
          <h3>{title}</h3>
          <span class="text-muted">{qualification}</span>
          <span ...>PDF</span>
          <span class="text-muted">{size}</span>
          <span class="text-muted">Published: {date}</span>
        </a>
      </div>
    """
    records: list[dict] = []

    raw = page.evaluate("""
    (origin) => {
        const results = [];

        // Primary: card divs with id starting with "sample-papers-and-mark-schemes"
        let cards = Array.from(
            document.querySelectorAll("div[id^='sample-papers-and-mark-schemes']")
        );

        // Fallback: any anchor linking to /files/ that has an aria-label
        if (cards.length === 0) {
            const links = Array.from(
                document.querySelectorAll("a[href*='/files/'][aria-label]")
            );
            // Use the closest block-level parent as card
            const seen = new Set();
            links.forEach(a => {
                const parent = a.closest('div, li, article') || a;
                if (!seen.has(parent)) { seen.add(parent); cards.push(parent); }
            });
        }

        cards.forEach((card, idx) => {
            // The primary link is the first <a> with aria-label
            const anchor = card.querySelector("a[aria-label]") || card.querySelector("a");
            if (!anchor) return;

            const title = (anchor.getAttribute('aria-label') || '').trim()
                       || (card.querySelector('h3, h4') || {innerText: ''}).innerText.trim();

            // href is relative like /files/...pdf  — make absolute
            const href = anchor.getAttribute('href') || '';
            const downloadUrl = href
                ? (href.startsWith('http') ? href : origin + href)
                : null;

            // Metadata spans — AQA uses text-muted class for qualification/size/date
            const spans = Array.from(card.querySelectorAll('span'));
            let qualification = '';
            let fileType = '';
            let fileSize = '';
            let publishedDate = '';

            spans.forEach(s => {
                const t = (s.innerText || '').trim();
                if (!t) return;
                if (t.startsWith('Published:')) {
                    publishedDate = t.replace('Published:', '').trim();
                } else if (/^\d+(\.\d+)?\s*(KB|MB|GB|B)$/i.test(t)) {
                    fileSize = t;
                } else if (/^(PDF|DOCX|ZIP)$/i.test(t)) {
                    fileType = t;
                } else if (t.includes('Religious') || t.includes('GCSE') || t.includes('A-level')) {
                    if (!qualification) qualification = t;
                }
            });

            // Spec/component code from the card's id attribute
            // e.g. "sample-papers-and-mark-schemes.2024.June.AQA-80612-MS-JUN24_PDF"
            const cardId = card.getAttribute('id') || '';
            const codeMatch = cardId.match(/AQA-([^_]+)_/);
            const specCode = codeMatch ? codeMatch[1] : '';

            results.push({
                cardIndex: idx,
                cardId,
                title,
                downloadUrl,
                detailUrl: null,
                publishedDate,
                fileSize,
                fileType: fileType || 'PDF',
                specCode,
                qualification,
                examSeriesMeta: '',
            });
        });

        return results;
    }
    """, AQA_ORIGIN)

    for i, r in enumerate(raw):
        title = r.get("title", "").strip()
        if not title:
            # Skip cards where we couldn't get a title
            continue

        resource_type = detect_resource_type(title)
        norm_title = normalise_title(title)
        exam_series = r.get("examSeriesMeta", "") or detect_exam_series(title)
        modified_type = detect_modified_type(title)
        published_date_raw = r.get("publishedDate", "")
        published_date_iso = parse_published_date(published_date_raw)
        download_url = r.get("downloadUrl") or None
        component_key = build_component_key(title)

        record: dict = {
            "source_url": source_url,
            "scraped_at": scraped_at,
            "page_number": page_number,
            "result_index": i,
            # Classification
            "subject": "",          # filled in by caller
            "qualification": "",    # filled in by caller
            "spec_code": r.get("specCode", ""),
            "component_code": "",
            "exam_series": exam_series,
            # Titles
            "title": title,
            "normalised_title": norm_title,
            "resource_type": resource_type,
            "paper_name": "",
            "section_name": "",
            "option_name": "",
            "religion_or_theme": "",
            "component_key": component_key,
            # Dates / file info
            "published_date": published_date_raw,
            "published_date_iso": published_date_iso,
            "file_size": r.get("fileSize", ""),
            "file_type": r.get("fileType", "PDF"),
            # URLs
            "download_url": download_url,
            "detail_url": r.get("detailUrl") or None,
            # Flags
            "is_question_paper": resource_type == "question_paper",
            "is_mark_scheme": resource_type == "mark_scheme",
            "is_examiner_report": resource_type == "examiner_report",
            "is_modified": modified_type != "none",
            "modified_type": modified_type,
            "is_insert_or_additional_material": detect_additional_material(title),
            "is_restricted": download_url is None,
            "download_url_missing": download_url is None,
        }

        # Best-effort paper/section/option parsing from normalised title
        _parse_paper_parts(record, norm_title)

        records.append(record)

    return records


def _parse_paper_parts(record: dict, norm_title: str) -> None:
    """
    Extract paper number, section, option, and religion/theme from
    a normalised title string using regex heuristics.
    """
    paper_m = re.search(r"paper\s+(\d+[A-Z]?)", norm_title, re.IGNORECASE)
    if paper_m:
        record["paper_name"] = f"Paper {paper_m.group(1).upper()}"

    section_m = re.search(r"section\s+([A-Z])", norm_title, re.IGNORECASE)
    if section_m:
        record["section_name"] = f"Section {section_m.group(1).upper()}"

    option_m = re.search(r"option\s+(\d+[A-Z]?)", norm_title, re.IGNORECASE)
    if option_m:
        record["option_name"] = f"Option {option_m.group(1)}"

    religion_m = re.search(r"\(([^)]+)\)", norm_title)
    if religion_m:
        record["religion_or_theme"] = religion_m.group(1).strip()


import re  # noqa: E402 (needed by _parse_paper_parts above)


# ---------------------------------------------------------------------------
# Pagination helpers
# ---------------------------------------------------------------------------

def _get_next_page_button(page: Page):
    """
    Return the next-page element if it exists and is enabled, else None.
    AQA 2024 uses a "Next" text link in pagination, plus numbered buttons.
    """
    for sel in [
        "a[aria-label='Next page']",
        "a[aria-label='Next']",
        "button[aria-label='Next page']",
        "button[aria-label='Next']",
        "a:has-text('Next')",
        "button:has-text('Next')",
        "a.pagination__next",
        "li.pagination-next a",
        "[rel='next']",
    ]:
        try:
            el = page.query_selector(sel)
            if el and el.is_visible() and el.is_enabled():
                disabled = el.get_attribute("disabled") or el.get_attribute("aria-disabled")
                if disabled and disabled.lower() in ("true", "disabled", ""):
                    continue
                return el
        except Exception:
            continue
    return None


def _apply_filters(page: Page, subject: str, qualification: str, exam_series: str) -> None:
    """
    Attempt to apply dropdown filters on the page if they exist.
    This is a best-effort — the page may already have filters from the URL.
    """
    # Subject dropdown
    for sel in ["select[name*='subject']", "#subject", "[data-filter='subject']"]:
        el = page.query_selector(sel)
        if el:
            try:
                el.select_option(label=subject)
                log.info("Applied subject filter: %s", subject)
                break
            except Exception:
                pass

    # Qualification dropdown
    for sel in ["select[name*='qualification']", "#qualification"]:
        el = page.query_selector(sel)
        if el:
            try:
                el.select_option(label=qualification)
                log.info("Applied qualification filter: %s", qualification)
                break
            except Exception:
                pass

    # Exam series
    if exam_series:
        for sel in ["select[name*='series']", "#examSeries", "[data-filter='examSeries']"]:
            el = page.query_selector(sel)
            if el:
                try:
                    el.select_option(label=exam_series)
                    log.info("Applied exam series filter: %s", exam_series)
                    break
                except Exception:
                    pass

    # Submit / search button if present
    for sel in ["button[type='submit']", "input[type='submit']", "button[class*='search']"]:
        el = page.query_selector(sel)
        if el and el.is_visible():
            el.click()
            log.info("Clicked search/submit button")
            time.sleep(2)
            break


# ---------------------------------------------------------------------------
# Main collect function
# ---------------------------------------------------------------------------

def collect_listing(
    url: str,
    subject: str = "",
    qualification: str = "",
    exam_series: str = "",
    spec_code: str = "All Specifications",
    resource_types: str = DEFAULT_RESOURCE_TYPES,
    output_prefix: str = "output/aqa",
    headless: bool = True,
    slow_mo_ms: int = 0,
    max_pages: int | None = None,
    items_per_page: int | None = None,
) -> list[dict]:
    all_records: list[dict] = []
    scraped_at = now_iso()

    log.info("Starting AQA listing collection")
    log.info("URL: %s", url)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless, slow_mo=slow_mo_ms)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (compatible; AQA-Pipeline/1.0; "
                "+https://github.com/learning-web/aqa-tools)"
            ),
            viewport={"width": 1280, "height": 900},
        )

        # Intercept PDF requests and record URLs without downloading
        intercepted_pdf_urls: set[str] = set()

        def _on_request(req):
            if ".pdf" in req.url.lower() or "/content/dam/" in req.url.lower():
                intercepted_pdf_urls.add(req.url)

        page = context.new_page()
        page.on("request", _on_request)

        log.info("Navigating to listing page...")
        page.goto(url, wait_until="networkidle", timeout=90_000)

        # If URL was built from params, try to also apply page filters
        if subject or qualification:
            _apply_filters(page, subject, qualification, exam_series)

        page.wait_for_timeout(5000)   # let the React app fully render results
        _wait_for_results(page)

        current_page = 1
        while True:
            if max_pages and current_page > max_pages:
                log.info("Reached max_pages limit (%d). Stopping.", max_pages)
                break

            log.info("Scraping page %d ...", current_page)
            records = _extract_cards(page, current_page, url, scraped_at)

            # Annotate subject/qualification
            for r in records:
                r["subject"] = subject
                r["qualification"] = qualification

            log.info("  Found %d cards on page %d", len(records), current_page)
            all_records.extend(records)
            log.info("  Total records so far: %d", len(all_records))

            next_btn = _get_next_page_button(page)
            if not next_btn:
                log.info("No next-page button found — collection complete.")
                break

            log.info("Navigating to page %d ...", current_page + 1)
            try:
                next_btn.click(timeout=15_000)
            except PWTimeout:
                log.info("Next button click timed out — assuming last page reached.")
                break
            page.wait_for_timeout(4000)   # wait for React re-render
            _wait_for_results(page)
            current_page += 1

        browser.close()

    # Deduplicate by download_url (same PDF linked multiple times)
    seen_urls: set[str] = set()
    unique_records: list[dict] = []
    for r in all_records:
        key = r.get("download_url") or f"{r['title']}|{r['page_number']}|{r['result_index']}"
        if key not in seen_urls:
            seen_urls.add(key)
            unique_records.append(r)

    log.info("Total unique records collected: %d", len(unique_records))

    # Write outputs
    prefix = Path(output_prefix)
    prefix.parent.mkdir(parents=True, exist_ok=True)

    write_csv(str(prefix) + ".csv", unique_records)
    log.info("Saved CSV: %s.csv", output_prefix)

    payload = {
        "metadata": {
            "source": "AQA",
            "scrapedAt": scraped_at,
            "sourceUrl": url,
            "subject": subject,
            "qualification": qualification,
            "examSeries": exam_series,
            "specCode": spec_code,
            "resourceTypes": resource_types,
            "totalRecords": len(unique_records),
            "pagesScraped": current_page,
        },
        "records": unique_records,
    }
    write_json(str(prefix) + ".json", payload)
    log.info("Saved JSON: %s.json", output_prefix)

    return unique_records


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def _parse_args(argv=None) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Stage 1: Collect AQA past-paper listing metadata (no PDFs downloaded)."
    )
    p.add_argument("--url", help="Full AQA listing URL (optional if --subject/--qualification used)")
    p.add_argument("--subject", default="", help="Subject name, e.g. 'Religious Studies'")
    p.add_argument("--qualification", default="", help="Qualification, e.g. 'GCSE Religious Studies'")
    p.add_argument("--spec-code", default="All Specifications", help="Specification code")
    p.add_argument("--exam-series", default="", help="Exam series, e.g. 'June 2024'")
    p.add_argument(
        "--resource-types",
        default=DEFAULT_RESOURCE_TYPES,
        help="Comma-separated resource types to include",
    )
    p.add_argument("--items-per-page", type=int, default=None, help="Items per page (if supported)")
    p.add_argument("--max-pages", type=int, default=None, help="Safety limit on number of pages")
    p.add_argument("--output-prefix", required=True, help="Output path prefix, e.g. output/aqa_rs_all")
    p.add_argument("--headless", type=lambda x: x.lower() != "false", default=True, help="Run headless (default true)")
    p.add_argument("--slow-mo-ms", type=int, default=0, help="Slow-motion delay in ms (for debugging)")
    return p.parse_args(argv)


def main(argv=None) -> None:
    args = _parse_args(argv)

    if not args.url and not (args.subject and args.qualification):
        print("ERROR: Provide either --url or both --subject and --qualification.", file=sys.stderr)
        sys.exit(1)

    url = args.url or build_aqa_url(
        subject=args.subject,
        qualification=args.qualification,
        spec_code=args.spec_code,
        exam_series=args.exam_series,
        resource_types=args.resource_types,
    )

    collect_listing(
        url=url,
        subject=args.subject,
        qualification=args.qualification,
        exam_series=args.exam_series,
        spec_code=args.spec_code,
        resource_types=args.resource_types,
        output_prefix=args.output_prefix,
        headless=args.headless,
        slow_mo_ms=args.slow_mo_ms,
        max_pages=args.max_pages,
        items_per_page=args.items_per_page,
    )


if __name__ == "__main__":
    main()
