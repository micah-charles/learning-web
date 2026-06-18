import { normalizeForSpeechCompare, tokenizePhrase } from "./speakShadowSegmenter.js";

function levenshteinDistance(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  const matrix = Array.from({ length: right.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= left.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= right.length; i += 1) {
    for (let j = 1; j <= left.length; j += 1) {
      matrix[i][j] = left[j - 1] === right[i - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[right.length][left.length];
}

function tokenMatches(expectedToken, transcriptTokens) {
  return transcriptTokens.some((token) => token === expectedToken || levenshteinDistance(expectedToken, token) <= 1);
}

function similarityScore(expected, transcript, language) {
  const normalizedExpected = normalizeForSpeechCompare(expected, language);
  const normalizedTranscript = normalizeForSpeechCompare(transcript, language);
  if (!normalizedExpected || !normalizedTranscript) return 0;
  if (normalizedExpected === normalizedTranscript) return 1;

  const charBase = Math.max(normalizedExpected.length, normalizedTranscript.length, 1);
  const charSimilarity = Math.max(0, 1 - (levenshteinDistance(normalizedExpected, normalizedTranscript) / charBase));
  const expectedTokens = tokenizePhrase(normalizedExpected, language).filter(Boolean);
  const transcriptTokens = tokenizePhrase(normalizedTranscript, language).filter(Boolean);
  if (!expectedTokens.length || !transcriptTokens.length) return charSimilarity;
  const matched = expectedTokens.filter((token) => tokenMatches(token, transcriptTokens)).length;
  const tokenSimilarity = matched / Math.max(expectedTokens.length, transcriptTokens.length);
  return Math.max(charSimilarity, tokenSimilarity);
}

function tokenDiff(expected, transcript, language) {
  const expectedTokens = tokenizePhrase(normalizeForSpeechCompare(expected, language), language).filter(Boolean);
  const transcriptTokens = tokenizePhrase(normalizeForSpeechCompare(transcript, language), language).filter(Boolean);
  const missingTokens = expectedTokens.filter((token) => !tokenMatches(token, transcriptTokens)).slice(0, 8);
  const extraTokens = transcriptTokens.filter((token) => !tokenMatches(token, expectedTokens)).slice(0, 8);
  return { missingTokens, extraTokens };
}

export function scoreSpeakShadowAttempt({ expected, transcript, confidence, language, settings = {} }) {
  const similarity = similarityScore(expected, transcript, language);
  const numericConfidence = Number.isFinite(confidence) ? confidence : null;
  const minSimilarity = settings.minSimilarity ?? 0.85;
  const minConfidence = settings.minConfidence ?? 0.6;
  const confidencePasses = numericConfidence === null || numericConfidence >= minConfidence;
  const passed = similarity >= minSimilarity && confidencePasses;
  const { missingTokens, extraTokens } = tokenDiff(expected, transcript, language);

  return {
    similarity,
    confidence: numericConfidence,
    passed,
    missingTokens,
    extraTokens,
    feedback: passed ? "Good match" : "Try that phrase again",
  };
}
