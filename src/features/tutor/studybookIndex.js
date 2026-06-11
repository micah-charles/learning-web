/**
 * studybookIndex.js
 *
 * Runtime loader for FoxChild Tutor study book search index.
 * Fetches /search/studybook-index.json and provides search functionality.
 */

let _indexCache = null;
let _loadPromise = null;

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
          // Allow caching - index only changes on rebuild
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
 * Simple tokenization for search queries.
 */
function tokenizeQuery(query) {
  if (!query) return [];
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "are", "was", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "must", "can", "this",
    "that", "these", "those", "i", "you", "he", "she", "it", "we", "they",
    "me", "him", "her", "us", "them", "my", "your", "his", "its", "our",
    "their", "what", "which", "who", "whom", "where", "when", "why", "how",
    "about", "can", "help", "tell", "show", "give", "meaning", "translate",
    "read", "aloud", "speak"
  ]);
  return query.toLowerCase()
    .split(/\s+/)
    .map(t => t.replace(/[^\w]/g, ""))
    .filter(t => t.length > 1 && !stopWords.has(t));
}

/**
 * Score a chunk against query tokens.
 * @returns {number} 0-1 score
 */
function scoreChunk(chunk, tokens) {
  if (!tokens.length) return 0;
  const content = chunk.content.toLowerCase();
  const heading = (chunk.heading || "").toLowerCase();

  let matches = 0;
  for (const token of tokens) {
    if (content.includes(token)) matches++;
    if (heading.includes(token)) matches += 1.5; // Boost heading matches
  }

  // Phrase bonus
  const phrase = tokens.join(" ");
  if (content.includes(phrase)) matches += tokens.length * 0.5;

  return Math.min(1, matches / Math.max(1, tokens.length * 0.8));
}

/**
 * Search the study book index.
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

  const tokens = tokenizeQuery(query);
  if (!tokens.length) return [];

  // Filter and score
  const results = [];
  for (const chunk of index.chunks) {
    // Optional filters
    if (subject && chunk.subject !== subject) continue;
    if (curriculum && chunk.curriculum !== curriculum) continue;

    const score = scoreChunk(chunk, tokens);
    if (score > 0.05) { // Minimum threshold
      results.push({ chunk, score });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, maxResults);
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
export function extractSnippet(chunk, tokens, contextChars = 300) {
  if (!tokens.length) return chunk.content.slice(0, contextChars);

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