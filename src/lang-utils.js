/**
 * lang-utils.js
 *
 * Normalises language codes to BCP-47 form across the app.
 * Packs store language codes in various short forms (la, de, en);
 * the app always looks them up using the full BCP-47 form.
 */

const LANG_NORM = {
  de: "de-DE",
  en: "en-GB",
  fr: "fr-FR",
  es: "es-ES",
  it: "it-IT",
  pt: "pt-BR",
  la: "la-Latn",
  nl: "nl-NL",
  el: "el-GR",
  ru: "ru-RU",
  zh: "zh-CN",
  ja: "ja-JP",
  ko: "ko-KR",
  ar: "ar-SA",
};

/**
 * Normalise a language code string to BCP-47 form.
 * @param {string|null|undefined} code
 * @returns {string} BCP-47 code, e.g. "de-DE", "en-GB", "la-Latn"
 */
export function normLang(code) {
  if (!code) return "de-DE";
  const lower = String(code).toLowerCase().replace("_", "-");
  return LANG_NORM[lower] || lower;
}

/**
 * Get the pack-level source language code as BCP-47.
 * Falls back to "de-DE".
 */
export function packSrcLang(pack) {
  return normLang(pack?.sourceLanguageCode);
}

/**
 * Get the pack-level target language code as BCP-47.
 * Falls back to "en-GB".
 */
export function packTgtLang(pack) {
  return normLang(pack?.targetLanguageCode);
}

/**
 * Read a word from a translations dict, trying normalised source/target keys.
 * @param {object} translations  - { "de-DE": "...", "en-GB": "..." }
 * @param {string} srcCode  - normalised source language (e.g. "la-Latn")
 * @param {string} tgtCode  - normalised target language (e.g. "en-GB")
 * @param {string} srcFallback - legacy sourceWord value
 * @param {string} tgtFallback - legacy targetWord value
 * @returns {{ src: string, tgt: string }}
 */
export function getTranslations(translations, srcCode, tgtCode, srcFallback = "", tgtFallback = "") {
  return {
    src: (translations?.[srcCode]
       || Object.values(translations || {})[0]
       || srcFallback || ""),
    tgt: (translations?.[tgtCode]
       || Object.values(translations || {}).slice(1)[0]
       || tgtFallback || ""),
  };
}
