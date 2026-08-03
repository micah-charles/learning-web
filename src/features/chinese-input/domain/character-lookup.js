export function findChineseInputCharacter(dataset, characterId) {
  return dataset?.characters?.find((character) => character.id === characterId) || null;
}
