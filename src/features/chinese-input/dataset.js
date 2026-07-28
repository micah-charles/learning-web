import seedDataset from "./data/seed-dataset.json";
import { validateChineseInputDataset } from "./domain/schemas.js";

let cachedDataset;

export function loadChineseInputDataset() {
  if (cachedDataset) return cachedDataset;
  const validation = validateChineseInputDataset(seedDataset);
  if (!validation.valid) {
    const error = new Error("Chinese Input Lab data failed validation.");
    error.validationErrors = validation.errors;
    throw error;
  }
  cachedDataset = seedDataset;
  return cachedDataset;
}

export function findChineseInputCharacter(dataset, characterId) {
  return dataset?.characters?.find((character) => character.id === characterId) || null;
}
