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
  zh: "zh-HK",
  ja: "ja-JP",
  ko: "ko-KR",
  ar: "ar-SA",
};

function getSpeechRecognitionLang(langCode) {
  const raw = String(langCode || "en").replace("_", "-");
  const lower = raw.toLowerCase();
  if (lower === "zh") return SPEECH_LANG_MAP.zh;
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

function getRecognizer() {
  if (typeof window === "undefined") return null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  if (recognizer) return recognizer;
  recognizer = new SR();
  recognizer.continuous = false;
  recognizer.interimResults = false;
  recognizer.maxAlternatives = 1;

  recognizer.onresult = (event) => {
    isRunning = false;
    const last = event.results.length - 1;
    const transcript = event.results[last][0].transcript;
    const confidence = event.results[last][0].confidence;
    if (resultCallback) resultCallback(transcript, confidence);
  };

  recognizer.onerror = (event) => {
    isRunning = false;
    if (errorCallback) errorCallback(event.error);
  };

  recognizer.onend = () => {
    isRunning = false;
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
  try {
    sr.start();
    isRunning = true;
  } catch (e) {
    if (onError) onError(e.message);
  }
}

export function stopListening() {
  if (recognizer && isRunning) {
    try { recognizer.stop(); } catch (e) { }
  }
  isRunning = false;
}

export function restartListening(languageCode, onResult, onError) {
  stopListening();
  setTimeout(() => startListening(languageCode, onResult, onError), 100);
}
