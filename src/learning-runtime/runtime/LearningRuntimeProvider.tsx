import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { buildRecommendation } from "../director/recommendation";
import { buildSessionPlan } from "../director/session-plan";
import type {
  DirectorCandidate,
  DirectorIntent,
  DirectorRecommendation,
  LearnerEvidenceSnapshot,
  LearningWorldAdapter,
  LearningWorldDefinition,
  SessionPlan,
} from "../types";
import { SessionController, type SessionControllerSnapshot } from "./session-controller";
import { isCompatibleCheckpoint, type RuntimeCheckpoint } from "./checkpoint-store";

interface RuntimeContextValue {
  world: LearningWorldDefinition;
  evidence: LearnerEvidenceSnapshot;
  candidates: readonly DirectorCandidate[];
  intent: DirectorIntent;
  recommendation: DirectorRecommendation;
  session: SessionControllerSnapshot;
  setIntent: (intent: DirectorIntent) => void;
  startSession: (candidateId?: string) => SessionPlan;
  advanceSession: () => void;
  clearSession: () => void;
}

const RuntimeContext = createContext<RuntimeContextValue | null>(null);

export function LearningRuntimeProvider<TDataset, TProgress, TContext>({
  adapter,
  dataset,
  progress,
  adapterContext,
  now,
  seed,
  initialIntent = "journey",
  checkpoint = null,
  onCheckpointChange,
  children,
}: {
  adapter: LearningWorldAdapter<TDataset, TProgress, TContext>;
  dataset: TDataset;
  progress: TProgress;
  adapterContext: TContext;
  now: string;
  seed: string;
  initialIntent?: DirectorIntent;
  checkpoint?: RuntimeCheckpoint | null;
  onCheckpointChange?: (checkpoint: RuntimeCheckpoint | null) => void;
  children: ReactNode;
}) {
  const [intent, setIntent] = useState<DirectorIntent>(initialIntent);
  const controllerRef = useRef(new SessionController());
  const requestSequenceRef = useRef(0);
  const [session, setSession] = useState<SessionControllerSnapshot>(() => controllerRef.current.snapshot());
  const world = useMemo(
    () => adapter.buildWorld(dataset, progress, adapterContext),
    [adapter, adapterContext, dataset, progress],
  );
  const evidence = useMemo(
    () => adapter.buildEvidence(dataset, progress, adapterContext, now),
    [adapter, adapterContext, dataset, now, progress],
  );
  const candidates = useMemo(
    () => adapter.buildCandidates(world, evidence, adapterContext),
    [adapter, adapterContext, evidence, world],
  );
  const recommendation = useMemo(
    () => buildRecommendation({
      candidates,
      evidence,
      intent,
      preferredId: evidence.preferredChapterId,
      now,
      seed,
    }),
    [candidates, evidence, intent, now, seed],
  );
  const restoredCheckpointRef = useRef("");

  useEffect(() => {
    if (!checkpoint || restoredCheckpointRef.current === checkpoint.sessionId) return;
    if (isCompatibleCheckpoint(checkpoint, world.worldId, world.contentRevision)) {
      restoredCheckpointRef.current = checkpoint.sessionId;
      setSession(controllerRef.current.resume(checkpoint));
    } else {
      onCheckpointChange?.(null);
    }
  }, [checkpoint, onCheckpointChange, world.contentRevision, world.worldId]);

  const startSession = useCallback((candidateId = "") => {
    const candidate = candidates.find((item) => item.id === candidateId)
      || recommendation.selected
      || candidates[0];
    if (!candidate) throw new Error("The Learning Director has no available activity candidate.");
    const selectedRecommendation = candidate.id === recommendation.selected?.id
      ? recommendation
      : buildRecommendation({ candidates, evidence, intent: candidate.intent, preferredId: candidate.id, now, seed });
    const blocks = adapter.buildActivityBlocks(selectedRecommendation, world, evidence, adapterContext);
    requestSequenceRef.current += 1;
    const plan = buildSessionPlan({
      request: {
        requestId: `${Date.parse(now)}-${candidate.id}-${requestSequenceRef.current}`,
        worldId: world.worldId,
        intent: candidate.intent,
        now,
        seed,
        learnerSnapshotId: evidence.id,
        presentation: { themeId: world.theme.id },
      },
      candidate,
      recommendation: selectedRecommendation,
      blocks,
      contentRevision: world.contentRevision,
      minimumAccuracy: Number(candidate.metadata?.minimumAccuracy) || 0.8,
    });
    setSession(controllerRef.current.start(plan));
    onCheckpointChange?.(controllerRef.current.checkpoint(now));
    return plan;
  }, [adapter, adapterContext, candidates, evidence, intent, now, onCheckpointChange, recommendation, seed, world]);

  const advanceSession = useCallback(() => {
    const next = controllerRef.current.advance();
    setSession(next);
    onCheckpointChange?.(next.status === "completed" ? null : controllerRef.current.checkpoint(new Date().toISOString()));
  }, [onCheckpointChange]);

  const clearSession = useCallback(() => {
    setSession(controllerRef.current.clear());
    onCheckpointChange?.(null);
  }, [onCheckpointChange]);

  const value = useMemo<RuntimeContextValue>(() => ({
    world,
    evidence,
    candidates,
    intent,
    recommendation,
    session,
    setIntent,
    startSession,
    advanceSession,
    clearSession,
  }), [advanceSession, candidates, clearSession, evidence, intent, recommendation, session, startSession, world]);

  return <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>;
}

export function useLearningRuntime(): RuntimeContextValue {
  const value = useContext(RuntimeContext);
  if (!value) throw new Error("useLearningRuntime must be used inside LearningRuntimeProvider.");
  return value;
}
