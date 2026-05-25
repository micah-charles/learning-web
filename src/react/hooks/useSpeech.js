import { useCallback } from "react";
import { speakText, stopSpeaking } from "@/utils.js";

export function useSpeech() {
  // Default lang to "en-GB" — callers should always pass the correct speech language
  // but "en-GB" is a safer fallback than "de-DE" for English-content packs.
  const speak = useCallback((text, lang = "en-GB") => speakText(text, lang), []);
  const stop = useCallback(() => stopSpeaking(), []);
  return { speak, stop };
}
