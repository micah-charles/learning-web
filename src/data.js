/**
 * data.js - unified-only loaders
 *
 * The public function names still match the original vanilla app, but every
 * loader resolves through manifest unifiedPath entries. Legacy path fields are
 * not fetched at runtime.
 */
import { normLang, packSrcLang, packTgtLang } from "./lang-utils.js";

const jsonCache = new Map();

function normalizeCachePath(path) {
  const value = String(path || "");
  if (value.startsWith("./uploaded://")) {
    return value.slice(2);
  }
  return value;
}

async function fetchJson(path) {
  const cacheKey = normalizeCachePath(path);
  if (jsonCache.has(cacheKey)) {
    return jsonCache.get(cacheKey);
  }
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

function sentenceFromItem(item) {
  const data = item.data || {};
  const translations = data.translations || {};
  const srcCode = item._srcCode || "de-DE";
  const tgtCode = item._tgtCode || "en-GB";
  return {
    id: item.id,
    level: item.level || "",
    topics: item.topics || [],
    de:    translations[srcCode] || Object.values(translations)[0] || data.sourceSentence || "",
    en:    translations[tgtCode] || Object.values(translations).slice(1)[0] || data.targetSentence || "",
    target_vocab_id: data.targetVocabId,
    vocab_ids: data.vocabIds || [],
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
    items: data.pairs || [],
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

function passageFromItem(item, packSpeechLanguage) {
  // `data` is the canonical location for passage fields (item.data).
  // Fall back to item-level fields so that AI-generated packs that omit the
  // `data` wrapper (e.g. flat structure from ChatGPT) still load correctly.
  const data = item.data || {};
  return {
    id: item.id,
    topic: Array.isArray(item.topics) ? item.topics[0] || "" : "",
    level: item.level || "",
    speech_language: data.speechLanguage || item.speechLanguage || packSpeechLanguage || "en-GB",
    chapter: data.chapter || item.chapter || "",
    section: data.section || item.section || "",
    title_de: data.sourceTitle || data.title || item.sourceTitle || item.title || "",
    title_en: data.targetTitle || data.title || item.targetTitle || item.title || "",
    passage_de: data.sourcePassage || item.sourcePassage || "",
    passage_en: data.targetPassage || item.targetPassage || "",
    questions: (data.questions || item.questions || []).map((question) => ({
      id: question.id,
      // Accept both questionType (canonical) and type (AI-generated shorthand)
      type: question.questionType || question.type || (question.options?.length ? "multiple_choice" : "open"),
      difficulty: question.difficulty || "medium",
      question: question.question || "",
      options: question.options || [],
      // Accept both correctOptionIndex (canonical) and answer (AI-generated shorthand)
      correct_option_index: question.correctOptionIndex ?? question.answer,
      correct_answer: question.correctAnswer || "",
      model_answer_en: question.modelAnswer || "",
      accepted_keywords: question.acceptedKeywords || [],
      grammar_focus: question.grammarFocus || null,
    })),
  };
}

/**
 * Pre-populate the fetchJson cache for a given path.
 * Used by admin-storage.js to inject uploaded pack blobs so that
 * loadUnifiedPack() returns in-memory data instead of fetching a URL.
 */
export function registerPackInCache(path, data) {
  const payload = Promise.resolve(data);
  jsonCache.set(path, payload);
  jsonCache.set(normalizeCachePath(path), payload);
  if (!String(path).startsWith("./")) {
    jsonCache.set(`./${path}`, payload);
  }
}

export async function loadManifest() {
  return fetchJson("./data/generated/manifest.json");
}

function packsWithCapability(manifest, cap) {
  return (manifest.packs || []).filter((p) => (p.capabilities || []).includes(cap));
}

export function listDatasets(manifest) {
  const revision = packsWithCapability(manifest, "revision");
  // Uploaded packs are injected into manifest.revisionPacks by hydrateManifest
  // (not into manifest.packs, which is the static JSON array). Include them here
  // so findDataset can resolve their IDs.
  const uploadedRevision = (manifest.revisionPacks || []).filter((p) => p._uploaded);
  return [manifest.core, ...revision, ...uploadedRevision].filter(Boolean).map(asDisplayPack);
}

export function findDataset(manifest, datasetId) {
  const found = listDatasets(manifest).find((dataset) => dataset.id === datasetId);
  return found || asDisplayPack(manifest.core);
}

// ─── Subject First helpers ──────────────────────────────────────────────
//
// `subject` is a top-level pack tag added in the Subject First refactor.
// Allowed values: "language" | "history" | "geography" | "science" | "literature".
// Older packs may not declare it; the inference fallback below assigns a
// best-guess subject so legacy packs still appear in the right bucket.

export const SUBJECTS = ["language", "history", "geography", "science", "literature", "computing", "religion", "other"];

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
  if (id.includes("literature") || id.includes("poetry") || id.includes("novel") || id.includes("shakespeare")) {
    return "literature";
  }
  if (id.includes("science") || id.includes("physics") || id.includes("biology") || id.includes("chemistry")) {
    return "science";
  }
  if (id.includes("literature") || id.includes("novel") || id.includes("poem") || id.includes("animal_farm") || id.includes("shakespeare")) {
    return "literature";
  }
  if (id.includes("computing") || id.includes("ks3_computing") || id.includes("gcse_computing")) {
    return "computing";
  }
  if (id.includes("ks3_rs_") || id.includes("religious_studies") || id.includes("gcse_rs_")) {
    return "religion";
  }

  // Translation-language fallback: anything where the source-language code
  // is a non-English BCP-47 language gets bucketed as "language".
  const src = String(dataset.sourceLanguageCode || "").toLowerCase().split("-")[0];
  const tgt = String(dataset.targetLanguageCode || "").toLowerCase().split("-")[0];
  if (LANGUAGE_HINT_CODES.includes(src) || LANGUAGE_HINT_CODES.includes(tgt)) {
    return "language";
  }
  return "other";
}

export function getDatasetSubject(dataset) {
  return inferSubject(dataset);
}

export function listDatasetsBySubject(manifest, subject) {
  return listDatasets(manifest).filter((d) => getDatasetSubject(d) === subject);
}

// ─── Curriculum helpers ──────────────────────────────────────────────────────
//
// `curriculum` is a top-level tag on each pack entry: "ks3" | "us-middle-school" | "other".
// Older packs may not carry it; the inference fallback reads it from the pack ID.

export const CURRICULUMS = ["ks3", "us-middle-school", "other"];

export const CURRICULUM_LABELS = {
  "ks3":              "KS3 (UK)",
  "us-middle-school": "US Middle School",
  "other":            "Other",
};

function inferCurriculum(dataset) {
  if (!dataset) return "other";
  const explicit = String(dataset.curriculum || "").toLowerCase();
  if (CURRICULUMS.includes(explicit)) return explicit;

  const id = String(dataset.id || "").toLowerCase();
  if (id.startsWith("usmsg_")) return "us-middle-school";
  if (id.startsWith("ks3_") || id.startsWith("y7_") || id.startsWith("y8_") || id.startsWith("y9_")) {
    return "ks3";
  }
  // All other packs (including any legacy gcse_ prefix) fall through to "other"
  return "other";
}

export function getDatasetCurriculum(dataset) {
  return inferCurriculum(dataset);
}

export function listDatasetsByCurriculum(manifest, curriculum) {
  return listDatasets(manifest).filter((d) => getDatasetCurriculum(d) === curriculum);
}

export function listDatasetsBySubjectAndCurriculum(manifest, subject, curriculum) {
  return listDatasets(manifest).filter(
    (d) => getDatasetSubject(d) === subject &&
           (curriculum === "all" || getDatasetCurriculum(d) === curriculum),
  );
}

export function listPassageGroupsByCurriculum(manifest, curriculum) {
  return listPassageGroups(manifest).filter(
    (g) => curriculum === "all" || inferCurriculum(g) === curriculum,
  );
}

export function listPassageGroupsBySubjectAndCurriculum(manifest, subject, curriculum) {
  return listPassageGroups(manifest).filter(
    (g) => getPassageGroupSubject(g) === subject &&
           (curriculum === "all" || inferCurriculum(g) === curriculum),
  );
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
  // Check static packs first, then uploaded packs (revisionPacks with _uploaded flag).
  const pack =
    (manifest.packs || []).find((item) => item.id === packId) ||
    (manifest.revisionPacks || []).find((item) => item.id === packId && item._uploaded);
  if (!pack || !pack.unifiedPath) {
    // Pack no longer exists (e.g. removed or merged into another pack).
    // Fall back to the core pack gracefully rather than crashing.
    return loadCoreUnifiedPack(manifest);
  }
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
  // When srcCode === tgtCode (all non-language packs: geography, science, history…),
  // the translations dict has a single key shared by both src and tgt. Reading it
  // for both `de` and `en` yields the same term for both — the quiz then shows
  // "Climate → choose Climate". For same-language packs, always prefer the explicit
  // sourceWord/targetWord fields and only use translations as a last resort.
  const isMonoLingual = srcCode === tgtCode;

  return filterUnifiedItems(pack, "vocab").map((item) => {
    const d = item.data || {};
    const translations = d.translations || {};

    const deVal = isMonoLingual
      ? (d.sourceWord || translations[srcCode] || Object.values(translations)[0] || "")
      : (translations[srcCode] || Object.values(translations)[0] || d.sourceWord || "");

    const enVal = isMonoLingual
      ? (d.targetWord || translations[tgtCode] || Object.values(translations).slice(1)[0] || "")
      : (translations[tgtCode] || Object.values(translations).slice(1)[0] || d.targetWord || "");

    return {
      id: item.id,
      de:    deVal,
      en:    enVal,
      pos:   d.partOfSpeech || "",
      gender:    d.gender    || null,
      plural:    d.plural    || null,
      // Only set exampleDe when src and target are different languages; when they
      // are the same (Science, Geography, History: en-GB → en-GB) both fields would
      // resolve to the same string and the card would render the example twice.
      exampleDe: srcCode !== tgtCode ? (d.examples?.[srcCode] || null) : null,
      exampleEn: d.examples?.[tgtCode] || null,
      topic:     Array.isArray(item.topics) ? item.topics[0] || "" : "",
      tags:      item.tags || [],
      level:     item.level || "",
      // Derive numeric stage from level string (e.g. "Stage 1" -> 1)
      // Needed by filterWordsForScope for Cambridge Latin Stages
      stage:     parseInt(String(item.level || "").replace("Stage ", ""), 10) || d.stage || null,
      part_of_speech: d.partOfSpeech || "",
      headword:  deVal,
      english_equivalent: enVal,
      stage_label: d.stageLabel,
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

export function getBuilderPackSubject(pack) {
  if (!pack) return "history";
  const explicit = String(pack.subject || "").toLowerCase();
  if (SUBJECTS.includes(explicit)) return explicit;
  const id = String(pack.id || "").toLowerCase();
  if (id.includes("geograph") || id.includes("glaciat")) return "geography";
  if (id.includes("histor") || id.includes("black_death") || id.includes("silk_road")) return "history";
  if (id.includes("science")) return "science";
  if (id.includes("literature") || id.includes("novel") || id.includes("poem")) return "literature";
  return "history";
}

export function listSentenceBuilderPacksBySubject(manifest, subject) {
  return listSentenceBuilderPacks(manifest).filter(
    (p) => getBuilderPackSubject(p) === subject,
  );
}

export function listSentenceBuilderPacksBySubjectAndCurriculum(manifest, subject, curriculum) {
  const bySubject = listSentenceBuilderPacksBySubject(manifest, subject);
  if (!curriculum || curriculum === "all") return bySubject;
  return bySubject.filter((p) => inferCurriculum(p) === curriculum);
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
  const staticGroups = packsWithCapability(manifest, "passages");
  // Uploaded passage packs are injected into manifest.passageGroups by
  // hydrateManifest — not into manifest.packs — so include them here.
  const uploadedGroups = (manifest.passageGroups || []).filter((p) => p._uploaded);
  return [...staticGroups, ...uploadedGroups];
}

export function getPassageGroupSubject(group) {
  if (!group) return "language";
  const explicit = String(group.subject || "").toLowerCase();
  if (SUBJECTS.includes(explicit)) return explicit;
  const id = String(group.id || "").toLowerCase();
  if (id.includes("geography") || id.includes("glaciation") || id.includes("geology") || id.includes("gcse_geo")) return "geography";
  if (id.includes("histor") || id.includes("black_death")) return "history";
  if (id.includes("science")) return "science";
  if (id.includes("literature") || id.includes("novel") || id.includes("poem") || id.includes("animal_farm") || id.includes("shakespeare")) return "literature";
  return "language";
}

export function listPassageGroupsBySubject(manifest, subject) {
  return listPassageGroups(manifest).filter((group) => getPassageGroupSubject(group) === subject);
}

export function listPassagePacks(manifest, groupId) {
  const pack = listPassageGroups(manifest).find((p) => p.id === groupId);
  if (!pack) return [];
  // Uploaded passage groups use unifiedPath; static groups use passagePath.
  const resolvedPath = pack.passagePath || pack.unifiedPath;
  return [{ id: pack.id, displayName: pack.displayName, resourceName: pack.id, passagePath: resolvedPath }];
}

export async function loadPassageUnifiedPack(manifest, groupId) {
  const pack = listPassageGroups(manifest).find((p) => p.id === groupId);
  // Uploaded passage groups use unifiedPath; static groups use passagePath.
  const path = pack?.passagePath || pack?.unifiedPath;
  if (!path) throw new Error(`No passagePath for pack: ${groupId}`);
  return fetchJson(`./${path}`);
}

export async function loadPassagePack(manifest, groupId, packId = null) {
  const pack = await loadPassageUnifiedPack(manifest, groupId);
  const packSpeechLanguage = pack && (pack.speechLanguage || pack.sourceLanguageCode);
  const passages = filterUnifiedItems(pack, "passage").map((item) => passageFromItem(item, packSpeechLanguage));
  if (!packId || packId === groupId) return passages;
  return passages.filter((passage) => {
    const key = `${groupId}::${passage.id}`;
    return packId === key || packId === passage.id || packId === groupId;
  });
}
