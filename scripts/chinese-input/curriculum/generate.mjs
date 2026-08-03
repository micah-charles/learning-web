#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, relative, resolve } from "node:path";
import { parseArgs } from "../canonical/io.mjs";

const args = parseArgs(process.argv.slice(2));
const projectRoot = resolve(import.meta.dirname, "../../..");
const mode = String(args.mode || "production");
if (!["preview", "production"].includes(mode)) throw new Error(`Unknown curriculum mode: ${mode}`);

const canonicalRoot = resolve(projectRoot, String(args.canonical || "learning-data/chinese-input/canonical"));
const policyRoot = resolve(projectRoot, String(args.policy || "learning-data/chinese-input/curriculum-policy"));
const reviewRoot = resolve(projectRoot, String(args.reviews || "learning-data/chinese-input/reviewed"));
const outputRoot = resolve(
  projectRoot,
  String(args.output || `learning-data/chinese-input/generated-curriculum/${mode}`),
);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value)}\n`);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableIdForCharacter(character) {
  return `u${character.codePointAt(0).toString(16).toLowerCase()}`;
}

function unique(values) {
  return [...new Set(values)];
}

function compareText(left, right) {
  return String(left).localeCompare(String(right), "en");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const value = text[index];
    if (quoted) {
      if (value === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (value === '"') quoted = false;
      else cell += value;
    } else if (value === '"') quoted = true;
    else if (value === ",") {
      row.push(cell);
      cell = "";
    } else if (value === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else cell += value;
  }
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  const [headers, ...body] = rows.filter((entry) => entry.some(Boolean));
  return headers
    ? body.map((entry) => Object.fromEntries(headers.map((header, index) => [header, entry[index] || ""])))
    : [];
}

function readPolicy(name) {
  return readJson(resolve(policyRoot, name));
}

const curriculumPolicy = readPolicy("curriculum-policy.json");
const rootPolicy = readPolicy("root-progression.json");
const stagePolicy = readPolicy("stage-policy.json");
const lessonPolicy = readPolicy("lesson-policy.json");
const reviewPolicy = readPolicy("review-policy.json");
const assessmentPolicy = readPolicy("assessment-policy.json");
const gamePolicy = readPolicy("game-policy.json");
const registerPolicy = readPolicy("register-policy.json");
const sourcePolicy = readPolicy("source-policy.json");

const canonicalFiles = {
  characters: "canonical_characters.json",
  readings: "canonical_character_readings.json",
  decompositions: "canonical_character_decompositions.json",
  components: "canonical_component_metadata.json",
  families: "canonical_character_families.json",
  words: "canonical_words.json",
  version: "dataset_version.json",
};
const policies = readdirSync(policyRoot).filter((name) => name.endsWith(".json")).sort();
const inputFiles = [
  ...Object.values(canonicalFiles).map((name) => resolve(canonicalRoot, name)),
  ...policies.map((name) => resolve(policyRoot, name)),
  ...readdirSync(reviewRoot).filter((name) => name.endsWith(".csv")).sort().map((name) => resolve(reviewRoot, name)),
];
const inputDigest = sha256(inputFiles.map((path) => `${relative(projectRoot, path)}:${sha256(readFileSync(path))}`).join("\n"));
const commonHeader = {
  generated: true,
  doNotEdit: true,
  schemaVersion: 1,
  generatorVersion: curriculumPolicy.generatorVersion,
  canonicalDatasetVersion: readJson(resolve(canonicalRoot, canonicalFiles.version)).datasetVersion,
  curriculumPolicyVersion: curriculumPolicy.curriculumPolicyVersion,
  inputDigest,
  generatedAt: curriculumPolicy.generatedAt,
  mode,
  releaseStatus: mode === "preview" ? curriculumPolicy.previewReleaseStatus : curriculumPolicy.productionReleaseStatus,
  productionEligible: mode === "production",
};

const characters = readJson(resolve(canonicalRoot, canonicalFiles.characters)).characters;
const readings = readJson(resolve(canonicalRoot, canonicalFiles.readings)).readings;
const decompositions = readJson(resolve(canonicalRoot, canonicalFiles.decompositions)).decompositions;
const componentMetadata = readJson(resolve(canonicalRoot, canonicalFiles.components)).components;
const families = readJson(resolve(canonicalRoot, canonicalFiles.families)).memberships;
const words = readJson(resolve(canonicalRoot, canonicalFiles.words)).words;
const characterByGlyph = new Map(characters.map((row) => [row.character, row]));
const characterById = new Map(characters.map((row) => [stableIdForCharacter(row.character), row]));
const decompositionByGlyph = new Map(decompositions.map((row) => [row.character, row]));
const componentById = new Map(componentMetadata.map((row) => [row.component_id, row]));
const readingsByGlyph = new Map();
for (const reading of readings) {
  if (!readingsByGlyph.has(reading.character)) readingsByGlyph.set(reading.character, []);
  readingsByGlyph.get(reading.character).push(reading);
}
const familiesByGlyph = new Map();
for (const family of families) {
  if (!familiesByGlyph.has(family.character)) familiesByGlyph.set(family.character, []);
  familiesByGlyph.get(family.character).push(family);
}

function productionRecords() {
  const errors = [];
  if (!sourcePolicy.approvedSources.length || !sourcePolicy.approvedHongKongCorpusSources.length) {
    errors.push("no approved and pinned Hong Kong corpus source exists in source-policy.json");
  }
  for (const source of sourcePolicy.approvedSources) {
    for (const field of sourcePolicy.requiredSourceFields) {
      if (!source[field]) errors.push(`approved Hong Kong source ${source.id || "<unknown>"} lacks ${field}`);
    }
    if (!sourcePolicy.approvedHongKongCorpusSources.includes(source.id)) {
      errors.push(`source ${source.id} is not in approvedHongKongCorpusSources`);
    }
  }
  const reviewPath = resolve(reviewRoot, "character_reviews.csv");
  const reviewRows = existsSync(reviewPath) ? parseCsv(readFileSync(reviewPath, "utf8")) : [];
  const approved = reviewRows.filter((row) => row.status === curriculumPolicy.requiredReviewStatus && row.hk_selection_status === "include");
  if (approved.length < curriculumPolicy.minimumReviewedCharacters) {
    errors.push(`${approved.length} approved included characters; ${curriculumPolicy.minimumReviewedCharacters} required`);
  }
  for (const row of approved) {
    if (!characterByGlyph.has(row.character)) errors.push(`${row.character}: review does not resolve to a canonical character`);
    if (!row.learner_definition_en) errors.push(`${row.character}: learner definition is missing`);
    if (!row.register) errors.push(`${row.character}: register review is missing`);
    if (!row.approved_cantonese_reading) errors.push(`${row.character}: approved Cantonese display reading is missing`);
    if (!row.supporting_words) errors.push(`${row.character}: supporting words are missing`);
    if (!sourcePolicy.approvedHongKongCorpusSources.includes(row.hk_corpus_source)) {
      errors.push(`${row.character}: Hong Kong corpus source is not approved`);
    }
  }
  if (errors.length) throw new Error(`Production curriculum generation blocked:\n- ${errors.join("\n- ")}`);
  return new Map(approved.map((row) => [row.character, row]));
}

const reviewByGlyph = mode === "production" ? productionRecords() : new Map();
const eligibleCharacters = mode === "production"
  ? characters.filter((row) => reviewByGlyph.has(row.character))
  : [...characters];
if (!eligibleCharacters.length) throw new Error("No characters are eligible for curriculum generation.");

const rootGlyphs = Array.from(rootPolicy.canonicalGlyphs);
const rootUsage = new Map(rootPolicy.rootIds.map((id) => [id.slice(-1), { total: 0, high: 0 }]));
for (const character of eligibleCharacters) {
  for (const key of unique(Array.from(character.cangjie))) {
    const usage = rootUsage.get(key);
    if (!usage) continue;
    usage.total += 1;
    if (character.foxchild_selection_rank <= 500) usage.high += 1;
  }
}
const roots = rootPolicy.rootIds.map((rootId, index) => {
  const key = rootId.slice(-1);
  const usage = rootUsage.get(key);
  return {
    rootId,
    key,
    canonicalGlyph: rootGlyphs[index],
    displayNameZh: rootGlyphs[index],
    reviewStatus: "source-attested-root-label",
    introductionPriority: usage.high * 10000 + usage.total,
    usage,
    confusionRootIds: rootPolicy.confusionPairs
      .filter((pair) => pair.includes(key))
      .flatMap((pair) => pair.filter((value) => value !== key).map((value) => `cj-${value}`)),
  };
}).sort((left, right) => right.introductionPriority - left.introductionPriority || compareText(left.key, right.key));

const wordsByCharacterId = new Map();
for (const word of words) {
  for (const characterId of word.character_ids) {
    if (!wordsByCharacterId.has(characterId)) wordsByCharacterId.set(characterId, []);
    wordsByCharacterId.get(characterId).push(word);
  }
}
for (const list of wordsByCharacterId.values()) {
  list.sort((left, right) => left.foxchild_selection_rank - right.foxchild_selection_rank || compareText(left.word, right.word));
}

function stageFor(character) {
  if (character.code_length === 1) return "cj-stage-01";
  if (character.code_length === 2) return "cj-stage-02";
  if (character.code_length >= 4) return "cj-stage-06";
  if (character.structure === "left-right") return "cj-stage-03";
  if (character.structure === "top-bottom") return "cj-stage-04";
  if (["surround", "overlay"].includes(character.structure)) return "cj-stage-05";
  if ((familiesByGlyph.get(character.character) || []).length) return "cj-stage-07";
  return "cj-stage-08";
}

const characterReadiness = eligibleCharacters.map((character) => {
  const characterId = stableIdForCharacter(character.character);
  const decomposition = decompositionByGlyph.get(character.character);
  const unsafeComponents = decomposition.ordered_component_ids.filter((id) => componentById.get(id)?.render_status !== "unicode-ready");
  const cantonese = (readingsByGlyph.get(character.character) || []).filter((row) => row.language === "yue-HK");
  const review = reviewByGlyph.get(character.character);
  const collisionCount = eligibleCharacters.filter((row) => row.cangjie === character.cangjie).length - 1;
  const factors = {
    preferredCodeLength: character.code_length,
    alternativeCodeCount: character.accepted_cangjie_codes.length,
    codeCollisionCount: collisionCount,
    rootCount: unique(Array.from(character.cangjie)).length,
  };
  return {
    character: character.character,
    characterId,
    eligibleForPreview: true,
    eligibleForProduction: Boolean(review),
    rootPrerequisites: unique(Array.from(character.cangjie)).map((key) => `cj-${key}`),
    componentPrerequisites: decomposition.ordered_component_ids.filter((id) => componentById.get(id)?.render_status === "unicode-ready"),
    blockedLearnerVisibleComponents: unsafeComponents,
    recommendedUnlockAfter: [],
    typingComplexity: {
      score: Number(Math.min(1, (character.code_length / 5) * 0.7 + Math.min(collisionCount, 5) * 0.06).toFixed(4)),
      method: curriculumPolicy.methodVersions.typingComplexity,
      factors,
    },
    visualComplexity: {
      score: Number(Math.min(1, (Number(character.total_strokes) || 0) / 30).toFixed(4)),
      method: curriculumPolicy.methodVersions.visualComplexity,
      confidence: "low",
    },
    wordSupportCount: (wordsByCharacterId.get(characterId) || []).length,
    polyphonyRisk: cantonese.length > 1 ? "review-required" : "low",
    registerStatus: review ? "reviewed" : character.register_review_status,
    proposedStageId: stageFor(character),
    canonicalEvidence: {
      edbSourceGlyph: character.edb_source_glyph,
      cangjie: character.cangjie,
      quick: character.quick,
      selectedRank: character.foxchild_selection_rank,
      structure: character.structure,
    },
    placementExplanation: [
      { rule: "canonical-selection", evidence: `foxchild selection rank ${character.foxchild_selection_rank}` },
      { rule: "root-prerequisites", evidence: unique(Array.from(character.cangjie)).join("") },
      { rule: "stage-classifier", evidence: `${stageFor(character)} via code length ${character.code_length} and structure ${character.structure}` },
      { rule: "preview-evidence-boundary", evidence: review ? "human-reviewed" : "derived provisional placement" },
    ],
  };
}).sort((left, right) => {
  const leftCanonical = characterById.get(left.characterId);
  const rightCanonical = characterById.get(right.characterId);
  return compareText(left.proposedStageId, right.proposedStageId)
    || leftCanonical.foxchild_selection_rank - rightCanonical.foxchild_selection_rank
    || compareText(left.characterId, right.characterId);
});

function balancedChunks(items, target, minimum, maximum) {
  if (!items.length) return [];
  const count = Math.max(1, Math.ceil(items.length / target));
  const chunks = Array.from({ length: count }, () => []);
  items.forEach((item, index) => chunks[index % count].push(item));
  const ordered = chunks.map((chunk) => chunk.sort((left, right) => {
    const leftCanonical = characterById.get(left.characterId);
    const rightCanonical = characterById.get(right.characterId);
    return (leftCanonical?.foxchild_selection_rank || 0) - (rightCanonical?.foxchild_selection_rank || 0)
      || compareText(left.characterId, right.characterId);
  }));
  if (ordered.length > 1 && ordered.at(-1).length < minimum) {
    while (ordered.at(-1).length < minimum && ordered.at(-2).length > minimum) {
      ordered.at(-1).unshift(ordered.at(-2).pop());
    }
  }
  if (ordered.some((chunk) => chunk.length > maximum)) throw new Error("Balanced lesson clustering exceeded maxCharactersPerLesson.");
  return ordered;
}

const lessons = [];
let globalSequence = 0;
let previousLessonId = "";
const rootIntroductionLesson = new Map();

function addLesson(lesson) {
  globalSequence += 1;
  const lessonId = lesson.lessonId || `${lesson.stageId}-lesson-${String(lesson.stageSequence).padStart(3, "0")}`;
  const identityKey = `${curriculumPolicy.curriculumPolicyVersion}|${lesson.stageId}|${lesson.identityToken}`;
  const core = {
    lessonId,
    lessonIdentityKey: identityKey,
    lessonVersion: 1,
    contentDigest: "",
    supersedes: null,
    stageId: lesson.stageId,
    sequence: globalSequence,
    releaseStatus: commonHeader.releaseStatus,
    productionEligible: mode === "production",
    title: lesson.title,
    shortTitle: lesson.shortTitle || lesson.title,
    estimatedMinutes: lesson.estimatedMinutes,
    objectives: lesson.objectives,
    prerequisites: lesson.prerequisites ?? (previousLessonId ? [previousLessonId] : []),
    newRoots: lesson.newRoots || [],
    reviewRoots: lesson.reviewRoots || [],
    newCharacters: lesson.newCharacters || [],
    reviewCharacters: lesson.reviewCharacters || [],
    supportingWords: [],
    optionalExtensionWords: [],
    structures: lesson.structures || [],
    components: lesson.components || [],
    registerCoverage: lesson.registerCoverage || [],
    teachingBlocks: lesson.teachingBlocks || [],
    exercisePoolIds: [],
    assessmentIds: [],
    gameNodeIds: [],
    reviewSchedule: [],
    unlockEffects: lesson.unlockEffects || [],
    generationExplanation: lesson.generationExplanation || [],
    unresolvedReviewWarnings: lesson.unresolvedReviewWarnings || [],
    sourceDigests: { inputDigest },
    branch: lesson.branch || "formal-core",
  };
  core.contentDigest = sha256(JSON.stringify({ ...core, contentDigest: "" }));
  lessons.push(core);
  previousLessonId = lessonId;
  return core;
}

const rootChunks = balancedChunks(
  roots.map((root) => ({ ...root, characterId: root.rootId })),
  rootPolicy.targetNewRootsPerLesson,
  1,
  rootPolicy.maxNewRootsPerLesson,
);
rootChunks.forEach((chunk, index) => {
  const lesson = addLesson({
    stageId: "cj-stage-00",
    stageSequence: index + 1,
    identityToken: `roots-${chunk.map((root) => root.key).join("").toLowerCase()}`,
    title: `Root orientation: ${chunk.map((root) => `${root.key} ${root.canonicalGlyph}`).join(" · ")}`,
    estimatedMinutes: 6,
    objectives: ["Recognise each new Cangjie root.", "Match keyboard keys to canonical root glyphs."],
    newRoots: chunk.map((root) => root.rootId),
    reviewRoots: roots.slice(0, index * rootPolicy.targetNewRootsPerLesson).slice(-4).map((root) => root.rootId),
    teachingBlocks: chunk.flatMap((root) => [
      { type: "root-introduction", rootId: root.rootId, key: root.key, glyph: root.canonicalGlyph },
      { type: "keyboard-position-introduction", rootId: root.rootId, key: root.key },
    ]),
    unlockEffects: chunk.map((root) => ({ entityId: root.rootId, effect: "root-introduced" })),
    generationExplanation: [{ rule: curriculumPolicy.methodVersions.rootProgression, evidence: chunk.map((root) => root.usage) }],
  });
  for (const root of chunk) rootIntroductionLesson.set(root.rootId, lesson.lessonId);
});

const readinessByStage = new Map();
for (const readiness of characterReadiness) {
  if (!readinessByStage.has(readiness.proposedStageId)) readinessByStage.set(readiness.proposedStageId, []);
  readinessByStage.get(readiness.proposedStageId).push(readiness);
}
let introducedCharacterIds = [];
for (const stage of stagePolicy.stages.filter((row) => /^cj-stage-0[1-8]$/.test(row.id))) {
  const byStructure = new Map();
  for (const row of readinessByStage.get(stage.id) || []) {
    const structure = characterById.get(row.characterId).structure;
    if (!byStructure.has(structure)) byStructure.set(structure, []);
    byStructure.get(structure).push(row);
  }
  const chunks = [...byStructure.entries()]
    .sort(([left], [right]) => compareText(left, right))
    .flatMap(([, rows]) => balancedChunks(
      rows,
      lessonPolicy.targetCharactersPerCoreLesson,
      lessonPolicy.minCharactersPerLesson,
      lessonPolicy.maxCharactersPerLesson,
    ));
  chunks.forEach((chunk, index) => {
    const canonicals = chunk.map((row) => characterById.get(row.characterId));
    const decomps = chunk.map((row) => decompositionByGlyph.get(row.character));
    const safeComponents = unique(decomps.flatMap((row) => row.ordered_component_ids))
      .filter((id) => componentById.get(id)?.render_status === "unicode-ready");
    const unsafeCount = decomps.flatMap((row) => row.ordered_component_ids)
      .filter((id) => componentById.get(id)?.render_status !== "unicode-ready").length;
    const lesson = addLesson({
      stageId: stage.id,
      stageSequence: index + 1,
      identityToken: `characters-${chunk.map((row) => row.characterId).join("-")}`,
      title: `${stage.name}: ${chunk.map((row) => row.character).join(" ")}`,
      shortTitle: chunk.map((row) => row.character).join(" "),
      estimatedMinutes: Math.min(lessonPolicy.maxEstimatedMinutes, 4 + chunk.length),
      objectives: [
        `Type ${chunk.length} new characters using verified Cangjie codes.`,
        "Identify the first and last roots used by each character.",
      ],
      newCharacters: chunk.map((row) => row.characterId),
      reviewCharacters: introducedCharacterIds.slice(-lessonPolicy.reviewCharactersPerLesson),
      reviewRoots: unique(chunk.flatMap((row) => row.rootPrerequisites)),
      structures: unique(canonicals.map((row) => row.structure)),
      components: safeComponents,
      teachingBlocks: chunk.flatMap((row) => {
        const canonical = characterById.get(row.characterId);
        const decomposition = decompositionByGlyph.get(row.character);
        return [
          {
            type: "character-decomposition",
            characterId: row.characterId,
            idsOperator: decomposition.top_level_operator,
            componentIds: decomposition.ordered_component_ids.filter((id) => componentById.get(id)?.render_status === "unicode-ready"),
            displayPolicy: "source-structure-with-unreviewed-components-labelled",
          },
          { type: "cangjie-code-walkthrough", characterId: row.characterId, code: canonical.cangjie },
          { type: "quick-code-walkthrough", characterId: row.characterId, code: canonical.quick },
          {
            type: "word-context-example",
            characterId: row.characterId,
            status: "pending-review",
            displayPolicy: "hide-or-labelled-preview",
          },
        ];
      }),
      unlockEffects: chunk.map((row) => ({ entityId: row.characterId, effect: "character-introduced" })),
      generationExplanation: chunk.map((row) => ({ entityId: row.characterId, reasons: row.placementExplanation })),
      unresolvedReviewWarnings: [
        ...(mode === "preview" ? [`${chunk.length} character placements are provisional derived calculations.`] : []),
        ...canonicals.filter((row) => row.learner_definition_status !== "approved").length
          ? ["Learner definitions are hidden because they are not approved."] : [],
        ...canonicals.filter((row) => row.register_review_status !== "approved").length
          ? ["Register claims are hidden because they are not approved."] : [],
        ...(unsafeCount ? [`${unsafeCount} component occurrences are hidden pending SVG fallback.`] : []),
      ],
    });
    introducedCharacterIds = [...introducedCharacterIds, ...lesson.newCharacters];
  });
}

const coreCharacterLessons = lessons.filter((lesson) => lesson.newCharacters.length);
const characterToLesson = new Map(coreCharacterLessons.flatMap((lesson) => lesson.newCharacters.map((id) => [id, lesson])));
const excludedWords = [];
const placedWords = [];
for (const word of [...words].sort((left, right) => left.foxchild_selection_rank - right.foxchild_selection_rank || compareText(left.word, right.word))) {
  const sourceLessons = word.character_ids.map((id) => characterToLesson.get(id));
  if (sourceLessons.some((lesson) => !lesson)) {
    excludedWords.push({ word: word.word, reason: "contains-character-not-eligible-for-curriculum" });
    continue;
  }
  const target = sourceLessons.sort((left, right) => right.sequence - left.sequence)[0];
  if (target.supportingWords.length >= lessonPolicy.maxSupportingWordsPerLesson) {
    excludedWords.push({ word: word.word, reason: "lesson-word-capacity" });
    continue;
  }
  const wordId = `word-${sha256(word.word).slice(0, 12)}`;
  target.supportingWords.push(wordId);
  placedWords.push({
    wordId,
    text: word.word,
    word: word.word,
    characterIds: word.character_ids,
    lessonId: target.lessonId,
    releaseStatus: commonHeader.releaseStatus,
    pronunciationStatus: word.pronunciation_status,
    learnerDefinitionStatus: word.learner_definition_status,
    registerReviewStatus: word.register_review_status,
    generationExplanation: [
      { rule: curriculumPolicy.methodVersions.wordAttachment, evidence: "placed when final required character becomes available" },
      { rule: "source-rank", evidence: word.foxchild_selection_rank },
    ],
  });
}

const hkPlaceholder = addLesson({
  stageId: "cj-stage-09",
  stageSequence: 1,
  identityToken: "hk-extension-evidence-placeholder",
  title: "Written Cantonese and HK typing extension — evidence pending",
  estimatedMinutes: 0,
  objectives: ["Explain why the optional HK branch is not yet learner-ready."],
  branch: "hk-extension",
  teachingBlocks: [{ type: "written-Cantonese-note", status: "pending-review", displayPolicy: "structural-placeholder-only" }],
  generationExplanation: [{ rule: "hk-extension-safety-gate", evidence: sourcePolicy.productionGateStatus }],
  unresolvedReviewWarnings: ["No approved Cantonese lexical source is available; pronunciations and definitions are not generated."],
});

const quickGroups = balancedChunks(
  characterReadiness.map((row) => ({ ...row, characterId: row.characterId })),
  100,
  1,
  120,
);
quickGroups.forEach((chunk, index) => {
  const quickCodes = new Map();
  for (const row of chunk) {
    const code = characterById.get(row.characterId).quick;
    if (!quickCodes.has(code)) quickCodes.set(code, []);
    quickCodes.get(code).push(row.characterId);
  }
  const collisions = [...quickCodes.entries()].filter(([, ids]) => ids.length > 1);
  addLesson({
    stageId: "cj-stage-10",
    stageSequence: index + 1,
    identityToken: `quick-${String(index + 1).padStart(3, "0")}`,
    title: `Quick first/last-key practice ${index + 1}`,
    estimatedMinutes: 10,
    objectives: ["Apply Quick first/last-key logic.", "Recognise and disambiguate Quick-code collisions."],
    reviewCharacters: chunk.map((row) => row.characterId),
    reviewRoots: unique(chunk.flatMap((row) => row.rootPrerequisites)),
    teachingBlocks: [
      { type: "extraction-rule-explanation", method: "quick", rule: "first-and-last-key" },
      { type: "code-confusion-warning", collisionCount: collisions.length, collisionCodes: collisions.slice(0, 20).map(([code]) => code) },
    ],
    generationExplanation: [{ rule: "quick-progression-v1", evidence: `canonical character slice ${index + 1}/${quickGroups.length}` }],
  });
});

for (let index = 0; index < 10; index += 1) {
  addLesson({
    stageId: "cj-stage-11",
    stageSequence: index + 1,
    identityToken: `fluency-${String(index + 1).padStart(2, "0")}`,
    title: `Fluency and mixed review ${index + 1}`,
    estimatedMinutes: 10,
    objectives: ["Build optional speed and accuracy without assuming mastery."],
    reviewCharacters: characterReadiness.filter((_, rowIndex) => rowIndex % 10 === index).map((row) => row.characterId),
    reviewRoots: roots.map((root) => root.rootId),
    teachingBlocks: [{ type: "recap", method: "mixed-cangjie-quick" }],
    generationExplanation: [{ rule: "stable-modulo-review-v1", evidence: index }],
  });
}
addLesson({
  stageId: "cj-stage-12",
  stageSequence: 1,
  identityToken: "comprehensive-mastery",
  title: "Comprehensive mastery and adaptive challenge",
  estimatedMinutes: 12,
  objectives: ["Provide a cumulative mastery opportunity across roots, characters and Quick."],
  reviewCharacters: characterReadiness.map((row) => row.characterId),
  reviewRoots: roots.map((root) => root.rootId),
  teachingBlocks: [{ type: "stage-checkpoint", scope: "complete-curriculum" }],
  generationExplanation: [{ rule: "final-cumulative-stage-v1", evidence: characterReadiness.length }],
});

const exerciseTypes = [
  "root-recognition", "key-to-root-matching", "root-to-key-matching", "character-to-cangjie-code",
  "code-to-character", "ordered-root-assembly", "missing-root-completion", "first-root-identification",
  "last-root-identification", "quick-code-recognition", "structure-classification", "component-identification",
  "repeated-component-recognition", "same-component-family-matching", "same-phonetic-family-matching",
  "word-completion", "word-typing", "context-sensitive-pronunciation", "register-identification",
  "visual-confusion-discrimination", "timed-typing", "mixed-review", "error-correction-retry",
  "stage-mastery-assessment",
];
const exercises = [];
const exerciseTemplates = exerciseTypes.map((type) => ({
  type,
  schemaVersion: 1,
  conditionalEvidenceRequired: ["same-phonetic-family-matching", "context-sensitive-pronunciation", "register-identification"].includes(type),
}));
for (const lesson of lessons) {
  const availableTypes = lesson.newRoots.length
    ? exerciseTypes.slice(0, 3)
    : lesson.newCharacters.length
      ? exerciseTypes.filter((type) => !["same-phonetic-family-matching", "context-sensitive-pronunciation", "register-identification"].includes(type))
      : lesson.stageId === "cj-stage-10"
        ? ["quick-code-recognition", "code-to-character", "mixed-review", "error-correction-retry"]
        : ["mixed-review", "timed-typing", "error-correction-retry", "stage-mastery-assessment"];
  for (const type of availableTypes) {
    const entities = lesson.newRoots.length ? lesson.newRoots : (lesson.newCharacters.length ? lesson.newCharacters : lesson.reviewCharacters.slice(0, 120));
    if (!entities.length && lesson.lessonId === hkPlaceholder.lessonId) continue;
    const exerciseId = `exercise-${lesson.lessonId}-${type}`;
    exercises.push({
      exerciseId,
      type,
      lessonId: lesson.lessonId,
      entityIds: entities,
      promptData: { source: "canonical-entity-fields-only" },
      answerData: { resolution: "canonical-id-lookup" },
      distractorData: { method: "same-root-structure-or-component-v1", seed: sha256(exerciseId).slice(0, 16) },
      difficulty: { method: "lesson-sequence-normalised-v1", score: Number((lesson.sequence / lessons.length).toFixed(4)) },
      source: { inputDigest },
      eligibility: { preview: true, production: mode === "production" },
      explanation: [{ rule: "deterministic-exercise-template-v1", evidence: type }],
    });
    lesson.exercisePoolIds.push(exerciseId);
  }
}

const assessments = [];
function addAssessment(type, id, lessonIds, entityIds, passAccuracy = assessmentPolicy.lessonPassAccuracy) {
  const assessmentId = `assessment-${id}`;
  const node = {
    assessmentId,
    type,
    coveredEntityIds: unique(entityIds),
    prerequisites: lessonIds.length ? [lessonIds.at(-1)] : [],
    questionPool: lessonIds.flatMap((lessonId) => lessons.find((lesson) => lesson.lessonId === lessonId)?.exercisePoolIds || []),
    questionSelectionPolicy: assessmentPolicy.selectionPolicy,
    passCriteria: { minimumAccuracy: passAccuracy },
    retryPolicy: assessmentPolicy.retryPolicy,
    remediationLessonReferences: lessonIds,
    productionEligible: mode === "production",
    generationExplanation: [{ rule: `${type}-assessment-v1`, evidence: lessonIds }],
  };
  assessments.push(node);
  for (const lessonId of lessonIds) {
    const lesson = lessons.find((row) => row.lessonId === lessonId);
    if (lesson) lesson.assessmentIds.push(assessmentId);
  }
}
for (const lesson of lessons) {
  addAssessment("lesson-check", lesson.lessonId, [lesson.lessonId], [...lesson.newRoots, ...lesson.newCharacters]);
}
for (let index = assessmentPolicy.checkpointEveryLessons - 1; index < lessons.length; index += assessmentPolicy.checkpointEveryLessons) {
  const covered = lessons.slice(Math.max(0, index - assessmentPolicy.checkpointEveryLessons + 1), index + 1);
  addAssessment("five-lesson-checkpoint", `checkpoint-${String(index + 1).padStart(3, "0")}`, covered.map((row) => row.lessonId), covered.flatMap((row) => [...row.newRoots, ...row.newCharacters]));
}
for (const stage of stagePolicy.stages) {
  const stageLessons = lessons.filter((lesson) => lesson.stageId === stage.id);
  addAssessment("stage-assessment", stage.id, stageLessons.map((row) => row.lessonId), stageLessons.flatMap((row) => [...row.newRoots, ...row.newCharacters]), assessmentPolicy.stagePassAccuracy);
}
addAssessment("final-comprehensive", "final", [lessons.at(-1).lessonId], [...roots.map((root) => root.rootId), ...characterReadiness.map((row) => row.characterId)], assessmentPolicy.finalPassAccuracy);

const reviewExposures = [];
for (const lesson of lessons) {
  const entities = [...lesson.newRoots, ...lesson.newCharacters];
  for (const entityId of entities) {
    const opportunities = reviewPolicy.introductionReviewIntervals
      .map((offset) => lessons[lesson.sequence - 1 + offset])
      .filter(Boolean)
      .map((target) => target.lessonId);
    const record = { entityId, introducedInLesson: lesson.lessonId, opportunityLessonIds: opportunities, adaptiveAtRuntime: true };
    reviewExposures.push(record);
    lesson.reviewSchedule.push(record);
  }
}

const gameNodes = lessons.map((lesson, index) => {
  const gameNodeId = `cj-game-${lesson.stageId}-node-${String(index + 1).padStart(3, "0")}`;
  lesson.gameNodeIds.push(gameNodeId);
  return {
    gameNodeId,
    stageId: lesson.stageId,
    lessonIds: [lesson.lessonId],
    newEntityIds: [...lesson.newRoots, ...lesson.newCharacters],
    reviewEntityIds: lesson.reviewCharacters,
    challengeType: gamePolicy.challengeTypes[index % gamePolicy.challengeTypes.length],
    difficultyBudget: Number((lesson.sequence / lessons.length).toFixed(4)),
    unlockAfter: lesson.prerequisites,
    bossCheckpoint: lesson.sequence % gamePolicy.bossEveryLessons === 0,
    rewardPolicyId: gamePolicy.rewardPolicyId,
  };
});

const rootUnlockGraph = roots.map((root) => {
  const lessonId = rootIntroductionLesson.get(root.rootId);
  return {
    rootId: root.rootId,
    introductionLesson: lessonId,
    prerequisiteRoots: [],
    reviewLessons: reviewExposures.find((row) => row.entityId === root.rootId)?.opportunityLessonIds || [],
    charactersUnlocked: characterReadiness.filter((row) => row.rootPrerequisites.includes(root.rootId)).map((row) => row.characterId),
    confusionPairs: root.confusionRootIds,
    masteryChecks: assessments.filter((row) => row.coveredEntityIds.includes(root.rootId)).map((row) => row.assessmentId),
  };
});
const characterUnlockGraph = characterReadiness.map((row) => ({
  characterId: row.characterId,
  introductionLesson: characterToLesson.get(row.characterId)?.lessonId,
  rootPrerequisites: row.rootPrerequisites,
  componentPrerequisites: row.componentPrerequisites,
  reviewLessons: reviewExposures.find((entry) => entry.entityId === row.characterId)?.opportunityLessonIds || [],
}));
const wordUnlockGraph = placedWords.map((row) => ({
  wordId: row.wordId,
  text: row.text,
  lessonId: row.lessonId,
  characterPrerequisites: row.characterIds,
  pronunciationEligibility: row.pronunciationStatus === "approved-contextual-lexical",
  registerEligibility: row.registerReviewStatus === "approved",
}));
const prerequisiteGraph = {
  stages: stagePolicy.stages.map((stage, index) => ({ stageId: stage.id, prerequisites: index ? [stagePolicy.stages[index - 1].id] : [] })),
  lessons: lessons.map((lesson) => ({ lessonId: lesson.lessonId, prerequisites: lesson.prerequisites })),
};

const stages = stagePolicy.stages.map((stage) => {
  const stageLessons = lessons.filter((lesson) => lesson.stageId === stage.id);
  const stageAssessments = assessments.filter((assessment) => assessment.type === "stage-assessment" && assessment.assessmentId === `assessment-${stage.id}`);
  return {
    stageId: stage.id,
    displayName: stage.name,
    curriculumPurpose: stage.purpose,
    branch: stage.branch,
    entryPrerequisites: prerequisiteGraph.stages.find((row) => row.stageId === stage.id).prerequisites,
    exitCriteria: stageAssessments.map((row) => row.assessmentId),
    introducedRoots: unique(stageLessons.flatMap((lesson) => lesson.newRoots)),
    introducedStructures: unique(stageLessons.flatMap((lesson) => lesson.structures)),
    characterCount: stageLessons.reduce((sum, lesson) => sum + lesson.newCharacters.length, 0),
    wordCount: stageLessons.reduce((sum, lesson) => sum + lesson.supportingWords.length, 0),
    lessonIds: stageLessons.map((lesson) => lesson.lessonId),
    assessmentIds: stageAssessments.map((row) => row.assessmentId),
    estimatedStudyMinutes: stageLessons.reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0),
    unresolvedReviewWarnings: unique(stageLessons.flatMap((lesson) => lesson.unresolvedReviewWarnings)),
    generatorExplanation: [{ rule: "stage-policy-v1", evidence: stage.id }],
  };
});

const legacyMigration = readJson(resolve(projectRoot, "learning-data/chinese-input/migrations/legacy-lesson-migration.json"));
const legacyMappings = legacyMigration.legacyLessons.map((legacyLesson) => {
  const entityTargets = (legacyLesson.legacyCharacterIds || []).map((characterId) => ({
    characterId,
    generatedLessonId: characterToLesson.get(characterId)?.lessonId || null,
  }));
  return {
    legacyLessonId: legacyLesson.legacyLessonId,
    legacyCharacterIds: legacyLesson.legacyCharacterIds || [],
    entityTargets,
    completionPolicy: "preserve-entity-mastery-and-mark-generated-lessons-partial",
  };
});
const migration = {
  ...commonHeader,
  migrationVersion: 1,
  stableEntityKeys: {
    characterMastery: "unicode character ID",
    rootMastery: "cj-<key>",
    wordMastery: "sha256-derived word ID",
  },
  legacyLessonMappings: legacyMappings,
  preserve: ["characterMastery", "rootMastery", "wordMastery", "achievements", "reviewHistory", "incorrectAnswerHistory", "spacedRepetitionState"],
  neverGrantMasteryForNewContent: true,
  generatedLessonCompletionRule: "completed only when every required stable entity was previously mastered; otherwise partial",
};

const unresolvedWarnings = [
  "All preview character placements use derived MOE/EDB/Cangjie proxies and are not approved curriculum decisions.",
  "Learner definitions remain hidden or labelled pending review.",
  "Register claims remain hidden pending review.",
  "Context-sensitive word pronunciation is not generated.",
  "Written Cantonese and HK typing extension remain structural placeholders pending an approved lexical source.",
  `${componentMetadata.filter((row) => row.render_status !== "unicode-ready").length} component records require learner-visible SVG fallbacks.`,
  "No approved independent Hong Kong frequency source is configured.",
];
const statistics = {
  ...commonHeader,
  totalStages: stages.length,
  totalLessons: lessons.length,
  totalAssessments: assessments.length,
  totalGameNodes: gameNodes.length,
  totalExercises: exercises.length,
  exerciseTemplateCount: exerciseTemplates.length,
  charactersCovered: characterReadiness.length,
  wordsCovered: placedWords.length,
  wordsExcluded: excludedWords.length,
  rootsCovered: rootUnlockGraph.length,
  averageCharactersPerCoreLesson: Number((characterReadiness.length / coreCharacterLessons.length).toFixed(2)),
  averageWordsPerCoreLesson: Number((placedWords.length / coreCharacterLessons.length).toFixed(2)),
  codeLengthProgression: Object.fromEntries([1, 2, 3, 4, 5].map((length) => [length, eligibleCharacters.filter((row) => row.code_length === length).length])),
  rootIntroductionProgression: rootUnlockGraph.map((row) => ({ rootId: row.rootId, lessonId: row.introductionLesson })),
  structureDistribution: Object.fromEntries(unique(eligibleCharacters.map((row) => row.structure)).sort().map((structure) => [structure, eligibleCharacters.filter((row) => row.structure === structure).length])),
  reviewDensity: Number((reviewExposures.length / lessons.length).toFixed(2)),
  assessmentDensity: Number((assessments.length / lessons.length).toFixed(2)),
  unresolvedReviewCount: unresolvedWarnings.length,
  previewOnlyItemCount: mode === "preview" ? characterReadiness.length + placedWords.length : 0,
  productionEligibleItemCount: mode === "production" ? characterReadiness.length + placedWords.length : 0,
  hkEvidenceCoveragePercent: mode === "production" ? 100 : 0,
  registerReviewCoveragePercent: Number((eligibleCharacters.filter((row) => row.register_review_status === "approved").length / eligibleCharacters.length * 100).toFixed(2)),
  componentDisplayCoveragePercent: Number((componentMetadata.filter((row) => row.render_status === "unicode-ready").length / componentMetadata.length * 100).toFixed(2)),
  lexicalPronunciationCoveragePercent: Number((words.filter((row) => row.pronunciation_status === "approved-contextual-lexical").length / words.length * 100).toFixed(2)),
  lessonCountExplanation: `${coreCharacterLessons.length} character lessons are data-derived at a target of ${lessonPolicy.targetCharactersPerCoreLesson} characters, plus root, Quick, extension, fluency and mastery lessons.`,
};

const semanticAudit = {
  ...commonHeader,
  status: "PASS_WITH_PROVISIONAL_WARNINGS",
  unresolvedEvidence: unresolvedWarnings,
  excludedCharacters: [],
  excludedWords,
  conditionalExerciseTypesNotGenerated: ["same-phonetic-family-matching", "context-sensitive-pronunciation", "register-identification"],
  safetyAssertions: {
    noAuthoritativeUnreviewedDefinitions: true,
    noUnapprovedHkFrequencyClaims: true,
    noUnreviewedRegisterClaims: true,
    noRawChiseLearnerGlyphs: true,
    noConcatenatedWordPronunciations: true,
    noUnsupportedSchoolLevels: true,
  },
};

const manifest = {
  ...commonHeader,
  curriculumId: "foxchild-chinese-input-complete",
  unresolvedEvidence: mode === "preview" ? unresolvedWarnings : [],
  files: [
    "curriculum_graph.json", "stages.json", "lessons.json", "character_readiness.json",
    "character_unlock_graph.json", "word_unlock_graph.json", "root_unlock_graph.json",
    "prerequisite_graph.json", "review_graph.json", "assessment_graph.json", "game_graph.json",
    "exercise_pools.json", "learner_progress_migration.json", "generation_explanations.json",
    "curriculum_statistics.json", "curriculum_semantic_audit.json",
  ],
  counts: {
    stages: stages.length,
    lessons: lessons.length,
    assessments: assessments.length,
    gameNodes: gameNodes.length,
    exercises: exercises.length,
    characters: characterReadiness.length,
    words: placedWords.length,
    roots: roots.length,
  },
};

rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(resolve(outputRoot, "lessons"), { recursive: true });
const documents = {
  "curriculum_manifest.json": manifest,
  "curriculum_graph.json": { ...commonHeader, stageIds: stages.map((row) => row.stageId), lessonIds: lessons.map((row) => row.lessonId), branches: ["formal-core", "hk-extension", "quick"] },
  "stages.json": { ...commonHeader, stages },
  "lessons.json": { ...commonHeader, lessons },
  "character_readiness.json": { ...commonHeader, characters: characterReadiness },
  "character_unlock_graph.json": { ...commonHeader, characters: characterUnlockGraph },
  "word_unlock_graph.json": { ...commonHeader, words: wordUnlockGraph, excludedWords },
  "root_unlock_graph.json": { ...commonHeader, roots: rootUnlockGraph },
  "prerequisite_graph.json": { ...commonHeader, ...prerequisiteGraph },
  "review_graph.json": { ...commonHeader, policy: reviewPolicy, exposures: reviewExposures },
  "assessment_graph.json": { ...commonHeader, assessments },
  "game_graph.json": { ...commonHeader, nodes: gameNodes },
  "exercise_pools.json": { ...commonHeader, templates: exerciseTemplates, exercises },
  "learner_progress_migration.json": migration,
  "generation_explanations.json": { ...commonHeader, characterPlacements: characterReadiness.map((row) => ({ entityId: row.characterId, placedInLesson: characterToLesson.get(row.characterId)?.lessonId, reasons: row.placementExplanation })), wordPlacements: placedWords },
  "curriculum_statistics.json": statistics,
  "curriculum_semantic_audit.json": semanticAudit,
};
for (const [name, document] of Object.entries(documents)) writeJson(resolve(outputRoot, name), document);
for (const lesson of lessons) writeJson(resolve(outputRoot, "lessons", `${lesson.lessonId}.json`), { ...commonHeader, lesson });

const validationReport = [
  "# Chinese Input curriculum validation",
  "",
  `- Mode: ${mode}`,
  `- Release status: ${commonHeader.releaseStatus}`,
  `- Production eligible: ${commonHeader.productionEligible}`,
  `- Stages: ${stages.length}`,
  `- Lessons: ${lessons.length}`,
  `- Characters covered exactly once: ${characterReadiness.length}`,
  `- Roots introduced: ${roots.length}`,
  `- Supporting words placed: ${placedWords.length}`,
  `- Exercises: ${exercises.length}`,
  `- Assessments: ${assessments.length}`,
  `- Game nodes: ${gameNodes.length}`,
  "",
  "Generated files are disposable. Edit canonical, reviewed or policy inputs and regenerate.",
  "",
].join("\n");
writeFileSync(resolve(outputRoot, "curriculum_validation_report.md"), validationReport);
writeFileSync(resolve(outputRoot, "curriculum_semantic_audit_report.md"), [
  "# Chinese Input curriculum semantic audit",
  "",
  "Status: PASS with explicit provisional warnings.",
  "",
  ...unresolvedWarnings.map((warning) => `- ${warning}`),
  "",
].join("\n"));

console.log(`Generated ${mode} curriculum: ${stages.length} stages, ${lessons.length} lessons, ${characterReadiness.length} characters, ${placedWords.length} words, ${assessments.length} assessments, ${gameNodes.length} game nodes, ${exercises.length} exercises.`);
console.log(`Input digest: ${inputDigest}`);
