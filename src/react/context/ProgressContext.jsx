import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";
import { loadStoredState, saveStoredState } from "@/storage.js";

const Ctx = createContext(null);

export function ProgressProvider({ children }) {
  const [state, setState] = useState(() => loadStoredState());
  const latestStateRef = useRef(state);

  const updateProgress = useCallback((fn) => {
    setState(prev => {
      const next = structuredClone(prev);
      fn(next);
      latestStateRef.current = next;
      return next;
    });
  }, []);

  // localStorage serialization can be substantial for long-running learners.
  // Persist after React paints instead of blocking the interaction that changed
  // progress. pagehide provides a synchronous last-chance flush.
  useEffect(() => {
    latestStateRef.current = state;
    saveStoredState(state);
  }, [state]);

  useEffect(() => {
    const flushPendingState = () => saveStoredState(latestStateRef.current);
    window.addEventListener("pagehide", flushPendingState);
    return () => window.removeEventListener("pagehide", flushPendingState);
  }, []);

  const value = useMemo(() => ({ progress: state, updateProgress }), [state, updateProgress]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress() {
  return useContext(Ctx);
}
