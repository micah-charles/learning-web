/**
 * tutorRetrieval.js
 *
 * Deterministic retrieval for FoxChild Tutor.
 * No LLM - uses simple tokenization and scoring against current content.
 */

import { normalizeForCompare, tokenizeSentence } from "@/utils.js";
import { searchStudyBookIndex, extractSnippet } from "./studybookIndex.js";

/**
 * Tokenize a query into lowercase words, filtering stop words.
 * @param {string} query - User query.
 * @returns {string[]} Array of query tokens.
 */
export function tokenizeQuery(query) {
  if (!query) return [];
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "are", "was", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "must", "can", "this",
    "that", "these", "those", "i", "you", "he", "she", "it", "we", "they",
    "me", "him", "her", "us", "them", "my", "your", "his", "its", "our",
    "their", "what", "which", "who", "whom", "where", "when",
    "about", "can", "help", "tell", "show", "give", "meaning", "translate", "read", "aloud", "speak"
  ]);
  return tokenizeSentence(query.toLowerCase())
    .filter(t => t.length > 1 && !stopWords.has(t));
}

/**
 * Score a text snippet against query tokens.
 * @param {string} text - Text to score.
 * @param {string[]} tokens - Query tokens.
 * @returns {number} Score (0-1).
 */
export function scoreText(text, tokens) {
  if (!text || !tokens.length) return 0;
  const normText = normalizeForCompare(text);
  let matches = 0;
  for (const token of tokens) {
    if (normText.includes(normalizeForCompare(token))) {
      matches++;
    }
  }
  // Bonus for phrase matches
  const queryPhrase = normalizeForCompare(tokens.join(" "));
  if (normText.includes(queryPhrase)) {
    matches += tokens.length * 0.5;
  }
  return Math.min(1, matches / Math.max(1, tokens.length));
}

/**
 * Extract relevant snippets from a text with context.
 * @param {string} text - Full text.
 * @param {string[]} tokens - Query tokens.
 * @param {number} maxSnippets - Maximum snippets to return.
 * @param {number} contextChars - Characters of context around match.
 * @returns {Array<{text: string, score: number, index: number}>}
 */
export function extractSnippets(text, tokens, maxSnippets = 3, contextChars = 200) {
  if (!text || !tokens.length) return [];
  const normText = normalizeForCompare(text);
  const originalText = text;
  const snippets = [];
  const usedRanges = [];

  for (const token of tokens) {
    const normToken = normalizeForCompare(token);
    let searchIndex = 0;
    while (searchIndex < normText.length) {
      const matchIndex = normText.indexOf(normToken, searchIndex);
      if (matchIndex === -1) break;

      // Check if this range overlaps with an already used range
      const start = Math.max(0, matchIndex - contextChars);
      const end = Math.min(originalText.length, matchIndex + normToken.length + contextChars);
      const overlaps = usedRanges.some(r => !(end <= r.start || start >= r.end));
      if (!overlaps) {
        usedRanges.push({ start, end });
        const snippet = originalText.slice(start, end).trim();
        const score = scoreText(snippet, tokens);
        snippets.push({ text: snippet, score, index: matchIndex });
        if (snippets.length >= maxSnippets) break;
      }
      searchIndex = matchIndex + 1;
    }
    if (snippets.length >= maxSnippets) break;
  }

  // Sort by score descending, then by position
  return snippets
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, maxSnippets);
}

/**
 * Search all available content sources for the tutor.
 * @param {object} params - Content sources.
 * @param {object|null} params.manifest - Current manifest.
 * @param {object|null} params.dataset - Current dataset/pack.
 * @param {object|null} params.quizSession - Current quiz session.
 * @param {object|null} params.readingPassage - Current reading passage.
 * @param {string|null} params.readingTargetText - Current reading passage target text (translation).
 * @param {string|null} params.studyBookHtml - Current study book HTML content (fallback).
 * @param {string} params.query - User query.
 * @param {boolean} params.semanticSearch - Use semantic/embedding search (default false).
 * @returns {Promise<object>} Retrieval result with snippets and metadata.
 */
export async function retrieveContent({
  manifest = null,
  dataset = null,
  quizSession = null,
  readingPassage = null,
  readingTargetText = null,
  studyBookHtml = null,
  query = "",
  semanticSearch = false
}) {
  const tokens = tokenizeQuery(query);
  if (!tokens.length) {
    return { snippets: [], sources: [], hasContent: false };
  }

  const allSnippets = [];
  const sources = [];

  // 1. Current quiz question
  if (quizSession?.questions?.length > 0 && quizSession.index < quizSession.questions.length) {
    const q = quizSession.questions[quizSession.index];
    const qText = `${q.prompt || ""} ${q.answer || ""} ${q.explanation || ""} ${q.hint || ""} ${(q.options || []).join(" ")}`;
    const snippets = extractSnippets(qText, tokens, 2);
    if (snippets.length) {
      allSnippets.push(...snippets.map(s => ({ ...s, source: "quiz", sourceLabel: "Current quiz question" })));
      sources.push("quiz");
    }
  }

  // 2. Current reading passage (source text)
  if (readingPassage?.sourceText) {
    const snippets = extractSnippets(readingPassage.sourceText, tokens, 3);
    if (snippets.length) {
      allSnippets.push(...snippets.map(s => ({ ...s, source: "reading", sourceLabel: "Reading passage (source)" })));
      sources.push("reading");
    }
  }

  // 3. Current reading passage (target/translation text)
  if (readingTargetText || readingPassage?.targetText) {
    const text = readingTargetText || readingPassage.targetText;
    const snippets = extractSnippets(text, tokens, 3);
    if (snippets.length) {
      allSnippets.push(...snippets.map(s => ({ ...s, source: "reading-translation", sourceLabel: "Reading passage (translation)" })));
      sources.push("reading-translation");
    }
  }

  // 4. Current reading passage questions
  if (readingPassage?.questions?.length) {
    for (const q of readingPassage.questions) {
      const qText = `${q.question || ""} ${q.model_answer_en || ""} ${(q.options || []).join(" ")} ${q.correct_answer || ""}`;
      const snippets = extractSnippets(qText, tokens, 1);
      if (snippets.length) {
        allSnippets.push(...snippets.map(s => ({ ...s, source: "reading-question", sourceLabel: "Reading question" })));
        sources.push("reading-question");
      }
    }
  }

  // 5. Study book content — search full index (async)
  let studyBookPromise = null;
  studyBookPromise = (async () => {
    try {
      // First: search within current pack's subject (if any)
      let results = await searchStudyBookIndex(query, {
        maxResults: 5,
        subject: dataset?.subject,
        curriculum: dataset?.curriculum,
        semanticSearch
      });

      // Fallback: if filtered search returned nothing and a pack is open,
      // search across all study books (broader retrieval)
      if (results.length === 0 && dataset?.subject) {
        results = await searchStudyBookIndex(query, {
          maxResults: 5,
          semanticSearch
        });
      }

      return results.map(r => ({
        text: extractSnippet(r.chunk, query, 300),
        score: r.score,
        source: "studybook",
        sourceLabel: `Study Book: ${r.chunk.heading || r.chunk.displayName}`,
        metadata: {
          packId: r.chunk.packId,
          subject: r.chunk.subject,
          curriculum: r.chunk.curriculum,
          anchor: r.chunk.anchor,
          heading: r.chunk.heading
        }
      }));
    } catch (err) {
      console.warn("[tutorRetrieval] Study book search failed:", err);
      return [];
    }
  })();

  // 6. Dataset vocabulary (if available via manifest/dataset)
  if (dataset?.id && manifest) {
    // Note: vocab items would need to be loaded asynchronously
    // This is a placeholder for when vocab is available in context
    // The tutorEngine will handle async loading
  }

  // Await study book search
  const studyBookSnippets = await studyBookPromise;
  if (studyBookSnippets.length) {
    allSnippets.push(...studyBookSnippets);
    sources.push("studybook");
  }

  // Deduplicate by source+text similarity
  const uniqueSnippets = [];
  const seenTexts = new Set();
  for (const snippet of allSnippets) {
    const key = `${snippet.source}:${normalizeForCompare(snippet.text).slice(0, 100)}`;
    if (!seenTexts.has(key)) {
      seenTexts.add(key);
      uniqueSnippets.push(snippet);
    }
  }

  // Sort by score
  uniqueSnippets.sort((a, b) => b.score - a.score);

  return {
    snippets: uniqueSnippets.slice(0, 8),
    sources: [...new Set(sources)],
    hasContent: uniqueSnippets.length > 0,
  };
}

/**
 * Get vocabulary hint for a word from dataset.
 * @param {object} vocabItem - Vocabulary item from unified pack.
 * @param {string[]} tokens - Query tokens.
 * @returns {object|null} Hint object or null.
 */
export function getVocabHint(vocabItem, tokens) {
  if (!vocabItem) return null;

  const searchText = `${vocabItem.de || ""} ${vocabItem.en || ""} ${vocabItem.exampleDe || ""} ${vocabItem.exampleEn || ""} ${vocabItem.topic || ""}`;
  const score = scoreText(searchText, tokens);

  if (score > 0.1) {
    return {
      word: vocabItem,
      score,
      hint: `This word appears in your current pack. ${vocabItem.de ? `German: ${vocabItem.de}` : ""} ${vocabItem.en ? `→ English: ${vocabItem.en}` : ""}`,
    };
  }
  return null;
}