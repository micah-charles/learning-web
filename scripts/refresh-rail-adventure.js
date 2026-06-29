#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), "..");
const engineDir = path.resolve(process.env.FOXCHILD_GAME_ENGINE_DIR || path.join(root, "number-mage-phaser"));
const sourceDir = path.join(engineDir, "dist", "games", "rail-adventure");
const targetDir = path.join(root, "public", "games", "rail-adventure");
const skipExport = process.argv.includes("--skip-export");

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed in ${cwd}`);
  }
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function assertEngineReady() {
  if (!(await exists(path.join(engineDir, "package.json")))) {
    throw new Error(`Game Engine repo not found at ${engineDir}. Set FOXCHILD_GAME_ENGINE_DIR to the FoxChildGameEngine checkout.`);
  }
}

async function assertExportReady() {
  for (const file of ["index.html", "main.js", "manifest.json", "astrocade-launcher.html"]) {
    if (!(await exists(path.join(sourceDir, file)))) {
      throw new Error(`Rail Adventure export is missing ${file}. Run npm run refresh:rail without --skip-export.`);
    }
  }
}

async function copyExport() {
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(path.dirname(targetDir), { recursive: true });
  await fs.cp(sourceDir, targetDir, { recursive: true });
}

async function runRefresh() {
  await assertEngineReady();
  if (!skipExport) {
    run("npm", ["run", "export:rail"], engineDir);
    run("npm", ["run", "validate:export"], engineDir);
  }
  await assertExportReady();
  await copyExport();
  console.log(`Rail Adventure refreshed from ${sourceDir} to ${targetDir}`);
}

runRefresh().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
