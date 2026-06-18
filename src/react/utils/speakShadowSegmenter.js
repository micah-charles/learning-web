import { normalizeForCompare } from "@/utils.js";
import {
  getSpeakShadowLanguage,
  getSpeakShadowLanguageByLocale,
  PHRASE_LENGTHS,
  PHRASE_STATUS,
} from "./speakShadowConfig.js";

const SENTENCE_ENDINGS = new Set([".", "?", "!", ";", ":", "。", "！", "？", "；", "："]);
const PHRASE_BREAKS = new Set([",", ";", ":", "，", "、", "；", "："]);
const CJK_LANGS = new Set(["zh", "zh-Hant", "ja"]);

function makeSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `speak-shadow-${crypto.randomUUID()}`;
  }
  return `speak-shadow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isCjkLanguage(language) {
  const id = typeof language === "string" ? language : language?.id;
  return CJK_LANGS.has(id);
}

export function normalizeForSpeechCompare(text, language = "en") {
  const value = String(text || "")
    .normalize("NFC")
    .replace(/[!?.,;:，。！？；：、"'`()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (isCjkLanguage(language)) {
    return value.replace(/\s+/g, "");
  }
  return normalizeForCompare(value);
}

export function tokenizePhrase(phrase, language = "en") {
  const text = String(phrase || "").trim();
  if (!text) return [];

  if (isCjkLanguage(language)) {
    const locale = getSpeakShadowLanguage(language).ttsLang;
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      return [...new Intl.Segmenter(locale, { granularity: "word" }).segment(text)]
        .map((part) => part.segment.trim())
        .filter(Boolean);
    }
    return [...text].filter((char) => char.trim());
  }

  return text.match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) || [];
}

function tokenCount(text, language) {
  return tokenizePhrase(text, language).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

function splitByCharacterSet(text, breakSet) {
  const chunks = [];
  let current = "";
  for (const char of String(text || "")) {
    current += char;
    if (breakSet.has(char)) {
      const trimmed = current.trim();
      if (trimmed) chunks.push(trimmed);
      current = "";
    }
  }
  const rest = current.trim();
  if (rest) chunks.push(rest);
  return chunks;
}

export function splitIntoSentences(text) {
  const normalised = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{2,}/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalised) return [];
  return splitByCharacterSet(normalised, SENTENCE_ENDINGS);
}

function splitLongTokenRun(tokens, maxTokens) {
  const chunks = [];
  for (let i = 0; i < tokens.length; i += maxTokens) {
    const chunk = tokens.slice(i, i + maxTokens).join(" ").replace(/\s+([!?.,;:])/g, "$1").trim();
    if (chunk) chunks.push(chunk);
  }
  return chunks;
}

export function splitSentenceIntoPhrases(sentence, language = "en", maxTokens = PHRASE_LENGTHS.medium.maxTokens) {
  if (tokenCount(sentence, language) <= maxTokens) return [sentence.trim()].filter(Boolean);
  const phraseChunks = splitByCharacterSet(sentence, PHRASE_BREAKS);
  const phrases = [];

  for (const chunk of phraseChunks) {
    if (tokenCount(chunk, language) <= maxTokens) {
      phrases.push(chunk);
      continue;
    }
    const tokens = tokenizePhrase(chunk, language);
    if (isCjkLanguage(language)) {
      for (let i = 0; i < tokens.length; i += maxTokens) {
        const text = tokens.slice(i, i + maxTokens).join("").trim();
        if (text) phrases.push(text);
      }
    } else {
      phrases.push(...splitLongTokenRun(tokens, maxTokens));
    }
  }

  return phrases.filter(Boolean);
}

export function getSpeakShadowTextLimit(text, language = "en") {
  const value = String(text || "").trim();
  if (!value) return { ok: true, count: 0, limit: isCjkLanguage(language) ? 3000 : 1000, unit: isCjkLanguage(language) ? "characters" : "words" };
  if (isCjkLanguage(language)) {
    const count = [...value.replace(/\s+/g, "")].length;
    return { ok: count <= 3000, count, limit: 3000, unit: "characters" };
  }
  const count = value.split(/\s+/).filter(Boolean).length;
  return { ok: count <= 1000, count, limit: 1000, unit: "words" };
}

export function createSpeakShadowSession({ title, text, language = "en", phraseLength = "medium", savedToBrowser = true, sourceType = "pasted_text", sourcePackageId = null }) {
  const languageConfig = getSpeakShadowLanguage(language);
  const lengthConfig = PHRASE_LENGTHS[phraseLength] || PHRASE_LENGTHS.medium;
  const sentences = splitIntoSentences(text);
  const phrases = sentences.flatMap((sentence) => splitSentenceIntoPhrases(sentence, languageConfig.id, lengthConfig.maxTokens));
  const now = new Date().toISOString();
  const sessionId = makeSessionId();

  return {
    schemaVersion: 1,
    type: "speak_shadow_session",
    sessionId,
    title: title?.trim() || "Read-aloud practice",
    sourceType,
    sourcePackageId,
    language: languageConfig.id,
    ttsLang: languageConfig.ttsLang,
    recognitionLang: languageConfig.recognitionLang,
    createdAt: now,
    lastOpenedAt: now,
    savedToBrowser,
    currentPhraseId: "phrase-001",
    settings: {
      phraseLength,
      maxTokensPerPhrase: lengthConfig.maxTokens,
      minSimilarity: 0.85,
      minConfidence: 0.6,
      autoPlayTutor: true,
      autoAdvanceOnPass: true,
    },
    phrases: phrases.map((phrase, index) => ({
      id: `phrase-${String(index + 1).padStart(3, "0")}`,
      text: phrase,
      tokens: tokenizePhrase(phrase, languageConfig.id),
      expectedNormalized: normalizeForSpeechCompare(phrase, languageConfig.id),
      status: index === 0 ? PHRASE_STATUS.CURRENT : PHRASE_STATUS.NOT_STARTED,
      attempts: [],
    })),
  };
}

function textFromReadAloudItem(item) {
  return item?.expectedAnswer || item?.sourceText || item?.targetText || item?.text || item?.sentence || item?.data?.expectedAnswer || item?.data?.sourceText || item?.data?.targetText || "";
}

export function createSpeakShadowSessionFromPack({ pack, title, language, savedToBrowser = true }) {
  const items = Array.isArray(pack?.items) ? pack.items : Array.isArray(pack) ? pack : [];
  const readable = items
    .map((item) => textFromReadAloudItem(item))
    .filter(Boolean)
    .join(" ");
  const resolvedLanguage = language || getSpeakShadowLanguageByLocale(pack?.locale || pack?.speechLanguage || pack?.sourceLanguageCode).id;
  return createSpeakShadowSession({
    title: title || pack?.title || pack?.displayName || "Imported read-aloud practice",
    text: readable,
    language: resolvedLanguage,
    savedToBrowser,
    sourceType: "json_package",
    sourcePackageId: pack?.packId || pack?.id || null,
  });
}

export function ensureSpeakShadowSession(input, { savedToBrowser = true } = {}) {
  if (input?.type === "speak_shadow_session" && Array.isArray(input.phrases)) {
    const languageConfig = getSpeakShadowLanguage(input.language);
    return {
      ...input,
      savedToBrowser,
      ttsLang: input.ttsLang || languageConfig.ttsLang,
      recognitionLang: input.recognitionLang || languageConfig.recognitionLang,
      lastOpenedAt: new Date().toISOString(),
      phrases: input.phrases.map((phrase, index) => ({
        id: phrase.id || `phrase-${String(index + 1).padStart(3, "0")}`,
        text: phrase.text || "",
        tokens: phrase.tokens || tokenizePhrase(phrase.text || "", input.language),
        expectedNormalized: phrase.expectedNormalized || normalizeForSpeechCompare(phrase.text || "", input.language),
        status: index === 0 ? PHRASE_STATUS.CURRENT : phrase.status || PHRASE_STATUS.NOT_STARTED,
        attempts: Array.isArray(phrase.attempts) ? phrase.attempts : [],
      })),
    };
  }
  return createSpeakShadowSessionFromPack({ pack: input, savedToBrowser });
}
