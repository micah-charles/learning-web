/**
 * studybookIndex.js
 *
 * Runtime loader for FoxChild Tutor study book search index.
 * Fetches /search/studybook-index.json and provides search functionality.
 * Phase 3B: Uses MiniSearch for better relevance + fuzzy matching.
 */

import MiniSearch from "minisearch";

let _indexCache = null;
let _loadPromise = null;
let _miniSearch = null;

/**
 * Load the study book index (cached).
 * @returns {Promise<object>} Index object with { chunks, version, generatedAt }
 */
export async function loadStudyBookIndex() {
  if (_indexCache) return _indexCache;

  if (!_loadPromise) {
    _loadPromise = (async () => {
      try {
        const res = await fetch("/search/studybook-index.json", {
          cache: "force-cache"
        });
        if (!res.ok) throw new Error(`Failed to load index: ${res.status}`);
        const data = await res.json();
        _indexCache = data;
        return data;
      } catch (err) {
        console.warn("[StudyBookIndex] Failed to load:", err.message);
        _indexCache = { chunks: [], version: 0, generatedAt: null };
        return _indexCache;
      }
    })();
  }
  return _loadPromise;
}

/**
 * Initialize MiniSearch index from loaded chunks.
 */
function initMiniSearch(chunks) {
  if (_miniSearch) return _miniSearch;

  _miniSearch = new MiniSearch({
    fields: ["content", "heading", "subject", "displayName"],
    storeFields: [
      "id", "packId", "displayName", "subject", "curriculum",
      "heading", "anchor", "level", "content", "wordCount",
      "sourcePath", "packPath", "isCombined"
    ],
    searchOptions: {
      boost: { heading: 3, content: 1, subject: 0.5, displayName: 1 },
      fuzzy: 0.2,
      prefix: true
    },
    extractField: (document, fieldName) => document[fieldName]
  });

  _miniSearch.addAll(chunks);
  return _miniSearch;
}

/**
 * Search the study book index using MiniSearch.
 * @param {string} query - User query
 * @param {object} options
 * @param {number} options.maxResults - Max results (default 8)
 * @param {string} options.subject - Filter by subject
 * @param {string} options.curriculum - Filter by curriculum
 * @returns {Promise<Array<{chunk: object, score: number}>>}
 */
export async function searchStudyBookIndex(query, options = {}) {
  const { maxResults = 8, subject, curriculum } = options;

  const index = await loadStudyBookIndex();
  if (!index.chunks?.length) return [];

  if (!_miniSearch) {
    initMiniSearch(index.chunks);
  }

  const filters = [];
  if (subject) filters.push({ field: "subject", value: subject });
  if (curriculum) filters.push({ field: "curriculum", value: curriculum });

  const results = _miniSearch.search(query, {
    filter: filters.length ? (doc => filters.every(f => doc[f.field] === f.value)) : undefined,
    ..._miniSearch.searchOptions
  });

  // Map to our format
  return results
    .slice(0, maxResults)
    .map(r => ({
      chunk: r,
      score: r.score || 0
    }));
}

/**
 * Get a specific chunk by ID (for "show evidence" deep links).
 */
export async function getStudyBookChunk(chunkId) {
  const index = await loadStudyBookIndex();
  return index.chunks.find(c => c.id === chunkId) || null;
}

/**
 * Extract snippet with context around match.
 */
export function extractSnippet(chunk, query, contextChars = 300) {
  if (!query) return chunk.content.slice(0, contextChars);

  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const content = chunk.content.toLowerCase();
  const original = chunk.content;

  // Find first token match
  for (const token of tokens) {
    const idx = content.indexOf(token.toLowerCase());
    if (idx >= 0) {
      const start = Math.max(0, idx - contextChars / 2);
      const end = Math.min(original.length, idx + contextChars / 2);
      let snippet = original.slice(start, end).trim();
      if (start > 0) snippet = "…" + snippet;
      if (end < original.length) snippet = snippet + "…";
      return snippet;
    }
  }

  // Fallback: return beginning
  return original.slice(0, contextChars) + (original.length > contextChars ? "…" : "");
}

/**
 * Build deep link URL to open StudyBookDrawer at specific heading.
 */
export function buildStudyBookDeepLink(chunk) {
  // URL format: /?studybook=<packId>&anchor=<heading-anchor>
  // The StudyBookDrawer can be opened programmatically via StudyBookContext
  return {
    packId: chunk.packId,
    anchor: chunk.anchor,
    heading: chunk.heading,
    subject: chunk.subject,
    curriculum: chunk.curriculum
  };
}

/**
 * Open Study Book in drawer at specific heading (to be called from UI).
 * This should be integrated with the StudyBookContext.
 */
export async function openStudyBookAtHeading(packId, anchor) {
  // This will be connected to the StudyBookContext.openBook()
  // The actual implementation depends on how the tutor accesses the context
  // For now, return the navigation info
  return { packId, anchor };
}