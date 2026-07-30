#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DATASET_VERSION, GENERATED_AT, SOURCE_DEFINITIONS } from "./constants.mjs";
import { educationalCangjieCodes, quickCode } from "./code-policy.mjs";
import { parseArgs, readJson, sha256File, writeJson, writeText } from "./io.mjs";

const args = parseArgs(process.argv.slice(2));
const projectRoot = resolve(import.meta.dirname, "../../..");
const sourceRoot = resolve(projectRoot, String(args["source-root"] || "data-source"));
const outputRoot = resolve(projectRoot, String(args.output || "learning-data/chinese-input/canonical"));
const referencePath = resolve(sourceRoot, `authoritative/${SOURCE_DEFINITIONS.cangjie.relativePath}`);
const document = readJson(resolve(outputRoot, "canonical_characters.json"));

function parseReference(text) {
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
    educationalCangjieCodes([...codes]),
  ]));
}

function sameValues(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

if (sha256File(referencePath) !== SOURCE_DEFINITIONS.cangjie.sha256) {
  throw new Error("Pinned Rime Cangjie reference checksum mismatch.");
}

const reference = parseReference(readFileSync(referencePath, "utf8"));
const mismatches = [];
for (const row of document.characters) {
  const expectedCodes = reference.get(row.character) || [];
  const expectedQuickCodes = [...new Set(expectedCodes.map(quickCode))];
  const actualCodes = [...row.accepted_cangjie_codes];
  const actualQuickCodes = [...row.accepted_quick_codes];
  const reasons = [];
  if (!expectedCodes.length) reasons.push("missing-from-reference");
  if (!sameValues(actualCodes, expectedCodes)) reasons.push("accepted-cangjie-set-differs");
  if (row.cangjie !== expectedCodes[0]) reasons.push("preferred-cangjie-differs");
  if (!sameValues(actualQuickCodes, expectedQuickCodes)) reasons.push("accepted-quick-set-differs");
  if (row.quick !== expectedQuickCodes[0]) reasons.push("preferred-quick-differs");
  if (reasons.length) {
    mismatches.push({
      character: row.character,
      reasons,
      expected_cangjie_codes: expectedCodes,
      actual_cangjie_codes: actualCodes,
      expected_quick_codes: expectedQuickCodes,
      actual_quick_codes: actualQuickCodes,
    });
  }
}

const status = mismatches.length ? "FAIL" : "PASS";
const audit = {
  schemaVersion: 1,
  datasetVersion: DATASET_VERSION,
  generatedAt: GENERATED_AT,
  status,
  reference: {
    id: SOURCE_DEFINITIONS.cangjie.id,
    commit: SOURCE_DEFINITIONS.cangjie.commit,
    sha256: SOURCE_DEFINITIONS.cangjie.sha256,
    path: referencePath.replace(`${projectRoot}/`, ""),
  },
  checkedCharacterCount: document.characters.length,
  mismatchCount: mismatches.length,
  mismatches,
};
writeJson(resolve(outputRoot, "cangjie_reference_audit.json"), audit);
writeText(resolve(outputRoot, "cangjie_reference_audit_report.md"), [
  "# Cangjie canonical-reference audit",
  "",
  `Status: **${status}**`,
  "",
  `- Pinned source: ${audit.reference.id}@${audit.reference.commit}`,
  `- Source SHA-256: \`${audit.reference.sha256}\``,
  `- Characters checked: ${audit.checkedCharacterCount}`,
  `- Mismatches: ${audit.mismatchCount}`,
  "",
  "The audit reparses the pinned Rime Cangjie table independently, applies the educational policy that excludes X-prefixed shortcuts when a standard code exists, and compares each policy-approved code set, preferred code, and derived Quick set.",
  "",
  ...(mismatches.length
    ? ["## Mismatches", "", ...mismatches.map((row) => `- ${row.character}: ${row.reasons.join(", ")}`), ""]
    : []),
].join("\n"));

console.log(`${status}: checked ${audit.checkedCharacterCount} characters against pinned Rime Cangjie; ${audit.mismatchCount} mismatches.`);
if (mismatches.length) process.exitCode = 1;
