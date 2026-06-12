/**
 * Study Book — markdown loading, rendering, and search.
 * Pure functions live in study-book-core.js; this module adds DOM-dependent parts.
 */

import { marked, ALLOWED_TAGS, ALLOWED_ATTR } from "./study-book-core.js";
export {
  extractTOC,
  highlightMatches,
  datasetHasStudyBook,
  getStudyBookFiles,
  hasStudyBookAnchor,
  makeStudyBookAnchor,
} from "./study-book-core.js";
import DOMPurify from "dompurify";

// ── Markdown cache ─────────────────────────────────────────────────────────

const mdCache = new Map(); // path → raw markdown string

/**
 * Fetches a markdown file by path. Returns the cached version on repeat calls.
 * Throws if the fetch fails.
 */
export async function loadMarkdownFile(path) {
  if (mdCache.has(path)) return mdCache.get(path);
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Study Book: could not load "${path}" (${res.status})`);
  const text = await res.text();
  mdCache.set(path, text);
  return text;
}

/**
 * Convenience loader that reads contentMdPath from a manifest dataset entry.
 * Returns null if the dataset has no contentMdPath.
 */
export async function loadContentMarkdown(dataset) {
  if (!dataset?.contentMdPath) return null;
  return loadMarkdownFile(dataset.contentMdPath);
}

// ── Rendering ──────────────────────────────────────────────────────────────

/**
 * Parses raw markdown to sanitized HTML ready for innerHTML assignment.
 */
export function renderMarkdown(rawMarkdown) {
  const dirty = marked.parse(rawMarkdown);
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS, ALLOWED_ATTR });
}
