export const CANGJIE_MAX_CODE_LENGTH = 5;
export const QUICK_MAX_CODE_LENGTH = 2;

export function normaliseCode(value) {
  return String(value || "").normalize("NFKC").trim().toUpperCase().replace(/[^A-Z]/g, "");
}

export function maxCodeLengthForMethod(method) {
  return method === "quick" ? QUICK_MAX_CODE_LENGTH : CANGJIE_MAX_CODE_LENGTH;
}

export function appendInputKey(buffer, key, method = "cangjie") {
  const normalisedBuffer = normaliseCode(buffer);
  const normalisedKey = normaliseCode(key).slice(0, 1);
  if (!normalisedKey) return normalisedBuffer;
  return `${normalisedBuffer}${normalisedKey}`.slice(0, maxCodeLengthForMethod(method));
}

export function codePoints(value) {
  return Array.from(String(value || ""));
}

export function unicodeCodePoint(value) {
  const [character] = codePoints(value);
  if (!character) return "";
  return `U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
}
