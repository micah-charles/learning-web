/**
 * tutorSpeech.js
 *
 * Browser SpeechSynthesis wrapper for FoxChild Tutor.
 * Reuses patterns from utils.js speakText/stopSpeaking.
 */

import { speakText, stopSpeaking, getVoicesForLanguage } from "@/utils.js";

/**
 * Speech state for the tutor panel.
 */
export const SpeechState = {
  IDLE: "idle",
  SPEAKING: "speaking",
  PAUSED: "paused",
};

/**
 * Speak text using browser SpeechSynthesis.
 * @param {string} text - Text to speak.
 * @param {string} lang - BCP-47 language code (e.g., "de-DE", "en-GB").
 * @returns {Promise<boolean>} True if speech started.
 */
export async function speak(text, lang = "en-GB") {
  if (!text || typeof text !== "string") return false;
  return speakText(text.trim(), lang);
}

/**
 * Stop current speech.
 * @returns {boolean} True if speech was stopped.
 */
export function stop() {
  return stopSpeaking();
}

/**
 * Check if SpeechSynthesis is currently speaking.
 * @returns {boolean}
 */
export function isSpeaking() {
  if (!("speechSynthesis" in window)) return false;
  return window.speechSynthesis.speaking || window.speechSynthesis.pending;
}

/**
 * Get available voices for a language.
 * @param {string} lang - BCP-47 language code.
 * @returns {SpeechSynthesisVoice[]}
 */
export function getVoices(lang) {
  return getVoicesForLanguage(lang);
}

/**
 * Get a preferred voice for the tutor (female, natural-sounding if available).
 * @param {string} lang - BCP-47 language code.
 * @returns {SpeechSynthesisVoice|null}
 */
export function getPreferredVoice(lang) {
  const voices = getVoices(lang);
  if (!voices.length) return null;

  // Prefer female-sounding voices, then high-quality ones
  const preferredKeywords = ["female", "woman", "girl", "natural", "premium", "enhanced"];
  const avoidedKeywords = ["male", "man", "boy", "robotic", "default"];

  for (const keyword of preferredKeywords) {
    const match = voices.find(v => v.name.toLowerCase().includes(keyword));
    if (match) return match;
  }

  // Avoid obviously male/robotic voices
  for (const voice of voices) {
    const name = voice.name.toLowerCase();
    if (!avoidedKeywords.some(k => name.includes(k))) {
      return voice;
    }
  }

  return voices[0];
}

/**
 * Speak with tutor-preferred voice.
 * @param {string} text - Text to speak.
 * @param {string} lang - BCP-47 language code.
 * @returns {Promise<boolean>} True if speech started.
 */
export async function speakWithPreferredVoice(text, lang = "en-GB") {
  if (!text || typeof text !== "string") return false;
  if (!("speechSynthesis" in window)) return false;

  const synth = window.speechSynthesis;
  const voice = getPreferredVoice(lang);

  const doSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = lang;
    utterance.rate = lang.startsWith("de") ? 0.95 : 1.0;
    if (voice) utterance.voice = voice;
    synth.speak(utterance);
  };

  if (synth.speaking || synth.pending) {
    synth.cancel();
    requestAnimationFrame(doSpeak);
  } else {
    doSpeak();
  }
  return true;
}

/**
 * Speech mode helpers for tutor settings.
 */
export const SpeechMode = {
  NONE: "none",      // No auto-read
  TOGGLE: "toggle",  // Read aloud button per message
  ALWAYS: "always",  // Auto-read every tutor response
};

/**
 * Check if a message should be auto-read based on speech mode.
 * @param {string} mode - Current speech mode.
 * @returns {boolean}
 */
export function shouldAutoRead(mode) {
  return mode === SpeechMode.ALWAYS;
}