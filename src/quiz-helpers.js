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
export function describeScope(dataset, prefSection) {
  if (usesStageSelection(dataset)) {
    return `Stages ${getSelectedStages(prefSection, dataset).join(", ")}`;
  }
  return prefSection.year || "ALL";
}
