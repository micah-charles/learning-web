import { normLang } from "@/lang-utils.js";

const SPEECH_LANG_MAP = {
  en: "en-GB",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  it: "it-IT",
  pt: "pt-BR",
  nl: "nl-NL",
  el: "el-GR",
  ru: "ru-RU",
  zh: "yue-Hant-HK",
  yue: "yue-Hant-HK",
  ja: "ja-JP",
  ko: "ko-KR",
  ar: "ar-SA",
};

function getSpeechRecognitionLang(langCode) {
  const raw = String(langCode || "en").replace("_", "-");
  const lower = raw.toLowerCase();
  if (lower === "zh") return SPEECH_LANG_MAP.zh;
  if (lower === "yue") return SPEECH_LANG_MAP.yue;
  if (raw.includes("-")) return raw;
  const normalized = normLang(raw) || "en-GB";
  if (String(normalized).includes("-")) return normalized;
  const short = String(normalized || "en").slice(0, 2).toLowerCase();
  return SPEECH_LANG_MAP[short] || "en-GB";
}

let recognizer = null;
let isRunning = false;
let resultCallback = null;
let errorCallback = null;
let didReceiveResult = false;
let didReceiveError = false;
let stopRequested = false;

function getRecognizer() {
  if (typeof window === "undefined") return null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  if (recognizer) return recognizer;
  recognizer = new SR();
  recognizer.continuous = false;
  recognizer.interimResults = false;
  recognizer.maxAlternatives = 5;

  recognizer.onresult = (event) => {
    isRunning = false;
    didReceiveResult = true;
    const last = event.results.length - 1;
    const alternatives = Array.from(event.results[last] || []).map((result) => ({
      transcript: result.transcript,
      confidence: result.confidence,
    }));
    const best = alternatives[0] || { transcript: "", confidence: null };
    if (resultCallback) resultCallback(best.transcript, best.confidence, alternatives, recognizer.lang);
  };

  recognizer.onerror = (event) => {
    isRunning = false;
    didReceiveError = true;
    if (errorCallback) errorCallback(event.error);
  };

  recognizer.onend = () => {
    isRunning = false;
    if (!didReceiveResult && !didReceiveError && !stopRequested && errorCallback) {
      errorCallback("no-result");
    }
  };

  return recognizer;
}

export function isSpeechRecognitionSupported() {
  return typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function startListening(languageCode, onResult, onError) {
  const sr = getRecognizer();
  if (!sr) {
    if (onError) onError("not-supported");
    return;
  }
  if (isRunning) stopListening();
  sr.lang = getSpeechRecognitionLang(languageCode);
  resultCallback = onResult;
  errorCallback = onError;
  didReceiveResult = false;
  didReceiveError = false;
  stopRequested = false;
  try {
    sr.start();
    isRunning = true;
  } catch (e) {
    if (onError) onError(e.message);
  }
}

export function stopListening() {
  if (recognizer && isRunning) {
    stopRequested = true;
    try { recognizer.stop(); } catch (e) { }
  }
  isRunning = false;
}

export function restartListening(languageCode, onResult, onError) {
  stopListening();
  setTimeout(() => startListening(languageCode, onResult, onError), 100);
}
