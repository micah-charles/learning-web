import { adaptGeneratedChineseInputDataset } from "./adapt-generated-curriculum.js";

const SUPPORTED_CURRICULUM_SCHEMA_VERSION = 1;
export const CHINESE_CURRICULUM_SOURCES = ["generated-preview", "generated-production"];
const generatedDatasetPromiseCache = new Map();

export function configuredChineseCurriculumSource(env = import.meta.env) {
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
    || manifest?.inputDigest !== bundle?.migration?.inputDigest
    || manifest?.inputDigest !== bundle?.wordGraph?.inputDigest) {
    errors.push("Generated curriculum input digests do not agree.");
  }
  if (requestedSource === "generated-preview") {
    if (manifest?.releaseStatus !== "provisional-preview" || manifest?.productionEligible !== false) errors.push("Preview source is not explicitly provisional.");
  }
  if (requestedSource === "generated-production") {
    if (manifest?.releaseStatus !== "production-approved" || manifest?.productionEligible !== true) errors.push("Production source was selected without a successful production curriculum.");
  }
  if (!Array.isArray(bundle?.stages?.stages) || !Array.isArray(bundle?.lessons?.lessons) || !Array.isArray(bundle?.wordGraph?.words)) errors.push("Generated stage, lesson, or word collections are missing.");
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
  // Only fetch artifacts consumed by the browser runtime. Assessment and game
  // graphs remain build-time validation inputs and were adding ~2.5 MB of JSON
  // parsing to every Chinese Input visit without a runtime consumer.
  const [manifest, stages, lessons, migration, wordGraph] = await Promise.all([
    load("curriculum_manifest.json"), load("stages.json"), load("lessons.json"),
    load("learner_progress_migration.json"), load("word_unlock_graph.json"),
  ]);
  const bundle = { manifest, stages, lessons, migration, wordGraph, source };
  const validation = validateGeneratedCurriculumBundle(bundle, source);
  if (!validation.valid) {
    const error = new Error(`Generated Chinese curriculum failed validation:\n- ${validation.errors.join("\n- ")}`);
    error.validationErrors = validation.errors;
    throw error;
  }
  return bundle;
}

async function loadGeneratedChineseInputDatasetUncached(options = {}) {
  const bundle = await loadGeneratedCurriculumBundle(options);
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
  const wordDocument = await loadCanonical("canonical_words.json");
  return {
    dataset: adaptGeneratedChineseInputDataset({ bundle, characterDocument, readingDocument, wordDocument }),
    bundle,
    warning: "",
  };
}

export function loadGeneratedChineseInputDataset(options = {}) {
  // Custom fetch implementations are normally tests and must remain isolated.
  if (options.fetchImpl) return loadGeneratedChineseInputDatasetUncached(options);
  const source = options.source || configuredChineseCurriculumSource();
  const basePath = options.basePath || "learning-data/chinese-input/generated-curriculum";
  const canonicalBasePath = options.canonicalBasePath || "learning-data/chinese-input/canonical";
  const cacheKey = `${source}|${basePath}|${canonicalBasePath}`;
  if (!generatedDatasetPromiseCache.has(cacheKey)) {
    const pending = loadGeneratedChineseInputDatasetUncached({ ...options, source })
      .catch((error) => {
        generatedDatasetPromiseCache.delete(cacheKey);
        throw error;
      });
    generatedDatasetPromiseCache.set(cacheKey, pending);
  }
  return generatedDatasetPromiseCache.get(cacheKey);
}
