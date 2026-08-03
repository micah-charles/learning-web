import type { ReactNode } from "react";

export type DirectorIntent = "journey" | "training" | "review" | "arena" | "explore" | "collection";
export type KnowledgeState = "undiscovered" | "available" | "current" | "mastered" | "weak";

export interface LocalizedLabel {
  en: string;
  local?: string;
}

export interface LearningNode {
  id: string;
  kind: string;
  label: LocalizedLabel;
  state: KnowledgeState;
  progress: number;
  regionId?: string;
  description?: string;
  glyph?: string;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface LearningChapter {
  id: string;
  label: LocalizedLabel;
  nodeIds: readonly string[];
  state: KnowledgeState;
  progress: number;
  estimatedMinutes: number;
  description?: string;
  position?: Readonly<{ x: number; y: number }>;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface LearnerEvidenceSnapshot {
  id: string;
  worldId: string;
  capturedAt: string;
  completedById: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  dueCount: number;
  weakCount: number;
  recentAccuracy: number;
  hasEvidence: boolean;
  activeSessionId?: string;
  preferredChapterId?: string;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface DirectorCandidate {
  id: string;
  kind: "chapter" | "training" | "review" | "arena" | "explore" | "collection";
  intent: DirectorIntent;
  label: LocalizedLabel;
  focusLabel: string;
  estimatedMinutes: number;
  progress?: number;
  weaknessValue?: number;
  dueValue?: number;
  expeditionPriority?: number;
  supportsArena?: boolean;
  lastAttemptAt?: string;
  recentlyUsed?: boolean;
  objectiveRefs?: readonly string[];
  metadata?: Readonly<Record<string, unknown>>;
}

export interface DirectorRecommendation {
  intent: DirectorIntent;
  selected: DirectorCandidate | null;
  alternatives: readonly Pick<DirectorCandidate, "id" | "intent" | "label">[];
  reasonCodes: readonly string[];
  title: string;
  summary: string;
  score: number;
  seed: string;
  estimatedMinutes: number;
}

export interface GenericChallenge {
  challengeId: string;
  capabilityId: string;
  evaluatorRef: string;
  prompt: Readonly<Record<string, unknown>>;
  responseContract: Readonly<Record<string, unknown>>;
  nodeIds: readonly string[];
  skillIds: readonly string[];
  contentRevision: string;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface ActivityBlock {
  blockId: string;
  purpose: "new" | "practice" | "retention" | "challenge" | "discovery";
  capabilityId: string;
  chapterId?: string;
  nodeIds: readonly string[];
  skillIds: readonly string[];
  challenges: readonly GenericChallenge[];
  contentRevision: string;
  metadata?: Readonly<Record<string, unknown>>;
}

export interface SessionRequest {
  requestId: string;
  worldId: string;
  intent: DirectorIntent;
  now: string;
  seed: string;
  learnerSnapshotId: string;
  presentation?: Readonly<Record<string, unknown>>;
}

export interface SessionPlan {
  schemaVersion: number;
  sessionId: string;
  worldId: string;
  intent: DirectorIntent;
  policyVersion: string;
  contentRevision: string;
  learnerSnapshotId: string;
  seed: string;
  createdAt: string;
  estimatedMinutes: number;
  chapterRefs: readonly Readonly<{ chapterId: string; revision: string }>[];
  objectiveRefs: readonly string[];
  blocks: readonly ActivityBlock[];
  presentation: Readonly<Record<string, unknown>>;
  recommendation: Readonly<{
    title: string;
    summary: string;
    reasonCodes: readonly string[];
    alternatives: readonly Pick<DirectorCandidate, "id" | "intent" | "label">[];
  }>;
  completionPolicy: Readonly<{ minimumAccuracy: number; allowRetry: boolean; preserveAttempts: boolean }>;
  planDigest: string;
}

export interface WorldTheme {
  id: string;
  className: string;
  backgroundImage?: string;
  companionImage?: string;
  labels: Readonly<Record<string, string>>;
}

export interface LearningWorldDefinition {
  worldId: string;
  contentRevision: string;
  label: LocalizedLabel;
  theme: WorldTheme;
  nodes: readonly LearningNode[];
  chapters: readonly LearningChapter[];
  capabilities: readonly string[];
}

export interface LearningWorldAdapter<TDataset, TProgress, TContext = unknown> {
  worldId: string;
  buildWorld(dataset: TDataset, progress: TProgress, context: TContext): LearningWorldDefinition;
  buildEvidence(dataset: TDataset, progress: TProgress, context: TContext, now: string): LearnerEvidenceSnapshot;
  buildCandidates(world: LearningWorldDefinition, evidence: LearnerEvidenceSnapshot, context: TContext): readonly DirectorCandidate[];
  buildActivityBlocks(
    recommendation: DirectorRecommendation,
    world: LearningWorldDefinition,
    evidence: LearnerEvidenceSnapshot,
    context: TContext,
  ): readonly ActivityBlock[];
}

export interface ActivityRendererProps {
  plan: SessionPlan;
  block: ActivityBlock;
  onComplete: (result: Readonly<Record<string, unknown>>) => void;
  onExit: () => void;
}

export interface RegisteredActivity {
  capabilityId: string;
  render: (props: ActivityRendererProps) => ReactNode;
}
