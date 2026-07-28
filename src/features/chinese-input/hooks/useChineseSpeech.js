import { useCallback, useState } from "react";
import { useSpeech } from "../../../react/hooks/useSpeech.js";
import { getVoicesForLanguage } from "../../../utils.js";

export default function useChineseSpeech(enabled = true) {
  const { speak, stop } = useSpeech("zh-HK");
  const [message, setMessage] = useState("");

  const pronounce = useCallback((text) => {
    if (!enabled) {
      setMessage("Speech is turned off in Chinese Input settings.");
      return false;
    }
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setMessage("Cantonese speech is not available in this browser. You can still use the Jyutping guide.");
      return false;
    }
    const loadedVoices = window.speechSynthesis.getVoices();
    if (loadedVoices.length && !getVoicesForLanguage("zh-HK").length) {
      setMessage("A compatible Chinese voice is not installed. You can still use the Jyutping guide.");
      return false;
    }
    setMessage("");
    speak(text, "zh-HK");
    return true;
  }, [enabled, speak]);

  return { pronounce, stop, message };
}
