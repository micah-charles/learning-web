/**
 * admin-validate.js
 *
 * Item-level schema validation for uploaded pack files.
 * Intentionally zero-dependency (no Ajv, no npm imports) so it
 * works in both Vite-bundled mode and the source-served production
 * environment (Python HTTP server + import map).
 *
 * ⚠ Caution: bare npm imports here will break source-served mode.
 *   See docs/AI_UI_IMPLEMENTATION_CAUTIONS.md §"Import map".
 */

const ITEM_CHECKS = {
  fillBlank(d, idx) {
    if (!d.sentence)
      return `items[${idx}].data: must have required property 'sentence'`;
    if (!String(d.sentence).includes("____"))
      return `items[${idx}].data.sentence: must contain '____' blank placeholder`;
    if (!d.answer)
      return `items[${idx}].data: must have required property 'answer'`;
    return null;
  },

  multipleChoice(d, idx) {
    if (!d.question)
      return `items[${idx}].data: must have required property 'question'`;
    if (!d.answer)
      return `items[${idx}].data: must have required property 'answer'`;
    if (!Array.isArray(d.options) || d.options.length < 2)
      return `items[${idx}].data: must have required property 'options' (array with at least 2 choices)`;
    const expected = String(d.answer).trim().toLowerCase();
    const hasAnswer = d.options.some((option) => String(option).trim().toLowerCase() === expected);
    if (!hasAnswer)
      return `items[${idx}].data.options: must include the answer`;
    return null;
  },

  sequence(d, idx) {
    if (!d.title)
      return `items[${idx}].data: must have required property 'title' (not 'question')`;
    if (!Array.isArray(d.items) || d.items.length === 0)
      return `items[${idx}].data: must have required property 'items' (non-empty array)`;
    return null;
  },

  categorySort(d, idx) {
    if (!Array.isArray(d.categories) || d.categories.length === 0)
      return `items[${idx}].data: must have required property 'categories'`;
    if (!Array.isArray(d.pairs) || d.pairs.length === 0)
      return `items[${idx}].data: must have required property 'pairs'`;
    return null;
  },

  passage(d, idx, item) {
    for (const [qi, q] of (item.questions || []).entries()) {
      if (!q.question)
        return `items[${idx}].questions[${qi}]: must use 'question' field (not 'questionText' or 'question_en')`;
    }
    return null;
  },

  sentenceBuilder(d, idx) {
    if (!d.answer)
      return `items[${idx}].data: must have required property 'answer'`;
    if (!Array.isArray(d.tiles) || d.tiles.length === 0)
      return `items[${idx}].data: must have required property 'tiles' (non-empty array)`;
    const reconstructed = d.tiles.map((tile) => String(tile)).join(" ");
    if (d.answer && reconstructed !== d.answer)
      return `items[${idx}].data.tiles: joined tiles must exactly match answer`;
    return null;
  },

  vocab(d, idx, item, context) {
    if (!d.sourceWord && !d.translations)
      return `items[${idx}].data: must have 'sourceWord' or 'translations'`;
    if (!d.targetWord && !d.translations)
      return `items[${idx}].data: must have 'targetWord' or 'translations'`;
    const hasTranslations = d.translations && typeof d.translations === "object";
    const sourceWord = hasTranslations ? Object.values(d.translations)[0] : d.sourceWord;
    const targetWord = hasTranslations ? Object.values(d.translations).slice(-1)[0] : d.targetWord;
    if (!context?.isLanguagePack && sourceWord && targetWord && String(sourceWord).trim().toLowerCase() === String(targetWord).trim().toLowerCase())
      return `items[${idx}].data.targetWord: must be a real definition, not a repeat of sourceWord`;
    const pos = String(d.partOfSpeech || d.pos || "").trim().toLowerCase();
    if (context?.isLanguagePack && ["n", "v", "a", "d", "r", "p", "c", "i"].includes(pos))
      return `items[${idx}].data.partOfSpeech: must use full words such as noun or verb, not '${pos}'`;
    return null;
  },
};

/**
 * Validate all items in a parsed pack against item-type rules.
 * Returns { ok: boolean, errors: string[] }.
 * Non-blocking by design — callers decide whether to reject or just warn.
 */
export function validatePackSchema(data) {
  const errors = [];
  const context = {
    isLanguagePack: Boolean(
      data?.sourceLanguageCode &&
      data?.targetLanguageCode &&
      data.sourceLanguageCode !== data.targetLanguageCode
    ),
  };
  for (const [idx, item] of (data?.items || []).entries()) {
    const check = item?.type && ITEM_CHECKS[item.type];
    if (!check) continue;
    const err = check(item.data || {}, idx, item, context);
    if (err) errors.push(err);
    if (errors.length >= 8) break;
  }
  return { ok: errors.length === 0, errors };
}
