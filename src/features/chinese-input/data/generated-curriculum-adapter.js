import { CANGJIE_ROOTS, ROOT_BY_KEY } from "./keyboard-layout.js";
import { validateChineseInputDataset } from "../domain/schemas.js";

const SUPPORTED_CURRICULUM_SCHEMA_VERSION = 1;
export const CHINESE_CURRICULUM_SOURCES = ["generated-preview", "generated-production"];

export function configuredChineseCurriculumSource(env = import.meta.env) {
  // The generated curriculum is the canonical 3,000-character / ~500-lesson
  // experience. Development must exercise the same content as production;
  const defaultSource = "generated-preview";
  const source = String(env?.VITE_CHINESE_CURRICULUM_SOURCE || defaultSource);
  return CHINESE_CURRICULUM_SOURCES.includes(source) ? source : defaultSource;
}

export function validateGeneratedCurriculumBundle(bundle, requestedSource) {
  const errors = [];
  const manifest = bundle?.manifest;
  if (!manifest?.generated || !manifest?.doNotEdit) errors.push("Generated curriculum manifest markers are missing.");
  if (manifest?.schemaVersion !== SUPPORTED_CURRICULUM_SCHEMA_VERSION) errors.push(`Unsupported curriculum schema version: ${manifest?.schemaVersion}`);
  if (manifest?.inputDigest !== bundle?.stages?.inputDigest
    || manifest?.inputDigest !== bundle?.lessons?.inputDigest
    || manifest?.inputDigest !== bundle?.assessments?.inputDigest
    || manifest?.inputDigest !== bundle?.games?.inputDigest) {
    errors.push("Generated curriculum input digests do not agree.");
  }
  if (requestedSource === "generated-preview") {
    if (manifest?.releaseStatus !== "provisional-preview" || manifest?.productionEligible !== false) {
      errors.push("Preview source is not explicitly provisional.");
    }
  }
  if (requestedSource === "generated-production") {
    if (manifest?.releaseStatus !== "production-approved" || manifest?.productionEligible !== true) {
      errors.push("Production source was selected without a successful production curriculum.");
    }
  }
  if (!Array.isArray(bundle?.stages?.stages) || !Array.isArray(bundle?.lessons?.lessons)) {
    errors.push("Generated stage or lesson collections are missing.");
  }
  return { valid: errors.length === 0, errors };
}

export async function loadGeneratedCurriculumBundle({
  source = configuredChineseCurriculumSource(),
  fetchImpl = fetch,
  basePath = "learning-data/chinese-input/generated-curriculum",
} = {}) {
  const mode = source === "generated-production" ? "production" : "preview";
  const root = `${basePath}/${mode}`;
  const load = async (name) => {
    const response = await fetchImpl(`${root}/${name}`);
    if (!response.ok) throw new Error(`Could not load generated Chinese curriculum ${name} (${response.status}).`);
    return response.json();
  };
  const [manifest, stages, lessons, assessments, games, migration] = await Promise.all([
    load("curriculum_manifest.json"),
    load("stages.json"),
    load("lessons.json"),
    load("assessment_graph.json"),
    load("game_graph.json"),
    load("learner_progress_migration.json"),
  ]);
  const bundle = { manifest, stages, lessons, assessments, games, migration, source };
  const validation = validateGeneratedCurriculumBundle(bundle, source);
  if (!validation.valid) {
    const error = new Error(`Generated Chinese curriculum failed validation:\n- ${validation.errors.join("\n- ")}`);
    error.validationErrors = validation.errors;
    throw error;
  }
  return bundle;
}

export function generatedPreviewWarning(bundle) {
  return bundle?.manifest?.releaseStatus === "provisional-preview"
    ? `Provisional generated curriculum. ${bundle.manifest.unresolvedEvidence?.length || 0} evidence warnings remain; this is not production-approved.`
    : "";
}

function canonicalCharacterId(character) {
  return `u${character.codePointAt(0).toString(16).toLowerCase()}`;
}

function methodData(code, acceptedCodes) {
  const preferredCode = code;
  return {
    preferredCode,
    acceptedCodes: acceptedCodes?.length ? acceptedCodes : [preferredCode],
    keySequence: Array.from(preferredCode),
    rootSequence: Array.from(preferredCode).map((key) => ROOT_BY_KEY[key]?.primaryRoot || key),
  };
}

export async function loadGeneratedChineseInputDataset(options = {}) {
  const bundle = await loadGeneratedCurriculumBundle(options);
  if (!bundle) return null;
  const fetchImpl = options.fetchImpl || fetch;
  const canonicalBasePath = options.canonicalBasePath || "learning-data/chinese-input/canonical";
  const loadCanonical = async (name) => {
    const response = await fetchImpl(`${canonicalBasePath}/${name}`);
    if (!response.ok) throw new Error(`Could not load canonical Chinese data ${name} (${response.status}).`);
    return response.json();
  };
  const [characterDocument, readingDocument] = await Promise.all([
    loadCanonical("canonical_characters.json"),
    loadCanonical("canonical_character_readings.json"),
  ]);
  const readingsByCharacter = new Map();
  for (const reading of readingDocument.readings) {
    if (!readingsByCharacter.has(reading.character)) readingsByCharacter.set(reading.character, []);
    readingsByCharacter.get(reading.character).push(reading);
  }
  const characters = characterDocument.characters.map((row) => ({
    id: canonicalCharacterId(row.character),
    char: row.character,
    codePoint: row.unicode,
    script: "traditional",
    meaning: {
      en: row.learner_definition_status === "approved"
        ? row.learner_definition_en
        : "Meaning pending educational review",
    },
    pronunciations: (readingsByCharacter.get(row.character) || []).map((reading) => ({
      locale: reading.language === "yue-HK" ? "zh-HK" : "zh-TW",
      system: reading.language === "yue-HK" ? "jyutping" : "pinyin",
      value: reading.reading,
      sourceLanguage: reading.language,
      reviewStatus: reading.review_status,
    })),
    cangjie: methodData(row.cangjie, row.accepted_cangjie_codes),
    quick: methodData(row.quick, row.accepted_quick_codes),
    lessonEligibility: { cangjie: true, quick: true },
    provenance: {
      verified: true,
      canonicalDatasetVersion: characterDocument.datasetVersion,
      cangjieSource: row.source_cangjie,
      unihanSource: row.source_unihan,
    },
  }));
  const characterById = new Map(characters.map((character) => [character.id, character]));
  const generated = bundle.lessons.lessons;
  const converted = [];
  const activeRootKeys = new Set();
  for (const lesson of generated) {
    const method = lesson.stageId === "cj-stage-10" ? "quick" : "cangjie";
    if (lesson.stageId === "cj-stage-09" || lesson.stageId === "cj-stage-12") continue;
    for (const rootId of lesson.newRoots) activeRootKeys.add(rootId.slice(-1));
    let characterIds = lesson.newCharacters.length ? lesson.newCharacters : lesson.reviewCharacters;
    if (!characterIds.length && lesson.newRoots.length) {
      characterIds = characters
        .filter((character) => {
          const keys = character.cangjie.keySequence;
          return keys.some((key) => lesson.newRoots.includes(`cj-${key}`))
            && keys.every((key) => activeRootKeys.has(key));
        })
        .slice(0, 6)
        .map((character) => character.id);
    }
    characterIds = characterIds.filter((id) => characterById.has(id));
    if (!characterIds.length) continue;
    if (lesson.newCharacters.length) {
      for (const id of characterIds) {
        for (const key of characterById.get(id).cangjie.keySequence) activeRootKeys.add(key);
      }
    }
    converted.push({
      id: lesson.lessonId,
      method,
      stage: Number(lesson.stageId.slice(-2)),
      order: converted.length + 1,
      title: { en: lesson.title, zhHant: lesson.shortTitle },
      introducedKeys: lesson.newRoots.map((id) => id.slice(-1)),
      reviewedKeys: lesson.reviewRoots.map((id) => id.slice(-1)),
      activeKeys: method === "quick" ? Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ") : [...activeRootKeys].sort(),
      characterIds,
      preserveCharacterOrder: true,
      activityMix: { keyboardExplore: lesson.newRoots.length, rootRecognition: 3, guidedTyping: 9, characterBuild: 2 },
      passCriteria: { minimumAccuracy: 0.8, minimumQuestions: 12 },
      prerequisites: converted.length ? [converted.at(-1).id] : [],
      estimatedMinutes: Math.max(1, lesson.estimatedMinutes),
      accessibilityNotes: "Generated preview content is keyboard, pointer and touch accessible.",
      releaseStatus: lesson.releaseStatus,
      unresolvedReviewWarnings: lesson.unresolvedReviewWarnings,
      stableIdentityKey: lesson.lessonIdentityKey,
      contentDigest: lesson.contentDigest,
    });
  }
  const dataset = {
    manifest: {
      schemaVersion: 1,
      datasetId: "foxchild-zh-hk-cangjie5-generated-preview",
      datasetVersion: characterDocument.datasetVersion,
      title: "FoxChild Chinese Input Lab Generated Preview",
      script: "traditional",
      locale: "zh-HK",
      inputMethods: ["cangjie", "quick"],
      cangjieVersion: "5",
      quickStandard: "rime-quick5-first-last",
      pronunciationSystem: "jyutping",
      license: {
        name: "Canonical source licences; see source manifest",
        source: "learning-data/chinese-input/canonical/source_manifest.json",
        attributionRequired: true,
      },
      generatedAt: bundle.manifest.generatedAt,
      counts: { roots: CANGJIE_ROOTS.length, characters: characters.length, lessons: converted.length },
      checksum: `sha256:${bundle.manifest.inputDigest}`,
      curriculumReleaseStatus: bundle.manifest.releaseStatus,
      curriculumWarnings: bundle.manifest.unresolvedEvidence,
    },
    roots: CANGJIE_ROOTS,
    characters,
    lessons: converted,
  };
  const runtimeValidation = validateChineseInputDataset(dataset);
  if (!runtimeValidation.valid) {
    const error = new Error(`Generated Chinese curriculum could not be adapted safely:\n- ${runtimeValidation.errors.join("\n- ")}`);
    error.validationErrors = runtimeValidation.errors;
    throw error;
  }
  return { dataset, bundle, warning: generatedPreviewWarning(bundle) };
}
