/**
 * studybookIndex.js
 *
 * Runtime loader for FoxChild Tutor study book search index.
 * Fetches /search/studybook-index.json and provides search functionality.
 * Phase 3B: Uses MiniSearch for better relevance + fuzzy matching.
 * Phase 3C: Optional semantic search via Transformers.js embeddings.
 */

import MiniSearch from "minisearch";

let _indexCache = null;
let _loadPromise = null;
let _miniSearch = null;
let _embedder = null;
let _embeddingsCache = null;
let _embeddingsPromise = null;

/**
 * Model configuration for embeddings.
 */
const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2"; // ~90 MB quantized, 384-dim
const EMBEDDING_DIM = 384;

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
 * Initialize the Transformers.js embedder (lazy-loaded).
 * Only loads when semantic search is enabled.
 */
async function initEmbedder() {
  if (_embedder) return _embedder;

  try {
    const { pipeline } = await import("@xenova/transformers");
    _embedder = await pipeline("feature-extraction", EMBEDDING_MODEL, {
      quantized: true,
      progress_callback: (p) => {
        if (p.status === "downloading") {
          console.log(`[StudyBookIndex] Downloading embedding model: ${Math.round(p.progress * 100)}%`);
        }
      }
    });
    console.log("[StudyBookIndex] Embedding model loaded");
    return _embedder;
  } catch (err) {
    console.error("[StudyBookIndex] Failed to load embedding model:", err);
    throw err;
  }
}

/**
 * Compute embeddings for all chunks and cache in IndexedDB.
 * Only runs once per session when semantic search is first enabled.
 */
async function ensureEmbeddings(chunks) {
  if (_embeddingsCache) return _embeddingsCache;

  if (_embeddingsPromise) return _embeddingsPromise;

  _embeddingsPromise = computeEmbeddings(chunks);
  return _embeddingsPromise;
}

async function computeEmbeddings(chunks) {
  try {
    const embedder = await initEmbedder();
    const embeddings = new Float32Array(chunks.length * EMBEDDING_DIM);

    // Process in batches to avoid memory issues
    const batchSize = 16;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const texts = batch.map(c => `${c.heading || ""} ${c.content}`.slice(0, 512));
      
      const outputs = await Promise.all(
        texts.map(text => embedder(text, { pooling: "mean", normalize: true }))
      );

      for (let j = 0; j < outputs.length; j++) {
        const idx = i + j;
        embeddings.set(outputs[j], idx * EMBEDDING_DIM);
      }

      // Progress (optional)
      if (i % 128 === 0) {
        console.log(`[StudyBookIndex] Embedded ${Math.min(i + batchSize, chunks.length)}/${chunks.length} chunks`);
      }
    }

    _embeddingsCache = { embeddings, dimension: EMBEDDING_DIM, count: chunks.length };
    
    // Cache in IndexedDB for future sessions
    try {
      await cacheEmbeddingsInIndexedDB(embeddings, chunks.length);
    } catch (e) {
      // Ignore IndexedDB errors
    }

    return _embeddingsCache;
  } catch (err) {
    console.error("[StudyBookIndex] Embedding computation failed:", err);
    _embeddingsPromise = null;
    throw err;
  }
}

/**
 * Cache embeddings in IndexedDB for persistence across sessions.
 */
async function cacheEmbeddingsInIndexedDB(embeddings, count) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("FoxChildTutor", 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("embeddings")) {
        db.createObjectStore("embeddings");
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction("embeddings", "readwrite");
      const store = tx.objectStore("embeddings");
      store.put({ embeddings: Array.from(embeddings), count, dimension: EMBEDDING_DIM, model: EMBEDDING_MODEL, timestamp: Date.now() }, "studybook");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

/**
 * Load cached embeddings from IndexedDB.
 */
async function loadCachedEmbeddings() {
  return new Promise((resolve) => {
    const request = indexedDB.open("FoxChildTutor", 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction("embeddings", "readonly");
      const store = tx.objectStore("embeddings");
      const getRequest = store.get("studybook");
      
      getRequest.onsuccess = () => {
        if (getRequest.result && getRequest.result.model === EMBEDDING_MODEL) {
          const { embeddings, count, dimension } = getRequest.result;
          if (count === count && dimension === EMBEDDING_DIM) {
            resolve({ embeddings: new Float32Array(embeddings), count, dimension });
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      getRequest.onerror = () => resolve(null);
    };
    
    request.onerror = () => resolve(null);
    
    // Timeout after 1s
    setTimeout(() => resolve(null), 1000);
  });
}

/**
 * Search the study book index using MiniSearch (keyword) or semantic embeddings.
 * @param {string} query - User query
 * @param {object} options
 * @param {number} options.maxResults - Max results (default 8)
 * @param {string} options.subject - Filter by subject
 * @param {string} options.curriculum - Filter by curriculum
 * @param {boolean} options.semantic - Use semantic/embedding search (default false)
 * @param {boolean} options.semanticSearch - Alias for semantic (for backward compatibility)
 * @returns {Promise<Array<{chunk: object, score: number}>>}
 */
export async function searchStudyBookIndex(query, options = {}) {
  const { maxResults = 8, subject, curriculum, semantic = false, semanticSearch = false } = options;
  const useSemantic = semantic || semanticSearch;

  const index = await loadStudyBookIndex();
  if (!index.chunks?.length) return [];

  if (!_miniSearch) {
    initMiniSearch(index.chunks);
  }

  // Keyword search (MiniSearch)
  const filters = [];
  if (subject) filters.push({ field: "subject", value: subject });
  if (curriculum) filters.push({ field: "curriculum", value: curriculum });

  let results = _miniSearch.search(query, {
    filter: filters.length ? (doc => filters.every(f => doc[f.field] === f.value)) : undefined,
    ..._miniSearch.searchOptions
  });

  // If semantic search is enabled and we have enough results to rerank
  if (useSemantic && results.length > 0) {
    try {
      // Try to load cached embeddings first
      let embeddingsCache = await loadCachedEmbeddings();
      if (!embeddingsCache || embeddingsCache.count !== index.chunks.length) {
        // Compute embeddings if not cached or stale
        embeddingsCache = await ensureEmbeddings(index.chunks);
      }

      if (embeddingsCache) {
        const embedder = await initEmbedder();
        const queryVec = await embedder(query.slice(0, 512), { pooling: "mean", normalize: true });
        
        // Compute cosine similarity for top N keyword results
        const topN = Math.min(results.length, 20);
        const scored = [];
        for (let i = 0; i < topN; i++) {
          const result = results[i];
          const chunkIdx = index.chunks.findIndex(c => c.id === result.id);
          if (chunkIdx >= 0) {
            const offset = chunkIdx * EMBEDDING_DIM;
            const chunkVec = embeddingsCache.embeddings.slice(offset, offset + EMBEDDING_DIM);
            
            // Cosine similarity (both vectors normalized)
            let dot = 0;
            for (let k = 0; k < EMBEDDING_DIM; k++) {
              dot += queryVec[k] * chunkVec[k];
            }
            scored.push({ ...result, semanticScore: dot });
          }
        }
        
        // Combine keyword and semantic scores (weighted)
        results = scored
          .sort((a, b) => (b.semanticScore * 0.7 + b.score * 0.3) - (a.semanticScore * 0.7 + a.score * 0.3))
          .slice(0, maxResults)
          .map(r => ({ ...r, score: r.semanticScore * 0.7 + r.score * 0.3 }));
      }
    } catch (err) {
      console.warn("[StudyBookIndex] Semantic search failed, falling back to keyword:", err);
    }
  }

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
 */
export async function openStudyBookAtHeading(packId, anchor) {
  return { packId, anchor };
}

/**
 * Check if semantic search is available (model loaded or cacheable).
 */
export async function isSemanticSearchAvailable() {
  try {
    const cached = await loadCachedEmbeddings();
    if (cached) return true;
    
    // Check if model can be loaded (network connectivity)
    const { pipeline } = await import("@xenova/transformers");
    await pipeline("feature-extraction", EMBEDDING_MODEL, { quantized: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Preload embedding model (call when user enables "smart search" setting).
 */
export async function preloadEmbeddingModel(onProgress) {
  try {
    const { pipeline } = await import("@xenova/transformers");
    _embedder = await pipeline("feature-extraction", EMBEDDING_MODEL, {
      quantized: true,
      progress_callback: onProgress
    });
    return true;
  } catch (err) {
    console.error("[StudyBookIndex] Failed to preload embedding model:", err);
    return false;
  }
}