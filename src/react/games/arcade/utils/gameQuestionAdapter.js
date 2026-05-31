/**
 * gameQuestionAdapter.js
 *
 * Converts the app's already-normalised pack data into runtime game objects.
 * It is intentionally data-driven: it never hardcodes a language, subject, or
 * question type — it works off the generic vocab word shape and builder card
 * shape produced by `data.js` (loadVocabItems / loadSentenceBuilderPack).
 *
 * Output shapes
 * -------------
 * Quiz Hunt:
 *   { id, mode:"quiz-hunt", questionText, correctAnswer, distractors:[..3],
 *     speechText, speechLanguage, wordId }
 *
 * Snake Builder:
 *   { id, mode:"snake-builder", sentence, answer,
 *     tokens:[{ text, order }], distractors:[..], speechLanguage, itemId }
 */
import { shuffle, normalizeForCompare } from "@/utils.js";

/** Pick up to `n` distinct distractors from `pool`, excluding `exclude` values. */
function pickDistractors(pool, n, exclude) {
  const seen = new Set(exclude.map(normalizeForCompare));
  const out = [];
  for (const value of shuffle(pool)) {
    const key = normalizeForCompare(value);
    if (!value || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= n) break;
  }
  return out;
}

/**
 * Build Quiz Hunt questions from normalised vocab words.
 *
 * @param {object[]} words   word objects: { id, de, en, topic, ... }
 * @param {object}   opts
 * @param {"prompt-en"|"prompt-src"} [opts.direction]
 *        "prompt-en"  → show `en` (English/definition), collect `de` (term/source word)
 *        "prompt-src" → show `de`, collect `en`
 * @param {number}   [opts.distractorCount=3]
 * @param {string}   [opts.speechLanguage]
 * @returns {object[]} quiz-hunt question objects (filtered to those with valid prompt+answer)
 */
export function buildQuizHuntQuestions(words, opts = {}) {
  const { direction = "prompt-en", distractorCount = 3, speechLanguage = "en-GB" } = opts;
  const promptKey = direction === "prompt-src" ? "de" : "en";
  const answerKey = direction === "prompt-src" ? "en" : "de";

  const answerPool = words.map((w) => w[answerKey]).filter(Boolean);

  return words
    .map((w) => {
      const questionText = (w[promptKey] || "").trim();
      const correctAnswer = (w[answerKey] || "").trim();
      if (!questionText || !correctAnswer) return null;
      const distractors = pickDistractors(answerPool, distractorCount, [correctAnswer]);
      // Need at least 1 distractor to be a meaningful hunt; skip otherwise.
      if (distractors.length === 0) return null;
      return {
        id: `qh_${w.id}`,
        mode: "quiz-hunt",
        questionText,
        correctAnswer,
        distractors,
        topic: w.topic || "",
        // Speech reads the answer side (the language being learned where applicable).
        speechText: correctAnswer,
        speechLanguage,
        wordId: w.id,
      };
    })
    .filter(Boolean);
}

/**
 * Build Snake Builder questions from normalised builder cards.
 *
 * @param {object[]} cards  builder cards: { id, prompt, answer, tiles:[...] }
 * @param {object}   opts
 * @param {string}   [opts.speechLanguage]
 * @returns {object[]} snake-builder question objects (need >= 2 tokens)
 */
export function buildSnakeBuilderQuestions(cards, opts = {}) {
  const { speechLanguage = "en-GB" } = opts;
  return cards
    .map((c) => {
      const tiles = Array.isArray(c.tiles) ? c.tiles.filter((t) => String(t).trim()) : [];
      if (tiles.length < 2) return null;
      return {
        id: `sb_${c.id}`,
        mode: "snake-builder",
        sentence: c.prompt || c.answer || "",
        answer: c.answer || tiles.join(" "),
        tokens: tiles.map((text, i) => ({ text, order: i + 1 })),
        speechText: c.answer || tiles.join(" "),
        speechLanguage,
        itemId: c.id,
      };
    })
    .filter(Boolean);
}

/**
 * Generate "decoy" tokens for snake-builder so the map isn't only correct words.
 * Pulls plausible distractor words from other questions' tokens.
 */
export function snakeBuilderDecoys(allQuestions, currentTokens, n) {
  const pool = allQuestions.flatMap((q) => (q.tokens || []).map((t) => t.text));
  return pickDistractors(pool, n, currentTokens.map((t) => t.text));
}
