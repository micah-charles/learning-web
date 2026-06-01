/**
 * GameBoard.jsx — grid renderer (React + CSS, no Canvas).
 *
 * Renders wall cells, collectible tokens, and entity segments (fox / snake)
 * positioned by CSS transform. Movement looks smooth because each tile has a
 * short transform transition (disabled under reduced-motion).
 *
 * Props
 *   map        { cols, rows, walls:Set }
 *   cellPx     pixel size of one grid cell
 *   tokens     [{ id, x, y, text, state }]   state: "neutral"|"correct"|"wrong"
 *   segments   [{ id, x, y, head }]          fox head + snake body
 *   playerEmoji string  glyph for the head (🦊 / 🐍)
 *   reducedMotion bool
 */
import { tokenLayout } from "../utils/tokenLayout.js";

function tileStyle(x, y, cellPx, reducedMotion) {
  return {
    width: cellPx,
    height: cellPx,
    transform: `translate(${x * cellPx}px, ${y * cellPx}px)`,
    transition: reducedMotion ? "none" : "transform 120ms linear",
  };
}

export default function GameBoard({ map, cellPx, tokens = [], segments = [], playerEmoji = "🦊", reducedMotion }) {
  const walls = [...map.walls].map((key) => {
    const [x, y] = key.split(",").map(Number);
    return { key, x, y };
  });

  // Build the border cells (perimeter ring of the grid).
  const borderCells = [];
  for (let x = 0; x < map.cols; x++) {
    borderCells.push({ x, y: 0 });
    borderCells.push({ x, y: map.rows - 1 });
  }
  for (let y = 1; y < map.rows - 1; y++) {
    borderCells.push({ x: 0, y });
    borderCells.push({ x: map.cols - 1, y });
  }

  return (
    <div
      className="arc-board"
      style={{ width: map.cols * cellPx, height: map.rows * cellPx }}
      aria-hidden="false"
    >
      {/* Border cells — visible edge of the map */}
      {borderCells.map((b) => (
        <div key={`b_${b.x}_${b.y}`} className="arc-border-cell"
          style={{ width: cellPx, height: cellPx, transform: `translate(${b.x * cellPx}px, ${b.y * cellPx}px)` }} />
      ))}

      {/* Pillar walls */}
      {walls.map((w) => (
        <div key={`w_${w.key}`} className="arc-wall"
          style={{ width: cellPx, height: cellPx, transform: `translate(${w.x * cellPx}px, ${w.y * cellPx}px)` }} />
      ))}

      {/* Collectible tokens. Wide words are rotated to read vertically
          (bottom-to-top) so they don't sprawl across the board; short words
          stay horizontal. Orientation must match utils/tokenLayout. */}
      {tokens.map((t) => {
        const { vertical } = tokenLayout(t.text, cellPx);
        return (
          <div
            key={t.id}
            className={`arc-token arc-token--${t.state || "neutral"}${vertical ? " arc-token--vertical" : ""}`}
            style={tileStyle(t.x, t.y, cellPx, reducedMotion)}
          >
            <span className="arc-token-text">{t.text}</span>
          </div>
        );
      })}

      {/* Entity segments (body first, head last so the head renders on top) */}
      {segments.map((s, i) => (
        <div
          key={s.id ?? `seg_${i}`}
          className={`arc-seg${s.head ? " arc-seg--head" : ""}`}
          style={tileStyle(s.x, s.y, cellPx, reducedMotion)}
        >
          {s.head ? <span className="arc-seg-face">{playerEmoji}</span> : null}
        </div>
      ))}
    </div>
  );
}
