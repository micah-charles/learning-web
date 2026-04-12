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

function foldGerman(value) {
  return stringValue(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue");
}

export function normalizeForCompare(value) {
  return foldGerman(value)
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
  return stringValue(level).toUpperCase().includes(selectedYear.toUpperCase());
}

export function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

export function speakText(text, language = "de-DE") {
  if (!("speechSynthesis" in window)) {
    return false;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.rate = language.startsWith("de") ? 0.95 : 1;
  window.speechSynthesis.speak(utterance);
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
