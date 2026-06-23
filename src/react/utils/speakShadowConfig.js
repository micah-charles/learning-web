export const SPEAK_SHADOW_LANGUAGES = [
  { id: "en", label: "English", ttsLang: "en-GB", recognitionLang: "en-GB" },
  { id: "de", label: "German", ttsLang: "de-DE", recognitionLang: "de-DE" },
  { id: "fr", label: "French", ttsLang: "fr-FR", recognitionLang: "fr-FR" },
  { id: "es", label: "Spanish", ttsLang: "es-ES", recognitionLang: "es-ES" },
  { id: "it", label: "Italian", ttsLang: "it-IT", recognitionLang: "it-IT" },
  { id: "zh", label: "Chinese", ttsLang: "zh-HK", recognitionLang: "yue-Hant-HK" },
  { id: "ja", label: "Japanese", ttsLang: "ja-JP", recognitionLang: "ja-JP" },
];

export const CHINESE_VOICE_LOCALES = [
  {
    id: "zh-HK",
    label: "Cantonese",
    nativeLabel: "粵語",
    description: "Hong Kong Cantonese speech",
    ttsLang: "zh-HK",
    recognitionLang: "yue-Hant-HK",
  },
  {
    id: "zh-TW",
    label: "Taiwan Mandarin",
    nativeLabel: "台灣國語",
    description: "Taiwan Mandarin speech with Traditional Chinese output",
    ttsLang: "zh-TW",
    recognitionLang: "zh-TW",
  },
];

export const DEFAULT_CHINESE_VOICE_LOCALE = "zh-HK";

export const DEFAULT_SPEAK_SHADOW_SETTINGS = {
  mode: "tutor",
  tutorMode: true,
  guidedAutoListen: true,
  phraseLength: "medium",
  minSimilarity: 0.85,
  minConfidence: 0.6,
  cjkScoringMode: "smooth",
  cjkSmoothMinConfidence: 0.8,
  cjkSmoothMinCompletion: 0.85,
  autoListenDelayMs: 250,
  readyBeepAfterListenStartsMs: 80,
  soundCuesEnabled: true,
  speechSilenceTimeoutMs: 7000,
  maxAutoListenRetries: 2,
  maxFailedAttemptsBeforeHint: 2,
  autoAdvanceOnPass: true,
  autoAdvanceDelayMs: 1200,
  autoReadNextPhrase: true,
  retryBeforeManualHelp: 2,
  partialUtteranceGraceMs: 2200,
  maxUtteranceChunks: 3,
  scorePartialImmediatelyIfPass: true,
  waitForContinuationIfTooShort: true,
  minCompletionRatioBeforeFail: 0.65,
  maxIncompleteCompletionRatio: 0.92,
};

export const PHRASE_LENGTHS = {
  short: { label: "Short", minTokens: 3, maxTokens: 7, maxChars: 24 },
  medium: { label: "Medium", minTokens: 5, maxTokens: 10, maxChars: 42 },
  long: { label: "Long", minTokens: 8, maxTokens: 14, maxChars: 64 },
};

export const PHRASE_STATUS = {
  NOT_STARTED: "not_started",
  CURRENT: "current",
  PASSED: "passed",
  RETRY: "retry",
  SKIPPED: "skipped",
};

export const TUTOR_STATES = {
  READY: "ready",
  TUTOR_READING: "tutor_reading",
  AUTO_LISTEN_PENDING: "auto_listen_pending",
  WAITING_FOR_STUDENT: "waiting_for_student",
  STUDENT_SPEAKING: "student_speaking",
  PENDING_CONTINUATION: "pending_continuation",
  CHECKING: "checking",
  RETRY: "retry",
  SILENCE_TIMEOUT: "silence_timeout",
  MANUAL_FALLBACK: "manual_fallback",
  PASSED: "passed",
  COMPLETED: "completed",
};

export const TUTOR_MESSAGES = {
  intro: "Listen carefully. I will read this sentence first.",
  getReady: "Get ready...",
  speak: "Now you try.",
  listening: "Listening... speak now.",
  pendingContinuation: "Keep going...",
  continueSentence: "I heard the first part. Continue the sentence.",
  retry: "Almost. Listen again and try once more.",
  slowDown: "Good try. Try reading it a little more slowly.",
  passed: "Good. Let's go to the next sentence.",
  excellent: "Excellent. That was very clear.",
  silent: "I did not hear anything. Tap Speak Now when you are ready.",
  manualFallback: "Take your time. Press Speak Now when ready.",
  challengeStart: "Read this sentence aloud.",
  challengeRetry: "Good try. Read it again slowly.",
  challengePassed: "Good job. Keep going.",
  challengeExcellent: "Excellent pronunciation.",
  listenHint: "Need help? Listen once, then try again.",
  browserNeedsManual: "Your browser needs you to press Speak Now manually.",
  completed: "Excellent. You have finished the whole passage.",
  challengeCompleted: "Challenge completed. Well done.",
  unsupportedTts: "Text-to-speech is not supported in this browser.",
  unsupportedRecognition: "Speech recognition is not supported in this browser. Try Chrome or Edge.",
  cantoneseSupportWarning: "Cantonese speech recognition uses the browser's Cantonese locale. If the browser still returns Mandarin text, use the manual transcript fallback or switch to Taiwan Mandarin recognition.",
};

export function getSpeakShadowLanguage(languageId) {
  const normalized = String(languageId || "").toLowerCase();
  if (normalized.startsWith("zh")) {
    return SPEAK_SHADOW_LANGUAGES.find((language) => language.id === "zh");
  }
  return SPEAK_SHADOW_LANGUAGES.find((language) => language.id === languageId) || SPEAK_SHADOW_LANGUAGES[0];
}

export function getSpeakShadowLanguageByLocale(locale) {
  const normalized = String(locale || "").toLowerCase();
  const exact = SPEAK_SHADOW_LANGUAGES.find(
    (language) => language.ttsLang.toLowerCase() === normalized || language.recognitionLang.toLowerCase() === normalized,
  );
  if (exact) return exact;
  const base = normalized.slice(0, 2);
  return SPEAK_SHADOW_LANGUAGES.find((language) => language.id.slice(0, 2) === base) || SPEAK_SHADOW_LANGUAGES[0];
}

export function getChineseVoiceLocale(localeId = DEFAULT_CHINESE_VOICE_LOCALE) {
  return CHINESE_VOICE_LOCALES.find((locale) => locale.id === localeId) || CHINESE_VOICE_LOCALES[0];
}

export function resolveSpeakShadowSpeech({ language, voiceLocale } = {}) {
  const languageConfig = getSpeakShadowLanguage(language);
  if (languageConfig.id === "zh") {
    const chineseVoice = getChineseVoiceLocale(voiceLocale);
    return {
      language: "zh",
      voiceLocale: chineseVoice.id,
      ttsLang: chineseVoice.ttsLang,
      recognitionLang: chineseVoice.recognitionLang,
    };
  }
  const requestedLocale = String(voiceLocale || "").trim();
  const localeMatchesLanguage = requestedLocale
    && requestedLocale.toLowerCase().startsWith(`${languageConfig.id.toLowerCase()}-`);
  if (localeMatchesLanguage) {
    return {
      language: languageConfig.id,
      voiceLocale: requestedLocale,
      ttsLang: requestedLocale,
      recognitionLang: requestedLocale,
    };
  }
  return {
    language: languageConfig.id,
    voiceLocale: "",
    ttsLang: languageConfig.ttsLang,
    recognitionLang: languageConfig.recognitionLang,
  };
}
