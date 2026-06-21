import { listPassageGroups, loadPassagePack } from "@/data.js";
import { getSpeakShadowLanguageByLocale } from "./speakShadowConfig.js";

const SPEAK_LAB_PACK_PATHS = [
  "data/SpeakLabPacks/chinese_reading/pack_unified.json",
  "data/SpeakLabPacks/speak_lab_french_reading/pack_unified.json",
  "data/SpeakLabPacks/speak_lab_german_reading/pack_unified.json",
  "data/SpeakLabPacks/speak_lab_japanese_reading/pack_unified.json",
  "data/SpeakLabPacks/speak_lab_spanish_reading/pack_unified.json",
  "data/SpeakLabPacks/speak_lab_uk_english_reading/pack_unified.json",
  "data/SpeakLabPacks/speak_lab_us_english_reading/pack_unified.json",
];
const LANGUAGE_READING_PACK_IDS = new Set([
  "bbc_bitesize_german",
  "deutsche_welle_nicos_weg",
  "dino_lernt_deutsch",
  "ferien_in_frankfurt",
  "others",
]);

const speakLabPackPromises = new Map();

async function fetchJson(path) {
  const response = await fetch(`./${path}`);
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  return response.json();
}

async function loadSpeakLabPack(path) {
  if (!speakLabPackPromises.has(path)) {
    speakLabPackPromises.set(path, fetchJson(path));
  }
  return speakLabPackPromises.get(path);
}

function passageItemTitle(item) {
  const data = item?.data || {};
  return data.sourceTitle || data.title || item?.sourceTitle || item?.title || item?.id || "Reading";
}

function passageItemText(item) {
  const data = item?.data || {};
  return data.sourcePassage || item?.sourcePassage || data.sourceText || item?.sourceText || data.targetPassage || item?.targetPassage || "";
}

function readingGroupLanguage(group) {
  const explicit = group?.sourceLanguageCode || group?.speechLanguage || group?.targetLanguageCode;
  if (explicit) return getSpeakShadowLanguageByLocale(explicit).id;
  if (LANGUAGE_READING_PACK_IDS.has(group?.id)) return "de";
  return getSpeakShadowLanguageByLocale(explicit).id;
}

export async function listSpeakLabPackageOptions(manifest) {
  const speakLabPacks = await Promise.all(SPEAK_LAB_PACK_PATHS.map(async (packPath) => ({ packPath, pack: await loadSpeakLabPack(packPath) })));
  const speakLabOptions = speakLabPacks.flatMap(({ packPath, pack }) => {
    const items = Array.isArray(pack?.items) ? pack.items : [];
    const speechLanguage = pack?.speechLanguage || pack?.sourceLanguageCode || "";
    const language = getSpeakShadowLanguageByLocale(speechLanguage).id;
    return items
      .filter((item) => item?.type === "passage" && passageItemText(item))
      .map((item) => ({
        id: `${pack.packId}::${item.id}`,
        source: "speak_lab_pack",
        packPath,
        packId: pack.packId,
        itemId: item.id,
        displayName: passageItemTitle(item),
        language,
        sourceLanguageCode: pack.sourceLanguageCode || speechLanguage,
        speechLanguage,
      }));
  });

  const languageReadingOptions = listPassageGroups(manifest || {})
    .filter((group) => group?.subject === "language" && LANGUAGE_READING_PACK_IDS.has(group.id))
    .map((group) => ({
      id: `reading_group::${group.id}`,
      source: "language_reading_group",
      groupId: group.id,
      displayName: group.displayName || group.id,
      language: readingGroupLanguage(group),
      sourceLanguageCode: group.sourceLanguageCode,
      speechLanguage: group.speechLanguage,
    }));

  return [...speakLabOptions, ...languageReadingOptions];
}

export async function loadSpeakLabPackageSelection(manifest, option) {
  if (!option) throw new Error("Choose a reading package first.");

  if (option.source === "speak_lab_pack" || option.source === "speak_lab_chinese") {
    const pack = await loadSpeakLabPack(option.packPath || SPEAK_LAB_PACK_PATHS[0]);
    const item = (pack.items || []).find((entry) => entry.id === option.itemId);
    const text = passageItemText(item);
    if (!item || !text) throw new Error("That Speak Lab package has no readable text.");
    const speechLanguage = item?.data?.speechLanguage || option.speechLanguage || pack.speechLanguage || pack.sourceLanguageCode || "";
    const language = getSpeakShadowLanguageByLocale(speechLanguage).id;
    return {
      title: passageItemTitle(item),
      text,
      language,
      voiceLocale: speechLanguage,
      sourceType: "speak_lab_package",
      sourcePackageId: option.id,
    };
  }

  if (option.source === "language_reading_group") {
    const passages = await loadPassagePack(manifest, option.groupId);
    const text = passages.map((passage) => passage.sourceText || passage.targetText).filter(Boolean).join(" ");
    if (!text) throw new Error("That Reading package has no passage text for Speak Lab.");
    const language = getSpeakShadowLanguageByLocale(passages[0]?.speech_language || option.sourceLanguageCode || option.speechLanguage).id;
    return {
      title: option.displayName || "Reading package practice",
      text,
      language,
      voiceLocale: language === "zh" ? "zh-HK" : "",
      sourceType: "language_reading_pack",
      sourcePackageId: option.groupId,
    };
  }

  throw new Error("Unsupported Speak Lab package type.");
}
