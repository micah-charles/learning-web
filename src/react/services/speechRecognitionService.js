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
let activeAttemptId = "";
let interimCallback = null;
let finalCallback = null;
let errorCallback = null;
let endCallback = null;
let didReceiveResult = false;
let didReceiveError = false;
let stopRequested = false;
let lastError = null;
let activeLanguage = "";
let timeoutHandle = null;

function makeAttemptId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `speech-${crypto.randomUUID()}`;
  return `speech-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function mapRecognitionError(error) {
  const code = typeof error === "string" ? error : error?.error || error?.message || "unknown";
  if (code === "not-allowed" || code === "service-not-allowed") return "not-allowed";
  if (code === "audio-capture") return "audio-capture";
  if (code === "no-speech") return "no-result";
  if (code === "network") return "network";
  if (code === "aborted") return "aborted";
  return code || "unknown";
}

function clearAttemptTimeout() {
  if (timeoutHandle && typeof window !== "undefined") {
    window.clearTimeout(timeoutHandle);
  }
  timeoutHandle = null;
}

function buildResultPayload(event, resultIndex, attemptId, language) {
  const result = event.results?.[resultIndex];
  const alternatives = Array.from(result || []).map((item) => ({
    transcript: item.transcript,
    confidence: item.confidence,
  }));
  const best = alternatives[0] || { transcript: "", confidence: null };
  const finalParts = [];
  const interimParts = [];
  for (let index = 0; index < event.results.length; index += 1) {
    const item = event.results[index];
    const transcript = item?.[0]?.transcript || "";
    if (!transcript) continue;
    if (item.isFinal) finalParts.push(transcript);
    else interimParts.push(transcript);
  }
  return {
    attemptId,
    transcript: best.transcript || "",
    finalTranscript: finalParts.join(" ").trim(),
    interimTranscript: interimParts.join(" ").trim(),
    confidence: Number.isFinite(best.confidence) ? best.confidence : null,
    alternatives,
    language,
    isFinal: Boolean(result?.isFinal),
    rawEvent: event,
  };
}

function finishAttempt() {
  clearAttemptTimeout();
  isRunning = false;
}

function installAttemptHandlers(sr, attemptId) {
  recognizer.onresult = (event) => {
    if (!activeAttemptId || attemptId !== activeAttemptId) return;
    const language = recognizer.lang;
    let finalPayload = null;
    for (let index = event.resultIndex || 0; index < event.results.length; index += 1) {
      const payload = buildResultPayload(event, index, attemptId, language);
      if (attemptId !== activeAttemptId) return;
      if (payload.isFinal) {
        finalPayload = payload;
      } else if (interimCallback) {
        interimCallback(payload);
      }
    }
    if (finalPayload) {
      didReceiveResult = true;
      finishAttempt();
      if (finalCallback && attemptId === activeAttemptId) finalCallback(finalPayload);
    }
  };

  recognizer.onerror = (event) => {
    if (!activeAttemptId || attemptId !== activeAttemptId) return;
    const mappedError = mapRecognitionError(event);
    finishAttempt();
    didReceiveError = true;
    lastError = mappedError;
    if (errorCallback && attemptId === activeAttemptId) errorCallback(mappedError, { attemptId, rawEvent: event });
  };

  recognizer.onend = () => {
    if (attemptId !== activeAttemptId) return;
    finishAttempt();
    if (attemptId && !didReceiveResult && !didReceiveError && !stopRequested && errorCallback) {
      lastError = "no-result";
      errorCallback("no-result", { attemptId });
    }
    if (endCallback && attemptId === activeAttemptId) endCallback({ attemptId, stopped: stopRequested });
  };
}

function getRecognizer() {
  if (typeof window === "undefined") return null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  if (recognizer) return recognizer;
  recognizer = new SR();
  recognizer.continuous = false;
  recognizer.interimResults = false;
  recognizer.maxAlternatives = 5;

  return recognizer;
}

export function isSpeechRecognitionSupported() {
  return typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function getSpeechRecognitionStatus() {
  return {
    supported: isSpeechRecognitionSupported(),
    running: isRunning,
    language: activeLanguage,
    permissionKnown: lastError === "not-allowed" ? false : null,
    lastError,
    attemptId: activeAttemptId,
  };
}

export function startListening(optionsOrLanguageCode, legacyOnResult, legacyOnError) {
  const options = typeof optionsOrLanguageCode === "object" && optionsOrLanguageCode !== null
    ? optionsOrLanguageCode
    : {
      languageCode: optionsOrLanguageCode,
      onFinal: (payload) => legacyOnResult?.(payload.transcript, payload.confidence, payload.alternatives, payload.language, payload),
      onError: legacyOnError,
    };
  const sr = getRecognizer();
  if (!sr) {
    options.onError?.("not-supported", { attemptId: options.attemptId || "" });
    return "";
  }
  if (isRunning) abortListening();
  const attemptId = options.attemptId || makeAttemptId();
  const language = getSpeechRecognitionLang(options.languageCode);
  sr.lang = language;
  sr.continuous = Boolean(options.continuous);
  sr.interimResults = Boolean(options.interimResults);
  sr.maxAlternatives = Math.max(1, Number(options.maxAlternatives) || 5);
  activeAttemptId = attemptId;
  activeLanguage = language;
  interimCallback = options.onInterim || null;
  finalCallback = options.onFinal || null;
  errorCallback = options.onError || null;
  endCallback = options.onEnd || null;
  didReceiveResult = false;
  didReceiveError = false;
  stopRequested = false;
  lastError = null;
  clearAttemptTimeout();
  installAttemptHandlers(sr, attemptId);
  try {
    sr.start();
    isRunning = true;
    if (options.timeoutMs) {
      timeoutHandle = window.setTimeout(() => {
        if (activeAttemptId !== attemptId) return;
        abortListening();
        lastError = "timeout";
        options.onError?.("timeout", { attemptId });
      }, options.timeoutMs);
    }
  } catch (e) {
    finishAttempt();
    lastError = mapRecognitionError(e);
    options.onError?.(lastError, { attemptId, rawEvent: e });
  }
  return attemptId;
}

export function stopListening() {
  if (recognizer && isRunning) {
    stopRequested = true;
    try { recognizer.stop(); } catch (e) { }
  }
  finishAttempt();
}

export function abortListening() {
  if (recognizer && isRunning) {
    stopRequested = true;
    try { recognizer.abort(); } catch (e) { }
  }
  finishAttempt();
  activeAttemptId = "";
}

export function restartListening(languageCode, onResult, onError) {
  abortListening();
  setTimeout(() => startListening(languageCode, onResult, onError), 100);
}

export const __speechRecognitionTestHooks = {
  reset() {
    recognizer = null;
    isRunning = false;
    activeAttemptId = "";
    interimCallback = null;
    finalCallback = null;
    errorCallback = null;
    endCallback = null;
    didReceiveResult = false;
    didReceiveError = false;
    stopRequested = false;
    lastError = null;
    activeLanguage = "";
    clearAttemptTimeout();
  },
  getRecognizer,
};
