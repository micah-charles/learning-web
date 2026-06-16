import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const fixtureDir = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(fixtureDir, "../..");

export interface QaBehaviourConfig {
  version: string;
  baseUrl: string;
  testMode: "sample" | "full";
  sampleSizePerCategory: number;
  fullDataTest: boolean;
  packs: {
    include: string[];
    exclude: string[];
    autoDiscover: boolean;
  };
  [key: string]: unknown;
}

export async function loadQaBehaviourConfig(): Promise<QaBehaviourConfig> {
  const filePath = path.join(projectRoot, "qa/config/qa-behaviour.config.json");
  return JSON.parse(await fs.readFile(filePath, "utf8")) as QaBehaviourConfig;
}

export async function loadProductBehaviourConfig(): Promise<Record<string, unknown>> {
  const modulePath = path.join(projectRoot, "src/config/learningBehaviourConfig.js");
  const mod = await import(pathToFileURL(modulePath).href);
  return (mod.learningBehaviourConfig || mod.default || {}) as Record<string, unknown>;
}

export function isFullDataRun(config: QaBehaviourConfig): boolean {
  return process.env.QA_FULL_DATA === "true" || config.fullDataTest || config.testMode === "full";
}
