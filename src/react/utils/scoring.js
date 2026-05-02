/**
 * scoring.js
 *
 * Pure utility functions for quiz scoring.
 * No side effects, no state, no external dependencies.
 */

// ─── Normalisation helpers ──────────────────────────────────────────

function toNorm(str) {
  return (str || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[‑–]/g, "-")            // normalise dashes
    .replace(/['"'']/g, "'")          // normalise apostrophes
    .replace(/[,.:;!?]+/g, "")       // strip punctuation
    .replace(/\s+/g, " ");           // collapse whitespace
}

// ─── Core scoring ───────────────────────────────────────────────────

/**
 * Check if a selected answer is correct.
 * @param {string} selected   - the user's answer
 * @param {string|Array} correct - the correct answer (string) or array of accepted answers
 * @returns {boolean}
 */
export function isCorrectAnswer(selected, correct) {
  if (!correct) return false;
  const norm = toNorm(selected);
  const accepted = Array.isArray(correct) ? correct : [correct];
  return accepted.map(toNorm).includes(norm);
}

/**
 * Calculate score from an array of answer objects.
 * @param {Array} answers - [{ selected, correct, isCorrect }]
 * @returns {{score: number, total: number}}
 */
export function calculateScore(answers) {
  const total = answers.length;
  const score = answers.filter((a) => a.isCorrect).length;
  return { score, total };
}

/**
 * Get accuracy percentage.
 * @param {Array} answers - [{ selected, correct, isCorrect }]
 * @param {number} [decimals=1]
 * @returns {number} 0-100
 */
export function getAccuracy(answers, decimals = 1) {
  if (!answers || answers.length === 0) return 0;
  const { score, total } = calculateScore(answers);
  return Math.round((score / total) * 100 * 10 ** decimals) / 10 ** decimals;
}

/**
 * Get a human-readable grade label.
 * @param {number} accuracy - 0-100
 * @returns {{label: string, tone: "green"|"amber"|"coral"}}
 */
export function gradeLabel(accuracy) {
  if (accuracy >= 85) return { label: "Excellent", tone: "green" };
  if (accuracy >= 70) return { label: "Good", tone: "green" };
  if (accuracy >= 50) return { label: "Keep practising", tone: "amber" };
  return { label: "Needs review", tone: "coral" };
}

/**
 * Get the hardest questions (most wrong answers) from a session.
 * @param {Array} answers - [{ question, selected, correct, isCorrect, wordId }]
 * @param {Array} [sourceWords] - original word objects for context
 * @param {number} [limit=10]
 * @returns {Array}
 */
export function getHardestQuestions(answers, sourceWords = [], limit = 10) {
  return [...answers]
    .filter((a) => !a.isCorrect)
    .sort((a, b) => (b.wrongCount || 0) - (a.wrongCount || 0))
    .slice(0, limit)
    .map((a) => {
      const word = sourceWords.find((w) => w.id === a.wordId);
      return {
        ...a,
        sourceWord: word ? word.data?.sourceWord || word.de : a.question,
        targetWord: word ? word.data?.targetWord || word.en : a.correct,
      };
    });
}