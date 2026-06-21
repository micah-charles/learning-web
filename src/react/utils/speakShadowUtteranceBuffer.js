import { normalizeForSpeechCompare, tokenizePhrase } from "./speakShadowSegmenter.js";
import { scoreSpeakShadowAttempt } from "./speakShadowScoring.js";

const CJK_LANGS = new Set(["zh", "ja"]);

function normalizeBufferLanguage(language) {
  const id = String(language?.id || language || "en").toLowerCase();
  if (id.startsWith("zh") || id.startsWith("yue") || id.startsWith("cmn")) return "zh";
  if (id.startsWith("ja")) return "ja";
  return id.split("-")[0] || "en";
}

function isCjkLanguage(language) {
  return CJK_LANGS.has(normalizeBufferLanguage(language));
}

export function joinUtteranceChunks(chunks = [], language = "en") {
  const cleaned = chunks.map((chunk) => String(chunk || "").trim()).filter(Boolean);
  if (isCjkLanguage(language)) return cleaned.join("");
  return cleaned.join(" ").replace(/\s+/g, " ").trim();
}

function completionRatio(expected, transcript, language) {
  const compareLanguage = normalizeBufferLanguage(language);
  const normalizedExpected = normalizeForSpeechCompare(expected?.speechTarget || expected?.text || expected || "", compareLanguage);
  const normalizedTranscript = normalizeForSpeechCompare(transcript, compareLanguage);
  if (!normalizedExpected || !normalizedTranscript) return 0;
  if (isCjkLanguage(compareLanguage)) {
    return Math.min(1, normalizedTranscript.length / Math.max(normalizedExpected.length, 1));
  }
  const expectedTokens = tokenizePhrase(normalizedExpected, compareLanguage).filter(Boolean);
  const transcriptTokens = tokenizePhrase(normalizedTranscript, compareLanguage).filter(Boolean);
  if (!expectedTokens.length) return 0;
  return Math.min(1, transcriptTokens.length / expectedTokens.length);
}

function isLikelyPrefix(expected, transcript, language) {
  const compareLanguage = normalizeBufferLanguage(language);
  const normalizedExpected = normalizeForSpeechCompare(expected?.speechTarget || expected?.text || expected || "", compareLanguage);
  const normalizedTranscript = normalizeForSpeechCompare(transcript, compareLanguage);
  if (!normalizedExpected || !normalizedTranscript) return false;
  if (normalizedExpected.startsWith(normalizedTranscript)) return true;
  if (isCjkLanguage(compareLanguage)) return normalizedExpected.includes(normalizedTranscript) && normalizedTranscript.length <= normalizedExpected.length;
  const expectedTokens = tokenizePhrase(normalizedExpected, compareLanguage).filter(Boolean);
  const transcriptTokens = tokenizePhrase(normalizedTranscript, compareLanguage).filter(Boolean);
  if (!transcriptTokens.length) return false;
  return transcriptTokens.every((token, index) => expectedTokens[index] === token);
}

export function evaluateBufferedUtterance({
  expected,
  chunks = [],
  confidence = null,
  alternatives = [],
  language = "en",
  voiceLocale = "",
  settings = {},
  forceFinalize = false,
} = {}) {
  const combinedTranscript = joinUtteranceChunks(chunks, language);
  const score = scoreSpeakShadowAttempt({
    expected,
    transcript: combinedTranscript,
    confidence,
    alternatives,
    language,
    voiceLocale,
    settings,
  });
  const chunkCount = chunks.filter((chunk) => String(chunk || "").trim()).length;
  const ratio = completionRatio(expected, combinedTranscript, language);
  const maxChunks = settings.maxUtteranceChunks ?? 3;
  const minRatio = settings.minCompletionRatioBeforeFail ?? 0.65;
  const maxIncompleteRatio = settings.maxIncompleteCompletionRatio ?? 0.92;
  const likelyPrefix = isLikelyPrefix(expected, combinedTranscript, language);
  const canWaitForContinuation = (
    Boolean(settings.waitForContinuationIfTooShort ?? true)
    && chunkCount < maxChunks
    && likelyPrefix
    && (
      ratio < minRatio
      || (
        ratio < maxIncompleteRatio
        && (score.requiredTokenScore < 1 || score.missingTokens?.length > 0)
        && score.orderScore >= 0.75
      )
    )
  );

  if (!canWaitForContinuation && score.passed && (settings.scorePartialImmediatelyIfPass ?? true)) {
    return {
      status: "pass",
      combinedTranscript,
      score,
      completionRatio: ratio,
      chunkCount,
    };
  }

  if (!forceFinalize && canWaitForContinuation) {
    return {
      status: "pendingContinuation",
      combinedTranscript,
      score: {
        ...score,
        passed: false,
        feedbackLevel: "continue",
        hint: "Keep going...",
        nextAction: "continue",
        feedback: "Keep going...",
      },
      completionRatio: ratio,
      chunkCount,
    };
  }

  return {
    status: "fail",
    combinedTranscript,
    score,
    completionRatio: ratio,
    chunkCount,
  };
}
