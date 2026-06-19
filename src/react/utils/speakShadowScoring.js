import { normalizeForSpeechCompare, tokenizePhrase } from "./speakShadowSegmenter.js";

const GERMAN_ARTICLES = new Set(["der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer", "eines"]);

const ZH_HK_EQUIVALENTS = [
  ["稀世", "欺世"],
  ["翠玉", "脆玉"],
  ["傳家寶", "传家宝"],
];

const JA_EQUIVALENTS = [
  ["学校", "がっこう", "ガッコウ"],
  ["猫", "ねこ", "ネコ"],
  ["私", "わたし", "ワタシ"],
  ["行きます", "いきます"],
];

const EN_CONTRACTIONS = [
  ["don't", "do not"],
  ["doesn't", "does not"],
  ["didn't", "did not"],
  ["can't", "cannot"],
  ["won't", "will not"],
  ["i'm", "i am"],
  ["you're", "you are"],
  ["he's", "he is"],
  ["she's", "she is"],
  ["it's", "it is"],
  ["we're", "we are"],
  ["they're", "they are"],
  ["i've", "i have"],
  ["we've", "we have"],
  ["they've", "they have"],
  ["i'll", "i will"],
  ["you'll", "you will"],
  ["we'll", "we will"],
  ["they'll", "they will"],
];

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

function stripDiacritics(text) {
  return String(text || "").normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function normalizeLatinBase(text) {
  return stripDiacritics(String(text || "").toLowerCase())
    .replace(/[’']/g, "")
    .replace(/[!?.,;:()[\]{}"“”¿¡]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expandEnglishContractions(text) {
  let value = String(text || "").toLowerCase();
  for (const [short, expanded] of EN_CONTRACTIONS) {
    value = value.replace(new RegExp(`\\b${short.replace("'", "[’']")}\\b`, "g"), expanded);
  }
  return value;
}

function normalizeGerman(text) {
  return String(text || "")
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[!?.,;:()[\]{}"“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeJapanese(text) {
  return String(text || "")
    .normalize("NFC")
    .replace(/[!?.,;:，。！？；：、"'`()[\]{}「」『』]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function canonicalizeEquivalent(text, groups) {
  let value = String(text || "");
  for (const group of groups) {
    const canonical = group[0];
    for (const item of group) {
      value = value.split(item).join(canonical);
    }
  }
  return value;
}

function getNormalizer(language) {
  if (language === "de") return normalizeGerman;
  if (language === "ja") return normalizeJapanese;
  if (language === "zh") return (text) => normalizeForSpeechCompare(text, "zh");
  if (language === "en") return (text) => normalizeLatinBase(expandEnglishContractions(text));
  if (["fr", "es", "it"].includes(language)) return normalizeLatinBase;
  return (text) => normalizeForSpeechCompare(text, language);
}

function getEquivalentNormalizer(language, voiceLocale) {
  const normalizedVoice = String(voiceLocale || "").toLowerCase();
  if (language === "zh" && (normalizedVoice.includes("hk") || normalizedVoice.includes("yue") || !normalizedVoice)) {
    return (text) => normalizeForSpeechCompare(canonicalizeEquivalent(text, ZH_HK_EQUIVALENTS), "zh");
  }
  if (language === "ja") {
    return (text) => normalizeJapanese(canonicalizeEquivalent(text, JA_EQUIVALENTS));
  }
  return null;
}

function tokenMatches(expectedToken, transcriptTokens, language) {
  return transcriptTokens.some((token) => {
    if (token === expectedToken) return true;
    if (language === "de" && (GERMAN_ARTICLES.has(expectedToken) || GERMAN_ARTICLES.has(token))) return false;
    return expectedToken.length > 4 && token.length > 4 && levenshteinDistance(expectedToken, token) <= 1;
  });
}

function similarityScore(expected, transcript, language, normalizer = getNormalizer(language)) {
  const normalizedExpected = normalizer(expected);
  const normalizedTranscript = normalizer(transcript);
  if (!normalizedExpected || !normalizedTranscript) return 0;
  if (normalizedExpected === normalizedTranscript) return 1;

  const charBase = Math.max(normalizedExpected.length, normalizedTranscript.length, 1);
  const charSimilarity = Math.max(0, 1 - (levenshteinDistance(normalizedExpected, normalizedTranscript) / charBase));
  const expectedTokens = tokenizePhrase(normalizedExpected, language).filter(Boolean);
  const transcriptTokens = tokenizePhrase(normalizedTranscript, language).filter(Boolean);
  if (!expectedTokens.length || !transcriptTokens.length) return charSimilarity;
  const matched = expectedTokens.filter((token) => tokenMatches(token, transcriptTokens, language)).length;
  const tokenSimilarity = matched / Math.max(expectedTokens.length, transcriptTokens.length);
  return Math.max(charSimilarity, tokenSimilarity);
}

function tokenDiff(expected, transcript, language, normalizer = getNormalizer(language)) {
  const expectedTokens = tokenizePhrase(normalizer(expected), language).filter(Boolean);
  const transcriptTokens = tokenizePhrase(normalizer(transcript), language).filter(Boolean);
  const missingTokens = expectedTokens.filter((token) => !tokenMatches(token, transcriptTokens, language)).slice(0, 8);
  const extraTokens = transcriptTokens.filter((token) => !tokenMatches(token, expectedTokens, language)).slice(0, 8);
  return { missingTokens, extraTokens };
}

function orderedTokenScore(expectedTokens, transcriptTokens, language) {
  if (!expectedTokens.length || !transcriptTokens.length) return 0;
  let matched = 0;
  let cursor = 0;
  for (const expectedToken of expectedTokens) {
    const index = transcriptTokens.findIndex((token, offset) => offset >= cursor && tokenMatches(expectedToken, [token], language));
    if (index >= cursor) {
      matched += 1;
      cursor = index + 1;
    }
  }
  return matched / expectedTokens.length;
}

function requiredTokenScore(requiredTokens, transcriptTokens, language) {
  if (!requiredTokens.length) return 1;
  const matched = requiredTokens.filter((token) => tokenMatches(token, transcriptTokens, language)).length;
  return matched / requiredTokens.length;
}

function buildHint({ passed, missingTokens, requiredTokenScore: keywordScore, confidenceScore }) {
  if (passed) return "Great! Next sentence.";
  if (confidenceScore !== null && confidenceScore < 0.35) return "I could not hear clearly. Try speaking a little closer to the microphone.";
  if (missingTokens.length) return `Almost - try the key words: ${missingTokens.slice(0, 4).join(", ")}.`;
  if (keywordScore < 0.75) return "Almost - try the bold words again.";
  return "Good try. Read it again slowly.";
}

function nextActionForScore({ passed, confidenceScore, missingTokens }) {
  if (passed) return "advance";
  if (confidenceScore !== null && confidenceScore < 0.35) return "manual_or_retry";
  if (missingTokens.length > 3) return "replay_with_hint";
  return "retry";
}

function scoreOneTranscript({ expected, transcript, confidence, language, voiceLocale, settings, source }) {
  const normalizer = getNormalizer(language);
  const equivalentNormalizer = getEquivalentNormalizer(language, voiceLocale);
  const expectedPhrase = typeof expected === "object" && expected !== null ? expected : null;
  const rawExpected = String(expectedPhrase?.speechTarget || expectedPhrase?.text || expected || "").trim();
  const rawTranscript = String(transcript || "").trim();
  const normalizedExpected = normalizer(rawExpected);
  const normalizedTranscript = normalizer(rawTranscript);
  const numericConfidence = Number.isFinite(confidence) ? confidence : null;
  const minSimilarity = settings.minSimilarity ?? 0.85;
  const minConfidence = settings.minConfidence ?? 0.6;
  const confidencePasses = numericConfidence === null || numericConfidence >= minConfidence;
  const expectedTokens = tokenizePhrase(normalizedExpected, language).filter(Boolean);
  const transcriptTokens = tokenizePhrase(normalizedTranscript, language).filter(Boolean);
  const strictTokens = language === "de" ? expectedTokens.filter((token) => GERMAN_ARTICLES.has(token)) : [];
  const requiredTokens = Array.isArray(expectedPhrase?.requiredTokens) && expectedPhrase.requiredTokens.length
    ? expectedPhrase.requiredTokens.map((token) => normalizer(token)).filter(Boolean)
    : expectedTokens.filter((token) => token.length > 3 || strictTokens.includes(token));
  let similarity = similarityScore(rawExpected, rawTranscript, language, normalizer);
  let matchType = "similarity";

  if (rawExpected && rawExpected === rawTranscript) {
    similarity = 1;
    matchType = "exact";
  } else if (normalizedExpected && normalizedExpected === normalizedTranscript) {
    similarity = Math.max(similarity, 0.95);
    matchType = source === "alternative" ? "alternative" : "normalized";
  } else if (equivalentNormalizer) {
    const equivalentExpected = equivalentNormalizer(rawExpected);
    const equivalentTranscript = equivalentNormalizer(rawTranscript);
    if (equivalentExpected && equivalentExpected === equivalentTranscript) {
      similarity = Math.max(similarity, 0.88);
      matchType = "equivalent";
    }
  }

  if (source === "alternative" && matchType !== "equivalent" && similarity >= minSimilarity) {
    matchType = "alternative";
    similarity = Math.max(similarity, 0.9);
  }

  const keywordScore = requiredTokenScore(requiredTokens, transcriptTokens, language);
  const orderScore = orderedTokenScore(expectedTokens, transcriptTokens, language);
  const strictTokenScore = strictTokens.length ? requiredTokenScore(strictTokens, transcriptTokens, language) : 1;
  const confidenceScore = numericConfidence;
  const characterScore = similarity;
  const overallScore = Math.max(
    similarity,
    Math.min(1, (keywordScore * 0.45) + (orderScore * 0.25) + (characterScore * 0.3)),
  );
  const requiredGatePasses = !requiredTokens.length || keywordScore >= 0.75;
  const strictGatePasses = strictTokenScore >= 1;
  const passed = (
    (similarity >= minSimilarity || (overallScore >= minSimilarity && requiredGatePasses))
    && confidencePasses
    && strictGatePasses
  );
  const diffNormalizer = matchType === "equivalent" && equivalentNormalizer ? equivalentNormalizer : normalizer;
  const { missingTokens, extraTokens } = tokenDiff(rawExpected, rawTranscript, language, diffNormalizer);
  const requiredMissing = requiredTokens.filter((token) => !tokenMatches(token, transcriptTokens, language));
  const feedbackLevel = passed ? "success" : requiredMissing.length ? "hint" : "retry";
  const hint = buildHint({
    passed,
    missingTokens: requiredMissing.length ? requiredMissing : missingTokens,
    requiredTokenScore: keywordScore,
    confidenceScore,
  });

  return {
    transcript: rawTranscript,
    similarity,
    overallScore,
    similarityScore: similarity,
    requiredTokenScore: keywordScore,
    orderScore,
    confidenceScore,
    confidence: numericConfidence,
    passed,
    matchType,
    source,
    feedbackLevel,
    missingTokens: (requiredMissing.length ? requiredMissing : missingTokens).slice(0, 8),
    extraTokens,
    hint,
    nextAction: nextActionForScore({ passed, confidenceScore, missingTokens: requiredMissing.length ? requiredMissing : missingTokens }),
    feedback: hint,
  };
}

export function scoreSpeakShadowAttempt({
  expected,
  transcript,
  confidence,
  alternatives = [],
  language,
  voiceLocale = "",
  settings = {},
}) {
  const transcriptOptions = [
    { transcript, confidence, source: "primary" },
    ...(Array.isArray(alternatives) ? alternatives : []).map((option) => ({
      transcript: option?.transcript,
      confidence: Number.isFinite(option?.confidence) ? option.confidence : confidence,
      source: "alternative",
    })),
  ]
    .map((option) => ({
      ...option,
      transcript: String(option.transcript || "").trim(),
    }))
    .filter((option, index, all) => (
      option.transcript && all.findIndex((item) => item.transcript === option.transcript) === index
    ));

  const scored = transcriptOptions.map((option) => scoreOneTranscript({
    expected,
    transcript: option.transcript,
    confidence: option.confidence,
    language,
    voiceLocale,
    settings,
    source: option.source,
  }));

  return scored.sort((left, right) => (
    Number(right.passed) - Number(left.passed)
    || (right.similarity - left.similarity)
    || ((right.confidence || 0) - (left.confidence || 0))
  ))[0] || scoreOneTranscript({
    expected,
    transcript,
    confidence,
    language,
    voiceLocale,
    settings,
    source: "primary",
  });
}
