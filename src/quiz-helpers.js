/**
 * quiz-helpers.js - shared pure functions for quiz setup
 * Used by both vanilla main.js and React pages.
 */
import { levelMatches } from "./utils.js";

export function getDatasetStageOptions(dataset) {
  return Array.isArray(dataset?.stageOptions) ? dataset.stageOptions.map(String) : [];
}
export function getStudyLanguageLabel(dataset) {
  return dataset?.sourceLanguageLabel || "German";
}
export function getTargetLanguageLabel(dataset) {
  return dataset?.targetLanguageLabel || "English";
}
export function getStudyLanguageCode(dataset) {
  return dataset?.speechLanguage || dataset?.sourceLanguageCode || "de-DE";
}
export function usesStageSelection(dataset) {
  return getDatasetStageOptions(dataset).length > 0;
}
export function getSelectedStages(prefSection, dataset) {
  const stageOptions = getDatasetStageOptions(dataset);
  if (!stageOptions.length) return [];
  const current = Array.isArray(prefSection.stages) ? prefSection.stages.map(String) : [];
  const valid = current.filter(s => stageOptions.includes(s));
  return valid.length ? valid : [...stageOptions];
}
export function filterWordsForScope(words, dataset, prefSection) {
  if (usesStageSelection(dataset)) {
    const selectedStages = new Set(getSelectedStages(prefSection, dataset));
    return words.filter(w => selectedStages.has(String(w.stage)));
  }
  return words.filter(w => levelMatches(w.level, prefSection.year));
}
export function filterFillBlankByStage(unifiedPack, prefSection, dataset) {
  const all = unifiedPack && Array.isArray(unifiedPack.items)
    ? unifiedPack.items.filter(item => item.type === "fillBlank")
    : [];
  if (!usesStageSelection(dataset)) return all;

  const selectedStages = new Set(getSelectedStages(prefSection, dataset).map(String));
  if (!selectedStages.size) return all;

  return all.filter(item => {
    const stageStr = String(item.level || "").replace(/^Stage\s+/i, "").trim();
    return !stageStr || isNaN(Number(stageStr)) || selectedStages.has(stageStr);
  });
}
export function describeScope(dataset, prefSection) {
  if (usesStageSelection(dataset)) {
    return `Stages ${getSelectedStages(prefSection, dataset).join(", ")}`;
  }
  return prefSection.year || "ALL";
}
