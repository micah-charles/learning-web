import { listPassageGroups, loadPassagePack } from "@/data.js";
import { getSpeakShadowLanguageByLocale } from "./speakShadowConfig.js";

const CHINESE_SPEAK_LAB_PACK_PATH = "data/SpeakLabPacks/chinese_reading/pack_unified.json";
const LANGUAGE_READING_PACK_IDS = new Set([
  "bbc_bitesize_german",
  "deutsche_welle_nicos_weg",
  "dino_lernt_deutsch",
  "ferien_in_frankfurt",
  "others",
]);

let chineseSpeakLabPackPromise = null;

async function fetchJson(path) {
  const response = await fetch(`./${path}`);
  if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
  return response.json();
}

async function loadChineseSpeakLabPack() {
  if (!chineseSpeakLabPackPromise) {
    chineseSpeakLabPackPromise = fetchJson(CHINESE_SPEAK_LAB_PACK_PATH);
  }
  return chineseSpeakLabPackPromise;
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
  const chinesePack = await loadChineseSpeakLabPack();
  const chineseItems = Array.isArray(chinesePack.items) ? chinesePack.items : [];
  const chineseOptions = chineseItems
    .filter((item) => item?.type === "passage" && passageItemText(item))
    .map((item) => ({
      id: `${chinesePack.packId}::${item.id}`,
      source: "speak_lab_chinese",
      packPath: CHINESE_SPEAK_LAB_PACK_PATH,
      packId: chinesePack.packId,
      itemId: item.id,
      displayName: passageItemTitle(item),
      language: "zh",
      sourceLanguageCode: chinesePack.sourceLanguageCode || chinesePack.speechLanguage || "zh-HK",
      speechLanguage: chinesePack.speechLanguage || chinesePack.sourceLanguageCode || "zh-HK",
    }));

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

  return [...chineseOptions, ...languageReadingOptions];
}

export async function loadSpeakLabPackageSelection(manifest, option) {
  if (!option) throw new Error("Choose a reading package first.");

  if (option.source === "speak_lab_chinese") {
    const pack = await loadChineseSpeakLabPack();
    const item = (pack.items || []).find((entry) => entry.id === option.itemId);
    const text = passageItemText(item);
    if (!item || !text) throw new Error("That Speak Lab package has no readable text.");
    return {
      title: passageItemTitle(item),
      text,
      language: "zh",
      voiceLocale: "zh-HK",
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
