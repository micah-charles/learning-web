import type {
  ActivityBlock,
  DirectorCandidate,
  DirectorRecommendation,
  LearnerEvidenceSnapshot,
  LearningChapter,
  LearningNode,
  LearningWorldAdapter,
  LearningWorldDefinition,
  KnowledgeState,
} from "../../../learning-runtime/types";
import { buildWordDependencyIndex } from "../domain/word-unlock-engine.js";

interface MethodData {
  preferredCode: string;
  acceptedCodes: string[];
  keySequence: string[];
}

interface ChineseCharacter {
  id: string;
  char: string;
  meaning: { en: string };
  cangjie: MethodData;
  quick: MethodData;
}

interface ChineseWord {
  id: string;
  word: string;
  characterIds: string[];
  meaning: string;
  meaningStatus?: string;
  reviewStatus?: string;
  frequencyRank?: number | null;
  example?: string;
}

interface ChineseRoot {
  id: string;
  key: string;
  primaryRoot: string;
  labelEn: string;
  category: string;
  mnemonic?: { en?: string };
  inputTool?: boolean;
}

interface ChineseLesson {
  id: string;
  method: "cangjie" | "quick";
  stage?: number;
  order: number;
  title: { en: string; zhHant?: string };
  activeKeys: string[];
  introducedKeys: string[];
  reviewedKeys: string[];
  characterIds: string[];
  estimatedMinutes: number;
  passCriteria?: { minimumAccuracy?: number; minimumQuestions?: number };
  prerequisites?: string[];
  category?: "journey" | "input-tools";
  inputToolKeys?: string[];
}

export interface ChineseInputDataset {
  manifest: {
    datasetId: string;
    datasetVersion: string;
    checksum: string;
    counts: { roots: number; characters: number; lessons: number };
  };
  roots: ChineseRoot[];
  characters: ChineseCharacter[];
  words?: ChineseWord[];
  wordGraph?: { words?: Array<{ wordId: string; text?: string; lessonId?: string; characterPrerequisites?: string[]; pronunciationEligibility?: boolean; registerEligibility?: boolean }>; inputDigest?: string };
  lessons: ChineseLesson[];
}

interface MasteryRecord {
  attempts?: number;
  exposures?: number;
  masteryScore?: number;
  nextReviewAt?: string;
}

export interface ChineseInputProgress {
  lessons?: Record<string, { status?: string; lastScore?: number; lastOpenedAt?: string }>;
  roots?: Record<string, MasteryRecord>;
  characters?: Record<string, { cangjie?: MasteryRecord; quick?: MasteryRecord }>;
  attemptEvents?: Array<{ method?: string; correct?: boolean; occurredAt?: string }>;
  sessions?: Array<{ lessonId?: string }>;
  discoveredNodes?: Record<string, unknown>;
  curriculumInputDigest?: string;
  words?: Record<string, { state?: string; attempts?: number; correct?: number; nextReviewAt?: string }>;
  wordDiscoveryEvents?: Array<{ wordId?: string; occurredAt?: string }>;
}

export interface ChineseInputRuntimeContext {
  method: "cangjie" | "quick";
  currentRootKey: string;
  preferredJourneyId: string;
}

function regionMetadata(dataset: ChineseInputDataset, progress: ChineseInputProgress, root: ChineseRoot, method: "cangjie" | "quick") {
  const relatedCharacters = dataset.characters
    .filter((character) => character[method]?.keySequence.includes(root.key))
    .map((character) => {
      const mastery = characterMastery(progress, character.id, method);
      const score = clamp(mastery.masteryScore || 0);
      return {
        id: character.id,
        glyph: character.char,
        label: character.meaning.en,
        progress: score,
        state: score >= 80 ? "mastered" : mastery.attempts ? "weak" : "available",
      };
    });
  const lessons = dataset.lessons
    .filter((lesson) => {
      if (lesson.method !== method) return false;
      if (lesson.inputToolKeys?.includes(root.key)) return true;
      if (lesson.introducedKeys.includes(root.key) || lesson.reviewedKeys.includes(root.key)) return true;
      return lesson.characterIds.some((characterId) => {
        const character = dataset.characters.find((candidate) => candidate.id === characterId);
        return character?.[method]?.keySequence.includes(root.key) || false;
      });
    })
    .slice(0, 8)
    .map((lesson) => ({ id: lesson.id, label: lesson.title.en, category: lesson.category || "journey", progress: clamp(progress.lessons?.[lesson.id]?.lastScore || 0) }));
  const weakCharacters = relatedCharacters.filter((character) => character.state === "weak");
  const masteredCharacters = relatedCharacters.filter((character) => character.state === "mastered");
  const completion = relatedCharacters.length
    ? clamp(relatedCharacters.reduce((sum, character) => sum + character.progress, 0) / relatedCharacters.length)
    : 0;
  const wordIndex = buildWordDependencyIndex({ words: (dataset.words || []) as any[], wordGraph: dataset.wordGraph, datasetVersion: dataset.manifest.datasetVersion });
  const relatedWords = Object.values(wordIndex.wordsById)
    .filter((word) => word.requiredCharacterIds.some((id: string) => relatedCharacters.some((character) => character.id === id)))
    .slice(0, 6)
    .map((word) => ({ wordId: word.wordId, word: word.word, meaning: word.meaning, meaningStatus: word.meaningStatus, state: progress.words?.[word.wordId]?.state || "hidden" }));
  return {
    completion,
    characterIds: relatedCharacters.map((character) => character.id),
    relatedCharacters: relatedCharacters.slice(0, 8),
    weakCharacters: weakCharacters.slice(0, 6),
    masteredCharacters: masteredCharacters.slice(0, 6),
    relatedWords,
    relatedLessons: lessons,
    upcomingDiscoveries: relatedCharacters.filter((character) => character.state === "available").length,
    recommendationReason: weakCharacters.length
      ? `${weakCharacters.length} weak character${weakCharacters.length === 1 ? "" : "s"} need review.`
      : lessons.length
        ? "Required by a nearby journey chapter."
        : "A fresh region is ready to explore.",
  };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

function stateForRoot(root: ChineseRoot, progress: ChineseInputProgress, currentRootKey: string): KnowledgeState {
  const record = progress.roots?.[root.key] || {};
  if (root.key === currentRootKey) return "current";
  if ((record.masteryScore || 0) >= 80) return "mastered";
  if ((record.exposures || record.attempts || 0) > 0 && (record.masteryScore || 0) < 50) return "weak";
  if ((record.exposures || record.attempts || 0) > 0 || progress.discoveredNodes?.[root.id]) return "available";
  return "undiscovered";
}

function stateForLesson(lesson: ChineseLesson, progress: ChineseInputProgress, preferredId: string): KnowledgeState {
  const record = progress.lessons?.[lesson.id];
  if (lesson.id === preferredId) return "current";
  if (record?.status === "completed" && (record.lastScore || 0) >= 80) return "mastered";
  if (record?.status === "practising" || (record?.lastScore || 100) < 60) return "weak";
  return record ? "available" : "undiscovered";
}

function chapterPosition(index: number): { x: number; y: number } {
  const row = Math.floor(index / 8);
  const column = index % 8;
  return { x: 8 + column * 12, y: 10 + row * 12 + (column % 2 ? 3 : 0) };
}

function characterMastery(progress: ChineseInputProgress, characterId: string, method: "cangjie" | "quick"): MasteryRecord {
  return progress.characters?.[characterId]?.[method] || {};
}

function reviewCharacterIds(dataset: ChineseInputDataset, progress: ChineseInputProgress, context: ChineseInputRuntimeContext, now: string): string[] {
  const nowValue = Date.parse(now);
  return dataset.characters
    .map((character) => ({ character, mastery: characterMastery(progress, character.id, context.method) }))
    .filter(({ mastery }) => mastery.attempts && (
      (mastery.nextReviewAt && Date.parse(mastery.nextReviewAt) <= nowValue)
      || (mastery.masteryScore || 0) < 65
    ))
    .sort((left, right) => (
      (left.mastery.masteryScore || 0) - (right.mastery.masteryScore || 0)
      || left.character.id.localeCompare(right.character.id)
    ))
    .slice(0, 20)
    .map(({ character }) => character.id);
}

export const chineseInputWorldAdapter: LearningWorldAdapter<ChineseInputDataset, ChineseInputProgress, ChineseInputRuntimeContext> = {
  worldId: "foxchild.chinese-input",

  buildWorld(dataset, progress, context): LearningWorldDefinition {
    const lessons = dataset.lessons.filter((lesson) => lesson.method === context.method);
    const nodes: LearningNode[] = dataset.roots.map((root) => {
      const state = stateForRoot(root, progress, context.currentRootKey);
      const rootProgress = progress.roots?.[root.key] || {};
      return {
        id: root.id,
        kind: "root",
        label: { en: root.labelEn, local: root.primaryRoot },
        state,
        progress: clamp(rootProgress.masteryScore || 0),
        regionId: root.category,
        description: root.mnemonic?.en,
        glyph: root.primaryRoot,
        metadata: { key: root.key, contentCategory: root.inputTool ? "input-tools" : "journey", ...regionMetadata(dataset, progress, root, context.method) },
      };
    });
    const chapters: LearningChapter[] = lessons.map((lesson, index) => {
      const teachingKeys = new Set([
        ...lesson.introducedKeys,
        ...lesson.reviewedKeys,
        ...lesson.characterIds.flatMap((characterId) => dataset.characters.find((character) => character.id === characterId)?.[context.method]?.keySequence || []),
      ]);
      return {
      id: lesson.id,
      label: { en: lesson.title.en, local: lesson.title.zhHant },
      nodeIds: [...teachingKeys].map((key) => `root-${key.toLowerCase()}`),
      state: stateForLesson(lesson, progress, context.preferredJourneyId),
      progress: clamp(progress.lessons?.[lesson.id]?.lastScore || 0),
      estimatedMinutes: lesson.estimatedMinutes,
      description: `Stage ${lesson.stage ?? 0} · ${lesson.characterIds.length} characters`,
      position: chapterPosition(index),
      metadata: { lessonId: lesson.id, method: lesson.method, stage: lesson.stage ?? 0, category: lesson.category || "journey", inputToolKeys: lesson.inputToolKeys || [] },
    };
    });
    return {
      worldId: this.worldId,
      contentRevision: dataset.manifest.checksum || dataset.manifest.datasetVersion,
      label: { en: "Chinese Input Kingdom", local: "中文輸入王國" },
      theme: {
        id: "jade-bamboo-kingdom",
        className: "flr-theme-jade",
        backgroundImage: "/images/chinese-input/kingdom-world.webp",
        companionImage: "/images/foxchild-girl.png",
        labels: { node: "root", chapter: "journey", collection: "museum" },
      },
      nodes,
      chapters,
      capabilities: ["chinese-input.lesson", "chinese-input.review", "chinese-input.football", "chinese-input.word-introduction", "chinese-input.word-review", "chinese-input.word-typing"],
    };
  },

  buildEvidence(dataset, progress, context, now): LearnerEvidenceSnapshot {
    const relevantEvents = (progress.attemptEvents || []).filter((event) => event.method === context.method).slice(-30);
    const dueIds = reviewCharacterIds(dataset, progress, context, now);
    const weakCount = dataset.characters.filter((character) => {
      const record = characterMastery(progress, character.id, context.method);
      return record.attempts && (record.masteryScore || 0) < 60;
    }).length;
    const recentAccuracy = relevantEvents.length
      ? relevantEvents.filter((event) => event.correct).length / relevantEvents.length * 100
      : 0;
    const wordStates = Object.values(progress.words || {});
    const discoveredWordCount = wordStates.filter((word) => ["discovered", "introduced", "learning", "ready-to-review", "secure"].includes(word.state || "")).length;
    const dueWordCount = wordStates.filter((word) => word.nextReviewAt && Date.parse(word.nextReviewAt) <= Date.parse(now)).length;
    return {
      id: `chinese-input:${context.method}:${progress.curriculumInputDigest || dataset.manifest.datasetVersion}`,
      worldId: this.worldId,
      capturedAt: now,
      completedById: progress.lessons || {},
      dueCount: dueIds.length + dueWordCount,
      weakCount,
      recentAccuracy: clamp(recentAccuracy),
      hasEvidence: relevantEvents.length > 0 || Object.keys(progress.lessons || {}).length > 0,
      preferredChapterId: context.preferredJourneyId || dataset.lessons.find((lesson) => lesson.method === context.method)?.id,
      metadata: { method: context.method, reviewCharacterIds: dueIds, discoveredWordCount, dueWordCount, wordStates },
    };
  },

  buildCandidates(world, evidence, context): readonly DirectorCandidate[] {
    const chapterCandidates: DirectorCandidate[] = world.chapters.map((chapter) => ({
      id: chapter.id,
      kind: "chapter",
      intent: "journey",
      label: chapter.label,
      focusLabel: chapter.label.local || chapter.label.en,
      estimatedMinutes: chapter.estimatedMinutes,
      progress: chapter.progress,
      weaknessValue: chapter.state === "weak" ? 30 : 0,
      recentlyUsed: evidence.preferredChapterId === chapter.id,
      objectiveRefs: chapter.nodeIds,
      metadata: { ...chapter.metadata, minimumAccuracy: 0.8 },
    }));
    const reviewIds = (evidence.metadata?.reviewCharacterIds as string[] | undefined) || [];
    const discoveredWordCount = Number(evidence.metadata?.discoveredWordCount || 0);
    const dueWordCount = Number(evidence.metadata?.dueWordCount || 0);
    return [
      ...chapterCandidates,
      {
        id: `review:${context.method}`,
        kind: "review",
        intent: "review",
        label: { en: "Memory Grove", local: "記憶林" },
        focusLabel: evidence.dueCount ? `${evidence.dueCount} due characters` : "recent characters",
        estimatedMinutes: 5,
        dueValue: evidence.dueCount,
        weaknessValue: evidence.weakCount,
        metadata: { characterIds: reviewIds, method: context.method, minimumAccuracy: 0.8 },
      },
      {
        id: `word-introduction:${context.method}`,
        kind: "training",
        intent: "training",
        label: { en: "New Word Discovery", local: "新詞發現" },
        focusLabel: `${discoveredWordCount} discovered words`,
        estimatedMinutes: 3,
        weaknessValue: discoveredWordCount ? 20 : 0,
        metadata: { method: context.method, wordMode: "introduction", minimumAccuracy: 0.7 },
      },
      {
        id: `word-review:${context.method}`,
        kind: "review",
        intent: "review",
        label: { en: "Word Review", local: "詞語複習" },
        focusLabel: `${dueWordCount} words ready to review`,
        estimatedMinutes: 3,
        dueValue: dueWordCount,
        metadata: { method: context.method, wordMode: "review", minimumAccuracy: 0.7 },
      },
      {
        id: `training:${context.currentRootKey}`,
        kind: "training",
        intent: "training",
        label: { en: "Root Training", local: "字根訓練" },
        focusLabel: `${context.currentRootKey} root practice`,
        estimatedMinutes: 4,
        metadata: { rootKey: context.currentRootKey, method: context.method },
      },
      {
        id: `arena:football:${context.method}`,
        kind: "arena",
        intent: "arena",
        label: { en: "Goalkeeper Arena", local: "守門員競技場" },
        focusLabel: "fast character recall",
        estimatedMinutes: 5,
        supportsArena: true,
        metadata: { challengeId: "current-journey", method: context.method },
      },
      { id: "explore:knowledge-world", kind: "explore", intent: "explore", label: { en: "Knowledge World", local: "知識世界" }, focusLabel: "the root regions", estimatedMinutes: 0 },
      { id: "collection:museum", kind: "collection", intent: "collection", label: { en: "Collection Museum", local: "收藏博物館" }, focusLabel: "your discoveries", estimatedMinutes: 0 },
    ];
  },

  buildActivityBlocks(recommendation, world, evidence, context): readonly ActivityBlock[] {
    const candidate = recommendation.selected;
    if (!candidate) return [];
    const metadata = candidate.metadata || {};
    const wordMode = String(metadata.wordMode || "");
    if (wordMode) {
      const wordStates = evidence.metadata?.wordStates as Array<{ wordId: string; state?: string; nextReviewAt?: string }> | undefined;
      const selectedWords = (wordStates || [])
        .filter((word) => wordMode === "review" ? ["ready-to-review", "learning", "secure"].includes(word.state || "") : ["discovered", "introduced"].includes(word.state || ""))
        .slice(0, 5);
      return [{
        blockId: `${wordMode}:${candidate.id}`,
        purpose: wordMode === "review" ? "retention" : "discovery",
        capabilityId: `chinese-input.word-${wordMode}`,
        nodeIds: selectedWords.map((word) => `word:${word.wordId}`),
        skillIds: ["chinese-input:word-meaning", "chinese-input:word-reading", "chinese-input:word-typing"],
        challenges: selectedWords.map((word) => ({
          challengeId: `${candidate.id}:${word.wordId}`,
          capabilityId: `chinese-input.word-${wordMode}`,
          evaluatorRef: "chinese-input.word.canonical-evaluator",
          prompt: { wordId: word.wordId, mode: wordMode },
          responseContract: { type: "word-challenge", modes: ["meaning", "reading", "order", "typing"] },
          nodeIds: [`word:${word.wordId}`],
          skillIds: ["chinese-input:word-typing"],
          contentRevision: world.contentRevision,
        })),
        contentRevision: world.contentRevision,
        metadata: { candidateId: candidate.id, method: context.method, wordMode, evidenceSnapshotId: evidence.id, wordCount: selectedWords.length },
      }];
    }
    const chapter = world.chapters.find((item) => item.id === candidate.id);
    const customNodeIds = (metadata.customNodeIds as string[] | undefined) || [];
    const customCharacterIds = customNodeIds.flatMap((id) => (world.nodes.find((node) => node.id === id)?.metadata?.characterIds as string[] | undefined) || []);
    const characterIds = customCharacterIds.length
      ? [...new Set(customCharacterIds)].slice(0, 24)
      : ((metadata.characterIds as string[] | undefined) || []) as string[];
    const capabilityId = candidate.kind === "arena"
      ? "chinese-input.football"
      : candidate.kind === "review"
        ? "chinese-input.review"
      : "chinese-input.lesson";
    const nodeIds = customNodeIds.length ? customNodeIds : chapter?.nodeIds || characterIds.map((id) => `character:${id}`);
    return [{
      blockId: `${candidate.kind}:${candidate.id}`,
      purpose: candidate.kind === "review" ? "retention" : candidate.kind === "arena" ? "challenge" : candidate.kind === "explore" ? "discovery" : "new",
      capabilityId,
      chapterId: customNodeIds.length ? undefined : chapter?.id,
      nodeIds,
      skillIds: [`input-method:${context.method}`],
      challenges: characterIds.map((characterId) => ({
        challengeId: `${candidate.id}:${characterId}`,
        capabilityId,
        evaluatorRef: `chinese-input.${context.method}.canonical-evaluator`,
        prompt: { characterId },
        responseContract: { type: "keyboard-code", method: context.method },
        nodeIds: [`character:${characterId}`],
        skillIds: [`input-method:${context.method}`],
        contentRevision: world.contentRevision,
      })),
      contentRevision: world.contentRevision,
      metadata: { candidateId: candidate.id, method: context.method, evidenceSnapshotId: evidence.id },
    }];
  },
};
