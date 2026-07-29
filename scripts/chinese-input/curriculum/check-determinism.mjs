#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = resolve(import.meta.dirname, "../../..");
const generator = resolve(import.meta.dirname, "generate.mjs");
const tempRoot = mkdtempSync(resolve(tmpdir(), "foxchild-curriculum-determinism-"));
const first = resolve(tempRoot, "first");
const second = resolve(tempRoot, "second");

function generate(output) {
  const result = spawnSync(process.execPath, [generator, "--mode=preview", `--output=${output}`], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
}

function files(root, current = root) {
  return readdirSync(current).sort().flatMap((name) => {
    const path = resolve(current, name);
    return statSync(path).isDirectory() ? files(root, path) : [path.slice(root.length + 1)];
  });
}

function hashes(root) {
  return Object.fromEntries(files(root).map((name) => [
    name,
    createHash("sha256").update(readFileSync(resolve(root, name))).digest("hex"),
  ]));
}

try {
  generate(first);
  const firstHashes = hashes(first);
  rmSync(first, { recursive: true, force: true });
  generate(first);
  const rerunHashes = hashes(first);
  generate(second);
  const secondHashes = hashes(second);
  const expected = JSON.stringify(firstHashes);
  if (expected !== JSON.stringify(rerunHashes) || expected !== JSON.stringify(secondHashes)) {
    throw new Error("Curriculum generation is not byte-identical.");
  }
  const aggregate = createHash("sha256").update(expected).digest("hex");
  console.log(`Curriculum determinism PASS: ${Object.keys(firstHashes).length} files, aggregate ${aggregate}`);
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
