export const CANGJIE_ROOT_LABELS = "日月金木水火土竹戈十大中一弓人心手口尸廿山女田難卜符";

// Z is retained as an advanced Cangjie/IME tool key, not as a normal
// character root. It can be taught and practised, but must not inflate root
// or character-region mastery.
export const INPUT_TOOL_KEYS = new Set(["Z"]);

export const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

const ROOT_CATEGORIES = [
  "philosophical", "philosophical", "philosophical", "philosophical",
  "philosophical", "philosophical", "philosophical",
  "stroke", "stroke", "stroke", "stroke", "stroke", "stroke", "stroke",
  "body", "body", "body", "body", "body", "body", "body",
  "shape", "shape", "shape", "special", "special",
];

const ENGLISH_LABELS = [
  "sun", "moon", "gold", "wood", "water", "fire", "earth",
  "bamboo", "halberd", "ten", "big", "centre", "one", "bow",
  "person", "heart", "hand", "mouth", "corpse", "twenty", "mountain",
  "woman", "field", "difficult", "divination", "symbol",
];

const KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const CANGJIE_ROOTS = Array.from(KEYS, (key, index) => {
  const primaryRoot = Array.from(CANGJIE_ROOT_LABELS)[index];
  const labelEn = ENGLISH_LABELS[index];
  return {
    id: `root-${key.toLowerCase()}`,
    key,
    primaryRoot,
    inputTool: INPUT_TOOL_KEYS.has(key),
    labelZhHant: primaryRoot,
    labelEn,
    category: ROOT_CATEGORIES[index],
    displayOrder: index + 1,
    aliases: [],
    mnemonic: {
      zhHant: `${key} 鍵代表「${primaryRoot}」`,
      en: `${key} represents ${labelEn}`,
    },
    pronunciation: {
      locale: "zh-HK",
      jyutping: "",
      audioText: primaryRoot,
    },
    enabled: true,
  };
});

export const ROOT_BY_KEY = Object.fromEntries(CANGJIE_ROOTS.map((root) => [root.key, root]));

export function rootsForKeys(keys = []) {
  return keys.map((key) => ROOT_BY_KEY[String(key).toUpperCase()]).filter(Boolean);
}
