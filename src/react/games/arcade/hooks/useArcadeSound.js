/**
 * useArcadeSound.js — tiny WebAudio blip generator (no audio assets).
 *
 * Produces short tones for correct / wrong / collect / complete events plus an
 * optional speech read-out (reusing the app's speech util). Fully muteable; the
 * AudioContext is created lazily on first use (after a user gesture) so mobile
 * autoplay policies are respected. Architecture is ready for Audio Chase mode
 * (Mode 3): call `speak()` to play a prompt the player must answer.
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

export function useArcadeSound(mutedRef) {
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

  const speak = useCallback((text, lang) => {
    if (mutedRef.current || !text) return;
    speakText(text, lang || "en-GB");
  }, [mutedRef]);

  const stop = useCallback(() => stopSpeaking(), []);

  return { play, speak, stop };
}
