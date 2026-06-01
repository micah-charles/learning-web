/**
 * mapGenerator.js — one map layout: "pillars".
 *
 * Pillars are placed on a 3-cell grid so corridors are always 2 cells wide —
 * wide enough for a growing snake to turn around without getting trapped.
 *
 * Spacing 2 (old) → 1-cell corridors → snake deadlock.
 * Spacing 3 (new) → 2-cell corridors → snake can always manoeuvre.
 *
 * The outer ring is always clear so the player can lap the board edge.
 */
import { cellKey } from "../engine/grid.js";

/**
 * Generate the pillar map for the given grid dimensions.
 * @param {number} cols
 * @param {number} rows
 * @returns {{cols:number, rows:number, walls:Set<string>, type:string}}
 */
export function generateMap(_type, cols, rows) {
  const walls = new Set();
  // Pillars at every 3rd interior position.  The 2-cell gap between them is the
  // usable corridor width; one free cell on each outer edge keeps the perimeter open.
  for (let y = 2; y < rows - 1; y += 3) {
    for (let x = 2; x < cols - 1; x += 3) {
      walls.add(cellKey(x, y));
    }
  }
  return { cols, rows, walls, type: "pillars" };
}

/**
 * Choose sensible grid dimensions for the available pixel box.
 * Landscape-biased; cells are kept comfortably tappable on touch screens.
 */
export function fitGrid(boxWidth, boxHeight, { minCell = 46, maxCols = 15, maxRows = 11 } = {}) {
  const cols = Math.max(7, Math.min(maxCols, Math.floor(boxWidth / minCell)));
  const rows = Math.max(5, Math.min(maxRows, Math.floor(boxHeight / minCell)));
  return { cols, rows };
}
