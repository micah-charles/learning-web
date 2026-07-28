#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateChineseInputDataset } from "../src/features/chinese-input/domain/schemas.js";

const ROOT = resolve(import.meta.dirname, "..");
const datasetPath = resolve(ROOT, "src/features/chinese-input/data/seed-dataset.json");
const dataset = JSON.parse(readFileSync(datasetPath, "utf8"));
const validation = validateChineseInputDataset(dataset);
const checksumSource = structuredClone(dataset);
const expectedChecksum = checksumSource.manifest.checksum;
delete checksumSource.manifest.checksum;
const actualChecksum = `sha256:${createHash("sha256").update(JSON.stringify(checksumSource)).digest("hex")}`;
if (actualChecksum !== expectedChecksum) {
  validation.valid = false;
  validation.errors.push(`manifest: checksum mismatch (expected ${expectedChecksum}, calculated ${actualChecksum})`);
}
const distribution = {};
const codeOwners = new Map();
for (const character of dataset.characters || []) {
  const length = character.cangjie.preferredCode.length;
  distribution[length] = (distribution[length] || 0) + 1;
  for (const code of character.cangjie.acceptedCodes) {
    if (!codeOwners.has(code)) codeOwners.set(code, []);
    codeOwners.get(code).push(character.id);
  }
}
const report = {
  generatedAt: dataset.manifest.generatedAt,
  datasetId: dataset.manifest.datasetId,
  datasetVersion: dataset.manifest.datasetVersion,
  valid: validation.valid,
  counts: validation.counts,
  errors: validation.errors,
  warnings: validation.warnings,
  checksum: { expected: expectedChecksum, calculated: actualChecksum, valid: expectedChecksum === actualChecksum },
  duplicateCodes: [...codeOwners.entries()]
    .filter(([, characterIds]) => characterIds.length > 1)
    .map(([code, characterIds]) => ({ code, characterIds })),
  unknownRoots: validation.errors.filter((error) => error.includes("unknown root")),
  unsupportedVersions: validation.errors.filter((error) => error.includes("Cangjie 5")),
  lessonCoverage: Object.fromEntries(dataset.lessons.map((lesson) => [
    lesson.id,
    lesson.characterIds.length || dataset.characters.filter((character) => character[lesson.method]?.keySequence.every((key) => lesson.activeKeys.includes(key))).length,
  ])),
  codeLengthDistribution: distribution,
  charactersMissingQuick: dataset.characters.filter((character) => !character.quick).map((character) => character.id),
  pronunciationCoverage: dataset.characters.filter((character) => character.pronunciations?.length).length,
  provenanceCoverage: dataset.characters.filter((character) => character.provenance?.verified).length,
};
const artifactDir = resolve(ROOT, "artifacts");
mkdirSync(artifactDir, { recursive: true });
writeFileSync(resolve(artifactDir, "chinese-input-data-validation.json"), `${JSON.stringify(report, null, 2)}\n`);
if (!validation.valid) {
  console.error(validation.errors.join("\n"));
  process.exit(1);
}
console.log(`Chinese Input dataset valid: ${validation.counts.characters} characters, ${validation.counts.roots} roots, ${validation.counts.lessons} lessons.`);
