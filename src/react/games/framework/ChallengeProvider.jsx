import { createContext, useContext, useMemo } from "react";
import { toGenericChallenges } from "./challengeAdapter.js";

const ChallengeContext = createContext(null);

export function ChallengeProvider({ questions, children }) {
  const challenges = useMemo(() => toGenericChallenges(questions), [questions]);
  const value = useMemo(() => ({ challenges }), [challenges]);
  return <ChallengeContext.Provider value={value}>{children}</ChallengeContext.Provider>;
}

export function useChallenges() {
  const context = useContext(ChallengeContext);
  if (!context) throw new Error("useChallenges must be used inside ChallengeProvider");
  return context;
}
