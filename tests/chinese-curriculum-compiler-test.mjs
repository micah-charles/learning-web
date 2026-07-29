import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const outputRoot = mkdtempSync(join(tmpdir(), "foxchild-curriculum-test-"));
const compiler = resolve(projectRoot, "scripts/chinese-input/curriculum/compile.mjs");

const fixture = spawnSync(process.execPath, [
  compiler,
  "--reviews=scripts/chinese-input/curriculum/fixtures/character_reviews.csv",
  "--policy=scripts/chinese-input/curriculum/fixtures/curriculum-policy.json",
  `--output=${outputRoot}/fixture`,
], { cwd: projectRoot, encoding: "utf8" });
if (fixture.status !== 0 || !fixture.stdout.includes("Compiled 10 reviewed characters")) {
  throw new Error(`Fixture compilation failed.\n${fixture.stdout}\n${fixture.stderr}`);
}

const unapprovedCorpus = spawnSync(process.execPath, [
  compiler,
  "--reviews=scripts/chinese-input/curriculum/fixtures/character_reviews.csv",
  "--minimum=10",
  `--output=${outputRoot}/unapproved-corpus`,
], { cwd: projectRoot, encoding: "utf8" });
if (unapprovedCorpus.status === 0 || !unapprovedCorpus.stderr.includes("corpus source is not approved")) {
  throw new Error(`Production policy accepted an unapproved Hong Kong corpus source.\n${unapprovedCorpus.stdout}\n${unapprovedCorpus.stderr}`);
}

const production = spawnSync(process.execPath, [compiler, `--output=${outputRoot}/production`], {
  cwd: projectRoot,
  encoding: "utf8",
});
if (production.status === 0 || !production.stderr.includes("2500 required")) {
  throw new Error(`Production compiler did not fail closed on the empty human-review table.\n${production.stdout}\n${production.stderr}`);
}

console.log("Chinese curriculum compiler tests passed: reviewed fixture compiled; unapproved HK corpus and empty production input failed closed.");
