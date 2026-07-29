#!/usr/bin/env node
import { resolve } from "node:path";
import { SOURCE_DEFINITIONS } from "./constants.mjs";
import { parseArgs, sha256, writeText } from "./io.mjs";

const args = parseArgs(process.argv.slice(2));
const projectRoot = resolve(import.meta.dirname, "../../..");
const sourceRoot = resolve(projectRoot, String(args["source-root"] || "data-source"));
const definition = SOURCE_DEFINITIONS.cangjie;
const fileName = definition.relativePath.split("/").at(-1);
const url = `${definition.repository.replace("github.com", "raw.githubusercontent.com")}/${definition.commit}/${fileName}`;

const response = await fetch(url, {
  headers: {
    "user-agent": "FoxChildCanonicalDataset/1.0 (+pinned CI audit source)",
  },
});
if (!response.ok) {
  throw new Error(`${response.status} ${response.statusText}: ${url}`);
}

const bytes = Buffer.from(await response.arrayBuffer());
const actualSha256 = sha256(bytes);
if (actualSha256 !== definition.sha256) {
  throw new Error(
    `Pinned Rime Cangjie reference checksum mismatch: expected ${definition.sha256}, received ${actualSha256}.`,
  );
}

const outputPath = resolve(sourceRoot, `authoritative/${definition.relativePath}`);
writeText(outputPath, bytes);
console.log(`Fetched ${definition.id}@${definition.commit} (${actualSha256}).`);
