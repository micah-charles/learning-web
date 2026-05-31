/**
 * mapGenerator.js — reusable grid-map layouts.
 *
 * Layouts are intentionally simple and forgiving (this is an "educational
 * arcade", not a precision maze). All layouts guarantee a fully-connected floor
 * so collectibles are always reachable.
 *
 *   "open"   → no internal walls (best for mobile / younger players)
 *   "pillars"→ a sparse grid of single-cell pillars with wide corridors
 */
import { cellKey } from "../engine/grid.js";

/**
 * @param {"open"|"pillars"} type
 * @param {number} cols
 * @param {number} rows
 * @returns {{cols:number, rows:number, walls:Set<string>, type:string}}
 */
export function generateMap(type, cols, rows) {
  const walls = new Set();

  if (type === "pillars") {
    // Place a pillar on interior cells where both coordinates are even.
    // Keep a 1-cell margin so the outer ring is always an open corridor.
    for (let y = 2; y < rows - 2; y += 2) {
      for (let x = 2; x < cols - 2; x += 2) {
        walls.add(cellKey(x, y));
      }
    }
  }
  // "open" leaves walls empty.

  return { cols, rows, walls, type };
}

/**
 * Choose sensible grid dimensions for the available pixel box, keeping cells
 * comfortably tappable on touch screens. Landscape-biased.
 */
export function fitGrid(boxWidth, boxHeight, { minCell = 46, maxCols = 15, maxRows = 11 } = {}) {
  const cols = Math.max(7, Math.min(maxCols, Math.floor(boxWidth / minCell)));
  const rows = Math.max(5, Math.min(maxRows, Math.floor(boxHeight / minCell)));
  return { cols, rows };
}
