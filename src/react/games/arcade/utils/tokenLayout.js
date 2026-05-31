/**
 * tokenLayout.js — how a word-pill maps onto grid cells.
 *
 * A pill renders as one line of text; long words are rotated 90° (vertical,
 * bottom-to-top). Either way the pill spans some pixels along its text axis, so
 * we map that onto grid cells by how much of each cell the pill actually covers.
 *
 * Two coverage thresholds are used:
 *   - COLLIDE (0.5): the player only "eats" a word when it's ≥50% under the pill
 *     → no false hits when merely next to a pill.
 *   - RESERVE (0.18): placement reserves any cell the pill noticeably touches
 *     → pills never visually overlap each other or the player.
 *
 * Orientation/threshold here MUST match GameBoard's rendering.
 */
import { floorCells, cellKey, isFloor } from "../engine/grid.js";
import { shuffle } from "@/utils.js";

const COLLIDE_COVERAGE = 0.5;
const RESERVE_COVERAGE = 0.18;

/** Estimated pill length in px along its text axis (bold ~0.8rem). */
function estTextPx(text) {
  return String(text || "").length * 8 + 20;
}

/** @returns {{ vertical: boolean, estPx: number }} */
export function tokenLayout(text, cellPx) {
  const estPx = estTextPx(text);
  // Prefer horizontal; only rotate when the word is much wider than a cell.
  const vertical = estPx > cellPx * 2.4;
  return { vertical, estPx };
}

/**
 * The cells a token's pill covers by at least `minCoverage` of the cell,
 * centred on the anchor. The anchor cell is always included.
 */
export function tokenCells(anchorX, anchorY, text, cellPx, minCoverage = COLLIDE_COVERAGE) {
  const { vertical, estPx } = tokenLayout(text, cellPx);
  const half = estPx / 2;
  const reach = Math.ceil(half / cellPx) + 1;
  const cells = [];
  for (let i = -reach; i <= reach; i++) {
    const lo = i * cellPx - cellPx / 2;
    const hi = i * cellPx + cellPx / 2;
    const overlap = Math.max(0, Math.min(hi, half) - Math.max(lo, -half));
    if (i === 0 || overlap / cellPx >= minCoverage) {
      cells.push(vertical ? { x: anchorX, y: anchorY + i } : { x: anchorX + i, y: anchorY });
    }
  }
  return cells;
}

/** Collision test: is (px,py) at least 50% under this token's pill? */
export function tokenContains(token, px, py, cellPx) {
  return tokenCells(token.x, token.y, token.text, cellPx, COLLIDE_COVERAGE)
    .some((c) => c.x === px && c.y === py);
}

/**
 * Place word items so no two pills overlap and none covers a reserved cell
 * (the player + a one-cell ring). Longest words first; graceful fallback if the
 * board is tight.
 */
export function placeTokensNoOverlap(map, items, reserved, cellPx) {
  const occupied = new Set();
  const mark = (x, y) => occupied.add(cellKey(x, y));

  for (const r of reserved) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) mark(r.x + dx, r.y + dy);
    }
  }

  const interior = floorCells(map).filter(
    (c) => c.x > 0 && c.y > 0 && c.x < map.cols - 1 && c.y < map.rows - 1,
  );
  const pool = interior.length ? interior : floorCells(map);

  const free = (cells) =>
    cells.every((c) => isFloor(map, c.x, c.y) && !occupied.has(cellKey(c.x, c.y)));

  const order = [...items].sort((a, b) => String(b.text).length - String(a.text).length);
  const placed = [];

  for (const item of order) {
    let anchor = null;
    let footprint = null;
    for (const c of shuffle(pool)) {
      const fc = tokenCells(c.x, c.y, item.text, cellPx, RESERVE_COVERAGE);
      if (free(fc)) { anchor = c; footprint = fc; break; }
    }
    if (!anchor) {
      anchor = shuffle(pool).find((c) => !occupied.has(cellKey(c.x, c.y))) || pool[0];
      footprint = tokenCells(anchor.x, anchor.y, item.text, cellPx, RESERVE_COVERAGE);
    }
    for (const c of footprint) mark(c.x, c.y);
    placed.push({ ...item, x: anchor.x, y: anchor.y });
  }

  return placed;
}
