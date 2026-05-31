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

  return (
    <div
      className="arc-board"
      style={{ width: map.cols * cellPx, height: map.rows * cellPx }}
      aria-hidden="false"
    >
      {/* Walls */}
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
