const DEFAULT_GRID_SIZE = 17;
const DEFAULT_ATTEMPTS = 80;

export function normalizeCrosswordAnswer(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/Ä/g, "AE")
    .replace(/Ö/g, "OE")
    .replace(/Ü/g, "UE")
    .replace(/ẞ/g, "SS")
    .replace(/ß/g, "SS")
    .replace(/Æ/g, "AE")
    .replace(/Œ/g, "OE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

export function crosswordEntriesFromWords(words, maxAnswerLength = 24) {
  const seen = new Set();
  return (words || [])
    .map((word) => {
      const displayAnswer = word.de || word.headword || "";
      const clue = word.en || word.english_equivalent || "";
      const answer = normalizeCrosswordAnswer(displayAnswer);
      return {
        id: word.id,
        answer,
        clue,
        displayAnswer,
        topic: word.topic || "",
      };
    })
    .filter((entry) => {
      if (!entry.id || !entry.answer || !entry.clue) return false;
      if (entry.answer.length < 3 || entry.answer.length > maxAnswerLength) return false;
      if (seen.has(entry.answer)) return false;
      seen.add(entry.answer);
      return true;
    });
}

function shuffleItems(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function emptyGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

function isInside(size, row, col) {
  return row >= 0 && col >= 0 && row < size && col < size;
}

function canPlace(grid, entry, row, col, direction) {
  const size = grid.length;
  const dr = direction === "down" ? 1 : 0;
  const dc = direction === "across" ? 1 : 0;
  let crossings = 0;

  const beforeRow = row - dr;
  const beforeCol = col - dc;
  const afterRow = row + dr * entry.answer.length;
  const afterCol = col + dc * entry.answer.length;

  if (isInside(size, beforeRow, beforeCol) && grid[beforeRow][beforeCol]) return null;
  if (isInside(size, afterRow, afterCol) && grid[afterRow][afterCol]) return null;

  for (let index = 0; index < entry.answer.length; index += 1) {
    const r = row + dr * index;
    const c = col + dc * index;
    if (!isInside(size, r, c)) return null;

    const existing = grid[r][c];
    if (existing && existing !== entry.answer[index]) return null;
    if (existing === entry.answer[index]) {
      crossings += 1;
      continue;
    }

    if (direction === "across") {
      if (isInside(size, r - 1, c) && grid[r - 1][c]) return null;
      if (isInside(size, r + 1, c) && grid[r + 1][c]) return null;
    } else {
      if (isInside(size, r, c - 1) && grid[r][c - 1]) return null;
      if (isInside(size, r, c + 1) && grid[r][c + 1]) return null;
    }
  }

  return { crossings };
}

function placeEntry(grid, placedEntries, entry, row, col, direction) {
  const dr = direction === "down" ? 1 : 0;
  const dc = direction === "across" ? 1 : 0;
  for (let index = 0; index < entry.answer.length; index += 1) {
    grid[row + dr * index][col + dc * index] = entry.answer[index];
  }
  placedEntries.push({ ...entry, row, col, direction });
}

function findPlacements(grid, placedEntries, entry) {
  const choices = [];
  const center = Math.floor(grid.length / 2);

  for (const placed of placedEntries) {
    for (let placedIndex = 0; placedIndex < placed.answer.length; placedIndex += 1) {
      for (let entryIndex = 0; entryIndex < entry.answer.length; entryIndex += 1) {
        if (placed.answer[placedIndex] !== entry.answer[entryIndex]) continue;

        const direction = placed.direction === "across" ? "down" : "across";
        const row = placed.direction === "across" ? placed.row - entryIndex : placed.row + placedIndex;
        const col = placed.direction === "across" ? placed.col + placedIndex : placed.col - entryIndex;
        const fit = canPlace(grid, entry, row, col, direction);

        if (fit) {
          const distance = Math.abs(row - center) + Math.abs(col - center);
          choices.push({
            row,
            col,
            direction,
            score: fit.crossings * 20 - distance,
          });
        }
      }
    }
  }

  return choices.sort((a, b) => b.score - a.score);
}

function trimGame(grid, placedEntries) {
  let minRow = Infinity;
  let minCol = Infinity;
  let maxRow = -Infinity;
  let maxCol = -Infinity;

  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      if (!grid[row][col]) continue;
      minRow = Math.min(minRow, row);
      minCol = Math.min(minCol, col);
      maxRow = Math.max(maxRow, row);
      maxCol = Math.max(maxCol, col);
    }
  }

  if (!Number.isFinite(minRow)) {
    return { grid: [], placedEntries: [] };
  }

  minRow = Math.max(0, minRow - 1);
  minCol = Math.max(0, minCol - 1);
  maxRow = Math.min(grid.length - 1, maxRow + 1);
  maxCol = Math.min(grid.length - 1, maxCol + 1);

  const trimmed = [];
  for (let row = minRow; row <= maxRow; row += 1) {
    trimmed.push(grid[row].slice(minCol, maxCol + 1));
  }

  return {
    grid: trimmed,
    placedEntries: placedEntries.map((entry) => ({
      ...entry,
      row: entry.row - minRow,
      col: entry.col - minCol,
    })),
  };
}

function numberEntries(placedEntries) {
  const starts = new Map();
  for (const entry of placedEntries) {
    const key = `${entry.row}:${entry.col}`;
    if (!starts.has(key)) starts.set(key, []);
    starts.get(key).push(entry);
  }

  let number = 1;
  for (const key of [...starts.keys()].sort((a, b) => {
    const [ar, ac] = a.split(":").map(Number);
    const [br, bc] = b.split(":").map(Number);
    return ar - br || ac - bc;
  })) {
    for (const entry of starts.get(key)) {
      entry.number = number;
    }
    number += 1;
  }
}

function scoreGame(game) {
  if (!game || !game.grid.length) return 0;
  const filledCells = game.grid.reduce((total, row) => total + row.filter(Boolean).length, 0);
  return game.placedEntries.length * 1000 - game.grid.length * game.grid[0].length + filledCells;
}

function generateOne(entries, gridSize) {
  const sorted = [...entries].sort((a, b) => b.answer.length - a.answer.length);
  const first = sorted.shift();
  if (!first || first.answer.length > gridSize) {
    return { grid: [], placedEntries: [] };
  }

  const grid = emptyGrid(gridSize);
  const placedEntries = [];
  const center = Math.floor(gridSize / 2);
  placeEntry(grid, placedEntries, first, center, Math.floor((gridSize - first.answer.length) / 2), "across");

  for (const entry of sorted) {
    const placements = findPlacements(grid, placedEntries, entry);
    if (!placements.length) continue;
    const best = placements[0];
    placeEntry(grid, placedEntries, entry, best.row, best.col, best.direction);
  }

  const game = trimGame(grid, placedEntries);
  numberEntries(game.placedEntries);
  return game;
}

export function generateCrossword(entries, options = {}) {
  const wordCount = options.wordCount || 10;
  const attempts = options.attempts || DEFAULT_ATTEMPTS;
  const candidates = entries.filter((entry) => entry.answer.length >= 3);
  const longest = Math.max(...candidates.map((entry) => entry.answer.length), 0);
  const gridSize = options.gridSize || Math.max(DEFAULT_GRID_SIZE, Math.min(25, Math.max(wordCount + 7, longest + 4)));

  let bestGame = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const selected = shuffleItems(candidates).slice(0, wordCount);
    const game = generateOne(selected, gridSize);
    game.requestedCount = wordCount;
    game.selectedCount = selected.length;
    if (!bestGame || scoreGame(game) > scoreGame(bestGame)) {
      bestGame = game;
    }
    if (game.placedEntries.length === Math.min(wordCount, selected.length)) {
      break;
    }
  }

  return bestGame || { grid: [], placedEntries: [], requestedCount: wordCount, selectedCount: 0 };
}
