import { CANGJIE_ROOTS, ROOT_BY_KEY } from "../data/keyboard-layout.js";
import { CHINESE_INPUT_LESSONS } from "../data/lesson-catalog.js";
import { unicodeCodePoint } from "./code-normalisation.js";

function assert(condition, message, errors) {
  if (!condition) errors.push(message);
}

function validateMethodData(character, method, errors) {
  const data = character[method];
  assert(data && typeof data === "object", `${character.id}: missing ${method} data`, errors);
  if (!data) return;
  assert(Array.isArray(data.acceptedCodes) && data.acceptedCodes.length > 0, `${character.id}: ${method} acceptedCodes is empty`, errors);
  assert(data.acceptedCodes?.includes(data.preferredCode), `${character.id}: ${method} preferredCode is not accepted`, errors);
  const maxLength = method === "cangjie" ? 5 : 2;
  for (const code of data.acceptedCodes || []) {
    assert(/^[A-Z]+$/.test(code), `${character.id}: invalid ${method} code ${code}`, errors);
    assert(code.length <= maxLength, `${character.id}: ${method} code exceeds ${maxLength} keys`, errors);
    assert(Array.from(code).every((key) => ROOT_BY_KEY[key]), `${character.id}: ${method} code uses unknown root`, errors);
  }
  assert(data.keySequence?.join("") === data.preferredCode, `${character.id}: ${method} keySequence does not match preferredCode`, errors);
  assert(data.rootSequence?.length === data.keySequence?.length, `${character.id}: ${method} root/key sequence length mismatch`, errors);
}

export function validateChineseInputDataset(dataset) {
  const errors = [];
  const warnings = [];
  assert(dataset?.manifest?.schemaVersion === 1, "manifest: schemaVersion must be 1", errors);
  assert(dataset?.manifest?.cangjieVersion === "5", "manifest: only Cangjie 5 is supported", errors);
  assert(dataset?.manifest?.locale === "zh-HK", "manifest: locale must be zh-HK", errors);
  assert(dataset?.manifest?.license?.name && dataset.manifest.license.name !== "TO_BE_CONFIRMED", "manifest: resolved license metadata is required", errors);
  assert(/^sha256:[a-f0-9]{64}$/.test(dataset?.manifest?.checksum || ""), "manifest: valid SHA-256 checksum is required", errors);
  assert(Array.isArray(dataset?.roots) && dataset.roots.length === CANGJIE_ROOTS.length, "dataset: all 26 keyboard roots are required", errors);
  assert(Array.isArray(dataset?.characters) && dataset.characters.length > 0, "dataset: characters are required", errors);
  const ids = new Set();
  const rootIds = new Set();
  const rootKeys = new Set();
  for (const root of dataset?.roots || []) {
    assert(!rootIds.has(root.id), `duplicate root id: ${root.id}`, errors);
    assert(!rootKeys.has(root.key), `duplicate root key: ${root.key}`, errors);
    rootIds.add(root.id);
    rootKeys.add(root.key);
    assert(ROOT_BY_KEY[root.key]?.primaryRoot === root.primaryRoot, `${root.id}: root label does not match keyboard map`, errors);
  }
  const charactersById = new Map();
  for (const character of dataset?.characters || []) {
    assert(!ids.has(character.id), `duplicate character id: ${character.id}`, errors);
    ids.add(character.id);
    charactersById.set(character.id, character);
    assert(Array.from(character.char || "").length === 1, `${character.id}: char must be one Unicode code point`, errors);
    assert(character.codePoint === unicodeCodePoint(character.char), `${character.id}: codePoint mismatch`, errors);
    assert(character.script === "traditional", `${character.id}: script must be traditional`, errors);
    assert(character.pronunciations?.some((entry) => entry.locale === "zh-HK" && entry.system === "jyutping"), `${character.id}: missing zh-HK Jyutping`, errors);
    assert(character.provenance?.verified === true, `${character.id}: unverified record`, errors);
    validateMethodData(character, "cangjie", errors);
    validateMethodData(character, "quick", errors);
  }
  for (const lesson of dataset?.lessons || CHINESE_INPUT_LESSONS) {
    for (const characterId of lesson.characterIds || []) {
      assert(charactersById.has(characterId), `${lesson.id}: unknown character ${characterId}`, errors);
      const character = charactersById.get(characterId);
      const methodData = character?.[lesson.method];
      assert(methodData?.keySequence?.every((key) => lesson.activeKeys.includes(key)), `${lesson.id}: active keys do not cover ${characterId}`, errors);
      assert(character?.provenance?.verified === true, `${lesson.id}: uses unverified character ${characterId}`, errors);
    }
    assert((lesson.activeKeys || []).every((key) => ROOT_BY_KEY[key]), `${lesson.id}: unknown active key`, errors);
  }
  const calculatedCounts = {
    roots: dataset?.roots?.length || 0,
    characters: dataset?.characters?.length || 0,
    lessons: dataset?.lessons?.length || 0,
  };
  assert(JSON.stringify(dataset?.manifest?.counts) === JSON.stringify(calculatedCounts), "manifest: counts do not match dataset", errors);
  const quickMissing = (dataset?.characters || []).filter((character) => !character.quick).length;
  if (quickMissing) warnings.push(`${quickMissing} characters are missing Quick data.`);
  return { valid: errors.length === 0, errors, warnings, counts: calculatedCounts };
}
