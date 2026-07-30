import { createContext, useCallback, useContext, useMemo } from "react";
import { useProgress } from "../../context/ProgressContext.jsx";
import { mergeMiniGameResult } from "./progressEngine.js";

const MiniGameContext = createContext(null);

export function MiniGameProvider({ children }) {
  const { progress, updateProgress } = useProgress();
  const profile = progress.progress.miniGames;
  const recordResult = useCallback((result) => {
    updateProgress((state) => {
      mergeMiniGameResult(state.progress.miniGames, result);
    });
  }, [updateProgress]);
  const updateProfile = useCallback((nextProfile) => {
    updateProgress((state) => {
      state.progress.miniGames = nextProfile;
    });
  }, [updateProgress]);
  const value = useMemo(() => ({ profile, recordResult, updateProfile }), [profile, recordResult, updateProfile]);
  return <MiniGameContext.Provider value={value}>{children}</MiniGameContext.Provider>;
}

export function useMiniGame() {
  const context = useContext(MiniGameContext);
  if (!context) throw new Error("useMiniGame must be used inside MiniGameProvider");
  return context;
}
