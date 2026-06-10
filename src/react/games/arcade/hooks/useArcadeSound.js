/**
 * useArcadeSound.js — two independent audio channels for the arcade.
 *
 * Channel 1 — Sound effects (mutedRef)
 *   Tiny WebAudio blips for correct / wrong / collect / complete / start.
 *   Toggled by the 🔊 button in the HUD.
 *
 * Channel 2 — Word speech (speechEnabledRef)
 *   Speaks the correct word/answer aloud via the app's shared speakText util
 *   (same engine used by Reading and Vocabulary tabs). Toggled by the 🗣 button.
 *
 * Both channels are independent: turning off sound effects does NOT silence
 * speech, and vice versa. Both use refs so flipping a toggle never re-renders
 * or restarts the game loop.
 *
 * Shared engine: speakText / stopSpeaking from utils.js — the same function
 * used by useSpeech (Reading / Vocab tabs).
 */
import { useRef, useCallback } from "react";
import { speakText, stopSpeaking } from "@/utils.js";

const TONES = {
  correct:  [{ f: 660, t: 0 }, { f: 880, t: 0.09 }],
  wrong:    [{ f: 200, t: 0 }, { f: 150, t: 0.12 }],
  collect:  [{ f: 520, t: 0 }],
  complete: [{ f: 660, t: 0 }, { f: 880, t: 0.08 }, { f: 1040, t: 0.16 }],
  start:    [{ f: 440, t: 0 }, { f: 660, t: 0.1 }],
};

export function useArcadeSound(mutedRef, speechEnabledRef) {
  const ctxRef = useRef(null);

  const ensureCtx = useCallback(() => {
    if (mutedRef.current) return null;
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, [mutedRef]);

  // Sound effects — gated by mutedRef only.
  const play = useCallback((name) => {
    const ctx = ensureCtx();
    if (!ctx) return;
    const notes = TONES[name] || TONES.collect;
    const now = ctx.currentTime;
    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = note.f;
      gain.gain.setValueAtTime(0.0001, now + note.t);
      gain.gain.exponentialRampToValueAtTime(0.12, now + note.t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.t + 0.13);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + note.t);
      osc.stop(now + note.t + 0.14);
    }
  }, [ensureCtx]);

  // Word speech — gated by speechEnabledRef only (independent of sound effects).
  const speakWord = useCallback((text, lang) => {
    if (!speechEnabledRef?.current || !text) return;
    speakText(text, lang || "en-GB");
  }, [speechEnabledRef]);

  const stop = useCallback(() => stopSpeaking(), []);

  return { play, speakWord, stop };
}
