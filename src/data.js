/**
 * data.js - unified-only loaders
 *
 * The public function names still match the original vanilla app, but every
 * loader resolves through manifest unifiedPath entries. Legacy path fields are
 * not fetched at runtime.
 */
import { normLang, packSrcLang, packTgtLang } from "./lang-utils.js";

const jsonCache = new Map();

async function fetchJson(path) {
  if (!jsonCache.has(path)) {
    jsonCache.set(
      path,
      fetch(path).then(async (response) => {
        if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
        return response.json();
      }),
    );
  }
  return jsonCache.get(path);
}

function getCorePath(manifest) {
  return manifest.coreUnifiedPath || manifest.core?.unifiedPath || "data/core_unified.json";
}

function asDisplayPack(pack) {
  return {
    ...pack,
    wordCount: pack.wordCount || pack.counts?.vocab || pack.itemCount || 0,
    sentenceCount: pack.sentenceCount || pack.counts?.sentence || 0,
    supportsSentences: pack.supportsSentences !== false,
    mergeCoreSentences: pack.mergeCoreSentences !== false,
    stageOptions: pack.stageOptions || [],
    defaultQuizModes: pack.defaultQuizModes || [],
  };
}

function vocabFromItem(item) {
  const data = item.data || {};
  return {
    id: item.id,
    de: data.sourceWord || data.de || "",
    en: data.targetWord || data.en || "",
    pos: data.partOfSpeech || data.pos || "",
    gender: data.gender || null,
    plural: data.plural || null,
    exampleDe: data.exampleSource || data.exampleDe || null,
    exampleEn: data.exampleTarget || data.exampleEn || null,
    topic: Array.isArray(item.topics) ? item.topics[0] || "" : "",
    tags: item.tags || [],
    level: item.level || "",
    part_of_speech: data.partOfSpeech || data.pos || "",
    headword: data.headword || data.sourceWord || data.de || "",
    english_equivalent: data.targetWord || data.en || "",
    stage: data.stage,
    stage_label: data.stageLabel || data.stage_label,
    categories: item.topics || [],
  };
}

function sentenceFromItem(item) {
  const data = item.data || {};
  const translations = data.translations || {};
  const srcCode = item._srcCode || "de-DE";
  const tgtCode = item._tgtCode || "en-GB";
  return {
    id: item.id,
    level: item.level || "",
    topics: item.topics || [],
    de:    translations[srcCode] || Object.values(translations)[0] || data.sourceSentence || data.de || "",
    en:    translations[tgtCode] || Object.values(translations).slice(1)[0] || data.targetSentence || data.en || "",
    target_vocab_id: data.targetVocabId || data.target_vocab_id,
    vocab_ids: data.vocabIds || data.vocab_ids || [],
  };
}

function sequenceFromItem(item) {
  const data = item.data || {};
  return {
    id: item.id,
    title: data.title || "",
    instruction: data.instruction || "",
    items: data.items || [],
    level: item.level || "",
    topics: item.topics || [],
  };
}

function sortFromItem(item) {
  const data = item.data || {};
  return {
    id: item.id,
    title: data.title || "",
    instruction: data.instruction || "",
    categories: data.categories || [],
    items: data.items || data.pairs || [],
    level: item.level || "",
    topics: item.topics || [],
  };
}

function gapFromItem(item) {
  const data = item.data || {};
  return {
    id: item.id,
    sentence: data.sentence || "",
    answer: data.answer || "",
    hint: data.hint || "",
    level: item.level || "",
    topics: item.topics || [],
  };
}

function builderFromItem(item) {
  const data = item.data || {};
  return {
    id: item.id,
    type: data.cardType || item.tags?.[0] || "unknown",
    prompt: data.prompt || "",
    answer: data.answer || "",
    tiles: data.tiles || [],
    level: item.level || "",
  };
}

function passageFromItem(item) {
  const data = item.data || {};
  return {
    id: item.id,
    topic: Array.isArray(item.topics) ? item.topics[0] || "" : "",
    level: item.level || "",
    speech_language: data.speechLanguage || "de-DE",
    chapter: data.chapter || "",
    section: data.section || "",
    title_de: data.sourceTitle || "",
    title_en: data.targetTitle || "",
    passage_de: data.sourcePassage || "",
    passage_en: data.targetPassage || "",
    questions: (data.questions || []).map((question) => ({
      id: question.id,
      type: question.questionType || question.type || (question.options?.length ? "multiple_choice" : "open"),
      difficulty: question.difficulty || "medium",
      question_en: question.question || question.question_en || "",
      options: question.options || [],
      correct_option_index: question.correctOptionIndex ?? question.correct_option_index,
      correct_answer: question.correctAnswer || question.correct_answer || "",
      model_answer_en: question.modelAnswer || question.model_answer_en || "",
      accepted_keywords: question.acceptedKeywords || question.accepted_keywords || [],
      grammar_focus: question.grammarFocus || question.grammar_focus || null,
    })),
  };
}

export async function loadManifest() {
  return fetchJson("./data/generated/manifest.json");
}

export function listDatasets(manifest) {
  return [manifest.core, ...(manifest.revisionPacks || [])].filter(Boolean).map(asDisplayPack);
}

export function findDataset(manifest, datasetId) {
  const found = listDatasets(manifest).find((dataset) => dataset.id === datasetId);
  return found || asDisplayPack(manifest.core);
}

// ─── Subject First helpers ──────────────────────────────────────────────
//
// `subject` is a top-level pack tag added in the Subject First refactor.
// Allowed values: "language" | "history" | "geography" | "science".
// Older packs may not declare it; the inference fallback below assigns a
// best-guess subject so legacy packs still appear in the right bucket.

export const SUBJECTS = ["language", "history", "geography", "science"];

const LANGUAGE_HINT_CODES = ["de", "fr", "es", "it", "la", "zh", "ja", "ko", "ru", "ar", "el", "pt", "nl"];

function inferSubject(dataset) {
  if (!dataset) return "language";
  const explicit = String(dataset.subject || "").toLowerCase();
  if (SUBJECTS.includes(explicit)) return explicit;

  const id = String(dataset.id || "").toLowerCase();
  if (id.includes("geography") || id.includes("glaciation") || id.includes("rivers") || id.includes("coast")) {
    return "geography";
  }
  if (id.includes("history") || id.includes("black_death") || id.includes("tudors") || id.includes("ww1") || id.includes("norman")) {
    return "history";
  }
  if (id.includes("science") || id.includes("physics") || id.includes("biology") || id.includes("chemistry")) {
    return "science";
  }

  // Translation-language fallback: anything where the source-language code
  // is a non-English BCP-47 language gets bucketed as "language".
  const src = String(dataset.sourceLanguageCode || "").toLowerCase().split("-")[0];
  const tgt = String(dataset.targetLanguageCode || "").toLowerCase().split("-")[0];
  if (LANGUAGE_HINT_CODES.includes(src) || LANGUAGE_HINT_CODES.includes(tgt)) {
    return "language";
  }
  return "language";
}

export function getDatasetSubject(dataset) {
  return inferSubject(dataset);
}

export function listDatasetsBySubject(manifest, subject) {
  return listDatasets(manifest).filter((d) => getDatasetSubject(d) === subject);
}

// Returns [{ id, label, isReverse }] for the two "direction" buttons shown when
// the selected subject is "language". For non-language packs returns [].
//
// `isReverse` matches the existing quiz.js convention: false = study→target
// (e.g. German prompt → English answer), true = target→study.
export function getDatasetDirections(dataset) {
  if (getDatasetSubject(dataset) !== "language") return [];
  const study = dataset.sourceLanguageLabel || "Study";
  const target = dataset.targetLanguageLabel || "English";
  return [
    { id: "studyToTarget", label: `${study} → ${target}`, isReverse: false },
    { id: "targetToStudy", label: `${target} → ${study}`, isReverse: true },
  ];
}

export async function loadCoreUnifiedPack(manifest) {
  return fetchJson(`./${getCorePath(manifest)}`);
}

export async function loadUnifiedPack(manifest, packId) {
  if (!packId || packId === "core") {
    return loadCoreUnifiedPack(manifest);
  }
  const pack = (manifest.revisionPacks || []).find((item) => item.id === packId);
  if (!pack || !pack.unifiedPath) throw new Error(`No unifiedPath for pack: ${packId}`);
  return fetchJson(`./${pack.unifiedPath}`);
}

export function filterUnifiedItems(unifiedPack, type) {
  if (!unifiedPack || !Array.isArray(unifiedPack.items)) return [];
  return unifiedPack.items.filter((item) => item.type === type);
}

export async function loadUnifiedItemsByType(manifest, packId, type) {
  const pack = await loadUnifiedPack(manifest, packId);
  return filterUnifiedItems(pack, type);
}

// loadVocabItems returns raw vocab items compatible with the old flat shape that
// selectWordPool and isWordMastered in quiz.js expect.
// Fields: id, de, en, level, topic, tags, etc. come from the unified item.
// The unified data (translations, gender, examples) is preserved under .data for quiz.js.

export async function loadVocabItems(manifest, datasetId) {
  const pack = await loadUnifiedPack(manifest, datasetId);
  const srcCode = packSrcLang(pack);
  const tgtCode = packTgtLang(pack);
  return filterUnifiedItems(pack, "vocab").map((item) => {
    const d = item.data || {};
    const translations = d.translations || {};
    return {
      id: item.id,
      de:    translations[srcCode] || Object.values(translations)[0] || d.sourceWord || d.de || "",
      en:    translations[tgtCode] || Object.values(translations).slice(1)[0] || d.targetWord || d.en || "",
      pos:   d.partOfSpeech || d.pos || "",
      gender:    d.gender    || null,
      plural:    d.plural    || null,
      exampleDe: d.examples?.[srcCode] || d.exampleSource || d.exampleDe || null,
      exampleEn: d.examples?.[tgtCode] || d.exampleTarget || d.exampleEn || null,
      topic:     Array.isArray(item.topics) ? item.topics[0] || "" : "",
      tags:      item.tags || [],
      level:     item.level || "",
      // Derive numeric stage from level string (e.g. "Stage 1" -> 1)
      // Needed by filterWordsForScope for Cambridge Latin Stages
      stage:     parseInt(String(item.level || "").replace("Stage ", ""), 10) || d.stage || null,
      part_of_speech: d.partOfSpeech || d.pos || "",
      headword:  translations[srcCode] || d.sourceWord || d.de || "",
      english_equivalent: translations[tgtCode] || d.targetWord || d.en || "",
      stage_label: d.stageLabel || d.stage_label,
      categories: item.topics || [],
      // Keep the original unified item data for quiz.js
      _unified: item,
    };
  });
}

export async function loadSentencePools(manifest, datasetId) {
  const corePack = await loadCoreUnifiedPack(manifest);
  const selectedPack = datasetId === "core" ? corePack : await loadUnifiedPack(manifest, datasetId);
  const core = filterUnifiedItems(corePack, "sentence").map(sentenceFromItem);
  const selected = datasetId === "core" ? [] : filterUnifiedItems(selectedPack, "sentence").map(sentenceFromItem);
  return {
    core,
    selected,
    combined: [...selected, ...core],
  };
}

export async function loadSequenceItems(manifest, datasetId) {
  const pack = await loadUnifiedPack(manifest, datasetId);
  return filterUnifiedItems(pack, "sequence").map(sequenceFromItem);
}

export async function loadCategorySortItems(manifest, datasetId) {
  const pack = await loadUnifiedPack(manifest, datasetId);
  return filterUnifiedItems(pack, "categorySort").map(sortFromItem);
}

export async function loadFillBlankItems(manifest, datasetId) {
  const pack = await loadUnifiedPack(manifest, datasetId);
  return filterUnifiedItems(pack, "fillBlank").map(gapFromItem);
}

export function listSentenceBuilderPacks(manifest) {
  return manifest.sentenceBuilderPacks || [];
}

export async function loadSentenceBuilderUnifiedPack(manifest, packId) {
  const pack = (manifest.sentenceBuilderPacks || []).find((item) => item.id === packId);
  if (!pack || !pack.unifiedPath) throw new Error(`No unifiedPath for sentence builder pack: ${packId}`);
  return fetchJson(`./${pack.unifiedPath}`);
}

export async function loadSentenceBuilderPack(manifest, packId) {
  const pack = await loadSentenceBuilderUnifiedPack(manifest, packId);
  return filterUnifiedItems(pack, "sentenceBuilder").map(builderFromItem);
}

export function listPassageGroups(manifest) {
  return manifest.passageGroups || [];
}

export function getPassageGroupSubject(group) {
  if (!group) return "language";
  const explicit = String(group.subject || "").toLowerCase();
  if (SUBJECTS.includes(explicit)) return explicit;
  const id = String(group.id || "").toLowerCase();
  if (id.includes("geography") || id.includes("glaciation") || id.includes("geology") || id.includes("gcse_geo")) return "geography";
  if (id.includes("histor") || id.includes("black_death")) return "history";
  if (id.includes("science")) return "science";
  return "language";
}

export function listPassageGroupsBySubject(manifest, subject) {
  return listPassageGroups(manifest).filter((group) => getPassageGroupSubject(group) === subject);
}

export function listPassagePacks(manifest, groupId) {
  const group = listPassageGroups(manifest).find((item) => item.id === groupId);
  if (!group) return [];
  if (Array.isArray(group.packs)) return group.packs;
  return [
    {
      id: group.id,
      displayName: group.displayName,
      resourceName: group.id,
      unifiedPath: group.unifiedPath,
    },
  ];
}

export async function loadPassageUnifiedPack(manifest, groupId) {
  const group = (manifest.passageGroups || []).find((item) => item.id === groupId);
  if (!group || !group.unifiedPath) throw new Error(`No unifiedPath for passage group: ${groupId}`);
  return fetchJson(`./${group.unifiedPath}`);
}

export async function loadPassagePack(manifest, groupId, packId = null) {
  const pack = await loadPassageUnifiedPack(manifest, groupId);
  const passages = filterUnifiedItems(pack, "passage").map(passageFromItem);
  if (!packId || packId === groupId) return passages;
  return passages.filter((passage) => {
    const key = `${groupId}::${passage.id}`;
    return packId === key || packId === passage.id || packId === groupId;
  });
}
