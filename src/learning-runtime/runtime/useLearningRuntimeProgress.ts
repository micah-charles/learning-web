import { useCallback } from "react";
import { useProgress } from "../../react/context/ProgressContext.jsx";
import type { RuntimeCheckpoint } from "./checkpoint-store";

interface RuntimeWorldState {
  checkpoint?: RuntimeCheckpoint | null;
  lastVisitedAt?: string;
}

export function useLearningRuntimeProgress(worldId: string): {
  checkpoint: RuntimeCheckpoint | null;
  saveCheckpoint: (checkpoint: RuntimeCheckpoint | null) => void;
} {
  const { progress, updateProgress } = useProgress() as unknown as {
    progress: any;
    updateProgress: (mutate: (state: any) => void) => void;
  };
  const world = (progress?.progress?.learningRuntime?.worlds?.[worldId] || {}) as RuntimeWorldState;
  const saveCheckpoint = useCallback((checkpoint: RuntimeCheckpoint | null) => {
    updateProgress((state: any) => {
      if (!state.progress.learningRuntime) state.progress.learningRuntime = { schemaVersion: 1, worlds: {} };
      if (!state.progress.learningRuntime.worlds) state.progress.learningRuntime.worlds = {};
      state.progress.learningRuntime.worlds[worldId] = {
        ...(state.progress.learningRuntime.worlds[worldId] || {}),
        checkpoint,
        lastVisitedAt: new Date().toISOString(),
      };
    });
  }, [updateProgress, worldId]);
  return { checkpoint: world.checkpoint || null, saveCheckpoint };
}
