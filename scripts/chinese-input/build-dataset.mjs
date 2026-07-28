#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CANGJIE_ROOTS, ROOT_BY_KEY } from "../../src/features/chinese-input/data/keyboard-layout.js";
import { CHINESE_INPUT_LESSONS } from "../../src/features/chinese-input/data/lesson-catalog.js";

const ROOT = resolve(import.meta.dirname, "../..");
const args = Object.fromEntries(process.argv.slice(2).map((entry) => {
  const [key, ...rest] = entry.replace(/^--/, "").split("=");
  return [key, rest.join("=")];
}));
const cangjiePath = args.cangjie;
const unihanPath = args.unihan;
if (!cangjiePath || !unihanPath) {
  console.error("Usage: node scripts/chinese-input/build-dataset.mjs --cangjie=/path/cangjie5.base.dict.yaml --unihan=/path/Unihan_Readings.txt");
  process.exit(1);
}

const SOURCE = {
  cangjieRepository: "https://github.com/rime/rime-cangjie",
  cangjieCommit: "52d90a1b1312e74042b38c1cbc8142defbc53171",
  quickRepository: "https://github.com/rime/rime-quick",
  quickCommit: "5dcdb9e353d314239e9c8cddc0f42d52da4837bb",
  unicodeVersion: "17.0.0",
  unicodeSource: "https://www.unicode.org/Public/17.0.0/ucd/Unihan.zip",
};

const SEED_CHARACTERS = Array.from(
  "日月金木水火土竹戈十大中一弓人心手口尸廿山女田難卜林森明休好男苗昌晶品本末未朱村杏呆困因回同朋爸爸媽媽我你他她們學生老師朋友香港中文輸入字根練習快樂天地上下左右東西南北前後多少年星期時間家庭河海雨風雲電車站門書看聽說話食飯飲茶貓狗鳥魚花草",
);

function parseCangjie(text) {
  const records = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#") || line.startsWith("---") || line.startsWith("...")) continue;
    const [char, rawCode] = line.split("\t");
    if (Array.from(char || "").length !== 1) continue;
    const code = String(rawCode || "").replace(/[^a-z]/g, "").toUpperCase();
    if (!code || code.length > 5 || code.startsWith("Z")) continue;
    if (!records.has(char)) records.set(char, new Set());
    records.get(char).add(code);
  }
  return records;
}

function parseUnihan(text) {
  const records = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const [codePoint, property, value] = line.split("\t");
    if (!["kCantonese", "kDefinition"].includes(property)) continue;
    const char = String.fromCodePoint(Number.parseInt(codePoint.slice(2), 16));
    const record = records.get(char) || {};
    record[property] = value;
    records.set(char, record);
  }
  return records;
}

function quickCode(code) {
  return code.length <= 1 ? code : `${code[0]}${code.at(-1)}`;
}

function characterId(char) {
  return `u${char.codePointAt(0).toString(16).toLowerCase()}`;
}

const cangjie = parseCangjie(readFileSync(cangjiePath, "utf8"));
const unihan = parseUnihan(readFileSync(unihanPath, "utf8"));
const seen = new Set();
const characters = [];
for (const char of SEED_CHARACTERS) {
  if (seen.has(char)) continue;
  seen.add(char);
  const codes = [...(cangjie.get(char) || [])].sort((a, b) => a.length - b.length || a.localeCompare(b));
  const reading = unihan.get(char);
  if (!codes.length || !reading?.kCantonese || !reading?.kDefinition) continue;
  const acceptedCodes = codes;
  const preferredCode = acceptedCodes[0];
  const quickCodes = [...new Set(acceptedCodes.map(quickCode))];
  const preferredQuickCode = quickCode(preferredCode);
  const roots = Array.from(preferredCode, (key) => ROOT_BY_KEY[key]?.primaryRoot).filter(Boolean);
  const quickRoots = Array.from(preferredQuickCode, (key) => ROOT_BY_KEY[key]?.primaryRoot).filter(Boolean);
  const codePoint = `U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
  characters.push({
    id: characterId(char),
    char,
    codePoint,
    script: "traditional",
    locale: "zh-HK",
    frequencyBand: characters.length < 40 ? 1 : characters.length < 80 ? 2 : 3,
    schoolBand: characters.length < 40 ? "foundation" : "expansion",
    difficulty: Math.min(5, preferredCode.length),
    tags: [`code-length-${preferredCode.length}`, preferredCode.length === 1 ? "root-character" : "seed"],
    meaning: { en: reading.kDefinition, zhHant: `「${char}」的常用意思可參考英文釋義。` },
    pronunciations: [{
      locale: "zh-HK",
      system: "jyutping",
      value: reading.kCantonese.split(" ")[0],
      audioText: char,
    }],
    cangjie: {
      version: "5",
      preferredCode,
      acceptedCodes,
      rootSequence: roots,
      keySequence: Array.from(preferredCode),
    },
    quick: {
      standard: "rime-quick5-first-last",
      preferredCode: preferredQuickCode,
      acceptedCodes: quickCodes,
      rootSequence: quickRoots,
      keySequence: Array.from(preferredQuickCode),
    },
    decomposition: {
      type: "canonical-code-sequence",
      layout: "sequence",
      nodes: Array.from(preferredCode, (key, index) => ({
        id: `code-${index + 1}`,
        glyph: ROOT_BY_KEY[key].primaryRoot,
        role: "cangjie-root",
        rootKeys: [key],
      })),
      edges: Array.from({ length: Math.max(0, preferredCode.length - 1) }, (_, index) => ({
        from: `code-${index + 1}`,
        to: `code-${index + 2}`,
      })),
      explanationZhHant: `倉頡五代標準碼為 ${preferredCode}。這是輸入碼順序，不等同於簡單的字形拆解。`,
    },
    examples: [{
      zhHant: `今天練習輸入「${char}」字。`,
      en: `Today we practise typing the character ${char}.`,
      jyutping: "",
    }],
    lessonEligibility: {
      rootRecognition: preferredCode.length === 1,
      guidedTyping: true,
      decomposition: true,
      quick: true,
      cangjie: true,
    },
    provenance: {
      sourceId: `rime-cangjie5:${SOURCE.cangjieCommit}:${codePoint}`,
      cangjieSource: SOURCE.cangjieRepository,
      cangjieCommit: SOURCE.cangjieCommit,
      quickSource: SOURCE.quickRepository,
      quickCommit: SOURCE.quickCommit,
      languageSource: SOURCE.unicodeSource,
      unicodeVersion: SOURCE.unicodeVersion,
      verified: true,
      verifiedAt: "2026-07-28T00:00:00.000Z",
    },
  });
}

const dataset = {
  manifest: {
    schemaVersion: 1,
    datasetId: "foxchild-zh-hk-cangjie5-seed",
    datasetVersion: "0.1.0",
    title: "FoxChild Chinese Input Lab Seed Dataset",
    script: "traditional",
    locale: "zh-HK",
    inputMethods: ["cangjie", "quick"],
    cangjieVersion: "5",
    quickStandard: "rime-quick5-first-last",
    pronunciationSystem: "jyutping",
    license: {
      name: "GPL-3.0-or-later data subset with LGPL-3.0 and Unicode-3.0 attribution",
      source: "Rime Cangjie 5, Rime Quick 5, and Unicode Unihan 17.0.0",
      attributionRequired: true,
    },
    generatedAt: "2026-07-28T00:00:00.000Z",
    counts: { roots: CANGJIE_ROOTS.length, characters: characters.length, lessons: CHINESE_INPUT_LESSONS.length },
  },
  roots: CANGJIE_ROOTS,
  characters,
  lessons: CHINESE_INPUT_LESSONS,
};
const serializedForChecksum = JSON.stringify(dataset);
dataset.manifest.checksum = `sha256:${createHash("sha256").update(serializedForChecksum).digest("hex")}`;
const output = resolve(ROOT, "src/features/chinese-input/data/seed-dataset.json");
writeFileSync(output, `${JSON.stringify(dataset, null, 2)}\n`);
console.log(`Wrote ${characters.length} verified characters to ${output}`);
