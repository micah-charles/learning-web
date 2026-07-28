import { useCallback, useEffect, useState } from "react";
import { useSpeech } from "../../../react/hooks/useSpeech.js";
import { getVoicesForLanguage } from "../../../utils.js";

export default function useChineseSpeech(enabled = true, locale = "zh-HK") {
  const speechLocale = locale === "zh-TW" ? "zh-TW" : "zh-HK";
  const languageLabel = speechLocale === "zh-TW" ? "Mandarin (Taiwan)" : "Cantonese";
  const { speak, stop } = useSpeech();
  const [message, setMessage] = useState("");

  const pronounce = useCallback((text) => {
    if (!enabled) {
      setMessage("Speech is turned off in Chinese Input settings.");
      return false;
    }
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setMessage(`${languageLabel} speech is not available in this browser.`);
      return false;
    }
    const loadedVoices = window.speechSynthesis.getVoices();
    if (loadedVoices.length && !getVoicesForLanguage(speechLocale).length) {
      setMessage(`A compatible ${languageLabel} voice is not installed.`);
      return false;
    }
    setMessage("");
    speak(text, speechLocale);
    return true;
  }, [enabled, languageLabel, speak, speechLocale]);

  useEffect(() => () => stop(), [speechLocale, stop]);

  return { pronounce, stop, message, speechLocale };
}
