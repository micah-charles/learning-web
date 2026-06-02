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

  // Every map has a solid outer border so the player can't leave the visible area.
  for (let x = 0; x < cols; x++) { walls.add(cellKey(x, 0)); walls.add(cellKey(x, rows - 1)); }
  for (let y = 1; y < rows - 1; y++) { walls.add(cellKey(0, y)); walls.add(cellKey(cols - 1, y)); }

  if (type === "pillars") {
    // Interior pillars at every 3rd position — 2-cell-wide corridors.
    for (let y = 2; y < rows - 1; y += 3) {
      for (let x = 2; x < cols - 1; x += 3) {
        walls.add(cellKey(x, y));
      }
    }
  }
  // "open" = only the outer border walls, interior completely clear.
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
