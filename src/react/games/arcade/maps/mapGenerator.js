/**
 * mapGenerator.js — two map layouts.
 *
 *  "open"    → no walls; the whole grid is a plain floor.
 *              Used for Sentence Snake so the growing body isn't boxed in.
 *
 *  "pillars" → sparse 1-cell pillars on a 3-cell grid, leaving 2-cell-wide
 *              corridors. Used for Quiz Hunt.
 *
 * The outer ring is always clear so the player can lap the board edge.
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
    // Pillars at every 3rd interior position — 2-cell corridors.
    for (let y = 2; y < rows - 1; y += 3) {
      for (let x = 2; x < cols - 1; x += 3) {
        walls.add(cellKey(x, y));
      }
    }
  }
  // "open" leaves walls empty.
  return { cols, rows, walls, type: type === "pillars" ? "pillars" : "open" };
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
