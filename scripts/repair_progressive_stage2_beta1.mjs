import fs from "node:fs";
import path from "node:path";
import { getDisplayText } from "../src/progressive-language-lesson.js";

const repoRoot = process.cwd();
const manifestPath = path.join(repoRoot, "data/ProgressiveLanguagePacks/manifest.json");
const stage1Root = path.join(repoRoot, "data/ProgressiveLanguagePacks/beta1/stage1");
const stage2Root = path.join(repoRoot, "data/ProgressiveLanguagePacks/beta1/stage2");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function pad3(value) {
  return String(value).padStart(3, "0");
}

function stripNumberPrefix(value) {
  return String(value || "").replace(/^\d+\s+—\s+/u, "").trim();
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function packIdSuffix(packId) {
  return String(packId || "")
    .replace(/^semantic_pack_l\d_\d{3}_/, "")
    .trim();
}

function titleSlug(pack) {
  const title = String(pack?.title || "");
  const match = title.match(/—\s*(.+)$/u);
  if (match?.[1]) return slugify(match[1]);
  return slugify(packIdSuffix(pack?.packId || ""));
}

function displayLabelSuffix(lesson, pack) {
  const fromLesson = stripNumberPrefix(lesson?.label || "");
  if (fromLesson) return fromLesson;
  const fromTopic = stripNumberPrefix(pack?.sourceTopic?.title || "");
  if (fromTopic) return fromTopic;
  return String(packIdSuffix(pack?.packId || "lesson")).replace(/_/g, " ");
}

function lessonNumberFromId(id) {
  const match = String(id || "").match(/_(\d{3})_/);
  return match ? Number(match[1]) : Number.NaN;
}

function lessonPath(lesson) {
  return path.join(repoRoot, String(lesson.path || "").replace(/^\.\//, ""));
}

function buildDistractorPool(packs) {
  const pool = [];
  for (const pack of packs) {
    for (const vocab of pack.vocabulary || []) {
      pool.push(vocab);
    }
  }
  return pool;
}

function addDistractorTexts(target, seen, vocab, candidates, lang, count = 3) {
  const correctText = getDisplayText(vocab.translations?.[lang], lang);
  seen.add(correctText);

  for (const candidate of candidates) {
    const text = getDisplayText(candidate.translations?.[lang], lang);
    if (!text || seen.has(text) || candidate.conceptId === vocab.conceptId) continue;
    target.push(text);
    seen.add(text);
    if (target.length >= count) break;
  }
}

function enrichVocabDistractors(pack, vocabPool) {
  let changed = false;

  for (const vocab of pack.vocabulary || []) {
    const sameCategoryAndType = vocabPool.filter((candidate) =>
      candidate.conceptId !== vocab.conceptId
      && candidate.semanticCategory === vocab.semanticCategory
      && candidate.type === vocab.type,
    );
    const sameType = vocabPool.filter((candidate) =>
      candidate.conceptId !== vocab.conceptId
      && candidate.type === vocab.type,
    );
    const sameCategory = vocabPool.filter((candidate) =>
      candidate.conceptId !== vocab.conceptId
      && candidate.semanticCategory === vocab.semanticCategory,
    );
    const fallback = vocabPool.filter((candidate) => candidate.conceptId !== vocab.conceptId);

    const languages = Object.keys(vocab.translations || {}).filter((lang) => lang !== "en");
    const nextDistractors = {};

    for (const lang of languages) {
      const chosen = [];
      const seen = new Set();
      addDistractorTexts(chosen, seen, vocab, sameCategoryAndType, lang, 3);
      if (chosen.length < 3) addDistractorTexts(chosen, seen, vocab, sameType, lang, 3);
      if (chosen.length < 3) addDistractorTexts(chosen, seen, vocab, sameCategory, lang, 3);
      if (chosen.length < 3) addDistractorTexts(chosen, seen, vocab, fallback, lang, 3);
      nextDistractors[lang] = chosen.slice(0, 3);
    }

    if (JSON.stringify(vocab.distractors || {}) !== JSON.stringify(nextDistractors)) {
      vocab.distractors = nextDistractors;
      changed = true;
    }
  }

  return changed;
}

function collectMergedLessons(stage1, stage2) {
  if (stage2?.lessons?.length) {
    const seenStage1Topics = new Set();
    const dedupedStage1 = [];

    for (const lesson of stage1.lessons || []) {
      const suffix = packIdSuffix(lesson.packId);
      if (seenStage1Topics.has(suffix)) continue;
      seenStage1Topics.add(suffix);
      dedupedStage1.push({ ...lesson });
    }

    const stage2Lessons = [...stage2.lessons].sort(
      (left, right) => lessonNumberFromId(left.id) - lessonNumberFromId(right.id),
    );

    return [...dedupedStage1, ...stage2Lessons];
  }

  return [...(stage1.lessons || [])].sort(
    (left, right) => lessonNumberFromId(left.id) - lessonNumberFromId(right.id),
  );
}

function moveDirIfNeeded(fromDir, toDir) {
  if (fromDir === toDir) return;
  ensureDir(path.dirname(toDir));
  if (fs.existsSync(toDir)) {
    fs.rmSync(toDir, { recursive: true, force: true });
  }
  fs.renameSync(fromDir, toDir);
}

function updatePackForLesson(pack, sequence, labelSuffix, slugSuffix) {
  const num = pad3(sequence);
  const nextPackId = `semantic_pack_l1_${num}_${slugSuffix}`;
  pack.packId = nextPackId;
  pack.title = `Semantic Pack L1_${num} — ${titleSlug(pack) || slugSuffix}`;
  pack.description = `A corrected multilingual Progressive Language pack for ${labelSuffix}.`;
  if (!pack.sourceTopic) pack.sourceTopic = {};
  pack.sourceTopic.topicId = `L1_${num}`;
  pack.sourceTopic.title = `${num} — ${labelSuffix}`;
  pack.sourceTopic.difficultyStage = 1;

  return nextPackId;
}

function rewriteMergedCatalog() {
  const manifest = readJson(manifestPath);
  const beta1 = manifest.packs.find((pack) => pack.id === "beta1");
  if (!beta1) throw new Error("Could not find beta1 manifest entry");

  const stage1 = beta1.stages.find((stage) => stage.id === "stage1");
  if (!stage1) throw new Error("Could not find beta1/stage1 manifest block");
  const stage2 = beta1.stages.find((stage) => stage.id === "stage2");

  const mergedSourceLessons = collectMergedLessons(stage1, stage2);
  const sourcePacks = mergedSourceLessons.map((lesson) => readJson(lessonPath(lesson)));
  const vocabPool = buildDistractorPool(sourcePacks);
  const nextLessons = [];
  const desiredStage1Dirs = new Set();

  for (const [index, sourceLesson] of mergedSourceLessons.entries()) {
    const sequence = index + 1;
    const currentPackPath = lessonPath(sourceLesson);
    const currentDir = path.dirname(currentPackPath);
    const pack = readJson(currentPackPath);

    const labelSuffix = displayLabelSuffix(sourceLesson, pack);
    const slugSuffix = packIdSuffix(sourceLesson.packId || pack.packId) || slugify(labelSuffix);
    const nextPackId = updatePackForLesson(pack, sequence, labelSuffix, slugSuffix);
    const nextDir = path.join(stage1Root, nextPackId);
    const nextPackPath = path.join(nextDir, "pack.json");

    moveDirIfNeeded(currentDir, nextDir);
    desiredStage1Dirs.add(nextPackId);

    enrichVocabDistractors(pack, vocabPool);
    writeJson(nextPackPath, pack);

    nextLessons.push({
      id: nextPackId,
      label: `${pad3(sequence)} — ${labelSuffix}`,
      title: pack.title,
      path: `./data/ProgressiveLanguagePacks/beta1/stage1/${nextPackId}/pack.json`,
      packId: nextPackId,
      vocabularyCount: (pack.vocabulary || []).length,
      chainCount: (pack.phraseProgressionChains || []).length,
      sentenceBuilderCount: (pack.sentenceBuilders || []).length,
    });
  }

  for (const entry of fs.readdirSync(stage1Root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (desiredStage1Dirs.has(entry.name)) continue;
    fs.rmSync(path.join(stage1Root, entry.name), { recursive: true, force: true });
  }

  if (fs.existsSync(stage2Root)) {
    fs.rmSync(stage2Root, { recursive: true, force: true });
  }

  beta1.description = "Corrected multilingual Beta 1 progressive lessons.";
  stage1.description = "110 deduplicated lessons combining the unique original Stage 1 lessons with the former Stage 2 set.";
  stage1.lessons = nextLessons;
  beta1.stages = [stage1];
  manifest.generatedAt = new Date().toISOString();

  writeJson(manifestPath, manifest);
}

rewriteMergedCatalog();

console.log("Beta 1 progressive catalog repair complete.");
