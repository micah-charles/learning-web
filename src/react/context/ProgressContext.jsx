import { createContext, useContext, useState, useCallback } from "react";
import { loadStoredState, saveStoredState } from "@/storage.js";

const Ctx = createContext(null);

export function ProgressProvider({ children }) {
  const [state, setState] = useState(() => loadStoredState());

  const updateProgress = useCallback((fn) => {
    setState(prev => {
      const next = structuredClone(prev);
      fn(next);
      saveStoredState(next);
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ progress: state, updateProgress }}>{children}</Ctx.Provider>;
}

export function useProgress() {
  return useContext(Ctx);
}
