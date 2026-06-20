import { normalizeForCompare } from "@/utils.js";
import {
  DEFAULT_SPEAK_SHADOW_SETTINGS,
  getSpeakShadowLanguage,
  getSpeakShadowLanguageByLocale,
  PHRASE_LENGTHS,
  PHRASE_STATUS,
  resolveSpeakShadowSpeech,
} from "./speakShadowConfig.js";

const SENTENCE_ENDINGS = new Set([".", "?", "!", ";", ":", "。", "！", "？", "；", "："]);
const PHRASE_BREAKS = new Set([",", ";", ":", "，", "、", "；", "："]);
const CJK_LANGS = new Set(["zh", "ja"]);
const SIMPLIFIED_TO_TRADITIONAL_CHINESE = {
  个: "個",
  进: "進",
  电: "電",
  梯: "梯",
  远: "遠",
  鲜: "鮮",
  圣: "聖",
  开: "開",
  这: "這",
  说: "說",
  为: "為",
  与: "與",
  会: "會",
  们: "們",
  听: "聽",
  读: "讀",
  语: "語",
  学: "學",
  习: "習",
  国: "國",
  时: "時",
  后: "後",
  发: "發",
  现: "現",
  过: "過",
  还: "還",
  头: "頭",
  里: "裡",
  间: "間",
  问: "問",
  门: "門",
  长: "長",
  车: "車",
  书: "書",
  东: "東",
  万: "萬",
  无: "無",
  业: "業",
  专: "專",
  传: "傳",
  变: "變",
  当: "當",
  实: "實",
  宝: "寶",
  对: "對",
  将: "將",
  尔: "爾",
  尽: "盡",
  层: "層",
  岁: "歲",
  带: "帶",
  广: "廣",
  应: "應",
  张: "張",
  录: "錄",
  总: "總",
  报: "報",
  换: "換",
  数: "數",
  旧: "舊",
  来: "來",
  机: "機",
  楼: "樓",
  欢: "歡",
  气: "氣",
  汉: "漢",
  没: "沒",
  泽: "澤",
  浅: "淺",
  温: "溫",
  湾: "灣",
  爱: "愛",
  画: "畫",
  礼: "禮",
  种: "種",
  称: "稱",
  简: "簡",
  给: "給",
  经: "經",
  统: "統",
  觉: "覺",
  观: "觀",
  让: "讓",
  讲: "講",
  论: "論",
  识: "識",
  诉: "訴",
  词: "詞",
  试: "試",
  话: "話",
  该: "該",
  请: "請",
  谁: "誰",
  调: "調",
  谢: "謝",
  贵: "貴",
  费: "費",
  赞: "讚",
  选: "選",
  钱: "錢",
  铁: "鐵",
  闻: "聞",
  队: "隊",
  难: "難",
  题: "題",
  风: "風",
  飞: "飛",
  饮: "飲",
  马: "馬",
  龙: "龍",
};

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
    .replace(/[\u3400-\u9fff]/gu, (char) => (language === "zh" ? SIMPLIFIED_TO_TRADITIONAL_CHINESE[char] || char : char))
    .replace(/[!?.,;:，。！？；：、"'`()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (isCjkLanguage(language)) {
    return value.replace(/\s+/g, "");
  }
  return normalizeForCompare(value);
}

export function normalizeTranscriptForDisplay(text, language = "en") {
  if (language !== "zh") return String(text || "");
  return String(text || "").replace(/[\u3400-\u9fff]/gu, (char) => SIMPLIFIED_TO_TRADITIONAL_CHINESE[char] || char);
}

export function tokenizePhrase(phrase, language = "en") {
  const text = String(phrase || "").trim();
  if (!text) return [];

  if (isCjkLanguage(language)) {
    const locale = language === "zh" ? "zh-HK" : getSpeakShadowLanguage(language).ttsLang;
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

function spokenTokens(text, language) {
  return tokenizePhrase(text, language).filter((token) => {
    if (isCjkLanguage(language)) return token.trim();
    return /[\p{L}\p{N}]/u.test(token);
  });
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

function mergeTooShortPhrases(phrases, language, minTokens, maxTokens, maxChars) {
  const merged = [];
  for (const phrase of phrases) {
    const last = merged[merged.length - 1];
    const joined = last ? `${last} ${phrase}`.replace(/\s+([!?.,;:，。！？；：、])/g, "$1").trim() : phrase;
    if (
      last
      && tokenCount(last, language) < minTokens
      && tokenCount(joined, language) <= maxTokens
      && (!maxChars || [...joined].length <= maxChars)
    ) {
      merged[merged.length - 1] = isCjkLanguage(language) ? `${last}${phrase}` : joined;
    } else {
      merged.push(phrase);
    }
  }
  return merged;
}

function splitLongCjkPhrase(text, language, maxTokens, maxChars) {
  const tokens = tokenizePhrase(text, language);
  const chunks = [];
  let current = "";
  let count = 0;
  for (const token of tokens) {
    const next = `${current}${token}`;
    if (current && (count >= maxTokens || (maxChars && [...next].length > maxChars))) {
      chunks.push(current);
      current = token;
      count = 1;
    } else {
      current = next;
      count += 1;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function splitSentenceIntoPhrases(sentence, language = "en", options = PHRASE_LENGTHS.medium) {
  const lengthConfig = typeof options === "number"
    ? { minTokens: 1, maxTokens: options, maxChars: 0, preferNaturalBreaks: true, mergeTooShortPhrases: true, splitLongCjkByWordOrChar: true }
    : {
      minTokens: 1,
      maxTokens: PHRASE_LENGTHS.medium.maxTokens,
      maxChars: 0,
      preferNaturalBreaks: true,
      mergeTooShortPhrases: true,
      splitLongCjkByWordOrChar: true,
      ...(options || {}),
    };
  const { minTokens, maxTokens, maxChars } = lengthConfig;
  if (tokenCount(sentence, language) <= maxTokens && (!maxChars || [...sentence].length <= maxChars)) {
    return [sentence.trim()].filter(Boolean);
  }
  const phraseChunks = splitByCharacterSet(sentence, PHRASE_BREAKS);
  const phrases = [];

  for (const chunk of phraseChunks) {
    if (tokenCount(chunk, language) <= maxTokens && (!maxChars || [...chunk].length <= maxChars)) {
      phrases.push(chunk);
      continue;
    }
    const tokens = tokenizePhrase(chunk, language);
    if (isCjkLanguage(language)) {
      phrases.push(...splitLongCjkPhrase(chunk, language, maxTokens, maxChars));
    } else {
      phrases.push(...splitLongTokenRun(tokens, maxTokens));
    }
  }

  const cleaned = phrases.filter(Boolean);
  return lengthConfig.mergeTooShortPhrases
    ? mergeTooShortPhrases(cleaned, language, minTokens, maxTokens, maxChars)
    : cleaned;
}

function classifyPhraseDifficulty(tokens) {
  if (tokens.length <= 4) return "easy";
  if (tokens.length <= 9) return "medium";
  return "hard";
}

function createSpeechFields(phrase, speech) {
  const speechTarget = normalizeForSpeechCompare(phrase, speech.language);
  const speechTokens = spokenTokens(speechTarget || phrase, speech.language);
  const requiredTokens = speechTokens.filter((token) => {
    if (speech.language === "de" && ["der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer", "eines"].includes(token)) {
      return true;
    }
    if (isCjkLanguage(speech.language)) return token.length > 1 || speechTokens.length <= 4;
    return token.length > 3;
  });
  const finalRequiredTokens = requiredTokens.length ? requiredTokens : speechTokens.slice(0, Math.min(3, speechTokens.length));
  return {
    speechTarget,
    speechTokens,
    requiredTokens: finalRequiredTokens,
    optionalTokens: speechTokens.filter((token) => !finalRequiredTokens.includes(token)),
    equivalentGroups: [],
    localeHints: {
      ttsLang: speech.ttsLang,
      recognitionLang: speech.recognitionLang,
      voiceLocale: speech.voiceLocale,
    },
    difficulty: classifyPhraseDifficulty(speechTokens),
  };
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

export function createSpeakShadowSession({
  title,
  text,
  language = "en",
  voiceLocale = "",
  phraseLength = "medium",
  savedToBrowser = true,
  sourceType = "pasted_text",
  sourcePackageId = null,
  settings = {},
}) {
  const speech = resolveSpeakShadowSpeech({ language, voiceLocale });
  const lengthConfig = PHRASE_LENGTHS[phraseLength] || PHRASE_LENGTHS.medium;
  const sentences = splitIntoSentences(text);
  const phrases = sentences.flatMap((sentence) => splitSentenceIntoPhrases(sentence, speech.language, {
    minTokens: lengthConfig.minTokens,
    maxTokens: lengthConfig.maxTokens,
    maxChars: lengthConfig.maxChars,
    preferNaturalBreaks: true,
    mergeTooShortPhrases: true,
    splitLongCjkByWordOrChar: true,
  }));
  const now = new Date().toISOString();
  const sessionId = makeSessionId();
  const mergedSettings = {
    ...DEFAULT_SPEAK_SHADOW_SETTINGS,
    ...settings,
    phraseLength,
    maxTokensPerPhrase: lengthConfig.maxTokens,
    minTokensPerPhrase: lengthConfig.minTokens,
    maxCharsPerPhrase: lengthConfig.maxChars,
  };

  return {
    schemaVersion: 1,
    type: "speak_shadow_session",
    sessionId,
    title: title?.trim() || "Read-aloud practice",
    sourceType,
    sourcePackageId,
    language: speech.language,
    voiceLocale: speech.voiceLocale,
    ttsLang: speech.ttsLang,
    recognitionLang: speech.recognitionLang,
    createdAt: now,
    lastOpenedAt: now,
    savedToBrowser,
    currentPhraseId: "phrase-001",
    settings: mergedSettings,
    phrases: phrases.map((phrase, index) => ({
      id: `phrase-${String(index + 1).padStart(3, "0")}`,
      text: phrase,
      tokens: tokenizePhrase(phrase, speech.language),
      expectedNormalized: normalizeForSpeechCompare(phrase, speech.language),
      ...createSpeechFields(phrase, speech),
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
    voiceLocale: resolvedLanguage === "zh" ? "zh-HK" : "",
    savedToBrowser,
    sourceType: "json_package",
    sourcePackageId: pack?.packId || pack?.id || null,
  });
}

export function ensureSpeakShadowSession(input, { savedToBrowser = true } = {}) {
  if (input?.type === "speak_shadow_session" && Array.isArray(input.phrases)) {
    const speech = resolveSpeakShadowSpeech({ language: input.language, voiceLocale: input.voiceLocale });
    return {
      ...input,
      language: speech.language,
      savedToBrowser,
      voiceLocale: input.voiceLocale || speech.voiceLocale,
      ttsLang: speech.language === "zh" ? speech.ttsLang : input.ttsLang || speech.ttsLang,
      recognitionLang: speech.language === "zh" ? speech.recognitionLang : input.recognitionLang || speech.recognitionLang,
      settings: { ...DEFAULT_SPEAK_SHADOW_SETTINGS, ...(input.settings || {}) },
      lastOpenedAt: new Date().toISOString(),
      phrases: input.phrases.map((phrase, index) => {
        const text = phrase.text || "";
        const speechFields = createSpeechFields(text, speech);
        return {
          id: phrase.id || `phrase-${String(index + 1).padStart(3, "0")}`,
          text,
          tokens: phrase.tokens || tokenizePhrase(text, speech.language),
          expectedNormalized: phrase.expectedNormalized || normalizeForSpeechCompare(text, speech.language),
          ...speechFields,
          speechTarget: phrase.speechTarget || speechFields.speechTarget,
          speechTokens: phrase.speechTokens || speechFields.speechTokens,
          requiredTokens: phrase.requiredTokens || speechFields.requiredTokens,
          optionalTokens: phrase.optionalTokens || speechFields.optionalTokens,
          equivalentGroups: phrase.equivalentGroups || speechFields.equivalentGroups,
          localeHints: phrase.localeHints || speechFields.localeHints,
          difficulty: phrase.difficulty || speechFields.difficulty,
          status: index === 0 ? PHRASE_STATUS.CURRENT : phrase.status || PHRASE_STATUS.NOT_STARTED,
          attempts: Array.isArray(phrase.attempts) ? phrase.attempts : [],
        };
      }),
    };
  }
  return createSpeakShadowSessionFromPack({ pack: input, savedToBrowser });
}
