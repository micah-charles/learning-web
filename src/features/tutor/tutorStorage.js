/**
 * tutorStorage.js
 *
 * Storage helpers for FoxChild Tutor preferences.
 * Uses the existing storage.js loadStoredState/saveStoredState to avoid direct localStorage access.
 */

import { loadStoredState, saveStoredState } from "@/storage.js";

const TUTOR_PREFS_KEY = "tutor";

export const DEFAULT_TUTOR_PREFS = {
  enabled: true,
  speechMode: "toggle", // "none" | "toggle" | "always"
  openOnLoad: false,
};

/**
 * Load tutor preferences from the global app state.
 * @returns {Promise<object>} Tutor preferences merged with defaults.
 */
export async function loadTutorPrefs() {
  try {
    const state = loadStoredState();
    const prefs = state.prefs?.[TUTOR_PREFS_KEY] || {};
    return { ...DEFAULT_TUTOR_PREFS, ...prefs };
  } catch (_error) {
    return { ...DEFAULT_TUTOR_PREFS };
  }
}

/**
 * Save tutor preferences to the global app state.
 * @param {object} prefs - Tutor preferences to save.
 */
export function saveTutorPrefs(prefs) {
  try {
    const state = loadStoredState();
    if (!state.prefs) state.prefs = {};
    state.prefs[TUTOR_PREFS_KEY] = { ...DEFAULT_TUTOR_PREFS, ...prefs };
    saveStoredState(state);
  } catch (_error) {
    // Silently fail - localStorage might be full or unavailable
  }
}

/**
 * Get a single tutor preference.
 * @param {string} key - Preference key.
 * @returns {Promise<any>} Preference value.
 */
export async function getTutorPref(key) {
  const prefs = await loadTutorPrefs();
  return prefs[key];
}

/**
 * Set a single tutor preference.
 * @param {string} key - Preference key.
 * @param {any} value - Preference value.
 */
export async function setTutorPref(key, value) {
  const prefs = await loadTutorPrefs();
  prefs[key] = value;
  saveTutorPrefs(prefs);
}

/**
 * Toggle tutor enabled state.
 * @returns {Promise<boolean>} New enabled state.
 */
export async function toggleTutorEnabled() {
  const prefs = await loadTutorPrefs();
  prefs.enabled = !prefs.enabled;
  saveTutorPrefs(prefs);
  return prefs.enabled;
}

/**
 * Cycle speech mode: none -> toggle -> always -> none
 * @returns {Promise<string>} New speech mode.
 */
export async function cycleSpeechMode() {
  const prefs = await loadTutorPrefs();
  const modes = ["none", "toggle", "always"];
  const currentIndex = modes.indexOf(prefs.speechMode);
  const nextIndex = (currentIndex + 1) % modes.length;
  prefs.speechMode = modes[nextIndex];
  saveTutorPrefs(prefs);
  return prefs.speechMode;
}