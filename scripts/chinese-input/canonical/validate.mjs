#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CHARACTER_COLUMNS, WORD_COLUMNS } from "./constants.mjs";
import { parseArgs, readJson, writeText } from "./io.mjs";

const args = parseArgs(process.argv.slice(2));
const projectRoot = resolve(import.meta.dirname, "../../..");
const outputRoot = resolve(projectRoot, String(args.output || "learning-data/chinese-input/canonical"));
const charactersDocument = readJson(resolve(outputRoot, "canonical_characters.json"));
const wordsDocument = readJson(resolve(outputRoot, "canonical_words.json"));
const statistics = readJson(resolve(outputRoot, "canonical_statistics.json"));
const characters = charactersDocument.characters;
const words = wordsDocument.words;
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

check(characters.length >= 2500 && characters.length <= 3500, `Character count ${characters.length} is outside 2500–3500.`);
check(words.length >= 8000 && words.length <= 15000, `Word count ${words.length} is outside 8000–15000.`);
check(duplicates(characters.map((row) => row.character)).length === 0, "Duplicate character rows found.");
check(duplicates(characters.map((row) => row.frequency_rank)).length === 0, "Duplicate character frequency ranks found.");
check(duplicates(words.map((row) => row.word)).length === 0, "Duplicate word rows found.");
check(duplicates(words.map((row) => row.frequency_rank)).length === 0, "Duplicate word frequency ranks found.");

const characterSet = new Set(characters.map((row) => row.character));
const requiredCharacterFields = [
  "character", "unicode", "unicode_hex", "edb_version", "frequency_rank", "frequency_band",
  "frequency_source", "difficulty_level", "school_level", "recommended_lesson", "curriculum_tier",
  "cangjie", "quick", "root_count", "code_length", "first_root", "last_root",
  "total_strokes", "english", "meaning", "jyutping", "mandarin_pinyin",
  "review_priority", "source_cangjie", "source_unihan", "source_edb", "source_opencc", "last_verified", "dataset_version",
];
for (const row of characters) {
  for (const field of requiredCharacterFields) {
    check(row[field] !== "" && row[field] !== null && row[field] !== undefined, `${row.character}: missing required field ${field}.`);
  }
  check(Array.from(row.character.normalize("NFC")).length === 1, `${row.character}: not one NFC code point.`);
  check(/\p{Script=Han}/u.test(row.character), `${row.character}: not a Han character.`);
  check(row.unicode === `U+${row.character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`, `${row.character}: Unicode value mismatch.`);
  check(/^[A-Y]{1,5}$/.test(row.cangjie), `${row.character}: invalid Cangjie 5 code ${row.cangjie}.`);
  check(/^[A-Y]{1,2}$/.test(row.quick), `${row.character}: invalid Quick code ${row.quick}.`);
  check(row.quick === (row.cangjie.length === 1 ? row.cangjie : `${row.cangjie[0]}${row.cangjie.at(-1)}`), `${row.character}: Quick code is not first/last Cangjie.`);
  check(row.accepted_cangjie_codes.includes(row.cangjie), `${row.character}: preferred Cangjie code is not accepted.`);
  check(row.accepted_quick_codes.includes(row.quick), `${row.character}: preferred Quick code is not accepted.`);
}

for (const row of words) {
  check(Array.from(row.word).every((glyph) => characterSet.has(glyph)), `${row.word}: references a character outside the canonical set.`);
  check(row.jyutping !== "", `${row.word}: missing derived Jyutping sequence.`);
  check(row.mandarin_pinyin !== "", `${row.word}: missing derived Mandarin sequence.`);
  check(row.frequency_source !== "", `${row.word}: missing word-frequency provenance.`);
}

const characterCsvHeader = readFileSync(resolve(outputRoot, "canonical_characters.csv"), "utf8").split(/\r?\n/, 1)[0];
const wordCsvHeader = readFileSync(resolve(outputRoot, "canonical_words.csv"), "utf8").split(/\r?\n/, 1)[0];
check(characterCsvHeader === CHARACTER_COLUMNS.join(","), "Character CSV header does not match the canonical schema.");
check(wordCsvHeader === WORD_COLUMNS.join(","), "Word CSV header does not match the canonical schema.");

warn(characters.every((row) => row.structure !== "unclassified"), "Structural layout remains unclassified until a pinned IDS/structure source is approved.");
warn(characters.every((row) => row.example_sentence), "Character example sentences are intentionally blank; no authoritative example corpus is pinned.");
warn(words.every((row) => row.english && row.meaning), "Word English meanings are intentionally blank; the frequency source does not publish definitions.");
warn(words.every((row) => row.example_sentence), "Word example sentences are intentionally blank; no redistributable sentence corpus is pinned.");

const status = errors.length ? "FAIL" : "PASS";
const validationReport = [
  "# Canonical Chinese dataset validation",
  "",
  `Status: **${status}**`,
  "",
  `- Characters: ${characters.length}`,
  `- Words: ${words.length}`,
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
].join("\n");
writeText(resolve(outputRoot, "validation_report.md"), validationReport);

const coverageReport = [
  "# Canonical Chinese dataset coverage",
  "",
  `- Canonical characters: ${statistics.characterCount}`,
  `- Canonical words: ${statistics.wordCount}`,
  `- EDB online inventory represented: ${statistics.edbCoveragePercent}%`,
  `- Characters with MOE frequency evidence: ${statistics.moeFrequencyCoveragePercent}%`,
  `- MOE corpus occurrence coverage: ${statistics.moeCorpusOccurrenceCoveragePercent}%`,
  `- Average stroke count: ${statistics.averageStrokeCount}`,
  `- Average Cangjie code length: ${statistics.averageCodeLength}`,
  "",
  "## Frequency bands",
  "",
  ...Object.entries(statistics.byFrequencyBand).map(([band, count]) => `- ${band}: ${count}`),
  "",
  "## Known enrichment gaps",
  "",
  "- EDB is used as the Hong Kong coverage reference; MOE frequency determines ordering.",
  "- Word readings are deterministic concatenations of canonical character readings, not context-sensitive pronunciations.",
  "- Structure, components, English word meanings and example sentences require separately licensed pinned sources.",
  "- Generated lesson IDs are recommendations only; lesson metadata references characters by ID and must not duplicate character records.",
  "",
].join("\n");
writeText(resolve(outputRoot, "coverage_report.md"), coverageReport);

console.log(`${status}: ${characters.length} characters, ${words.length} words, ${errors.length} errors, ${warnings.length} warnings.`);
if (errors.length) process.exitCode = 1;
