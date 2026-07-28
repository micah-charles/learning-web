#!/usr/bin/env node
import { resolve } from "node:path";
import { inflateRawSync } from "node:zlib";
import { GENERATED_AT, SOURCE_DEFINITIONS } from "./constants.mjs";
import { parseArgs, sha256, stripHtml, writeJson, writeText } from "./io.mjs";

const args = parseArgs(process.argv.slice(2));
const projectRoot = resolve(import.meta.dirname, "../../..");
const outputRoot = resolve(projectRoot, String(args.output || "data-source/authoritative"));
const fetchedAt = String(args["fetched-at"] || GENERATED_AT);

async function fetchChecked(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "FoxChildCanonicalDataset/1.0 (+offline educational data pipeline)",
      ...options.headers,
    },
    ...options,
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response;
}

async function fetchEdbCharacters() {
  const rawPages = [];
  const records = [];
  for (let strokes = 1; strokes <= 33; strokes += 1) {
    const body = new URLSearchParams({
      searchMethod: "stk",
      searchStk: String(strokes),
      searchCriteria: String(strokes),
    });
    const response = await fetchChecked(`${SOURCE_DEFINITIONS.edb.baseUrl}/charlist.jsp`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    const html = await response.text();
    rawPages.push({ strokes, sha256: sha256(html), html });
    const pattern = /result\.jsp\?id=([^"&]+)[^"]*"[\s\S]*?>([^<]+)<\/a>/g;
    for (const match of html.matchAll(pattern)) {
      const character = stripHtml(match[2]).normalize("NFC");
      if (Array.from(character).length !== 1) continue;
      records.push({ character, edbId: match[1], totalStrokes: strokes });
    }
  }
  const unique = [...new Map(records.map((record) => [record.character, record])).values()];
  if (unique.length !== SOURCE_DEFINITIONS.edb.expectedCharacterCount) {
    throw new Error(`EDB source returned ${unique.length} characters; expected ${SOURCE_DEFINITIONS.edb.expectedCharacterCount}.`);
  }
  for (const anchor of ["一", "的", "是", "學", "香港"]) {
    for (const character of anchor) {
      if (!unique.some((record) => record.character === character)) {
        throw new Error(`EDB source is missing anchor character ${character}.`);
      }
    }
  }
  writeJson(resolve(outputRoot, "hk-edb/character-pages.json"), {
    source: SOURCE_DEFINITIONS.edb,
    fetchedAt,
    pages: rawPages,
  });
  writeJson(resolve(outputRoot, "hk-edb/characters.json"), {
    source: SOURCE_DEFINITIONS.edb,
    fetchedAt,
    count: unique.length,
    characters: unique,
  });
  return { count: unique.length, path: "hk-edb/characters.json" };
}

function unzipSingleFile(bytes) {
  const buffer = Buffer.from(bytes);
  if (buffer.readUInt32LE(0) !== 0x04034b50) throw new Error("MOE archive has no local ZIP header.");
  const compression = buffer.readUInt16LE(8);
  const compressedSize = buffer.readUInt32LE(18);
  const nameLength = buffer.readUInt16LE(26);
  const extraLength = buffer.readUInt16LE(28);
  const start = 30 + nameLength + extraLength;
  const compressed = buffer.subarray(start, start + compressedSize);
  if (compression === 0) return compressed;
  if (compression === 8) return inflateRawSync(compressed);
  throw new Error(`Unsupported MOE ZIP compression method ${compression}.`);
}

function unzipEntries(bytes, wantedNames) {
  const buffer = Buffer.from(bytes);
  let end = buffer.length - 22;
  while (end >= 0 && buffer.readUInt32LE(end) !== 0x06054b50) end -= 1;
  if (end < 0) throw new Error("ZIP end-of-central-directory record not found.");
  const entryCount = buffer.readUInt16LE(end + 10);
  let cursor = buffer.readUInt32LE(end + 16);
  const extracted = new Map();
  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) throw new Error("Invalid ZIP central-directory entry.");
    const compression = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const fileNameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const fileName = buffer.subarray(cursor + 46, cursor + 46 + fileNameLength).toString("utf8");
    if (wantedNames.has(fileName)) {
      if (buffer.readUInt32LE(localOffset) !== 0x04034b50) throw new Error(`Invalid local ZIP header for ${fileName}.`);
      const localNameLength = buffer.readUInt16LE(localOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
      const value = compression === 0 ? compressed : compression === 8 ? inflateRawSync(compressed) : null;
      if (!value) throw new Error(`Unsupported ZIP compression method ${compression} for ${fileName}.`);
      extracted.set(fileName, value);
    }
    cursor += 46 + fileNameLength + extraLength + commentLength;
  }
  for (const name of wantedNames) {
    if (!extracted.has(name)) throw new Error(`ZIP archive is missing ${name}.`);
  }
  return extracted;
}

function parseMoeRows(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    const cells = line.split("│").map((cell) => cell.trim());
    if (cells.length < 6 || !/^\d+$/.test(cells[1])) continue;
    const sourceGlyph = cells[2];
    const traditionalMatch = sourceGlyph.match(/（(\p{Script=Han})/u);
    const character = (traditionalMatch?.[1] || Array.from(sourceGlyph)[0] || "").normalize("NFC");
    if (Array.from(character).length !== 1) continue;
    rows.push({
      rank: Number(cells[1]),
      character,
      sourceGlyph,
      count: Number(cells[3]),
      cumulativeCount: Number(cells[4]),
      cumulativePercentage: Number(cells[5]),
    });
  }
  return rows;
}

async function fetchMoeFrequency() {
  const response = await fetchChecked(SOURCE_DEFINITIONS.frequency.url);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const textBytes = unzipSingleFile(bytes);
  const text = new TextDecoder("big5").decode(textBytes);
  const rows = parseMoeRows(text);
  if (rows.length !== SOURCE_DEFINITIONS.frequency.expectedCharacterCount) {
    throw new Error(`MOE source returned ${rows.length} rows; expected ${SOURCE_DEFINITIONS.frequency.expectedCharacterCount}.`);
  }
  if (rows[0]?.character !== "的" || rows[1]?.character !== "一" || rows[2]?.character !== "是") {
    throw new Error("MOE frequency anchors do not match 的, 一, 是.");
  }
  if (rows.reduce((sum, row) => sum + row.count, 0) !== SOURCE_DEFINITIONS.frequency.expectedTotalFrequency) {
    throw new Error("MOE frequency total does not match the published total.");
  }
  writeText(resolve(outputRoot, "tw-moe/dlrest1.zip"), Buffer.from(bytes));
  writeText(resolve(outputRoot, "tw-moe/dlrest1.txt"), Buffer.from(textBytes));
  writeJson(resolve(outputRoot, "tw-moe/frequency.json"), {
    source: SOURCE_DEFINITIONS.frequency,
    fetchedAt,
    count: rows.length,
    rows,
  });
  return { count: rows.length, path: "tw-moe/frequency.json" };
}

function canonicalTraditionalText(sourceText) {
  const compact = String(sourceText).replace(/\s+/g, "").normalize("NFC");
  const variant = compact.match(/^(.+?)（(.+?)）$/u);
  return (variant?.[2] || compact).normalize("NFC");
}

function parseMoeWordRows(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    const cells = line.split("│").map((cell) => cell.trim());
    if (cells.length < 7 || !/^\d+$/.test(cells[1])) continue;
    const word = canonicalTraditionalText(cells[2]);
    if (!word) continue;
    rows.push({
      rank: Number(cells[1]),
      word,
      sourceWord: cells[2].replace(/\s+/g, ""),
      count: Number(cells[3]),
      cumulativeCount: Number(cells[4]),
      percentage: Number(cells[5]),
      cumulativePercentage: Number(cells[6]),
    });
  }
  return rows;
}

async function fetchMoeWordFrequency() {
  const response = await fetchChecked(SOURCE_DEFINITIONS.wordFrequency.url);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const textBytes = unzipSingleFile(bytes);
  const text = new TextDecoder("big5").decode(textBytes);
  const rows = parseMoeWordRows(text);
  if (rows.length !== SOURCE_DEFINITIONS.wordFrequency.expectedWordCount) {
    throw new Error(`MOE word source returned ${rows.length} rows; expected ${SOURCE_DEFINITIONS.wordFrequency.expectedWordCount}.`);
  }
  if (rows[0]?.word !== "的" || rows[1]?.word !== "了" || rows[2]?.word !== "個") {
    throw new Error("MOE word-frequency anchors do not match 的, 了, 個.");
  }
  if (rows.reduce((sum, row) => sum + row.count, 0) !== SOURCE_DEFINITIONS.wordFrequency.expectedTotalFrequency) {
    throw new Error("MOE word-frequency total does not match the published total.");
  }
  writeText(resolve(outputRoot, "tw-moe/dlrest2.zip"), Buffer.from(bytes));
  writeText(resolve(outputRoot, "tw-moe/dlrest2.txt"), Buffer.from(textBytes));
  writeJson(resolve(outputRoot, "tw-moe/word-frequency.json"), {
    source: SOURCE_DEFINITIONS.wordFrequency,
    fetchedAt,
    count: rows.length,
    rows,
  });
  return { count: rows.length, path: "tw-moe/word-frequency.json" };
}

async function fetchPinnedRimeSources() {
  const definitions = [SOURCE_DEFINITIONS.cangjie, SOURCE_DEFINITIONS.quick];
  const results = {};
  for (const definition of definitions) {
    const fileName = definition.relativePath.split("/").at(-1);
    const url = `${definition.repository.replace("github.com", "raw.githubusercontent.com")}/${definition.commit}/${fileName}`;
    const response = await fetchChecked(url);
    const text = await response.text();
    if (sha256(text) !== definition.sha256) throw new Error(`${definition.id} checksum mismatch.`);
    writeText(resolve(outputRoot, definition.relativePath), text);
    results[definition.id] = { url, path: definition.relativePath, sha256: definition.sha256 };
  }
  return results;
}

async function fetchUnihanSources() {
  const response = await fetchChecked(SOURCE_DEFINITIONS.unihan.baseUrl);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const names = new Set(["Unihan_Readings.txt", "Unihan_IRGSources.txt", "Unihan_Variants.txt"]);
  const entries = unzipEntries(bytes, names);
  const results = {};
  for (const [name, value] of entries) {
    const relativePath = `unihan@${SOURCE_DEFINITIONS.unihan.version}/${name}`;
    writeText(resolve(outputRoot, relativePath), value);
    results[name] = { path: relativePath, sha256: sha256(value) };
  }
  return results;
}

async function fetchOpenCcSource() {
  const definition = SOURCE_DEFINITIONS.opencc;
  const url = `${definition.repository.replace("github.com", "raw.githubusercontent.com")}/${definition.commit}/${definition.sourcePath}`;
  const response = await fetchChecked(url);
  const text = await response.text();
  if (sha256(text) !== definition.sha256) throw new Error(`${definition.id} checksum mismatch.`);
  writeText(resolve(outputRoot, definition.relativePath), text);
  return { url, path: definition.relativePath, sha256: definition.sha256 };
}

const [edb, frequency, wordFrequency, rime, unihan, opencc] = await Promise.all([
  fetchEdbCharacters(),
  fetchMoeFrequency(),
  fetchMoeWordFrequency(),
  fetchPinnedRimeSources(),
  fetchUnihanSources(),
  fetchOpenCcSource(),
]);
writeJson(resolve(outputRoot, "acquisition-manifest.json"), {
  schemaVersion: 1,
  fetchedAt,
  sources: { edb, frequency, wordFrequency, rime, unihan, opencc },
  note: "Normal builds consume these local snapshots and never scrape live websites.",
});
console.log(`Fetched ${edb.count} EDB characters, ${frequency.count} MOE character rows, and ${wordFrequency.count} MOE word rows into ${outputRoot}.`);
