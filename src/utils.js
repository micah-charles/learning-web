const ACRONYMS = new Set(["bbc", "gcse", "dw", "y7", "y8", "y9", "y10", "y11"]);

function stringValue(value) {
  return value === undefined || value === null ? "" : String(value);
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function escapeHtml(value) {
  return stringValue(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function humanizeLabel(value) {
  return stringValue(value)
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const lower = token.toLowerCase();
      return ACRONYMS.has(lower) ? lower.toUpperCase() : lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function shuffle(input) {
  const list = [...input];
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [list[index], list[swapIndex]] = [list[swapIndex], list[index]];
  }
  return list;
}

export function sampleSize(input, count) {
  return shuffle(input).slice(0, Math.max(0, count));
}

export function splitJsonl(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function foldText(value) {
  return stringValue(value)
    .normalize("NFC")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function normalizeForCompare(value) {
  return foldText(value)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeSentence(value) {
  return stringValue(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function levelMatches(level, selectedYear) {
  if (!selectedYear || selectedYear === "ALL") {
    return true;
  }
  // Handle stage-based packs (e.g. "Stage 1") vs year-based ("Y7")
  // "Stage 1" matches when year is "Stage 1" or when selectedYear is numeric "1"
  const stageMatch = String(level || "").match(/^Stage\s+(\d+)$/i);
  if (stageMatch) {
    const itemStage = stageMatch[1];
    // Match against a numeric year selection (e.g. "1" matches "Stage 1")
    if (selectedYear.replace(/\D/g, "") === itemStage) {
      return true;
    }
  }
  return stringValue(level).toUpperCase().includes(selectedYear.toUpperCase());
}

export function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

/** Return all available TTS voices that match the given BCP-47 language code. */
export function getVoicesForLanguage(langCode) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  const primary = (langCode || "").toLowerCase();
  const base = primary.split("-")[0];
  return voices.filter((v) => {
    const vl = v.lang.toLowerCase().replace("_", "-");
    return vl === primary || vl.startsWith(base + "-");
  });
}

export function isSpeechSynthesisSupported() {
  return typeof window !== "undefined"
    && "speechSynthesis" in window
    && typeof window.SpeechSynthesisUtterance !== "undefined";
}

export function speakText(text, language = "de-DE", voiceNameOrOptions = "") {
  if (!isSpeechSynthesisSupported() || !text) return false;
  const synth = window.speechSynthesis;
  const options = voiceNameOrOptions && typeof voiceNameOrOptions === "object"
    ? voiceNameOrOptions
    : { voiceName: voiceNameOrOptions || "" };

  const doSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = options.rate ?? (language.startsWith("de") ? 0.95 : 1);
    if (typeof options.pitch === "number") utterance.pitch = options.pitch;
    if (typeof options.volume === "number") utterance.volume = options.volume;
    if (options.voiceName) {
      const match = synth.getVoices().find((v) => v.name === options.voiceName);
      if (match) utterance.voice = match;
    }
    if (options.onStart) utterance.onstart = options.onStart;
    if (options.onEnd) utterance.onend = options.onEnd;
    if (options.onError) utterance.onerror = options.onError;
    synth.speak(utterance);
  };

  if (synth.speaking || synth.pending) {
    // Chrome bug: calling speak() immediately after cancel() silently drops
    // the new utterance. Defer by one animation frame — this stays within the
    // transient user-activation window (Chrome preserves it through rAF).
    synth.cancel();
    requestAnimationFrame(doSpeak);
  } else {
    doSpeak();
  }
  return true;
}

export function stopSpeaking() {
  if (!isSpeechSynthesisSupported()) {
    return false;
  }
  window.speechSynthesis.cancel();
  return true;
}

export function byDisplayName(a, b) {
  const left = a && a.displayName ? String(a.displayName) : "";
  const right = b && b.displayName ? String(b.displayName) : "";
  return left.localeCompare(right);
}

export function uniqueBy(items, makeKey) {
  const seen = new Set();
  return items.filter((item) => {
    const key = makeKey(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString();
  } catch (_error) {
    return stringValue(value);
  }
}
