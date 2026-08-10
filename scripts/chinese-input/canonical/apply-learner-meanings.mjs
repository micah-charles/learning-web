#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(new URL("../../..", import.meta.url).pathname);
const canonicalRoot = resolve(projectRoot, "learning-data/chinese-input/canonical");
const reviewPath = resolve(process.argv.find((arg) => arg.startsWith("--review="))?.slice("--review=".length)
  || resolve(canonicalRoot, "learner_meaning_review.csv"));

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"'; index += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"' && cell === "") quoted = true;
    else if (char === ",") { row.push(cell); cell = ""; }
    else if (char === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  const [header, ...data] = rows;
  return data.filter((values) => values.some((value) => value !== "")).map((values) => Object.fromEntries(
    header.map((key, index) => [key, values[index] ?? ""]),
  ));
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function writeCanonicalCsv(path, document, key) {
  const rows = document[key];
  const csvRows = [document.columns.join(",")];
  for (const row of rows) csvRows.push(document.columns.map((column) => {
    const value = Array.isArray(row[column]) ? row[column].join("|") : row[column];
    return csvCell(value);
  }).join(","));
  writeFileSync(path, `${csvRows.join("\n")}\n`);
}

const reviewRows = parseCsv(readFileSync(reviewPath, "utf8"));
if (reviewRows.length !== 13_000) throw new Error(`Expected 13,000 reviewed rows, found ${reviewRows.length}.`);
const seen = new Set();
const characters = new Map();
const words = new Map();
for (const row of reviewRows) {
  const key = `${row.type}:${row.term}`;
  if (seen.has(key)) throw new Error(`Duplicate review row: ${key}`);
  seen.add(key);
  if (!row.term || !row.learner_definition_en) throw new Error(`Missing term or learner definition: ${key}`);
  if (row.learner_definition_status !== "approved") {
    throw new Error(`${key} must be marked approved before canonical import.`);
  }
  (row.type === "character" ? characters : row.type === "word" ? words : null)?.set(row.term, row);
}
if (characters.size !== 3_000 || words.size !== 10_000) {
  throw new Error(`Expected 3,000 characters and 10,000 words; found ${characters.size} and ${words.size}.`);
}

const characterPath = resolve(canonicalRoot, "canonical_characters.json");
const wordPath = resolve(canonicalRoot, "canonical_words.json");
const characterDocument = JSON.parse(readFileSync(characterPath, "utf8"));
const wordDocument = JSON.parse(readFileSync(wordPath, "utf8"));
let characterUpdates = 0;
let wordUpdates = 0;
for (const row of characterDocument.characters) {
  const review = characters.get(row.character);
  if (!review) throw new Error(`Review is missing canonical character ${row.character}.`);
  row.learner_definition_en = review.learner_definition_en;
  row.learner_definition_status = "approved";
  characterUpdates += 1;
}
for (const row of wordDocument.words) {
  const review = words.get(row.word);
  if (!review) throw new Error(`Review is missing canonical word ${row.word}.`);
  row.learner_definition_en = review.learner_definition_en;
  row.learner_definition_status = "approved";
  wordUpdates += 1;
}

writeFileSync(characterPath, `${JSON.stringify(characterDocument)}\n`);
writeFileSync(wordPath, `${JSON.stringify(wordDocument)}\n`);
writeCanonicalCsv(resolve(canonicalRoot, "canonical_characters.csv"), characterDocument, "characters");
writeCanonicalCsv(resolve(canonicalRoot, "canonical_words.csv"), wordDocument, "words");
console.log(`Imported ${characterUpdates} approved character meanings and ${wordUpdates} approved word meanings.`);
