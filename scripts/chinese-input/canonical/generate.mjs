#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CHARACTER_COLUMNS,
  CHARACTER_READING_COLUMNS,
  DATASET_VERSION,
  GENERATED_AT,
  HONG_KONG_CANTONESE_CHARACTER_ANCHORS,
  HONG_KONG_CANTONESE_WORD_ANCHORS,
  SCHEMA_VERSION,
  SEMANTIC_ANCHOR_CHARACTERS,
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
    "kCantonese", "kDefinition", "kHanyuPinlu", "kHanyuPinyin", "kMandarin",
    "kSMSZD2003Readings",
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
  if (!Number.isInteger(rank)) return "unranked";
  if (rank <= 100) return "top-100";
  if (rank <= 500) return "top-500";
  if (rank <= 1000) return "top-1000";
  if (rank <= 2500) return "top-2500";
  return "extended";
}

function frequencyTier(rank) {
  if (!Number.isInteger(rank)) return "unranked";
  if (rank <= 500) return "tier-1-moe-top-500";
  if (rank <= 1500) return "tier-2-moe-501-1500";
  if (rank <= 2500) return "tier-3-moe-1501-2500";
  return "tier-4-moe-beyond-2500";
}

function suggestedCategoryFromDefinition(definition) {
  const value = String(definition).toLowerCase();
  if (/\b(person|man|woman|father|mother|child|surname)\b/.test(value)) return "people";
  if (/\b(eat|drink|food|rice|tea|fruit|meat)\b/.test(value)) return "food";
  if (/\b(school|study|learn|write|read|book)\b/.test(value)) return "education";
  if (/\b(rain|wind|cloud|sun|moon|water|fire|earth|mountain)\b/.test(value)) return "nature";
  if (/\b(go|come|make|do|take|give|see|hear|speak)\b/.test(value)) return "actions";
  if (/\b(number|one|two|three|four|five|six|seven|eight|nine|ten)\b/.test(value)) return "numbers";
  return "general";
}

function frequencyBucket(rank, type = "character") {
  if (!Number.isInteger(rank)) return "unranked";
  const size = type === "word" ? 100 : 10;
  const start = Math.floor((rank - 1) / size) * size + 1;
  const end = start + size - 1;
  return `moe-${type}-${String(start).padStart(5, "0")}-${String(end).padStart(5, "0")}`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function parseSpaceSeparatedReadings(value) {
  return unique(String(value || "").split(/\s+/).map((reading) => reading.trim()));
}

function parseHanyuPinlu(value) {
  const readings = [];
  for (const match of String(value || "").matchAll(/([^\s()]+)\((\d+)\)/g)) {
    readings.push({ reading: match[1], usage: `attested-count:${match[2]}` });
  }
  return readings;
}

function parseHanyuPinyin(value) {
  const readings = [];
  for (const group of String(value || "").split(/\s+/)) {
    const separator = group.indexOf(":");
    const rawReadings = separator >= 0 ? group.slice(separator + 1) : group;
    for (const reading of rawReadings.split(",")) {
      if (reading) readings.push({ reading, usage: "" });
    }
  }
  return readings;
}

function parseSmszdReadings(value) {
  const readings = [];
  for (const group of String(value || "").split(/\s+/)) {
    const marker = group.indexOf("粵");
    if (marker < 0) continue;
    const mandarinUsage = group.slice(0, marker);
    for (const reading of group.slice(marker + 1).split(",")) {
      if (reading) readings.push({ reading, usage: mandarinUsage ? `mandarin-mapping:${mandarinUsage}` : "" });
    }
  }
  return readings;
}

function characterReadingRows(character, language) {
  const sourcePrefix = `${SOURCE_DEFINITIONS.unihan.id}@${SOURCE_DEFINITIONS.unihan.version}`;
  const rows = [];
  const add = (languageCode, reading, usage, property) => {
    if (!reading || rows.some((row) => row.language === languageCode && row.reading === reading)) return;
    rows.push({
      character,
      language: languageCode,
      reading,
      usage,
      word_example: "",
      is_default_for_display: false,
      source: `${sourcePrefix}:${property}`,
      source_property: property,
      review_status: "source-attested-unreviewed",
    });
  };
  for (const reading of parseSpaceSeparatedReadings(language.kCantonese)) {
    add("yue-HK", reading, "", "kCantonese");
  }
  for (const { reading, usage } of parseSmszdReadings(language.kSMSZD2003Readings)) {
    add("yue-HK", reading, usage, "kSMSZD2003Readings");
  }
  for (const reading of parseSpaceSeparatedReadings(language.kMandarin)) {
    add("zh-Hant-TW", reading, "", "kMandarin");
  }
  for (const { reading, usage } of parseHanyuPinlu(language.kHanyuPinlu)) {
    add("zh-Hant-TW", reading, usage, "kHanyuPinlu");
  }
  for (const { reading, usage } of parseHanyuPinyin(language.kHanyuPinyin)) {
    add("zh-Hant-TW", reading, usage, "kHanyuPinyin");
  }
  return rows;
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
  const selectionRank = index + 1;
  const moeRank = Number.isInteger(record.frequency?.rank) ? record.frequency.rank : null;
  const preferredCode = record.codes[0];
  const preferredQuick = quickCode(preferredCode);
  const definition = record.language.kDefinition;
  const strokes = parseStrokeCount(record.language.kTotalStrokes, record.edb.totalStrokes);
  const cangjieDifficulty = Math.min(5, preferredCode.length);
  const visualComplexity = Math.min(5, Math.max(1, Math.ceil(strokes / 6)));
  const suggestedCategory = suggestedCategoryFromDefinition(definition);
  return {
    character: record.character,
    unicode: unicodeValue(record.character),
    unicode_hex: record.character.codePointAt(0).toString(16).toUpperCase(),
    edb_presence: true,
    edb_version: SOURCE_DEFINITIONS.edb.version,
    edb_grade_level: "",
    moe_frequency_rank: moeRank ?? "",
    moe_frequency_score: record.frequency
      ? Number((record.frequency.count / SOURCE_DEFINITIONS.frequency.expectedTotalFrequency).toFixed(10))
      : "",
    moe_frequency_band: frequencyBand(moeRank),
    hk_frequency_rank: "",
    foxchild_selection_rank: selectionRank,
    foxchild_selection_score: Number((1 - ((selectionRank - 1) / Math.max(1, candidates.length - 1))).toFixed(10)),
    foxchild_selection_method: "edb-eligible-then-moe-corpus-order-v1",
    frequency_bucket: frequencyBucket(moeRank),
    foxchild_frequency_tier: frequencyTier(moeRank),
    foxchild_frequency_tier_method: "moe-rank-bands-v1",
    usage_level: "",
    literacy_level: "",
    curriculum_stage: "",
    curriculum_priority: "",
    cangjie: preferredCode,
    quick: preferredQuick,
    root_count: preferredCode.length,
    code_length: preferredCode.length,
    first_root: preferredCode[0],
    last_root: preferredCode.at(-1),
    cangjie_difficulty: cangjieDifficulty,
    cangjie_difficulty_method: "preferred-code-length-v1",
    simple_code_candidate: preferredCode.length <= 3,
    simple_code_candidate_method: "preferred-code-length-at-most-3-v1",
    radical: parseRadical(record.language.kRSUnicode),
    total_strokes: strokes,
    structure: "unknown",
    left_right: "",
    top_bottom: "",
    surround: "",
    single: "",
    visual_complexity: visualComplexity,
    visual_complexity_method: "total-stroke-count-proxy-v1",
    visual_complexity_confidence: "low",
    unihan_definition: definition,
    learner_definition_en: "",
    learner_definition_status: "unreviewed",
    suggested_category: suggestedCategory,
    category_method: "unihan-definition-keyword-proposal-v1",
    category_confidence: "low",
    category_review_status: "pending",
    example_word: "",
    example_phrase: "",
    example_sentence: "",
    code_uniqueness: Number((1 / codeCounts.get(preferredCode)).toFixed(4)),
    code_uniqueness_method: "inverse-selected-preferred-code-collision-count-v1",
    cangjie_first_root_group: `cangjie-${preferredCode[0]}`,
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
const selectedRecordByGlyph = new Map(selected.map((record) => [record.character, record]));
const characterReadings = characters.flatMap((character) => (
  characterReadingRows(character.character, selectedRecordByGlyph.get(character.character).language)
));
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
    const selectionRank = index + 1;
    const memberSelectionCeiling = Math.max(...members.map((member) => member.foxchild_selection_rank));
    return {
      word: row.word,
      unicode_sequence: glyphs.map(unicodeValue).join(" "),
      character_ids: glyphs.map((glyph) => `u${glyph.codePointAt(0).toString(16).toLowerCase()}`),
      moe_frequency_rank: row.rank,
      moe_frequency_score: Number((row.count / SOURCE_DEFINITIONS.wordFrequency.expectedTotalFrequency).toFixed(10)),
      hk_frequency_rank: "",
      foxchild_selection_rank: selectionRank,
      foxchild_selection_score: Number((1 - (index / 9999)).toFixed(10)),
      foxchild_selection_method: "moe-word-order-filtered-to-selected-characters-v1",
      frequency_bucket: frequencyBucket(row.rank, "word"),
      foxchild_frequency_tier: frequencyTier(row.rank),
      foxchild_frequency_tier_method: "moe-rank-bands-v1",
      usage_level: "",
      curriculum_priority: "",
      character_selection_ceiling: memberSelectionCeiling,
      pronunciation_status: "contextual-lexical-source-required",
      learner_definition_en: "",
      learner_definition_status: "unreviewed",
      suggested_category: "",
      category_method: "",
      category_confidence: "",
      category_review_status: "unreviewed",
      example_sentence: "",
      source_frequency: SOURCE_DEFINITIONS.wordFrequency.id,
      last_verified: GENERATED_AT.slice(0, 10),
      dataset_version: DATASET_VERSION,
    };
  });

const readingsByCharacterAndLanguage = new Map();
for (const reading of characterReadings) {
  const key = `${reading.character}:${reading.language}`;
  if (!readingsByCharacterAndLanguage.has(key)) readingsByCharacterAndLanguage.set(key, []);
  readingsByCharacterAndLanguage.get(key).push(reading);
}

function sourceSignalsMultipleReadings(record, languageCode) {
  if (languageCode === "yue-HK") {
    return unique([
      ...parseSpaceSeparatedReadings(record.language.kCantonese),
      ...parseSmszdReadings(record.language.kSMSZD2003Readings).map((row) => row.reading),
    ]).length > 1;
  }
  return unique([
    ...parseSpaceSeparatedReadings(record.language.kMandarin),
    ...parseHanyuPinlu(record.language.kHanyuPinlu).map((row) => row.reading),
    ...parseHanyuPinyin(record.language.kHanyuPinyin).map((row) => row.reading),
  ]).length > 1;
}

const polyphonicSingleReading = [];
for (const record of selected) {
  for (const languageCode of ["yue-HK", "zh-Hant-TW"]) {
    if (!sourceSignalsMultipleReadings(record, languageCode)) continue;
    const represented = readingsByCharacterAndLanguage.get(`${record.character}:${languageCode}`) || [];
    if (represented.length <= 1) {
      polyphonicSingleReading.push({
        character: record.character,
        language: languageCode,
        represented_reading_count: represented.length,
      });
    }
  }
}

const weakCategoryProposals = characters
  .filter((row) => row.suggested_category && row.category_confidence === "low")
  .map((row) => ({
    character: row.character,
    suggested_category: row.suggested_category,
    category_method: row.category_method,
  }));
const complexSimpleCodeCandidates = characters
  .filter((row) => row.simple_code_candidate && row.visual_complexity >= 4)
  .map((row) => ({
    character: row.character,
    cangjie: row.cangjie,
    total_strokes: row.total_strokes,
    visual_complexity: row.visual_complexity,
  }));
const unknownStructureWithFlags = characters
  .filter((row) => row.structure === "unknown" && [row.left_right, row.top_bottom, row.surround, row.single].some((value) => value !== ""))
  .map((row) => ({ character: row.character }));
const taiwanHighFrequencyWithoutHongKongRank = characters
  .filter((row) => Number(row.moe_frequency_rank) <= 100 && row.hk_frequency_rank === "")
  .map((row) => ({
    character: row.character,
    moe_frequency_rank: row.moe_frequency_rank,
    status: "hong-kong-relevance-unverified",
  }));
const selectedCharacterSet = new Set(characters.map((row) => row.character));
const selectedWordSet = new Set(words.map((row) => row.word));
const missingHongKongCharacters = HONG_KONG_CANTONESE_CHARACTER_ANCHORS
  .filter((character) => !selectedCharacterSet.has(character))
  .map((character) => ({ character, status: "missing-from-edb-gated-selection" }));
const missingHongKongWords = HONG_KONG_CANTONESE_WORD_ANCHORS
  .filter((word) => !selectedWordSet.has(word))
  .map((word) => ({ word, status: "missing-from-taiwan-word-frequency-selection" }));

const semanticAudit = {
  schemaVersion: 1,
  datasetVersion: DATASET_VERSION,
  generatedAt: GENERATED_AT,
  fixture: {
    reviewedAnchorCount: SEMANTIC_ANCHOR_CHARACTERS.length,
    note: "Anchors verify schema safety and expected presence; they are not a lesson order.",
  },
  flags: {
    polyphonicCharactersWithOneReading: polyphonicSingleReading,
    weakCategoryProposals,
    complexSimpleCodeCandidates,
    unknownStructureWithPopulatedFlags: unknownStructureWithFlags,
    lessonRootLoad: {
      status: "not-applicable",
      reason: "No curriculum lesson assignments are generated by this canonical source pipeline.",
    },
    taiwanHighFrequencyWithoutHongKongRank,
    missingHongKongCantoneseCharacters: missingHongKongCharacters,
    missingHongKongCantoneseWords: missingHongKongWords,
  },
};
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
  schemaVersion: SCHEMA_VERSION,
  datasetVersion: DATASET_VERSION,
  generatedAt: GENERATED_AT,
  columns: CHARACTER_COLUMNS,
  characters,
});
writeText(resolve(outputRoot, "canonical_words.csv"), toCsv(WORD_COLUMNS, words));
writeCompactJson(resolve(outputRoot, "canonical_words.json"), {
  schemaVersion: SCHEMA_VERSION,
  datasetVersion: DATASET_VERSION,
  generatedAt: GENERATED_AT,
  columns: WORD_COLUMNS,
  words,
});
writeText(resolve(outputRoot, "canonical_character_readings.csv"), toCsv(CHARACTER_READING_COLUMNS, characterReadings));
writeCompactJson(resolve(outputRoot, "canonical_character_readings.json"), {
  schemaVersion: SCHEMA_VERSION,
  datasetVersion: DATASET_VERSION,
  generatedAt: GENERATED_AT,
  columns: CHARACTER_READING_COLUMNS,
  readings: characterReadings,
});

const statistics = {
  characterCount: characters.length,
  characterReadingCount: characterReadings.length,
  wordCount: words.length,
  sourceCandidateCount: candidates.length,
  rejectedCount: rejected.length,
  edbCoveragePercent: Number((characters.length / edbSnapshot.count * 100).toFixed(2)),
  moeFrequencyCoveragePercent: Number((characters.filter((row) => row.source_frequency).length / characters.length * 100).toFixed(2)),
  moeCorpusOccurrenceCoveragePercent: Number((characters.reduce((sum, row) => sum + (row.moe_frequency_score || 0), 0) * 100).toFixed(4)),
  averageStrokeCount: Number((characters.reduce((sum, row) => sum + row.total_strokes, 0) / characters.length).toFixed(2)),
  averageCodeLength: Number((characters.reduce((sum, row) => sum + row.code_length, 0) / characters.length).toFixed(2)),
  byMoeFrequencyBand: histogram(characters, "moe_frequency_band"),
  byFoxchildFrequencyTier: histogram(characters, "foxchild_frequency_tier"),
  byRadical: histogram(characters, "radical"),
  byStructure: histogram(characters, "structure"),
  byFrequencyBucket: histogram(characters, "frequency_bucket"),
  top100: characters.slice(0, 100).map((row) => row.character).join(""),
  top500Count: Math.min(500, characters.length),
  top1000Count: Math.min(1000, characters.length),
  top2500Count: Math.min(2500, characters.length),
};
writeJson(resolve(outputRoot, "canonical_statistics.json"), statistics);
writeJson(resolve(outputRoot, "semantic_audit.json"), semanticAudit);
writeText(resolve(outputRoot, "semantic_audit_report.md"), [
  "# Canonical Chinese semantic audit",
  "",
  "This report records unresolved semantic risk. Flags are not automatically promoted into curriculum facts.",
  "",
  `- Reviewed semantic QA anchors: ${SEMANTIC_ANCHOR_CHARACTERS.length}`,
  `- Polyphonic source signals represented by only one reading: ${polyphonicSingleReading.length}`,
  `- Low-confidence category proposals awaiting review: ${weakCategoryProposals.length}`,
  `- Visually complex simple-code candidates: ${complexSimpleCodeCandidates.length}`,
  `- Unknown structures with populated layout flags: ${unknownStructureWithFlags.length}`,
  `- MOE top-100 characters without a Hong Kong frequency rank: ${taiwanHighFrequencyWithoutHongKongRank.length}`,
  `- Missing Hong Kong Cantonese character anchors: ${missingHongKongCharacters.length}`,
  `- Missing Hong Kong Cantonese word anchors: ${missingHongKongWords.length}`,
  "",
  "## Hong Kong gaps",
  "",
  `- Characters: ${missingHongKongCharacters.map((row) => row.character).join(" ") || "None"}`,
  `- Words: ${missingHongKongWords.map((row) => row.word).join(" · ") || "None"}`,
  "",
  "## Curriculum boundary",
  "",
  "- The generator creates frequency buckets, not lessons.",
  "- No Hong Kong frequency rank, curriculum priority, literacy level, structure or pedagogical primary reading is inferred.",
  "- Lesson root-load auditing remains not applicable until reviewed lesson assignments exist.",
  "",
].join("\n"));
writeJson(resolve(outputRoot, "source_manifest.json"), {
  schemaVersion: SCHEMA_VERSION,
  datasetVersion: DATASET_VERSION,
  generatedAt: GENERATED_AT,
  sourceDefinitions: SOURCE_DEFINITIONS,
  sourceFiles,
  acquisition: "Run fetch-authoritative-sources.mjs explicitly; normal builds are offline.",
});
writeJson(resolve(outputRoot, "dataset_version.json"), {
  datasetVersion: DATASET_VERSION,
  schemaVersion: SCHEMA_VERSION,
  generatedAt: GENERATED_AT,
  characterCount: characters.length,
  characterReadingCount: characterReadings.length,
  wordCount: words.length,
});
writeJson(resolve(outputRoot, "rejected_characters.json"), { rejected });

console.log(`Generated ${characters.length} canonical characters and ${words.length} canonical words in ${outputRoot}.`);
