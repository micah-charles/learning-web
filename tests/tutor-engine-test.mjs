import assert from "node:assert/strict";
import MiniSearch from "minisearch";

/**
 * Test the MiniSearch dedup behavior (simulating the defensive dedup
 * added to studybookIndex.js initMiniSearch).
 */
{
  const chunks = [
    { id: "pack1|path1|intro|1|0", heading: "Intro", content: "Introduction content here" },
    { id: "pack1|path1|intro|1|0", heading: "Intro (duplicate)", content: "Duplicate content" },
    { id: "pack1|path1|details|2|1", heading: "Details", content: "Details content here" },
  ];

  const ms = new MiniSearch({
    fields: ["content", "heading"],
    storeFields: ["id", "heading", "content"],
    extractField: (doc, fn) => doc[fn],
  });

  const seen = new Set();
  const uniqueChunks = [];
  for (const chunk of chunks) {
    if (seen.has(chunk.id)) {
      continue;
    }
    seen.add(chunk.id);
    uniqueChunks.push(chunk);
  }

  assert.equal(uniqueChunks.length, 2, "Should deduplicate from 3 to 2 chunks");

  ms.addAll(uniqueChunks);
  const results = ms.search("content");
  assert.equal(results.length, 2, "Should find results from 2 unique chunks");
  assert.ok(results.every(r => r.score > 0), "All results should have positive scores");
}

/**
 * Test study book index loader avoids `force-cache`, which can preserve a stale
 * broken index after the search generator has been fixed.
 */
{
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    return {
      ok: true,
      async json() {
        return { chunks: [], version: 1, generatedAt: "2026-06-12T00:00:00.000Z" };
      },
    };
  };

  try {
    const { loadStudyBookIndex } = await import("../src/features/tutor/studybookIndex.js");
    const index = await loadStudyBookIndex();
    assert.equal(index.version, 1, "Should load the mocked index");
    assert.equal(calls.length, 1, "Should fetch the index once");
    assert.equal(calls[0].url, "/search/studybook-index.json", "Production-style loads should use the canonical index URL");
    assert.equal(calls[0].options.cache, "no-cache", "Study book index should revalidate instead of force-caching");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

/**
 * Test wantsExplanation helper from tutorEngine.js.
 */
{
  const { wantsExplanation } = await import("../src/features/tutor/tutorEngine.js");

  // Not a follow-up if no hint was given
  assert.equal(wantsExplanation("why is it accusative", false), false);

  // Explanation pattern matched with hintGiven
  assert.equal(wantsExplanation("why is it accusative", true), true);
  assert.equal(wantsExplanation("explain this answer", true), true);
  assert.equal(wantsExplanation("show me the answer", true), true);

  // Non-explanation query even with hintGiven
  assert.equal(wantsExplanation("hello", true), false);
  assert.equal(wantsExplanation("what is the meaning of Bildung", true), false);
}

/**
 * Test tokenizeQuery from tutorRetrieval.js.
 */
{
  const { tokenizeQuery, scoreText, extractSnippets } = await import("../src/features/tutor/tutorRetrieval.js");

  const tokens = tokenizeQuery("What is the meaning of Bildung?");
  assert.ok(Array.isArray(tokens), "tokenizeQuery should return array");
  assert.ok(tokens.length > 0, "Should produce tokens from query");
  assert.ok(tokens.every(t => t.length > 1), "All tokens should be longer than 1 char");

  const emptyTokens = tokenizeQuery("");
  assert.equal(emptyTokens.length, 0, "Empty query should produce no tokens");

  const stopOnly = tokenizeQuery("the a an");
  assert.equal(stopOnly.length, 0, "Only stop words should produce no tokens");

  // scoreText
  const score = scoreText("accusative case in German grammar", ["accusative", "case"]);
  assert.ok(score > 0, "scoreText should return positive score for matching text");

  const noMatch = scoreText("nominative subject", ["accusative"]);
  assert.equal(noMatch, 0, "scoreText should return 0 for non-matching text");

  // extractSnippets
  const text = "The accusative case is used for the direct object of a sentence. The nominative case is for the subject.";
  const snippets = extractSnippets(text, ["accusative"], 1, 20);
  assert.ok(Array.isArray(snippets), "extractSnippets should return array");
  assert.ok(snippets.length <= 1, "Should return at most 1 snippet with maxSnippets=1");
}

/**
 * Test generateTutorResponse with no pack open (dataset=null).
 * Should return "couldn't find" message instead of old refusal.
 */
{
  const { generateTutorResponse, ResponseType } = await import("../src/features/tutor/tutorEngine.js");

  const result = await generateTutorResponse({
    query: "tell me about coastal",
    manifest: null,
    dataset: null,
    quizSession: null,
    readingPassage: null,
    readingTargetText: null,
    studyBookHtml: null,
    vocabItems: null,
    hintGivenForCurrentQuestion: false,
    speechMode: "toggle",
    semanticSearch: false,
    speechLang: "en-GB",
  });

  // Should not say "I can only help with the current pack"
  assert.ok(!result.text.includes("I can only help"), "Should not contain old refusal message");

  // Should mention the query in the response
  assert.ok(result.text.includes("coastal"), "Response should mention the query term");

  // Should be a refusal type (not a normal response since no content found)
  assert.equal(result.type, ResponseType.REFUSAL, "Should return REFUSAL type");
}

/**
 * Test off-topic query still shows off-topic message.
 */
{
  const { generateTutorResponse, ResponseType } = await import("../src/features/tutor/tutorEngine.js");

  const result = await generateTutorResponse({
    query: "what is the weather today",
    manifest: null,
    dataset: null,
    quizSession: null,
    readingPassage: null,
    readingTargetText: null,
    studyBookHtml: null,
    vocabItems: null,
    hintGivenForCurrentQuestion: false,
    speechMode: "toggle",
    semanticSearch: false,
    speechLang: "en-GB",
  });

  // Off-topic + no content → show "I'm a study assistant" message
  assert.ok(result.text.includes("study assistant"), "Off-topic should show study assistant message");
  assert.equal(result.type, ResponseType.REFUSAL, "Off-topic should return REFUSAL");
}

/**
 * Test active quiz + unrelated query does NOT force a quiz hint.
 */
{
  const { generateTutorResponse, ResponseType } = await import("../src/features/tutor/tutorEngine.js");

  const result = await generateTutorResponse({
    query: "tell me about coastal erosion",
    manifest: null,
    dataset: { id: "german_ks3", subject: "language", curriculum: "ks3", displayName: "German KS3" },
    quizSession: {
      questions: [{
        id: "q1",
        kind: "choice",
        prompt: "What case is 'der' in 'der Mann'?",
        answer: "nominative",
        options: ["nominative", "accusative", "dative"],
      }],
      index: 0,
    },
    readingPassage: null,
    readingTargetText: null,
    studyBookHtml: null,
    vocabItems: [],
    hintGivenForCurrentQuestion: false,
    speechMode: "toggle",
    semanticSearch: false,
    speechLang: "en-GB",
  });

  // Should NOT be a quiz hint (query doesn't match quiz content)
  assert.notEqual(result.type, ResponseType.HINT, "Should not return HINT for unrelated query");
  assert.notEqual(result.type, ResponseType.EXPLANATION, "Should not return EXPLANATION for unrelated query");
}

/**
 * Test fallback message includes the quoted query term.
 */
{
  const { generateTutorResponse } = await import("../src/features/tutor/tutorEngine.js");

  const result = await generateTutorResponse({
    query: "quantum physics",
    manifest: null,
    dataset: null,
    quizSession: null,
    readingPassage: null,
    readingTargetText: null,
    studyBookHtml: null,
    vocabItems: null,
    hintGivenForCurrentQuestion: false,
    speechMode: "toggle",
    semanticSearch: false,
    speechLang: "en-GB",
  });

  assert.ok(result.text.includes("quantum physics"), "Fallback should quote the exact query");
}

console.log("All tutor engine tests passed!");
