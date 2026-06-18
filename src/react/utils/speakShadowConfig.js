export const SPEAK_SHADOW_LANGUAGES = [
  { id: "en", label: "English", ttsLang: "en-GB", recognitionLang: "en-GB" },
  { id: "de", label: "German", ttsLang: "de-DE", recognitionLang: "de-DE" },
  { id: "fr", label: "French", ttsLang: "fr-FR", recognitionLang: "fr-FR" },
  { id: "es", label: "Spanish", ttsLang: "es-ES", recognitionLang: "es-ES" },
  { id: "it", label: "Italian", ttsLang: "it-IT", recognitionLang: "it-IT" },
  { id: "zh", label: "Chinese", ttsLang: "zh-HK", recognitionLang: "zh-HK" },
  { id: "ja", label: "Japanese", ttsLang: "ja-JP", recognitionLang: "ja-JP" },
];

export const CHINESE_VOICE_LOCALES = [
  {
    id: "zh-HK",
    label: "Cantonese",
    nativeLabel: "粵語",
    description: "Hong Kong Cantonese speech",
    ttsLang: "zh-HK",
    recognitionLang: "zh-HK",
  },
  {
    id: "zh-TW",
    label: "Mandarin",
    nativeLabel: "國語",
    description: "Mandarin speech with Traditional Chinese text",
    ttsLang: "zh-TW",
    recognitionLang: "zh-TW",
  },
];

export const DEFAULT_CHINESE_VOICE_LOCALE = "zh-HK";

export const DEFAULT_SPEAK_SHADOW_SETTINGS = {
  tutorMode: true,
  phraseLength: "medium",
  minSimilarity: 0.85,
  minConfidence: 0.6,
  autoAdvanceOnPass: true,
  autoReadNextPhrase: true,
  retryBeforeManualHelp: 2,
};

export const PHRASE_LENGTHS = {
  short: { label: "Short", maxTokens: 8 },
  medium: { label: "Medium", maxTokens: 12 },
  long: { label: "Long", maxTokens: 20 },
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
  WAITING_FOR_STUDENT: "waiting_for_student",
  STUDENT_SPEAKING: "student_speaking",
  CHECKING: "checking",
  RETRY: "retry",
  PASSED: "passed",
  COMPLETED: "completed",
};

export const TUTOR_MESSAGES = {
  intro: "Listen carefully. I will read this sentence first.",
  speak: "Now you try.",
  retry: "Almost. Listen again and try once more.",
  passed: "Good. Let's go to the next sentence.",
  completed: "Excellent. You have finished the whole passage.",
  unsupportedTts: "Text-to-speech is not supported in this browser.",
  unsupportedRecognition: "Speech recognition is not supported in this browser. Try Chrome or Edge.",
  cantoneseSupportWarning: "Cantonese speech recognition may not be fully supported in this browser. You can still use Cantonese listening, or switch to Mandarin recognition.",
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
  return {
    language: languageConfig.id,
    voiceLocale: "",
    ttsLang: languageConfig.ttsLang,
    recognitionLang: languageConfig.recognitionLang,
  };
}
