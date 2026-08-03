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

interface ChineseRoot {
  id: string;
  key: string;
  primaryRoot: string;
  labelEn: string;
  category: string;
  mnemonic?: { en?: string };
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
}

export interface ChineseInputRuntimeContext {
  method: "cangjie" | "quick";
  currentRootKey: string;
  preferredJourneyId: string;
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
        metadata: { key: root.key },
      };
    });
    const chapters: LearningChapter[] = lessons.map((lesson, index) => ({
      id: lesson.id,
      label: { en: lesson.title.en, local: lesson.title.zhHant },
      nodeIds: [...new Set([...lesson.introducedKeys, ...lesson.reviewedKeys, ...lesson.activeKeys])].map((key) => `root-${key.toLowerCase()}`),
      state: stateForLesson(lesson, progress, context.preferredJourneyId),
      progress: clamp(progress.lessons?.[lesson.id]?.lastScore || 0),
      estimatedMinutes: lesson.estimatedMinutes,
      description: `Stage ${lesson.stage ?? 0} · ${lesson.characterIds.length} characters`,
      position: chapterPosition(index),
      metadata: { lessonId: lesson.id, method: lesson.method, stage: lesson.stage ?? 0 },
    }));
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
      capabilities: ["chinese-input.lesson", "chinese-input.review", "chinese-input.football"],
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
    return {
      id: `chinese-input:${context.method}:${progress.curriculumInputDigest || dataset.manifest.datasetVersion}`,
      worldId: this.worldId,
      capturedAt: now,
      completedById: progress.lessons || {},
      dueCount: dueIds.length,
      weakCount,
      recentAccuracy: clamp(recentAccuracy),
      hasEvidence: relevantEvents.length > 0 || Object.keys(progress.lessons || {}).length > 0,
      preferredChapterId: context.preferredJourneyId || dataset.lessons.find((lesson) => lesson.method === context.method)?.id,
      metadata: { method: context.method, reviewCharacterIds: dueIds },
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
    const chapter = world.chapters.find((item) => item.id === candidate.id);
    const characterIds = ((metadata.characterIds as string[] | undefined) || []) as string[];
    const capabilityId = candidate.kind === "arena"
      ? "chinese-input.football"
      : candidate.kind === "review"
        ? "chinese-input.review"
        : "chinese-input.lesson";
    const nodeIds = chapter?.nodeIds || characterIds.map((id) => `character:${id}`);
    return [{
      blockId: `${candidate.kind}:${candidate.id}`,
      purpose: candidate.kind === "review" ? "retention" : candidate.kind === "arena" ? "challenge" : candidate.kind === "explore" ? "discovery" : "new",
      capabilityId,
      chapterId: chapter?.id,
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
