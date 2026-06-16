import fs from "node:fs/promises";
import path from "node:path";
import { projectRoot, type QaBehaviourConfig } from "./behaviour-config";

export interface ManifestPackEntry {
  id: string;
  displayName?: string;
  subject?: string;
  curriculum?: string;
  capabilities?: string[];
  unifiedPath?: string;
  passagePath?: string;
  contentMdPath?: string;
  [key: string]: unknown;
}

export interface ManifestShape {
  core?: ManifestPackEntry;
  coreUnifiedPath?: string;
  packs?: ManifestPackEntry[];
  sentenceBuilderPacks?: ManifestPackEntry[];
}

export interface VocabRecord {
  id: string;
  source: string;
  target: string;
  topic: string;
}

export interface BuilderRecord {
  id: string;
  prompt: string;
  answer: string;
  tiles: string[];
}

export interface PassageQuestionRecord {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  sourceRef?: {
    paragraph?: number;
    quote?: string;
  } | null;
}

export interface PassageRecord {
  id: string;
  title: string;
  sourceText: string;
  targetText: string;
  questions: PassageQuestionRecord[];
}

export interface ProgressiveLessonDescriptor {
  id: string;
  label: string;
  path: string;
}

export async function readJsonFile<T>(relativePath: string): Promise<T> {
  const filePath = path.join(projectRoot, relativePath);
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

export async function readTextFile(relativePath: string): Promise<string> {
  return fs.readFile(path.join(projectRoot, relativePath), "utf8");
}

export async function loadManifest(): Promise<ManifestShape> {
  return readJsonFile<ManifestShape>("data/generated/manifest.json");
}

export async function loadProgressiveCatalog(): Promise<any> {
  return readJsonFile("data/ProgressiveLanguagePacks/manifest.json");
}

function includePack(packId: string, config: QaBehaviourConfig): boolean {
  const include = config.packs?.include || [];
  const exclude = new Set(config.packs?.exclude || []);
  if (exclude.has(packId)) return false;
  if (include.length > 0) return include.includes(packId);
  return true;
}

export function getRevisionPacks(manifest: ManifestShape, config: QaBehaviourConfig): ManifestPackEntry[] {
  const packs = manifest.packs || [];
  const revision = packs.filter((pack) => (pack.capabilities || []).includes("revision") && pack.unifiedPath);
  return revision.filter((pack) => includePack(pack.id, config));
}

export function getPassageGroups(manifest: ManifestShape, config: QaBehaviourConfig): ManifestPackEntry[] {
  const packs = manifest.packs || [];
  const passageGroups = packs.filter((pack) => (pack.capabilities || []).includes("passages") && (pack.passagePath || pack.unifiedPath));
  return passageGroups.filter((pack) => includePack(pack.id, config));
}

export function getSentenceBuilderPacks(manifest: ManifestShape, config: QaBehaviourConfig): ManifestPackEntry[] {
  const packs = manifest.sentenceBuilderPacks || [];
  return packs.filter((pack) => pack.unifiedPath && includePack(pack.id, config));
}

export function getStudyBookPacks(manifest: ManifestShape, config: QaBehaviourConfig): ManifestPackEntry[] {
  const packs = manifest.packs || [];
  return packs.filter((pack) => pack.contentMdPath && includePack(pack.id, config));
}

export async function loadCorePack(manifest: ManifestShape): Promise<any> {
  const relativePath = manifest.coreUnifiedPath || manifest.core?.unifiedPath || "data/core_unified.json";
  return readJsonFile(relativePath);
}

export async function loadRevisionPack(manifest: ManifestShape, packId: string): Promise<any> {
  if (packId === "core") return loadCorePack(manifest);
  const pack = getRevisionPacks(manifest, {
    version: "",
    baseUrl: "",
    testMode: "sample",
    sampleSizePerCategory: 1,
    fullDataTest: false,
    packs: { include: [], exclude: [], autoDiscover: true },
  }).find((entry) => entry.id === packId)
    || (manifest.packs || []).find((entry) => entry.id === packId);
  if (!pack?.unifiedPath) {
    throw new Error(`No unifiedPath for revision pack ${packId}`);
  }
  return readJsonFile(pack.unifiedPath);
}

export async function loadPassagePack(group: ManifestPackEntry): Promise<any> {
  const relativePath = String(group.passagePath || group.unifiedPath || "");
  if (!relativePath) {
    throw new Error(`No passagePath for group ${group.id}`);
  }
  return readJsonFile(relativePath);
}

export async function loadSentenceBuilderPack(pack: ManifestPackEntry): Promise<any> {
  if (!pack.unifiedPath) {
    throw new Error(`No unifiedPath for sentence builder pack ${pack.id}`);
  }
  return readJsonFile(pack.unifiedPath);
}

export async function loadStudyBookMarkdown(pack: ManifestPackEntry): Promise<string> {
  if (!pack.contentMdPath) {
    throw new Error(`No contentMdPath for study book pack ${pack.id}`);
  }
  return readTextFile(pack.contentMdPath);
}

export function normaliseVocabRecords(pack: any): VocabRecord[] {
  const srcCode = String(pack?.sourceLanguageCode || "de-DE");
  const tgtCode = String(pack?.targetLanguageCode || "en-GB");
  const sameLanguage = srcCode === tgtCode;
  const items = Array.isArray(pack?.items) ? pack.items : [];
  return items
    .filter((item) => item?.type === "vocab")
    .map((item) => {
      const data = item.data || {};
      const translations = data.translations || {};
      const source = sameLanguage
        ? data.sourceWord || translations[srcCode] || Object.values(translations)[0] || ""
        : translations[srcCode] || Object.values(translations)[0] || data.sourceWord || "";
      const target = sameLanguage
        ? data.targetWord || translations[tgtCode] || Object.values(translations).slice(1)[0] || ""
        : translations[tgtCode] || Object.values(translations).slice(1)[0] || data.targetWord || "";
      return {
        id: item.id,
        source: String(source || "").trim(),
        target: String(target || "").trim(),
        topic: Array.isArray(item.topics) ? String(item.topics[0] || "") : "",
      };
    })
    .filter((record) => record.source && record.target);
}

export function normaliseBuilderRecords(pack: any): BuilderRecord[] {
  const items = Array.isArray(pack?.items) ? pack.items : [];
  return items
    .filter((item) => item?.type === "sentenceBuilder")
    .map((item) => {
      const data = item.data || {};
      const answer = String(data.answer || "").trim();
      const tiles = Array.isArray(data.tiles) && data.tiles.length > 0
        ? data.tiles.map((token: string) => String(token))
        : answer.split(/\s+/).filter(Boolean);
      return {
        id: item.id,
        prompt: String(data.prompt || "").trim(),
        answer,
        tiles,
      };
    })
    .filter((record) => record.prompt && record.answer && record.tiles.length > 0);
}

export function normalisePassageRecords(pack: any): PassageRecord[] {
  const items = Array.isArray(pack?.items) ? pack.items : [];
  return items
    .filter((item) => item?.type === "passage")
    .map((item) => {
      const data = item.data || {};
      const questions = Array.isArray(data.questions) ? data.questions : [];
      return {
        id: item.id,
        title: String(data.sourceTitle || data.title || data.targetTitle || "").trim(),
        sourceText: String(data.sourcePassage || "").trim(),
        targetText: String(data.targetPassage || "").trim(),
        questions: questions.map((question: any, index: number) => {
          const correctByIndex = Number.isInteger(question.correctOptionIndex)
            ? question.options?.[question.correctOptionIndex]
            : "";
          return {
            id: question.id || `${item.id}_q${index + 1}`,
            question: String(question.question || "").trim(),
            options: Array.isArray(question.options) ? question.options.map((option: string) => String(option)) : [],
            correctAnswer: String(question.correctAnswer || question.modelAnswer || correctByIndex || "").trim(),
            sourceRef: question.sourceRef || null,
          };
        }).filter((question: PassageQuestionRecord) => question.question),
      };
    })
    .filter((record) => record.title && record.questions.length > 0);
}

export async function findFirstProgressiveLesson(): Promise<{ lesson: ProgressiveLessonDescriptor; pack: any }> {
  const catalog = await loadProgressiveCatalog();
  const lesson = catalog?.packs?.[0]?.stages?.[0]?.lessons?.[0];
  if (!lesson?.path) {
    throw new Error("No progressive lesson path found in manifest");
  }
  return {
    lesson: {
      id: lesson.id,
      label: lesson.label || lesson.id,
      path: lesson.path,
    },
    pack: await readJsonFile(lesson.path.replace(/^\.\//, "")),
  };
}

export async function findStudyBookPackWithImages(packs: ManifestPackEntry[]): Promise<ManifestPackEntry | null> {
  for (const pack of packs) {
    const markdown = await loadStudyBookMarkdown(pack);
    if (/!\[[^\]]*\]\([^)]+\)|<img\s/i.test(markdown)) {
      return pack;
    }
  }
  return null;
}
