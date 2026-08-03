#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { adaptGeneratedChineseInputDataset } from "../src/features/chinese-input/data/adapt-generated-curriculum.js";
import { validateChineseInputDataset } from "../src/features/chinese-input/domain/schemas.js";

const ROOT = resolve(import.meta.dirname, "..");
const read = (path) => JSON.parse(readFileSync(resolve(ROOT, path), "utf8"));
const bundleRoot = "learning-data/chinese-input/generated-curriculum/preview";
const bundle = {
  manifest: read(`${bundleRoot}/curriculum_manifest.json`),
  stages: read(`${bundleRoot}/stages.json`),
  lessons: read(`${bundleRoot}/lessons.json`),
  assessments: read(`${bundleRoot}/assessment_graph.json`),
  games: read(`${bundleRoot}/game_graph.json`),
  migration: read(`${bundleRoot}/learner_progress_migration.json`),
  source: "generated-preview",
};
const dataset = adaptGeneratedChineseInputDataset({
  bundle,
  characterDocument: read("learning-data/chinese-input/canonical/canonical_characters.json"),
  readingDocument: read("learning-data/chinese-input/canonical/canonical_character_readings.json"),
});
const validation = validateChineseInputDataset(dataset);
if (dataset.characters.length !== 3000) validation.errors.push(`Expected 3000 canonical characters, found ${dataset.characters.length}.`);
if (dataset.lessons.length < 500) validation.errors.push(`Expected at least 500 runtime lessons, found ${dataset.lessons.length}.`);
validation.valid = validation.errors.length === 0;
const report = {
  generatedAt: dataset.manifest.generatedAt,
  datasetId: dataset.manifest.datasetId,
  datasetVersion: dataset.manifest.datasetVersion,
  source: bundle.source,
  valid: validation.valid,
  counts: { ...validation.counts, rawGeneratedLessons: bundle.lessons.lessons.length },
  errors: validation.errors,
  warnings: validation.warnings,
  checksum: dataset.manifest.checksum,
  curriculumInputDigest: bundle.manifest.inputDigest,
};
const artifactDir = resolve(ROOT, "artifacts");
mkdirSync(artifactDir, { recursive: true });
writeFileSync(resolve(artifactDir, "chinese-input-data-validation.json"), `${JSON.stringify(report, null, 2)}\n`);
if (!validation.valid) {
  console.error(validation.errors.join("\n"));
  process.exit(1);
}
console.log(`Chinese Input generated dataset valid: ${dataset.characters.length} characters, ${dataset.roots.length} roots, ${dataset.lessons.length} runtime lessons (${bundle.lessons.lessons.length} generated lessons).`);
