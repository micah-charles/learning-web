#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CHARACTER_COLUMNS,
  CHARACTER_DECOMPOSITION_COLUMNS,
  CHARACTER_FAMILY_COLUMNS,
  CHARACTER_READING_COLUMNS,
  CHARACTER_REVIEW_QUEUE_COLUMNS,
  COMPONENT_METADATA_COLUMNS,
  DATASET_VERSION,
  SEMANTIC_ANCHOR_CHARACTERS,
  WORD_COLUMNS,
} from "./constants.mjs";
import { parseArgs, readJson, writeText } from "./io.mjs";

const args = parseArgs(process.argv.slice(2));
const projectRoot = resolve(import.meta.dirname, "../../..");
const outputRoot = resolve(projectRoot, String(args.output || "learning-data/chinese-input/canonical"));
const fixturePath = resolve(import.meta.dirname, "fixtures/semantic-anchor-review.json");
const charactersDocument = readJson(resolve(outputRoot, "canonical_characters.json"));
const wordsDocument = readJson(resolve(outputRoot, "canonical_words.json"));
const readingsDocument = readJson(resolve(outputRoot, "canonical_character_readings.json"));
const decompositionsDocument = readJson(resolve(outputRoot, "canonical_character_decompositions.json"));
const componentsDocument = readJson(resolve(outputRoot, "canonical_component_metadata.json"));
const familiesDocument = readJson(resolve(outputRoot, "canonical_character_families.json"));
const reviewQueueDocument = readJson(resolve(outputRoot, "character_review_queue.json"));
const cangjieAudit = readJson(resolve(outputRoot, "cangjie_reference_audit.json"));
const statistics = readJson(resolve(outputRoot, "canonical_statistics.json"));
const semanticAudit = readJson(resolve(outputRoot, "semantic_audit.json"));
const fixture = readJson(fixturePath);
const characters = charactersDocument.characters;
const words = wordsDocument.words;
const readings = readingsDocument.readings;
const decompositions = decompositionsDocument.decompositions;
const components = componentsDocument.components;
const familyMemberships = familiesDocument.memberships;
const reviewQueue = reviewQueueDocument.reviews;
const errors = [];
const warnings = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}

function warn(condition, message) {
  if (!condition) warnings.push(message);
}

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

function csvHeader(fileName) {
  return readFileSync(resolve(outputRoot, fileName), "utf8").split(/\r?\n/, 1)[0];
}

check(charactersDocument.schemaVersion === 4, "Character schema version must be 4.");
check(wordsDocument.schemaVersion === 4, "Word schema version must be 4.");
check(readingsDocument.schemaVersion === 4, "Character-reading schema version must be 4.");
check(decompositionsDocument.schemaVersion === 4, "Character-decomposition schema version must be 4.");
check(componentsDocument.schemaVersion === 4, "Component-metadata schema version must be 4.");
check(familiesDocument.schemaVersion === 4, "Character-family schema version must be 4.");
check(charactersDocument.datasetVersion === DATASET_VERSION, "Character dataset version mismatch.");
check(wordsDocument.datasetVersion === DATASET_VERSION, "Word dataset version mismatch.");
check(readingsDocument.datasetVersion === DATASET_VERSION, "Character-reading dataset version mismatch.");
check(decompositionsDocument.datasetVersion === DATASET_VERSION, "Character-decomposition dataset version mismatch.");
check(componentsDocument.datasetVersion === DATASET_VERSION, "Component-metadata dataset version mismatch.");
check(familiesDocument.datasetVersion === DATASET_VERSION, "Character-family dataset version mismatch.");
check(characters.length >= 2500 && characters.length <= 3500, `Character count ${characters.length} is outside 2500–3500.`);
check(words.length >= 8000 && words.length <= 15000, `Word count ${words.length} is outside 8000–15000.`);
check(duplicates(characters.map((row) => row.character)).length === 0, "Duplicate character rows found.");
check(duplicates(characters.map((row) => row.foxchild_selection_rank)).length === 0, "Duplicate character selection ranks found.");
check(duplicates(words.map((row) => row.word)).length === 0, "Duplicate word rows found.");
check(duplicates(words.map((row) => row.foxchild_selection_rank)).length === 0, "Duplicate word selection ranks found.");
check(duplicates(readings.map((row) => `${row.character}:${row.language}:${row.reading}`)).length === 0, "Duplicate character-reading rows found.");
check(decompositions.length === characters.length, "Every character must have exactly one decomposition row.");
check(duplicates(decompositions.map((row) => row.character)).length === 0, "Duplicate character-decomposition rows found.");
check(duplicates(components.map((row) => row.component_id)).length === 0, "Duplicate component metadata IDs found.");
check(duplicates(familyMemberships.map((row) => `${row.family_id}:${row.character}`)).length === 0, "Duplicate character-family memberships found.");
check(reviewQueue.length === characters.length, "Every character must be present in the human-review queue.");
check(cangjieAudit.status === "PASS" && cangjieAudit.mismatchCount === 0, "Pinned Cangjie reference audit did not pass.");

const characterSet = new Set(characters.map((row) => row.character));
const characterByGlyph = new Map(characters.map((row) => [row.character, row]));
const forbiddenEducationalFields = [
  "recommended_lesson", "recommended_unit", "school_level", "is_beginner",
  "difficulty_level", "review_priority", "review_interval", "mastery_weight",
  "unlock_after", "memory_difficulty", "shape_complexity", "family_grouping",
  "phonetic_grouping", "semantic_grouping", "component_grouping",
  "jyutping", "mandarin_pinyin", "english", "meaning", "category",
];
const requiredCharacterFields = [
  "character", "unicode", "unicode_hex", "edb_source_glyph", "edb_version", "foxchild_selection_rank",
  "foxchild_selection_score", "foxchild_selection_method", "frequency_bucket",
  "foxchild_frequency_tier", "foxchild_frequency_tier_method",
  "cangjie", "quick", "root_count", "code_length",
  "first_root", "last_root", "cangjie_difficulty", "cangjie_difficulty_method",
  "simple_code_candidate_method", "total_strokes", "structure",
  "decomposition_status", "structure_source",
  "visual_complexity", "visual_complexity_method", "visual_complexity_confidence",
  "unihan_definition", "learner_definition_status", "category_review_status",
  "code_uniqueness", "code_uniqueness_method", "source_cangjie", "source_unihan",
  "source_edb", "source_opencc", "last_verified", "dataset_version",
];
for (const row of characters) {
  for (const field of requiredCharacterFields) {
    check(row[field] !== "" && row[field] !== null && row[field] !== undefined, `${row.character}: missing required field ${field}.`);
  }
  for (const field of forbiddenEducationalFields) {
    check(!(field in row), `${row.character}: deprecated educational field ${field} must not be generated.`);
  }
  check(Array.from(row.character.normalize("NFC")).length === 1, `${row.character}: not one NFC code point.`);
  check(/\p{Script=Han}/u.test(row.character), `${row.character}: not a Han character.`);
  check(row.unicode === `U+${row.character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`, `${row.character}: Unicode value mismatch.`);
  check(/^[A-Y]{1,5}$/.test(row.cangjie), `${row.character}: invalid Cangjie 5 code ${row.cangjie}.`);
  check(/^[A-Y]{1,2}$/.test(row.quick), `${row.character}: invalid Quick code ${row.quick}.`);
  check(row.quick === (row.cangjie.length === 1 ? row.cangjie : `${row.cangjie[0]}${row.cangjie.at(-1)}`), `${row.character}: Quick code is not first/last Cangjie.`);
  check(row.accepted_cangjie_codes.includes(row.cangjie), `${row.character}: preferred Cangjie code is not accepted.`);
  check(row.accepted_quick_codes.includes(row.quick), `${row.character}: preferred Quick code is not accepted.`);
  check(["left-right", "top-bottom", "surround", "overlay", "single", "other"].includes(row.structure), `${row.character}: invalid source-backed structure ${row.structure}.`);
  check(row.left_right === (row.structure === "left-right"), `${row.character}: left-right flag disagrees with structure.`);
  check(row.top_bottom === (row.structure === "top-bottom"), `${row.character}: top-bottom flag disagrees with structure.`);
  check(row.surround === (row.structure === "surround"), `${row.character}: surround flag disagrees with structure.`);
  check(row.single === (row.structure === "single"), `${row.character}: single flag disagrees with structure.`);
  check(row.decomposition_status === "source-attested-unreviewed", `${row.character}: decomposition review boundary is missing.`);
  check(row.learner_definition_en === "" && row.learner_definition_status === "unreviewed", `${row.character}: Unihan gloss must not be promoted to a learner definition.`);
  check(row.category_confidence === "low" && row.category_review_status === "pending", `${row.character}: heuristic category must remain a low-confidence pending proposal.`);
  check(
    row.register === ""
      && row.formal_written_chinese === ""
      && row.written_cantonese === ""
      && row.spoken_cantonese_transcription === ""
      && row.hk_education_core === ""
      && row.hk_typing_extension === ""
      && row.register_review_status === "unreviewed",
    `${row.character}: language register was asserted without human review.`,
  );
  check(row.hk_frequency_rank === "" && row.usage_level === "" && row.curriculum_priority === "", `${row.character}: missing Hong Kong/usage/curriculum evidence must remain blank.`);
}

const decompositionByCharacter = new Map(decompositions.map((row) => [row.character, row]));
const componentById = new Map(components.map((row) => [row.component_id, row]));
for (const row of decompositions) {
  check(characterSet.has(row.character), `${row.character}: decomposition references a character outside the canonical set.`);
  check(row.ids !== "", `${row.character}: blank IDS decomposition.`);
  check(
    row.component_occurrence_count === row.ordered_component_occurrences.length
      && row.component_occurrence_count === row.ordered_component_ids.length
      && row.component_occurrence_count >= 1,
    `${row.character}: invalid ordered component occurrence count.`,
  );
  check(
    row.unique_component_count === row.unique_components.length
      && row.unique_component_count === new Set(row.ordered_component_occurrences).size,
    `${row.character}: invalid unique component count.`,
  );
  check(
    row.ordered_component_ids.every((componentId, index) => (
      componentById.get(componentId)?.source_token === row.ordered_component_occurrences[index]
    )),
    `${row.character}: component occurrence does not resolve through display metadata.`,
  );
  check(row.source === "chise-ids-ucs-basic" && row.source_commit !== "", `${row.character}: decomposition lacks pinned CHISE provenance.`);
  check(row.review_status === "unreviewed", `${row.character}: source decomposition was incorrectly marked educationally reviewed.`);
}
for (const row of components) {
  check(row.source_token !== "" && row.component_id !== "", `${row.component_id}: component metadata lacks identity.`);
  check(
    ["unicode-ready", "missing-svg-fallback"].includes(row.render_status),
    `${row.component_id}: invalid component render status.`,
  );
  if (row.render_status === "unicode-ready") {
    check(row.unicode_character !== "" && row.display_glyph === row.unicode_character, `${row.component_id}: Unicode component is not display-safe.`);
  } else {
    check(row.source_token.startsWith("&") && row.display_glyph === "", `${row.component_id}: unresolved CHISE entity leaked into the display glyph.`);
  }
  check(row.name_review_status === "unreviewed", `${row.component_id}: component name was marked reviewed without human input.`);
}
const multipleDecomposition = decompositionByCharacter.get("多");
check(
  multipleDecomposition?.ordered_component_occurrences.join("|") === "夕|夕"
    && multipleDecomposition?.component_occurrence_count === 2
    && multipleDecomposition?.unique_component_count === 1,
  "多: repeated IDS components were not preserved.",
);
for (const row of familyMemberships) {
  check(characterSet.has(row.character), `${row.character}: family membership references a character outside the canonical set.`);
  check(["component-shared", "phonetic-class", "semantic-variant"].includes(row.family_type), `${row.character}: invalid family type ${row.family_type}.`);
  check(row.basis !== "" && row.source !== "", `${row.character}: family membership lacks basis/provenance.`);
  check(row.review_status === "unreviewed", `${row.character}: source-derived family was incorrectly marked reviewed.`);
}
for (const character of ["青", "清", "情", "請", "晴", "精"]) {
  check(
    familyMemberships.some((row) => row.family_type === "component-shared" && row.basis === "青" && row.character === character),
    `${character}: 青 component-family fixture is missing.`,
  );
}

for (const row of words) {
  check(Array.from(row.word).every((glyph) => characterSet.has(glyph)), `${row.word}: references a character outside the canonical set.`);
  check(row.pronunciation_status === "contextual-lexical-source-required", `${row.word}: unsafe derived word pronunciation was generated.`);
  check(!("jyutping" in row) && !("mandarin_pinyin" in row), `${row.word}: character readings must not be concatenated into word pronunciations.`);
  check(row.learner_definition_en === "" && row.learner_definition_status === "unreviewed", `${row.word}: unsupported learner definition was generated.`);
  check(
    row.register === ""
      && row.formal_written_chinese === ""
      && row.written_cantonese === ""
      && row.spoken_cantonese_transcription === ""
      && row.hk_education_core === ""
      && row.hk_typing_extension === ""
      && row.register_review_status === "unreviewed",
    `${row.word}: language register was asserted without human review.`,
  );
  check(row.hk_frequency_rank === "" && row.usage_level === "" && row.curriculum_priority === "", `${row.word}: missing Hong Kong/usage/curriculum evidence must remain blank.`);
  check(row.source_frequency !== "", `${row.word}: missing word-frequency provenance.`);
}

for (const row of readings) {
  check(characterSet.has(row.character), `${row.character}: reading references a character outside the canonical set.`);
  check(["yue-HK", "zh-Hant-TW"].includes(row.language), `${row.character}: unsupported reading language ${row.language}.`);
  check(row.reading !== "", `${row.character}: blank reading.`);
  check(row.is_default_for_display === false, `${row.character}: a pedagogical primary reading was selected without review.`);
  check(row.source_property !== "" && row.source !== "", `${row.character}: reading lacks property-level provenance.`);
  check(row.review_status === "source-attested-unreviewed", `${row.character}: reading review status is not honest.`);
}

check(csvHeader("canonical_characters.csv") === CHARACTER_COLUMNS.join(","), "Character CSV header does not match schema 4.");
check(csvHeader("canonical_words.csv") === WORD_COLUMNS.join(","), "Word CSV header does not match schema 4.");
check(csvHeader("canonical_character_readings.csv") === CHARACTER_READING_COLUMNS.join(","), "Character-reading CSV header does not match schema 4.");
check(csvHeader("canonical_character_decompositions.csv") === CHARACTER_DECOMPOSITION_COLUMNS.join(","), "Character-decomposition CSV header does not match schema 4.");
check(csvHeader("canonical_component_metadata.csv") === COMPONENT_METADATA_COLUMNS.join(","), "Component-metadata CSV header does not match schema 4.");
check(csvHeader("canonical_character_families.csv") === CHARACTER_FAMILY_COLUMNS.join(","), "Character-family CSV header does not match schema 4.");
check(csvHeader("character_review_queue.csv") === CHARACTER_REVIEW_QUEUE_COLUMNS.join(","), "Character review-queue CSV header does not match schema.");

const fixtureCharacters = Array.from(fixture.characters);
check(fixture.reviewStatus === "manual-fixture-review-complete", "Semantic anchor fixture has not completed manual fixture review.");
check(fixtureCharacters.length === 300, `Semantic anchor fixture must contain 300 characters; found ${fixtureCharacters.length}.`);
check(duplicates(fixtureCharacters).length === 0, "Semantic anchor fixture contains duplicate characters.");
check(fixtureCharacters.join("") === SEMANTIC_ANCHOR_CHARACTERS.join(""), "Semantic anchor fixture and code constant disagree.");
for (const character of fixtureCharacters) {
  const expectedAbsent = fixture.expectedAbsent.includes(character);
  check(characterSet.has(character) !== expectedAbsent, `${character}: semantic anchor presence differs from reviewed fixture.`);
  if (expectedAbsent) continue;
  const row = characterByGlyph.get(character);
  check(decompositionByCharacter.has(character), `${character}: anchor decomposition is missing.`);
  check(row.category_review_status === "pending", `${character}: anchor category bypassed review.`);
  check(row.learner_definition_status === "unreviewed", `${character}: anchor learner definition bypassed review.`);
}

const readingCounts = new Map();
const readingValues = new Map();
for (const row of readings) {
  if (!readingCounts.has(row.character)) readingCounts.set(row.character, new Set());
  readingCounts.get(row.character).add(`${row.language}:${row.reading}`);
  const key = `${row.character}:${row.language}`;
  if (!readingValues.has(key)) readingValues.set(key, new Set());
  readingValues.get(key).add(row.reading);
}
for (const [character, expectation] of Object.entries(fixture.criticalSourceExpectations)) {
  const row = characterByGlyph.get(character);
  check(row?.cangjie === expectation.cangjie, `${character}: critical fixture Cangjie code mismatch.`);
  check(row?.quick === expectation.quick, `${character}: critical fixture Quick code mismatch.`);
  const cantonese = readingValues.get(`${character}:yue-HK`) || new Set();
  for (const reading of expectation.cantoneseReadings) {
    check(cantonese.has(reading), `${character}: critical fixture is missing Cantonese reading ${reading}.`);
  }
}
for (const character of fixture.polyphonicAnchors) {
  check((readingCounts.get(character)?.size || 0) >= 2, `${character}: polyphonic anchor has fewer than two source-attested readings.`);
}

check(semanticAudit.flags.polyphonicCharactersWithOneReading.length === 0, "Polyphonic source signals remain represented by only one reading.");
check(semanticAudit.flags.unknownStructureWithPopulatedFlags.length === 0, "Unknown structures still have populated layout flags.");
check(semanticAudit.flags.structureFlagMismatches.length === 0, "Source-backed structures disagree with layout flags.");
check(semanticAudit.flags.missingDecompositions.length === 0, "Canonical characters are missing pinned decompositions.");
const sayDiagnostic = semanticAudit.flags.hongKongCharacterAnchorDiagnostics.find((row) => row.character === "說");
check(
  sayDiagnostic?.selected === true
    && sayDiagnostic?.edbSourceGlyph === "説"
    && sayDiagnostic?.exclusionReason === "",
  "說: reviewed EDB glyph alias did not produce a transparent selected anchor.",
);
for (const diagnostic of semanticAudit.flags.hongKongCharacterAnchorDiagnostics) {
  check(
    diagnostic.selected || diagnostic.exclusionReason !== "",
    `${diagnostic.character}: missing Hong Kong anchor lacks an exclusion reason.`,
  );
}
for (const diagnostic of semanticAudit.flags.hongKongWordAnchorDiagnostics) {
  check(
    diagnostic.selected || diagnostic.exclusionReason !== "",
    `${diagnostic.word}: missing Hong Kong word anchor lacks an exclusion reason.`,
  );
}
for (const character of fixture.expectedAbsent) {
  check(
    semanticAudit.flags.missingHongKongCantoneseCharacters.some((row) => row.character === character)
      || semanticAudit.flags.taiwanHighFrequencyWithoutHongKongRank.some((row) => row.character === character),
    `${character}: reviewed missing Hong Kong anchor is not exposed by the semantic audit.`,
  );
}

warn(decompositions.every((row) => row.review_status === "reviewed"), "CHISE decompositions are source-backed but not yet reviewed for FoxChild teaching use.");
warn(familyMemberships.every((row) => row.review_status === "reviewed"), "Source-derived character families are not yet reviewed for FoxChild teaching use.");
warn(characters.every((row) => row.learner_definition_status === "reviewed"), "Learner-facing English definitions remain unreviewed.");
warn(words.every((row) => row.learner_definition_status === "reviewed"), "Word learner definitions remain unreviewed.");
warn(words.every((row) => row.pronunciation_status === "reviewed"), "Context-sensitive word pronunciations require a pinned lexical source.");
warn(semanticAudit.flags.weakCategoryProposals.length === 0, `${semanticAudit.flags.weakCategoryProposals.length} low-confidence category proposals await review.`);
warn(semanticAudit.flags.taiwanHighFrequencyWithoutHongKongRank.length === 0, "MOE top-frequency records still lack independent Hong Kong frequency ranks.");
warn(semanticAudit.flags.missingHongKongCantoneseCharacters.length === 0, "Hong Kong Cantonese character anchors are missing from the EDB-gated selection.");
warn(semanticAudit.flags.missingHongKongCantoneseWords.length === 0, "Hong Kong Cantonese word anchors are missing from the Taiwan word-frequency selection.");

const status = errors.length ? "FAIL" : "PASS";
writeText(resolve(outputRoot, "validation_report.md"), [
  "# Canonical Chinese dataset validation",
  "",
  `Status: **${status}**`,
  "",
  `- Characters: ${characters.length}`,
  `- Character readings: ${readings.length}`,
  `- Words: ${words.length}`,
  `- Semantic QA anchors: ${fixtureCharacters.length}`,
  `- Errors: ${errors.length}`,
  `- Warnings: ${warnings.length}`,
  "",
  "## Errors",
  "",
  ...(errors.length ? errors.map((error) => `- ${error}`) : ["- None."]),
  "",
  "## Warnings",
  "",
  ...(warnings.length ? warnings.map((warning) => `- ${warning}`) : ["- None."]),
  "",
].join("\n"));

writeText(resolve(outputRoot, "coverage_report.md"), [
  "# Canonical Chinese dataset coverage",
  "",
  `- Canonical characters: ${statistics.characterCount}`,
  `- Source-attested character readings: ${statistics.characterReadingCount}`,
  `- Source-attested character decompositions: ${statistics.characterDecompositionCount}`,
  `- Display-safe component metadata records: ${statistics.componentMetadataCount}`,
  `- Components still requiring an SVG fallback: ${statistics.componentMissingSvgFallbackCount}`,
  `- Source-derived family memberships: ${statistics.characterFamilyMembershipCount} across ${statistics.characterFamilyCount} families`,
  `- Canonical words: ${statistics.wordCount}`,
  `- EDB online inventory represented: ${statistics.edbCoveragePercent}%`,
  `- Characters with MOE frequency evidence: ${statistics.moeFrequencyCoveragePercent}%`,
  `- MOE corpus occurrence coverage: ${statistics.moeCorpusOccurrenceCoveragePercent}%`,
  `- Average stroke count: ${statistics.averageStrokeCount}`,
  `- Average Cangjie code length: ${statistics.averageCodeLength}`,
  "",
  "## MOE frequency bands",
  "",
  ...Object.entries(statistics.byMoeFrequencyBand).map(([band, count]) => `- ${band}: ${count}`),
  "",
  "## Evidence boundaries",
  "",
  "- MOE corpus ranks are preserved as MOE ranks; they are not Hong Kong curriculum order.",
  "- Frequency buckets are descriptive corpus buckets, not lessons.",
  "- Character readings are relational, multi-valued and source-attested; none is selected as a pedagogical default.",
  "- Word pronunciations are blank until a context-sensitive lexical source is approved.",
  "- Structure/components are source-attested from pinned CHISE IDS; their teaching interpretation remains unreviewed.",
  "- Phonetic classes and semantic-variant families are provisional Unihan evidence; component families are deterministic CHISE-derived memberships.",
  "- Literacy levels, curriculum priorities and learner definitions remain unknown or unreviewed.",
  "- Category values are low-confidence proposals and cannot be consumed as reviewed categories.",
  "",
].join("\n"));

console.log(`${status}: ${characters.length} characters, ${readings.length} readings, ${words.length} words, ${errors.length} errors, ${warnings.length} warnings.`);
if (errors.length) process.exitCode = 1;
