/**
 * tokenLayout.js — how a word-pill maps onto grid cells.
 *
 * A pill is a single line of text; long words are rotated 90° (vertical,
 * bottom-to-top). The pill spans some pixels, so we map it onto grid cells by
 * how much of each cell it covers ("footprint").
 *
 * TWO coverage thresholds:
 *   COLLIDE  0.50 — player eats a word only when ≥50% under the pill.
 *   RESERVE  0.18 — placement keeps any cell the pill noticeably touches clear.
 *
 * SOLVABILITY GUARANTEE (issue #4)
 * ──────────────────────────────────
 * After placing tokens, placeTokensNoOverlap verifies that there exists a path
 * from the player to the correct-answer token that avoids every wrong-answer
 * token's footprint (from the player's POV those cells are "danger zones").
 * If no such path exists, placement is retried up to MAX_PLACEMENT_TRIES times.
 * If still unsolvable, correct and wrong tokens are placed without the footprint
 * constraint so the game is never unplayable (graceful fallback).
 */
import { floorCells, cellKey, isFloor, reachableFrom } from "../engine/grid.js";
import { shuffle } from "@/utils.js";

const COLLIDE_COVERAGE  = 0.5;
const RESERVE_COVERAGE  = 0.18;
const MAX_PLACEMENT_TRIES = 12;

/** Estimated pill length in px along its text axis. */
function estTextPx(text) {
  return String(text || "").length * 8 + 20;
}

/** @returns {{ vertical: boolean, estPx: number }} */
export function tokenLayout(text, cellPx) {
  const estPx = estTextPx(text);
  const vertical = estPx > cellPx * 2.4;
  return { vertical, estPx };
}

/**
 * The cells a token's pill covers by at least `minCoverage` of the cell,
 * centred on the anchor. The anchor cell is always included (i === 0).
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
      cells.push(vertical
        ? { x: anchorX, y: anchorY + i }
        : { x: anchorX + i, y: anchorY });
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
 * Build a Set of "x,y" keys representing the combined footprint of all wrong
 * (non-correct) tokens. This is the "blocked" set for the solvability BFS.
 */
function wrongFootprint(tokens, cellPx) {
  const blocked = new Set();
  for (const t of tokens) {
    if (t._isCorrect) continue;
    for (const c of tokenCells(t.x, t.y, t.text, cellPx, COLLIDE_COVERAGE)) {
      blocked.add(cellKey(c.x, c.y));
    }
  }
  return blocked;
}

/**
 * Try to place items so:
 *   (a) no two pills overlap each other or the player ring, AND
 *   (b) there is a path from the player to the correct token that avoids all
 *       wrong-token footprints (BFS solvability check).
 *
 * Retried up to MAX_PLACEMENT_TRIES. Falls back gracefully if no solvable
 * arrangement is found in that budget.
 *
 * @param {GameMap}   map
 * @param {object[]}  items         [{ text, _isCorrect?, ...payload }]
 * @param {{x,y}[]}  reserved       player + any other cells to keep clear (ring applied)
 * @param {number}    cellPx
 * @returns {object[]}  items with { x, y } anchors added
 */
export function placeTokensNoOverlap(map, items, reserved, cellPx) {
  const interior = floorCells(map).filter(
    (c) => c.x > 0 && c.y > 0 && c.x < map.cols - 1 && c.y < map.rows - 1,
  );
  const pool = interior.length ? interior : floorCells(map);
  const playerCell = reserved[0] || { x: Math.floor(map.cols / 2), y: Math.floor(map.rows / 2) };

  for (let attempt = 0; attempt < MAX_PLACEMENT_TRIES; attempt++) {
    const occupied = new Set();

    // Reserve a ring around every reserved cell (player position etc.).
    for (const r of reserved) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) occupied.add(cellKey(r.x + dx, r.y + dy));
      }
    }

    const free = (cells) =>
      cells.every((c) => isFloor(map, c.x, c.y) && !occupied.has(cellKey(c.x, c.y)));

    // Place longest words first (hardest to fit).
    const order = [...items].sort((a, b) => String(b.text).length - String(a.text).length);
    const placed = [];
    let failed = false;

    for (const item of order) {
      let anchor = null;
      let footprint = null;
      for (const c of shuffle(pool)) {
        const fc = tokenCells(c.x, c.y, item.text, cellPx, RESERVE_COVERAGE);
        if (free(fc)) { anchor = c; footprint = fc; break; }
      }
      if (!anchor) {
        // Fallback: any free anchor (may cause visual overlap in degenerate cases).
        anchor = shuffle(pool).find((c) => !occupied.has(cellKey(c.x, c.y))) || pool[0];
        footprint = tokenCells(anchor.x, anchor.y, item.text, cellPx, RESERVE_COVERAGE);
        failed = true;
      }
      for (const c of footprint) occupied.add(cellKey(c.x, c.y));
      placed.push({ ...item, x: anchor.x, y: anchor.y });
    }

    // ── Solvability check ────────────────────────────────────────────────────
    // Find the correct token and verify the player can reach it while navigating
    // around wrong-answer footprints.  If no correct token is marked (builder
    // mode uses order, not a single correct flag), skip the check.
    const correctToken = placed.find((t) => t._isCorrect);
    if (!correctToken) return placed; // snake/builder mode — no single correct target

    const blocked = wrongFootprint(placed, cellPx);
    // Remove the correct token's own cells from blocked (it's the destination).
    for (const c of tokenCells(correctToken.x, correctToken.y, correctToken.text, cellPx, COLLIDE_COVERAGE)) {
      blocked.delete(cellKey(c.x, c.y));
    }
    const reachable = reachableFrom(map, playerCell, blocked);

    // The player needs to reach at least one of the correct token's collision cells.
    const correctCells = tokenCells(correctToken.x, correctToken.y, correctToken.text, cellPx, COLLIDE_COVERAGE);
    const canReach = correctCells.some((c) => reachable.has(cellKey(c.x, c.y)));

    if (canReach && !failed) return placed; // perfect — solvable and no forced fallbacks
    if (canReach) return placed; // solvable even with a tight board
    // Not solvable this attempt — retry with a fresh shuffle.
  }

  // ── Graceful fallback ────────────────────────────────────────────────────────
  // Could not find a solvable arrangement in the budget. Place without the
  // solvability constraint so the game always starts (may be hard but not stuck).
  const occupied = new Set();
  for (const r of reserved) occupied.add(cellKey(r.x, r.y));
  return items.map((item) => {
    const anchor = shuffle(pool).find((c) => !occupied.has(cellKey(c.x, c.y))) || pool[0];
    occupied.add(cellKey(anchor.x, anchor.y));
    return { ...item, x: anchor.x, y: anchor.y };
  });
}
