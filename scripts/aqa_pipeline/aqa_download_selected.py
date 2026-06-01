"""
aqa_download_selected.py — Stage 3 of the AQA past-paper pipeline.

Downloads only the selected matched files from Stage 2.
Defaults to dry-run; requires --confirm-download for actual downloads.

Usage:
    # Dry run (default — safe to run anytime)
    python -m aqa_tools.aqa_download_selected \
        --input "output/aqa_rs_june_2024_selected.json" \
        --download-dir "downloads/aqa" \
        --dry-run

    # Actual download (requires explicit confirmation flag)
    python -m aqa_tools.aqa_download_selected \
        --input "output/aqa_rs_june_2024_selected.json" \
        --download-dir "downloads/aqa" \
        --max-downloads 20 \
        --delay-ms 7000 \
        --confirm-download
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
import time
from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

from .aqa_common import now_iso, safe_filename, slugify, write_csv, write_json

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (compatible; AQA-Pipeline/1.0; "
    "+https://github.com/learning-web/aqa-tools)"
)
DEFAULT_DELAY_MS = 7000
DEFAULT_MAX_DOWNLOADS = 20


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_pairs(input_path: str) -> dict:
    path = Path(input_path)
    if not path.exists():
        log.error("Input file not found: %s", input_path)
        sys.exit(1)
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def _build_folder_path(
    download_dir: str,
    qualification: str,
    exam_series: str,
    component_key: str,
) -> Path:
    """
    Construct a safe, structured folder path:
    downloads/aqa/<qualification>/<exam-series>/<component-key>/
    """
    base = Path(download_dir)
    qual_slug = slugify(qualification) if qualification else "unknown-qualification"
    series_slug = slugify(exam_series) if exam_series else "unknown-series"
    comp_slug = component_key or "unknown-component"
    return base / qual_slug / series_slug / comp_slug


def _download_file(
    url: str,
    dest: Path,
    user_agent: str,
) -> tuple[str, int, int, str]:
    """
    Download a single file with basic safety checks.
    Returns (status, http_status, bytes_downloaded, error_message).
    """
    req = Request(url, headers={"User-Agent": user_agent})
    try:
        with urlopen(req, timeout=60) as resp:
            http_status = resp.status
            content_type = resp.headers.get("Content-Type", "")
            # Safety: only accept PDF content
            if "pdf" not in content_type.lower() and not url.lower().endswith(".pdf"):
                # Still download but warn
                log.warning("Unexpected Content-Type '%s' for %s", content_type, url)
            data = resp.read()
            dest.write_bytes(data)
            return "ok", http_status, len(data), ""
    except HTTPError as e:
        return "http_error", e.code, 0, str(e)
    except URLError as e:
        return "url_error", 0, 0, str(e)
    except Exception as e:  # noqa: BLE001
        return "error", 0, 0, str(e)


def _write_metadata(folder: Path, meta: dict) -> None:
    write_json(folder / "metadata.json", meta)


# ---------------------------------------------------------------------------
# Core download function
# ---------------------------------------------------------------------------

def download_selected(
    input_path: str,
    download_dir: str,
    dry_run: bool = True,
    max_downloads: int = DEFAULT_MAX_DOWNLOADS,
    delay_ms: int = DEFAULT_DELAY_MS,
    overwrite: bool = False,
    user_agent: str = DEFAULT_USER_AGENT,
) -> list[dict]:
    """
    Process the selected_pairs JSON and download files.
    Returns the download log rows.
    """
    data = _load_pairs(input_path)
    metadata = data.get("metadata", {})
    pairs = data.get("pairs", [])

    qualification = metadata.get("qualification", "")
    subject = metadata.get("subject", "")

    log.info("Input: %s", input_path)
    log.info("Mode: %s", "DRY RUN" if dry_run else "ACTUAL DOWNLOAD")
    log.info("Total pairs in input: %d", len(pairs))
    log.info("Max downloads: %d", max_downloads)
    log.info("Delay between files: %d ms", delay_ms)

    matched_pairs = [p for p in pairs if p.get("matchStatus") == "matched"]
    log.info("Matched pairs to process: %d", len(matched_pairs))

    # Build download tasks
    tasks: list[dict[str, Any]] = []
    for pair in matched_pairs:
        component_key = pair.get("componentKey", "unknown")
        display_title = pair.get("displayTitle", component_key)
        exam_series = pair.get("examSeries", "")
        folder = _build_folder_path(download_dir, qualification, exam_series, component_key)

        qp = pair.get("questionPaper") or {}
        ms = pair.get("markScheme") or {}

        if qp.get("downloadUrl"):
            tasks.append({
                "component_key": component_key,
                "display_title": display_title,
                "exam_series": exam_series,
                "file_role": "question_paper",
                "url": qp["downloadUrl"],
                "filename": "question-paper.pdf",
                "folder": folder,
                "pair_meta": {
                    "source": "AQA",
                    "subject": subject,
                    "qualification": qualification,
                    "examSeries": exam_series,
                    "componentKey": component_key,
                    "displayTitle": display_title,
                },
                "qp_meta": qp,
                "ms_meta": ms,
            })

        if ms.get("downloadUrl"):
            tasks.append({
                "component_key": component_key,
                "display_title": display_title,
                "exam_series": exam_series,
                "file_role": "mark_scheme",
                "url": ms["downloadUrl"],
                "filename": "mark-scheme.pdf",
                "folder": folder,
                "pair_meta": {
                    "source": "AQA",
                    "subject": subject,
                    "qualification": qualification,
                    "examSeries": exam_series,
                    "componentKey": component_key,
                    "displayTitle": display_title,
                },
                "qp_meta": qp,
                "ms_meta": ms,
            })

    log.info("Total files to download: %d", len(tasks))

    if len(tasks) > max_downloads:
        log.warning(
            "File count (%d) exceeds --max-downloads (%d). Truncating.",
            len(tasks),
            max_downloads,
        )
        tasks = tasks[:max_downloads]

    # Execute downloads
    log_rows: list[dict] = []
    downloaded = 0
    skipped = 0
    errors = 0

    for task in tasks:
        folder: Path = task["folder"]
        dest = folder / task["filename"]
        url = task["url"]
        component_key = task["component_key"]
        file_role = task["file_role"]
        timestamp = now_iso()

        log_row: dict[str, Any] = {
            "timestamp": timestamp,
            "component_key": component_key,
            "file_role": file_role,
            "url": url,
            "target_path": str(dest),
            "status": "",
            "http_status": "",
            "bytes_downloaded": "",
            "error_message": "",
        }

        if dry_run:
            exists = dest.exists()
            status = "would_skip" if (exists and not overwrite) else "would_download"
            log.info("[DRY RUN] %s → %s (%s)", url[:80], dest, status)
            log_row["status"] = status
            log_rows.append(log_row)
            continue

        # Skip if exists and not overwriting
        if dest.exists() and not overwrite:
            log.info("SKIP (exists): %s", dest)
            log_row["status"] = "skipped_exists"
            log_rows.append(log_row)
            skipped += 1
            continue

        # Create folder
        folder.mkdir(parents=True, exist_ok=True)

        log.info("Downloading %s → %s", url[:80], dest)
        status, http_status, nbytes, error_msg = _download_file(url, dest, user_agent)

        log_row.update({
            "status": status,
            "http_status": http_status,
            "bytes_downloaded": nbytes,
            "error_message": error_msg,
        })
        log_rows.append(log_row)

        if status == "ok":
            downloaded += 1
            log.info("  OK — %d bytes", nbytes)
        else:
            errors += 1
            log.warning("  FAILED — %s (HTTP %s)", error_msg, http_status)

        # Write per-folder metadata.json after both files processed
        # (we write/overwrite on each file; last one wins — that's fine)
        _write_per_folder_metadata(folder, task)

        # Polite delay between files
        if delay_ms > 0:
            log.info("  Waiting %d ms before next request ...", delay_ms)
            time.sleep(delay_ms / 1000.0)

    # Write download log
    log_base = Path(download_dir)
    log_base.mkdir(parents=True, exist_ok=True)
    write_csv(str(log_base / "download_log.csv"), log_rows)
    write_json(str(log_base / "download_log.json"), {
        "metadata": {
            "source": "AQA",
            "loggedAt": now_iso(),
            "inputFile": input_path,
            "dryRun": dry_run,
            "totalTasks": len(tasks),
            "downloaded": downloaded,
            "skipped": skipped,
            "errors": errors,
        },
        "entries": log_rows,
    })

    if dry_run:
        log.info("DRY RUN complete. %d file(s) would be downloaded.", len(tasks))
        log.info("Re-run with --confirm-download to perform actual downloads.")
    else:
        log.info(
            "Download complete. Downloaded: %d  Skipped: %d  Errors: %d",
            downloaded,
            skipped,
            errors,
        )

    return log_rows


def _write_per_folder_metadata(folder: Path, task: dict) -> None:
    """Write metadata.json inside a component folder."""
    qp = task.get("qp_meta") or {}
    ms = task.get("ms_meta") or {}
    meta = {
        **task["pair_meta"],
        "files": {
            "questionPaper": {
                "filename": "question-paper.pdf",
                "sourceUrl": qp.get("downloadUrl", ""),
                "publishedDate": qp.get("publishedDateIso", ""),
                "title": qp.get("title", ""),
            },
            "markScheme": {
                "filename": "mark-scheme.pdf",
                "sourceUrl": ms.get("downloadUrl", ""),
                "publishedDate": ms.get("publishedDateIso", ""),
                "title": ms.get("title", ""),
            },
        },
        "downloadedAt": now_iso(),
    }
    _write_metadata(folder, meta)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _parse_args(argv=None) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Stage 3: Download selected AQA past papers (safe, polite, controlled)."
    )
    p.add_argument("--input", required=True, help="selected_pairs JSON from Stage 2")
    p.add_argument("--download-dir", required=True, help="Root download directory")
    p.add_argument(
        "--dry-run",
        action="store_true",
        default=True,
        help="Simulate downloads without saving files (default: on)",
    )
    p.add_argument(
        "--confirm-download",
        action="store_true",
        default=False,
        help="Required to perform actual downloads (disables dry-run)",
    )
    p.add_argument(
        "--max-downloads",
        type=int,
        default=DEFAULT_MAX_DOWNLOADS,
        help=f"Maximum number of files to download (default {DEFAULT_MAX_DOWNLOADS})",
    )
    p.add_argument(
        "--delay-ms",
        type=int,
        default=DEFAULT_DELAY_MS,
        help=f"Delay between file downloads in ms (default {DEFAULT_DELAY_MS})",
    )
    p.add_argument(
        "--overwrite",
        action="store_true",
        default=False,
        help="Overwrite existing files (default: skip)",
    )
    p.add_argument("--user-agent", default=DEFAULT_USER_AGENT, help="HTTP User-Agent string")
    return p.parse_args(argv)


def main(argv=None) -> None:
    args = _parse_args(argv)

    dry_run = not args.confirm_download

    if dry_run:
        log.info("=" * 60)
        log.info("DRY RUN MODE — no files will be downloaded.")
        log.info("Pass --confirm-download to perform actual downloads.")
        log.info("=" * 60)

    download_selected(
        input_path=args.input,
        download_dir=args.download_dir,
        dry_run=dry_run,
        max_downloads=args.max_downloads,
        delay_ms=args.delay_ms,
        overwrite=args.overwrite,
        user_agent=args.user_agent,
    )


if __name__ == "__main__":
    main()
