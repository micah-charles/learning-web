#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs, readJson, writeJson } from "../canonical/io.mjs";

const args = parseArgs(process.argv.slice(2));
const projectRoot = resolve(import.meta.dirname, "../../..");
const canonicalRoot = resolve(projectRoot, String(args.canonical || "learning-data/chinese-input/canonical"));
const reviewPath = resolve(projectRoot, String(args.reviews || "learning-data/chinese-input/reviewed/character_reviews.csv"));
const policyPath = resolve(projectRoot, String(args.policy || "learning-data/chinese-input/curriculum/curriculum-policy.json"));
const outputRoot = resolve(projectRoot, String(args.output || "learning-data/chinese-input/curriculum/generated"));
const policy = readJson(policyPath);
const charactersDocument = readJson(resolve(canonicalRoot, "canonical_characters.json"));
const readingsDocument = readJson(resolve(canonicalRoot, "canonical_character_readings.json"));
const decompositionsDocument = readJson(resolve(canonicalRoot, "canonical_character_decompositions.json"));

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  const [headers, ...values] = rows.filter((entry) => entry.some((value) => value !== ""));
  if (!headers) return [];
  return values.map((entry) => Object.fromEntries(headers.map((header, index) => [header, entry[index] || ""])));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const characters = charactersDocument.characters;
const characterByGlyph = new Map(characters.map((row) => [row.character, row]));
const decompositionByGlyph = new Map(decompositionsDocument.decompositions.map((row) => [row.character, row]));
const cantoneseReadings = new Map();
for (const row of readingsDocument.readings) {
  if (row.language !== "yue-HK") continue;
  if (!cantoneseReadings.has(row.character)) cantoneseReadings.set(row.character, new Set());
  cantoneseReadings.get(row.character).add(row.reading);
}

const reviews = parseCsv(readFileSync(reviewPath, "utf8"));
const errors = [];
const approved = [];
const seen = new Set();
for (const review of reviews) {
  const prefix = review.character || "<blank>";
  if (seen.has(review.character)) errors.push(`${prefix}: duplicate review row.`);
  seen.add(review.character);
  const canonical = characterByGlyph.get(review.character);
  if (!canonical) errors.push(`${prefix}: not present in canonical characters.`);
  if (review.status !== policy.requiredReviewStatus) continue;
  if (!["include", "exclude"].includes(review.hk_selection_status)) errors.push(`${prefix}: invalid HK selection status.`);
  if (!review.reviewer || !/^\d{4}-\d{2}-\d{2}$/.test(review.reviewed_at)) errors.push(`${prefix}: reviewer and ISO review date are required.`);
  if (review.hk_selection_status === "exclude" && !review.review_notes) {
    errors.push(`${prefix}: an approved exclusion requires review notes.`);
  }
  if (review.hk_selection_status === "include" && canonical) {
    if (!review.learner_definition_en) errors.push(`${prefix}: approved inclusion lacks learner definition.`);
    if (!Number.isInteger(Number(review.curriculum_priority)) || Number(review.curriculum_priority) < 1) errors.push(`${prefix}: invalid curriculum priority.`);
    if (!review.curriculum_stage) errors.push(`${prefix}: approved inclusion lacks curriculum stage.`);
    if (!(cantoneseReadings.get(review.character) || new Set()).has(review.approved_cantonese_reading)) {
      errors.push(`${prefix}: approved Cantonese display reading is not source-attested.`);
    }
    approved.push({
      ...review,
      curriculum_priority: Number(review.curriculum_priority),
      canonical,
      decomposition: decompositionByGlyph.get(review.character),
    });
  }
}
assert(errors.length === 0, `Curriculum review validation failed:\n- ${errors.join("\n- ")}`);

const minimum = Number(args.minimum || policy.minimumReviewedCharacters);
assert(
  approved.length >= minimum,
  `Curriculum compilation blocked: ${approved.length} approved included characters; ${minimum} required. Complete human review or use an explicit lower --minimum only for fixtures.`,
);

approved.sort((left, right) => (
  left.curriculum_priority - right.curriculum_priority
  || left.canonical.foxchild_selection_rank - right.canonical.foxchild_selection_rank
));

const lessons = [];
const introducedRoots = new Set();
let current = null;
for (const review of approved) {
  const roots = [...new Set(Array.from(review.canonical.cangjie))];
  const newRoots = roots.filter((root) => !introducedRoots.has(root));
  const wouldOverflowRoots = current
    && current.character_ids.length > 0
    && new Set([...current.new_roots, ...newRoots]).size > policy.maxNewCangjieRootsPerLesson;
  if (!current || current.character_ids.length >= policy.lessonSize || wouldOverflowRoots) {
    const lessonNumber = lessons.length + 1;
    current = {
      id: `lesson-${String(lessonNumber).padStart(3, "0")}`,
      stage: review.curriculum_stage,
      prerequisites: lessonNumber === 1 ? [] : [`lesson-${String(lessonNumber - 1).padStart(3, "0")}`],
      character_ids: [],
      new_roots: [],
      review_status: "human-approved-input",
    };
    lessons.push(current);
  }
  current.character_ids.push(`u${review.character.codePointAt(0).toString(16).toLowerCase()}`);
  current.new_roots = [...new Set([...current.new_roots, ...newRoots])].sort();
  for (const root of roots) introducedRoots.add(root);
}

const reviewByCharacter = new Map(approved.map((row) => [row.character, row]));
const lessonGraph = {
  schemaVersion: 1,
  canonicalDatasetVersion: charactersDocument.datasetVersion,
  policy,
  lessons,
};
const assessmentItems = approved.map((review) => ({
  id: `assessment-u${review.character.codePointAt(0).toString(16).toLowerCase()}`,
  character_id: `u${review.character.codePointAt(0).toString(16).toLowerCase()}`,
  modes: ["cangjie", "quick", "recognition"],
  approved_cantonese_reading: review.approved_cantonese_reading,
  learner_definition_en: review.learner_definition_en,
  source_reviewed_at: review.reviewed_at,
  source_reviewer: review.reviewer,
}));
const assessmentGraph = {
  schemaVersion: 1,
  canonicalDatasetVersion: charactersDocument.datasetVersion,
  assessments: assessmentItems,
  lesson_gates: lessons.map((lesson) => ({
    id: `assessment-gate-${lesson.id}`,
    lesson_id: lesson.id,
    required_assessment_ids: lesson.character_ids.map((characterId) => `assessment-${characterId}`),
  })),
};
const gameGraph = {
  schemaVersion: 1,
  canonicalDatasetVersion: charactersDocument.datasetVersion,
  games: lessons.map((lesson, index) => ({
    id: `game-${lesson.id}`,
    lesson_id: lesson.id,
    character_ids: lesson.character_ids,
    unlock_after: index === 0 ? [] : [`assessment-gate-${lessons[index - 1].id}`],
  })),
};

for (const review of approved) {
  assert(reviewByCharacter.has(review.character), `${review.character}: internal review lookup failure.`);
}
writeJson(resolve(outputRoot, "lesson_graph.json"), lessonGraph);
writeJson(resolve(outputRoot, "assessment_graph.json"), assessmentGraph);
writeJson(resolve(outputRoot, "game_graph.json"), gameGraph);
writeJson(resolve(outputRoot, "curriculum_manifest.json"), {
  schemaVersion: 1,
  canonicalDatasetVersion: charactersDocument.datasetVersion,
  reviewedCharacterCount: approved.length,
  lessonCount: lessons.length,
  status: "compiled-from-human-approved-review-table",
  sourceReviews: reviewPath.replace(`${projectRoot}/`, ""),
  sourcePolicy: policyPath.replace(`${projectRoot}/`, ""),
});
console.log(`Compiled ${approved.length} reviewed characters into ${lessons.length} lessons, ${assessmentGraph.assessments.length} assessments and ${gameGraph.games.length} games.`);
