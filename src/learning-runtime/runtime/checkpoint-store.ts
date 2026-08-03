import { isValidSessionPlan } from "../director/session-plan";
import type { SessionPlan } from "../types";

export interface RuntimeCheckpoint {
  schemaVersion: 1;
  worldId: string;
  sessionId: string;
  plan: SessionPlan;
  blockIndex: number;
  challengeIndex: number;
  savedAt: string;
}

export function createCheckpoint(
  plan: SessionPlan,
  position: { blockIndex?: number; challengeIndex?: number },
  savedAt: string,
): RuntimeCheckpoint {
  if (!isValidSessionPlan(plan)) throw new Error("Cannot checkpoint an invalid session plan.");
  return Object.freeze({
    schemaVersion: 1,
    worldId: plan.worldId,
    sessionId: plan.sessionId,
    plan,
    blockIndex: Math.max(0, position.blockIndex || 0),
    challengeIndex: Math.max(0, position.challengeIndex || 0),
    savedAt,
  });
}

export function isCompatibleCheckpoint(
  checkpoint: RuntimeCheckpoint | null | undefined,
  worldId: string,
  contentRevision: string,
): boolean {
  return Boolean(checkpoint
    && checkpoint.schemaVersion === 1
    && checkpoint.worldId === worldId
    && checkpoint.plan.contentRevision === contentRevision
    && isValidSessionPlan(checkpoint.plan));
}
