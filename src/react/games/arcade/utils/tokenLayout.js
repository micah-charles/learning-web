/**
 * tokenLayout.js — how a word-pill maps onto grid cells.
 *
 * A pill is rendered as a single line of text. Long words are rotated 90°
 * (vertical, bottom-to-top). Either way the pill visually spans several cells,
 * so for placement AND collision we treat a token as occupying that whole line
 * of cells ("footprint"). This guarantees:
 *   - pills never overlap each other (placement reserves footprints),
 *   - the player can never sit *under* a pill without eating it (collision
 *     checks the footprint, not just the anchor cell).
 *
 * The orientation/threshold here MUST match GameBoard's rendering.
 */
import { floorCells, cellKey, isFloor } from "../engine/grid.js";
import { shuffle } from "@/utils.js";

/** Estimated pill length in px along its text axis. */
function estTextPx(text) {
  return String(text || "").length * 8 + 20;
}

/** @returns {{ vertical: boolean, spanCells: number }} */
export function tokenLayout(text, cellPx) {
  const estPx = estTextPx(text);
  const vertical = estPx > cellPx * 2.3;
  const spanCells = Math.max(1, Math.ceil(estPx / cellPx));
  return { vertical, spanCells };
}

/** The line of cells a token's pill covers, centred on its anchor cell. */
export function tokenCells(anchorX, anchorY, text, cellPx) {
  const { vertical, spanCells } = tokenLayout(text, cellPx);
  const before = Math.floor((spanCells - 1) / 2);
  const after = spanCells - 1 - before;
  const cells = [];
  for (let d = -before; d <= after; d++) {
    cells.push(vertical ? { x: anchorX, y: anchorY + d } : { x: anchorX + d, y: anchorY });
  }
  return cells;
}

/** Does this token's footprint cover (px, py)? Used for collision. */
export function tokenContains(token, px, py, cellPx) {
  return tokenCells(token.x, token.y, token.text, cellPx).some((c) => c.x === px && c.y === py);
}

/**
 * Place a set of word items so no two pills overlap and none covers a reserved
 * cell (e.g. the player). Longest words are placed first (hardest to fit). If a
 * non-overlapping spot can't be found for a word, it falls back to any free
 * anchor (degrading gracefully rather than dropping the word).
 *
 * @param {GameMap} map
 * @param {object[]} items     [{ text, ...payload }]
 * @param {{x,y}[]} reserved   cells to keep clear (player) — reserved with a 1-ring margin
 * @param {number} cellPx
 * @returns {object[]} items with { x, y } anchors added
 */
export function placeTokensNoOverlap(map, items, reserved, cellPx) {
  const occupied = new Set();
  const mark = (x, y) => occupied.add(cellKey(x, y));

  // Reserve the player cell(s) plus a one-cell ring so a pill never spawns on
  // top of / immediately touching the player.
  for (const r of reserved) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) mark(r.x + dx, r.y + dy);
    }
  }

  const interior = floorCells(map).filter(
    (c) => c.x > 0 && c.y > 0 && c.x < map.cols - 1 && c.y < map.rows - 1,
  );
  const pool = interior.length ? interior : floorCells(map);

  const footprintFree = (cells) =>
    cells.every((c) => isFloor(map, c.x, c.y) && !occupied.has(cellKey(c.x, c.y)));

  const order = [...items].sort((a, b) => String(b.text).length - String(a.text).length);
  const placed = [];

  for (const item of order) {
    let anchor = null;
    let cells = null;
    for (const c of shuffle(pool)) {
      const fc = tokenCells(c.x, c.y, item.text, cellPx);
      if (footprintFree(fc)) { anchor = c; cells = fc; break; }
    }
    if (!anchor) {
      // Relaxed: any free anchor cell (allow pill overlap rather than no token).
      anchor = shuffle(pool).find((c) => !occupied.has(cellKey(c.x, c.y))) || pool[0];
      cells = tokenCells(anchor.x, anchor.y, item.text, cellPx);
    }
    for (const c of cells) mark(c.x, c.y); // footprint-only (pills may sit adjacent, not overlapping)
    placed.push({ ...item, x: anchor.x, y: anchor.y });
  }

  return placed;
}
