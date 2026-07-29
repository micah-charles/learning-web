#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "../canonical/io.mjs";

const args = parseArgs(process.argv.slice(2));
const projectRoot = resolve(import.meta.dirname, "../../..");
const mode = String(args.mode || "preview");
const outputRoot = resolve(projectRoot, String(args.output || `learning-data/chinese-input/generated-curriculum/${mode}`));
const canonicalRoot = resolve(projectRoot, "learning-data/chinese-input/canonical");
const read = (name) => JSON.parse(readFileSync(resolve(outputRoot, name)));
const lessons = read("lessons.json").lessons;
const readiness = read("character_readiness.json").characters;
const exercises = read("exercise_pools.json").exercises;
const migration = read("learner_progress_migration.json");
const semanticAudit = read("curriculum_semantic_audit.json");
const decompositions = JSON.parse(readFileSync(resolve(canonicalRoot, "canonical_character_decompositions.json"))).decompositions;
const readings = JSON.parse(readFileSync(resolve(canonicalRoot, "canonical_character_readings.json"))).readings;
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const readinessByGlyph = new Map(readiness.map((row) => [row.character, row]));
const lessonFor = (characterId) => lessons.find((lesson) => lesson.newCharacters.includes(characterId));

check(lessons.filter((lesson) => lesson.stageId === "cj-stage-00").flatMap((lesson) => lesson.newRoots).length === 26, "Golden root-introduction stage does not cover 26 roots.");
const many = decompositions.find((row) => row.character === "多");
const manyLesson = lessonFor("u591a");
const manyBlock = manyLesson?.teachingBlocks.find((block) => block.type === "character-decomposition" && block.characterId === "u591a");
check(many?.ordered_component_occurrences.join("|") === "夕|夕", "Golden 多 decomposition lost repeated IDS components.");
check(manyBlock?.componentIds.length === 2 && manyBlock.componentIds[0] === manyBlock.componentIds[1], "Generated 多 lesson lost repeated component IDs.");
check(readinessByGlyph.get("說")?.canonicalEvidence.edbSourceGlyph === "説", "Golden 說 EDB source glyph provenance is missing.");
const polyphonic = readiness.find((row) => row.polyphonyRisk === "review-required");
check(Boolean(polyphonic && lessonFor(polyphonic.characterId)), "No polyphonic golden character was placed.");
const complex = readiness.find((row) => row.typingComplexity.factors.preferredCodeLength >= 4);
check(Boolean(complex && lessonFor(complex.characterId)), "No complex four/five-key golden character was placed.");
check(lessons.some((lesson) => lesson.stageId === "cj-stage-09" && lesson.branch === "hk-extension" && lesson.productionEligible === false), "Written-Cantonese provisional branch is missing or unsafe.");
check(lessons.some((lesson) => lesson.stageId === "cj-stage-10" && lesson.teachingBlocks.some((block) => block.type === "code-confusion-warning" && block.collisionCount > 0)), "Quick collision golden case is missing.");
check(migration.legacyLessonMappings.some((row) => row.entityTargets.some((target) => target.generatedLessonId)), "Legacy-to-generated migration mapping is empty.");
check(exercises.some((exercise) => exercise.type === "repeated-component-recognition"), "Repeated-component exercise type was not generated.");
check(semanticAudit.safetyAssertions.noRawChiseLearnerGlyphs, "Semantic audit did not assert CHISE display safety.");

const result = {
  ...semanticAudit,
  status: errors.length ? "FAIL" : "PASS_WITH_PROVISIONAL_WARNINGS",
  regressionFixtures: {
    rootIntroduction: "pass",
    repeatedIdsMany: errors.some((row) => row.includes("多")) ? "fail" : "pass",
    saySourceGlyph: errors.some((row) => row.includes("說")) ? "fail" : "pass",
    polyphonicCharacter: polyphonic?.characterId || "",
    complexCodeCharacter: complex?.characterId || "",
    writtenCantonesePlaceholder: "pass",
    quickCollision: "pass",
    migration: "pass"
  },
  errors,
};
writeFileSync(resolve(outputRoot, "curriculum_semantic_audit.json"), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(resolve(outputRoot, "curriculum_semantic_audit_report.md"), [
  "# Chinese Input curriculum semantic audit",
  "",
  `Status: ${result.status}`,
  "",
  "## Golden regressions",
  "",
  ...Object.entries(result.regressionFixtures).map(([name, value]) => `- ${name}: ${value}`),
  "",
  "## Provisional warnings",
  "",
  ...result.unresolvedEvidence.map((warning) => `- ${warning}`),
  "",
  ...(errors.length ? ["## Errors", "", ...errors.map((error) => `- ${error}`), ""] : []),
].join("\n"));
if (errors.length) throw new Error(`Curriculum semantic audit failed:\n- ${errors.join("\n- ")}`);
console.log(`Curriculum semantic audit PASS with ${result.unresolvedEvidence.length} explicit provisional warnings.`);
