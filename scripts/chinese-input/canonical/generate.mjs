#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CHARACTER_COLUMNS,
  DATASET_VERSION,
  GENERATED_AT,
  SOURCE_DEFINITIONS,
  WORD_COLUMNS,
} from "./constants.mjs";
import {
  parseArgs,
  readJson,
  sha256File,
  toCsv,
  writeCompactJson,
  writeJson,
  writeText,
} from "./io.mjs";

const args = parseArgs(process.argv.slice(2));
const projectRoot = resolve(import.meta.dirname, "../../..");
const sourceRoot = resolve(projectRoot, String(args["source-root"] || "data-source"));
const outputRoot = resolve(projectRoot, String(args.output || "learning-data/chinese-input/canonical"));
const targetCount = Number(args.count || 3000);

const paths = {
  edb: resolve(sourceRoot, "authoritative/hk-edb/characters.json"),
  frequency: resolve(sourceRoot, "authoritative/tw-moe/frequency.json"),
  wordFrequency: resolve(sourceRoot, "authoritative/tw-moe/word-frequency.json"),
  cangjie: resolve(sourceRoot, `authoritative/${SOURCE_DEFINITIONS.cangjie.relativePath}`),
  quick: resolve(sourceRoot, `authoritative/${SOURCE_DEFINITIONS.quick.relativePath}`),
  readings: resolve(sourceRoot, `authoritative/${SOURCE_DEFINITIONS.unihan.relativePaths.readings}`),
  radicalStrokes: resolve(sourceRoot, `authoritative/${SOURCE_DEFINITIONS.unihan.relativePaths.radicalStrokes}`),
  variants: resolve(sourceRoot, `authoritative/${SOURCE_DEFINITIONS.unihan.relativePaths.variants}`),
  opencc: resolve(sourceRoot, `authoritative/${SOURCE_DEFINITIONS.opencc.relativePath}`),
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseCangjie(text) {
  const records = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#") || line === "---" || line === "...") continue;
    const [character, rawCode] = line.split("\t");
    if (Array.from(character || "").length !== 1) continue;
    const code = String(rawCode || "").replace(/[^a-z]/g, "").toUpperCase();
    if (!code || code.length > 5 || code.startsWith("Z")) continue;
    if (!records.has(character)) records.set(character, new Set());
    records.get(character).add(code);
  }
  return new Map([...records].map(([character, codes]) => [
    character,
    [...codes].sort((a, b) => a.length - b.length || a.localeCompare(b)),
  ]));
}

function mergeUnihanFile(records, text, acceptedProperties) {
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const [codePoint, property, value] = line.split("\t");
    if (!acceptedProperties.has(property) || !/^U\+[0-9A-F]+$/.test(codePoint || "")) continue;
    const character = String.fromCodePoint(Number.parseInt(codePoint.slice(2), 16));
    const record = records.get(character) || {};
    record[property] = value;
    records.set(character, record);
  }
}

function parseUnihan() {
  const records = new Map();
  mergeUnihanFile(records, readFileSync(paths.readings, "utf8"), new Set([
    "kCantonese", "kDefinition", "kMandarin",
  ]));
  mergeUnihanFile(records, readFileSync(paths.radicalStrokes, "utf8"), new Set([
    "kRSUnicode", "kTotalStrokes",
  ]));
  mergeUnihanFile(records, readFileSync(paths.variants, "utf8"), new Set([
    "kSimplifiedVariant", "kTraditionalVariant",
  ]));
  return records;
}

function quickCode(code) {
  return code.length < 2 ? code : `${code[0]}${code.at(-1)}`;
}

function unicodeValue(character) {
  return `U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
}

function sourceRank(record) {
  return Number.isInteger(record.frequency?.rank) ? record.frequency.rank : Number.MAX_SAFE_INTEGER;
}

function frequencyBand(rank) {
  if (rank <= 100) return "top-100";
  if (rank <= 500) return "top-500";
  if (rank <= 1000) return "top-1000";
  if (rank <= 2500) return "top-2500";
  return "extended";
}

function curriculumTier(rank) {
  if (rank <= 500) return "foundation";
  if (rank <= 1500) return "core";
  if (rank <= 2500) return "expansion";
  return "extension";
}

function categoryFromDefinition(definition) {
  const value = String(definition).toLowerCase();
  if (/\b(person|man|woman|father|mother|child|surname)\b/.test(value)) return "people";
  if (/\b(eat|drink|food|rice|tea|fruit|meat)\b/.test(value)) return "food";
  if (/\b(school|study|learn|write|read|book)\b/.test(value)) return "education";
  if (/\b(rain|wind|cloud|sun|moon|water|fire|earth|mountain)\b/.test(value)) return "nature";
  if (/\b(go|come|make|do|take|give|see|hear|speak)\b/.test(value)) return "actions";
  if (/\b(number|one|two|three|four|five|six|seven|eight|nine|ten)\b/.test(value)) return "numbers";
  return "general";
}

function parseRadical(value) {
  return String(value || "").split(" ")[0].split(".")[0];
}

function parseStrokeCount(value, fallback) {
  const number = Number.parseInt(String(value || "").split(" ")[0], 10);
  return Number.isInteger(number) ? number : fallback;
}

function parseOpenCcSimplifiedCharacters(text) {
  const records = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const [simplified, rawTraditional] = line.split("\t");
    const traditional = String(rawTraditional || "").split(" ").filter(Boolean);
    if (Array.from(simplified || "").length === 1 && traditional.length) records.set(simplified, traditional);
  }
  return records;
}

function isSimplifiedOnly(character, unihan, opencc) {
  const openCcMappings = opencc.get(character) || [];
  const openCcConverts = openCcMappings.some((mapped) => mapped !== character);
  const unihanConverts = Boolean(unihan.kTraditionalVariant) && !unihan.kSimplifiedVariant;
  return openCcConverts && unihanConverts;
}

assert(targetCount >= 2500 && targetCount <= 3500, "--count must be between 2500 and 3500.");
assert(sha256File(paths.cangjie) === SOURCE_DEFINITIONS.cangjie.sha256, "Pinned Cangjie source checksum mismatch.");
assert(sha256File(paths.quick) === SOURCE_DEFINITIONS.quick.sha256, "Pinned Quick source checksum mismatch.");
assert(sha256File(paths.opencc) === SOURCE_DEFINITIONS.opencc.sha256, "Pinned OpenCC source checksum mismatch.");
assert(readFileSync(paths.quick, "utf8").includes("derive/^([^z])\\w+(\\w)$/$1$2/"), "Pinned Quick first/last rule is missing.");

const edbSnapshot = readJson(paths.edb);
const frequencySnapshot = readJson(paths.frequency);
const wordFrequencySnapshot = readJson(paths.wordFrequency);
assert(edbSnapshot.count === SOURCE_DEFINITIONS.edb.expectedCharacterCount, "EDB snapshot count mismatch.");
assert(frequencySnapshot.count === SOURCE_DEFINITIONS.frequency.expectedCharacterCount, "Frequency snapshot count mismatch.");
assert(wordFrequencySnapshot.count === SOURCE_DEFINITIONS.wordFrequency.expectedWordCount, "Word-frequency snapshot count mismatch.");

const cangjie = parseCangjie(readFileSync(paths.cangjie, "utf8"));
const unihan = parseUnihan();
const opencc = parseOpenCcSimplifiedCharacters(readFileSync(paths.opencc, "utf8"));
const frequency = new Map();
for (const row of frequencySnapshot.rows) {
  const existing = frequency.get(row.character);
  if (!existing || row.rank < existing.rank) frequency.set(row.character, row);
}

const rejected = [];
const candidates = [];
for (const edb of edbSnapshot.characters) {
  const character = edb.character.normalize("NFC");
  const codes = cangjie.get(character);
  const language = unihan.get(character) || {};
  const reasons = [];
  if (Array.from(character).length !== 1 || !/\p{Script=Han}/u.test(character)) reasons.push("not-single-han");
  if (!codes?.length) reasons.push("missing-cangjie");
  if (!language.kDefinition) reasons.push("missing-definition");
  if (!language.kCantonese) reasons.push("missing-jyutping");
  if (!language.kMandarin) reasons.push("missing-mandarin");
  if (isSimplifiedOnly(character, language, opencc)) reasons.push("simplified-only");
  if (reasons.length) {
    rejected.push({ character, reasons });
    continue;
  }
  candidates.push({ character, edb, codes, language, frequency: frequency.get(character) });
}

candidates.sort((a, b) => (
  sourceRank(a) - sourceRank(b)
  || (b.frequency?.count || 0) - (a.frequency?.count || 0)
  || a.edb.totalStrokes - b.edb.totalStrokes
  || a.character.codePointAt(0) - b.character.codePointAt(0)
));
assert(candidates.length >= targetCount, `Only ${candidates.length} fully sourced candidates; need ${targetCount}.`);
const selected = candidates.slice(0, targetCount);
const codeCounts = new Map();
for (const record of selected) {
  const code = record.codes[0];
  codeCounts.set(code, (codeCounts.get(code) || 0) + 1);
}

const characters = selected.map((record, index) => {
  const rank = index + 1;
  const preferredCode = record.codes[0];
  const preferredQuick = quickCode(preferredCode);
  const definition = record.language.kDefinition;
  const strokes = parseStrokeCount(record.language.kTotalStrokes, record.edb.totalStrokes);
  const typingDifficulty = Math.min(5, preferredCode.length);
  const strokeDifficulty = Math.min(5, Math.max(1, Math.ceil(strokes / 6)));
  const category = categoryFromDefinition(definition);
  const lesson = Math.ceil(rank / 10);
  const unit = Math.ceil(lesson / 10);
  return {
    character: record.character,
    unicode: unicodeValue(record.character),
    unicode_hex: record.character.codePointAt(0).toString(16).toUpperCase(),
    present_in_edb: true,
    edb_version: SOURCE_DEFINITIONS.edb.version,
    frequency_rank: rank,
    frequency_score: record.frequency ? Number((record.frequency.count / SOURCE_DEFINITIONS.frequency.expectedTotalFrequency).toFixed(10)) : 0,
    frequency_band: frequencyBand(rank),
    frequency_source: record.frequency ? SOURCE_DEFINITIONS.frequency.id : `${SOURCE_DEFINITIONS.edb.id}:fallback`,
    difficulty_level: Math.min(5, Math.ceil((typingDifficulty + strokeDifficulty) / 2)),
    school_level: rank <= 1200 ? "FoxChild primary foundation" : rank <= 2500 ? "FoxChild primary core" : "FoxChild primary extension",
    recommended_lesson: `character-${String(lesson).padStart(3, "0")}`,
    recommended_unit: `unit-${String(unit).padStart(2, "0")}`,
    curriculum_tier: curriculumTier(rank),
    cangjie: preferredCode,
    quick: preferredQuick,
    root_count: preferredCode.length,
    code_length: preferredCode.length,
    first_root: preferredCode[0],
    last_root: preferredCode.at(-1),
    radical: parseRadical(record.language.kRSUnicode),
    total_strokes: strokes,
    structure: "unclassified",
    left_right: false,
    top_bottom: false,
    surround: false,
    single: preferredCode.length === 1,
    english: definition,
    category,
    sub_category: "unclassified",
    meaning: definition,
    example_word: "",
    example_phrase: "",
    example_sentence: "",
    jyutping: record.language.kCantonese.split(" ")[0],
    mandarin_pinyin: record.language.kMandarin.split(" ")[0],
    is_high_frequency: rank <= 1000,
    is_beginner: rank <= 500 && preferredCode.length <= 3,
    is_common_word: rank <= 1500,
    review_priority: Number((1 + (typingDifficulty / 5) + (rank / targetCount)).toFixed(3)),
    review_interval: rank <= 500 ? 1 : rank <= 1500 ? 3 : rank <= 2500 ? 7 : 14,
    mastery_weight: Number((1 + (targetCount - rank) / targetCount).toFixed(3)),
    unlock_after: lesson === 1 ? "" : `character-${String(lesson - 1).padStart(3, "0")}`,
    teaching_notes: `Teach the verified Cangjie 5 code ${preferredCode}; Quick code ${preferredQuick}.`,
    component_1: "",
    component_2: "",
    component_3: "",
    component_4: "",
    similar_characters: "",
    confusable_characters: "",
    derived_characters: "",
    stroke_difficulty: strokeDifficulty,
    typing_difficulty: typingDifficulty,
    memory_difficulty: Math.min(5, Math.ceil((typingDifficulty + Math.log2(rank + 1) / 3) / 2)),
    shape_complexity: strokeDifficulty,
    code_uniqueness: Number((1 / codeCounts.get(preferredCode)).toFixed(4)),
    family_grouping: `cangjie-${preferredCode[0]}`,
    phonetic_grouping: record.language.kMandarin.replace(/[1-5\s]/g, "").split(" ")[0],
    semantic_grouping: category,
    component_grouping: "unclassified",
    source_frequency: record.frequency ? SOURCE_DEFINITIONS.frequency.id : "",
    source_cangjie: `${SOURCE_DEFINITIONS.cangjie.id}@${SOURCE_DEFINITIONS.cangjie.commit}`,
    source_unihan: `${SOURCE_DEFINITIONS.unihan.id}@${SOURCE_DEFINITIONS.unihan.version}`,
    source_edb: `${SOURCE_DEFINITIONS.edb.id}@${SOURCE_DEFINITIONS.edb.version}`,
    source_opencc: `${SOURCE_DEFINITIONS.opencc.id}@${SOURCE_DEFINITIONS.opencc.commit}`,
    last_verified: GENERATED_AT.slice(0, 10),
    dataset_version: DATASET_VERSION,
    accepted_cangjie_codes: record.codes,
    accepted_quick_codes: [...new Set(record.codes.map(quickCode))],
  };
});

const characterByGlyph = new Map(characters.map((character) => [character.character, character]));
const words = wordFrequencySnapshot.rows
  .filter((row) => {
    const glyphs = Array.from(row.word.normalize("NFC"));
    return glyphs.length >= 2
      && glyphs.length <= 4
      && glyphs.every((glyph) => characterByGlyph.has(glyph));
  })
  .slice(0, 10000)
  .map((row, index) => {
    const glyphs = Array.from(row.word.normalize("NFC"));
    const members = glyphs.map((glyph) => characterByGlyph.get(glyph));
    const unlockRank = Math.max(...members.map((member) => member.frequency_rank));
    const lesson = Math.ceil(unlockRank / 10);
    const categoryCounts = new Map();
    for (const member of members) {
      categoryCounts.set(member.category, (categoryCounts.get(member.category) || 0) + 1);
    }
    const category = [...categoryCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || "general";
    return {
      word: row.word,
      unicode_sequence: glyphs.map(unicodeValue).join(" "),
      character_ids: glyphs.map((glyph) => `u${glyph.codePointAt(0).toString(16).toLowerCase()}`),
      frequency_rank: index + 1,
      frequency_score: Number((row.count / SOURCE_DEFINITIONS.wordFrequency.expectedTotalFrequency).toFixed(10)),
      frequency_source: SOURCE_DEFINITIONS.wordFrequency.id,
      school_level: index < 4000 ? "FoxChild primary foundation" : index < 8000 ? "FoxChild primary core" : "FoxChild primary extension",
      curriculum_tier: index < 2000 ? "foundation" : index < 6000 ? "core" : index < 9000 ? "expansion" : "extension",
      recommended_lesson: `character-${String(lesson).padStart(3, "0")}`,
      jyutping: members.map((member) => member.jyutping).join(" "),
      mandarin_pinyin: members.map((member) => member.mandarin_pinyin).join(" "),
      english: "",
      meaning: "",
      category,
      sub_category: "unclassified",
      example_sentence: "",
      review_priority: Number((1 + ((index + 1) / 10000)).toFixed(3)),
      source_edb: "",
      last_verified: GENERATED_AT.slice(0, 10),
      dataset_version: DATASET_VERSION,
      source_frequency: SOURCE_DEFINITIONS.wordFrequency.id,
    };
  });
const sourceFiles = Object.fromEntries(Object.entries(paths).map(([id, path]) => [
  id,
  { path: path.replace(`${projectRoot}/`, ""), sha256: sha256File(path) },
]));

function histogram(rows, field) {
  return Object.fromEntries([...new Set(rows.map((row) => String(row[field] || "unknown")))]
    .sort()
    .map((value) => [value, rows.filter((row) => String(row[field] || "unknown") === value).length]));
}

writeText(resolve(outputRoot, "canonical_characters.csv"), toCsv(CHARACTER_COLUMNS, characters));
writeCompactJson(resolve(outputRoot, "canonical_characters.json"), {
  schemaVersion: 1,
  datasetVersion: DATASET_VERSION,
  generatedAt: GENERATED_AT,
  columns: CHARACTER_COLUMNS,
  characters,
});
writeText(resolve(outputRoot, "canonical_words.csv"), toCsv(WORD_COLUMNS, words));
writeCompactJson(resolve(outputRoot, "canonical_words.json"), {
  schemaVersion: 1,
  datasetVersion: DATASET_VERSION,
  generatedAt: GENERATED_AT,
  columns: WORD_COLUMNS,
  words,
});

const statistics = {
  characterCount: characters.length,
  wordCount: words.length,
  sourceCandidateCount: candidates.length,
  rejectedCount: rejected.length,
  edbCoveragePercent: Number((characters.length / edbSnapshot.count * 100).toFixed(2)),
  moeFrequencyCoveragePercent: Number((characters.filter((row) => row.source_frequency).length / characters.length * 100).toFixed(2)),
  moeCorpusOccurrenceCoveragePercent: Number((characters.reduce((sum, row) => sum + row.frequency_score, 0) * 100).toFixed(4)),
  averageStrokeCount: Number((characters.reduce((sum, row) => sum + row.total_strokes, 0) / characters.length).toFixed(2)),
  averageCodeLength: Number((characters.reduce((sum, row) => sum + row.code_length, 0) / characters.length).toFixed(2)),
  byFrequencyBand: histogram(characters, "frequency_band"),
  byCurriculumTier: histogram(characters, "curriculum_tier"),
  byRadical: histogram(characters, "radical"),
  byStructure: histogram(characters, "structure"),
  byLesson: histogram(characters, "recommended_lesson"),
  top100: characters.slice(0, 100).map((row) => row.character).join(""),
  top500Count: Math.min(500, characters.length),
  top1000Count: Math.min(1000, characters.length),
  top2500Count: Math.min(2500, characters.length),
};
writeJson(resolve(outputRoot, "canonical_statistics.json"), statistics);
writeJson(resolve(outputRoot, "source_manifest.json"), {
  schemaVersion: 1,
  datasetVersion: DATASET_VERSION,
  generatedAt: GENERATED_AT,
  sourceDefinitions: SOURCE_DEFINITIONS,
  sourceFiles,
  acquisition: "Run fetch-authoritative-sources.mjs explicitly; normal builds are offline.",
});
writeJson(resolve(outputRoot, "dataset_version.json"), {
  datasetVersion: DATASET_VERSION,
  schemaVersion: 1,
  generatedAt: GENERATED_AT,
  characterCount: characters.length,
  wordCount: words.length,
});
writeJson(resolve(outputRoot, "rejected_characters.json"), { rejected });

console.log(`Generated ${characters.length} canonical characters and ${words.length} canonical words in ${outputRoot}.`);
