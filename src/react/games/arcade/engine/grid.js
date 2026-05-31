/**
 * grid.js — grid model + collision (the "physics" of the arcade).
 *
 * The map is a grid of cells. A cell is either floor or wall. Entities live at
 * integer cell coordinates {x, y}. All collision is coordinate-based.
 */

export const DIRS = {
  up:    { x: 0, y: -1 },
  down:  { x: 0, y: 1 },
  left:  { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  none:  { x: 0, y: 0 },
};

export const OPPOSITE = { up: "down", down: "up", left: "right", right: "left", none: "none" };

export function cellKey(x, y) {
  return `${x},${y}`;
}

/**
 * @typedef {Object} GameMap
 * @property {number} cols
 * @property {number} rows
 * @property {Set<string>} walls   set of "x,y" wall cells
 */

export function isWall(map, x, y) {
  return map.walls.has(cellKey(x, y));
}

export function inBounds(map, x, y) {
  return x >= 0 && y >= 0 && x < map.cols && y < map.rows;
}

/** Can an entity stand on (x,y)? Inside bounds and not a wall. */
export function isFloor(map, x, y) {
  return inBounds(map, x, y) && !isWall(map, x, y);
}

/** All floor cells as {x,y} objects. */
export function floorCells(map) {
  const out = [];
  for (let y = 0; y < map.rows; y++) {
    for (let x = 0; x < map.cols; x++) {
      if (isFloor(map, x, y)) out.push({ x, y });
    }
  }
  return out;
}

/**
 * Pick `n` distinct random floor cells, avoiding any cell in `occupied`
 * (a Set of "x,y" keys). Returns as many as it can find.
 *
 * @param {object} [opts]
 * @param {boolean} [opts.interior]  Prefer non-border cells so wide word-pills
 *   don't get clipped at the board edge. Falls back to all cells if the interior
 *   can't supply `n` cells.
 */
export function randomFloorCells(map, n, occupied = new Set(), opts = {}) {
  const rng = opts.rng || Math.random;
  let candidates = floorCells(map).filter((c) => !occupied.has(cellKey(c.x, c.y)));
  if (opts.interior) {
    const inner = candidates.filter(
      (c) => c.x > 0 && c.y > 0 && c.x < map.cols - 1 && c.y < map.rows - 1,
    );
    if (inner.length >= n) candidates = inner;
  }
  // Fisher–Yates partial shuffle.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, n);
}

/**
 * Resolve a single grid step for a moving entity.
 * Returns the next {x,y}. If the next cell is blocked, the entity stays put.
 */
export function stepInDirection(map, pos, direction) {
  const d = DIRS[direction] || DIRS.none;
  const nx = pos.x + d.x;
  const ny = pos.y + d.y;
  if (isFloor(map, nx, ny)) return { x: nx, y: ny };
  return { x: pos.x, y: pos.y };
}

/** Manhattan distance between two cells. */
export function cellsEqual(a, b) {
  return a.x === b.x && a.y === b.y;
}
