import { useCallback } from "react";
import { speakText, stopSpeaking } from "@/utils.js";

export function useSpeech() {
  const speak = useCallback((text, lang = "de-DE") => speakText(text, lang), []);
  const stop = useCallback(() => stopSpeaking(), []);
  return { speak, stop };
}
