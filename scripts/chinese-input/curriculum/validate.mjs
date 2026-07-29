#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "../canonical/io.mjs";

const args = parseArgs(process.argv.slice(2));
const projectRoot = resolve(import.meta.dirname, "../../..");
const mode = String(args.mode || "preview");
const outputRoot = resolve(projectRoot, String(args.output || `learning-data/chinese-input/generated-curriculum/${mode}`));
const canonicalRoot = resolve(projectRoot, String(args.canonical || "learning-data/chinese-input/canonical"));
const lessonPolicy = JSON.parse(readFileSync(resolve(projectRoot, "learning-data/chinese-input/curriculum-policy/lesson-policy.json")));
const read = (name) => JSON.parse(readFileSync(resolve(outputRoot, name)));

const manifest = read("curriculum_manifest.json");
const stages = read("stages.json").stages;
const lessons = read("lessons.json").lessons;
const readiness = read("character_readiness.json").characters;
const roots = read("root_unlock_graph.json").roots;
const wordGraph = read("word_unlock_graph.json");
const prerequisites = read("prerequisite_graph.json");
const reviews = read("review_graph.json").exposures;
const assessments = read("assessment_graph.json").assessments;
const games = read("game_graph.json").nodes;
const pools = read("exercise_pools.json");
const migration = read("learner_progress_migration.json");
const canonicalCharacters = JSON.parse(readFileSync(resolve(canonicalRoot, "canonical_characters.json"))).characters;
const canonicalWords = JSON.parse(readFileSync(resolve(canonicalRoot, "canonical_words.json"))).words;
const canonicalComponents = JSON.parse(readFileSync(resolve(canonicalRoot, "canonical_component_metadata.json"))).components;

const errors = [];
const warnings = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const duplicates = (values) => values.filter((value, index) => values.indexOf(value) !== index);
const lessonById = new Map(lessons.map((lesson) => [lesson.lessonId, lesson]));
const stageById = new Map(stages.map((stage) => [stage.stageId, stage]));
const assessmentById = new Map(assessments.map((node) => [node.assessmentId, node]));
const gameById = new Map(games.map((node) => [node.gameNodeId, node]));
const exerciseById = new Map(pools.exercises.map((exercise) => [exercise.exerciseId, exercise]));
const canonicalCharacterIds = new Set(canonicalCharacters.map((row) => `u${row.character.codePointAt(0).toString(16)}`));
const canonicalWordIds = new Set(canonicalWords.map((row) => row.word));
const safeComponents = new Set(canonicalComponents.filter((row) => row.render_status === "unicode-ready").map((row) => row.component_id));
const allEntityIds = new Set([...canonicalCharacterIds, ...roots.map((row) => row.rootId), ...wordGraph.words.map((row) => row.wordId)]);

check(manifest.generated === true && manifest.doNotEdit === true, "Manifest must mark generated output as do-not-edit.");
check(manifest.mode === mode, `Manifest mode ${manifest.mode} does not match requested ${mode}.`);
check(manifest.releaseStatus === (mode === "preview" ? "provisional-preview" : "production-approved"), "Release status does not match mode.");
check(manifest.productionEligible === (mode === "production"), "Production eligibility does not match mode.");
check(stages.length === 13, "All 13 policy stages must be emitted.");
check(duplicates(stages.map((row) => row.stageId)).length === 0, "Duplicate stage IDs.");
check(duplicates(lessons.map((row) => row.lessonId)).length === 0, "Duplicate lesson IDs.");
check(duplicates(lessons.map((row) => row.lessonIdentityKey)).length === 0, "Duplicate lesson identity keys.");
check(duplicates(readiness.map((row) => row.characterId)).length === 0, "Duplicate character readiness records.");
check(roots.length === 26 && duplicates(roots.map((row) => row.rootId)).length === 0, "All 26 roots must be introduced once.");
check(pools.templates.length === 24, "All 24 required exercise templates must be declared.");
check(duplicates(pools.templates.map((row) => row.type)).length === 0, "Duplicate exercise templates.");
check(manifest.counts.characters === readiness.length, "Manifest character count mismatch.");
check(manifest.counts.lessons === lessons.length, "Manifest lesson count mismatch.");
check(manifest.counts.words === wordGraph.words.length, "Manifest word count mismatch.");

const newCharacters = lessons.flatMap((lesson) => lesson.newCharacters);
check(newCharacters.length === readiness.length, "Every eligible character must appear exactly once as new content.");
check(duplicates(newCharacters).length === 0, `Characters introduced more than once: ${duplicates(newCharacters).slice(0, 10).join(", ")}`);
check(newCharacters.every((id) => canonicalCharacterIds.has(id)), "A lesson introduces a character outside the canonical dataset.");
check(readiness.every((row) => newCharacters.includes(row.characterId)), "A readiness character is absent from lessons.");

const rootIntroductionSequence = new Map();
for (const lesson of lessons) {
  check(stageById.has(lesson.stageId), `${lesson.lessonId}: unknown stage.`);
  check(lesson.releaseStatus === manifest.releaseStatus, `${lesson.lessonId}: release status mismatch.`);
  check(lesson.estimatedMinutes <= lessonPolicy.maxEstimatedMinutes, `${lesson.lessonId}: estimated minutes exceed policy.`);
  check(lesson.newRoots.length <= 2, `${lesson.lessonId}: too many new roots.`);
  if (lesson.newCharacters.length) {
    check(lesson.newCharacters.length <= lessonPolicy.maxCharactersPerLesson, `${lesson.lessonId}: too many new characters.`);
    check(lesson.structures.length <= lessonPolicy.maxStructuresPerLesson, `${lesson.lessonId}: too many structures.`);
  }
  for (const rootId of lesson.newRoots) rootIntroductionSequence.set(rootId, lesson.sequence);
  for (const prerequisite of lesson.prerequisites) check(lessonById.has(prerequisite), `${lesson.lessonId}: unknown prerequisite ${prerequisite}.`);
  for (const componentId of lesson.components) check(safeComponents.has(componentId), `${lesson.lessonId}: unsafe learner-visible component ${componentId}.`);
  for (const exerciseId of lesson.exercisePoolIds) check(exerciseById.has(exerciseId), `${lesson.lessonId}: missing exercise ${exerciseId}.`);
  for (const assessmentId of lesson.assessmentIds) check(assessmentById.has(assessmentId), `${lesson.lessonId}: missing assessment ${assessmentId}.`);
  for (const gameNodeId of lesson.gameNodeIds) check(gameById.has(gameNodeId), `${lesson.lessonId}: missing game node ${gameNodeId}.`);
}
check(rootIntroductionSequence.size === 26, "Every root must have an introduction lesson.");

const readinessById = new Map(readiness.map((row) => [row.characterId, row]));
for (const lesson of lessons) {
  for (const characterId of lesson.newCharacters) {
    const row = readinessById.get(characterId);
    for (const rootId of row.rootPrerequisites) {
      check(rootIntroductionSequence.get(rootId) < lesson.sequence, `${lesson.lessonId}: ${characterId} uses ${rootId} before root introduction.`);
    }
  }
}

const visiting = new Set();
const visited = new Set();
function visitLesson(lessonId) {
  if (visiting.has(lessonId)) {
    errors.push(`Circular lesson prerequisite at ${lessonId}.`);
    return;
  }
  if (visited.has(lessonId)) return;
  visiting.add(lessonId);
  for (const id of lessonById.get(lessonId)?.prerequisites || []) visitLesson(id);
  visiting.delete(lessonId);
  visited.add(lessonId);
}
for (const lesson of lessons) visitLesson(lesson.lessonId);
check(visited.size === lessons.length, "An inaccessible lesson exists.");

for (const word of wordGraph.words) {
  check(lessonById.has(word.lessonId), `${word.wordId}: unknown unlock lesson.`);
  check(word.characterPrerequisites.every((id) => canonicalCharacterIds.has(id)), `${word.wordId}: unknown character prerequisite.`);
}
for (const excluded of wordGraph.excludedWords) check(Boolean(excluded.reason), `${excluded.word}: excluded word lacks reason.`);
check(wordGraph.words.every((row) => canonicalWordIds.has(row.wordId) || row.wordId.startsWith("word-")), "Invalid word IDs.");

for (const exercise of pools.exercises) {
  check(lessonById.has(exercise.lessonId), `${exercise.exerciseId}: unknown lesson.`);
  check(exercise.entityIds.every((id) => allEntityIds.has(id)), `${exercise.exerciseId}: unresolved exercise entity.`);
  check(exercise.answerData.resolution === "canonical-id-lookup", `${exercise.exerciseId}: unsafe answer source.`);
}
for (const assessment of assessments) {
  check(assessment.prerequisites.every((id) => lessonById.has(id)), `${assessment.assessmentId}: unknown prerequisite.`);
  check(assessment.questionPool.every((id) => exerciseById.has(id)), `${assessment.assessmentId}: unknown question pool.`);
}
for (const game of games) {
  check(game.lessonIds.every((id) => lessonById.has(id)), `${game.gameNodeId}: unknown lesson.`);
  check(game.unlockAfter.every((id) => lessonById.has(id)), `${game.gameNodeId}: unknown unlock prerequisite.`);
}
for (const exposure of reviews) {
  check(allEntityIds.has(exposure.entityId), `${exposure.entityId}: review graph entity does not resolve.`);
  check(exposure.opportunityLessonIds.every((id) => lessonById.has(id)), `${exposure.entityId}: review lesson does not resolve.`);
}
check(migration.neverGrantMasteryForNewContent === true, "Migration must not grant mastery for new content.");
check(migration.stableEntityKeys.characterMastery === "unicode character ID", "Character mastery must use stable Unicode IDs.");

const serialized = JSON.stringify({ stages, lessons, readiness, pools });
check(!serialized.includes("&CDP-") && !serialized.includes("&U-i"), "Raw CHISE entity leaked into learner-facing curriculum.");
check(!serialized.includes("concatenat"), "Unsafe inferred word-pronunciation method appears in output.");
if (mode === "preview") {
  check(manifest.productionEligible === false && manifest.unresolvedEvidence.length > 0, "Preview must expose unresolved evidence.");
  check(lessons.every((lesson) => lesson.productionEligible === false), "Preview lesson marked production eligible.");
} else {
  check(manifest.unresolvedEvidence.length === 0, "Production output contains unresolved evidence.");
}

const report = [
  "# Chinese Input curriculum validation",
  "",
  `Status: ${errors.length ? "FAIL" : "PASS"}`,
  `Mode: ${mode}`,
  `Stages: ${stages.length}`,
  `Lessons: ${lessons.length}`,
  `Characters introduced exactly once: ${newCharacters.length}`,
  `Roots introduced: ${rootIntroductionSequence.size}`,
  `Words: ${wordGraph.words.length}`,
  `Exercises: ${pools.exercises.length}`,
  `Assessments: ${assessments.length}`,
  `Game nodes: ${games.length}`,
  "",
  ...(errors.length ? ["## Errors", "", ...errors.map((error) => `- ${error}`), ""] : []),
  ...(warnings.length ? ["## Warnings", "", ...warnings.map((warning) => `- ${warning}`), ""] : []),
].join("\n");
writeFileSync(resolve(outputRoot, "curriculum_validation_report.md"), report);
if (errors.length) throw new Error(`Curriculum validation failed:\n- ${errors.join("\n- ")}`);
console.log(`Curriculum validation PASS: ${stages.length} stages, ${lessons.length} lessons, ${newCharacters.length} characters, ${rootIntroductionSequence.size} roots, ${wordGraph.words.length} words.`);
