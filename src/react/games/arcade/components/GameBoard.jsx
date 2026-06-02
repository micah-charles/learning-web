/**
 * GameBoard.jsx — grid renderer (React + CSS, no Canvas).
 *
 * Props
 *   map          { cols, rows, walls:Set }  — walls include the outer border ring
 *   cellPx       pixel size of one grid cell
 *   tokens       [{ id, x, y, text, state }]
 *   segments     [{ id, x, y, head, word? }]  word = collected word for tail segments
 *   playerEmoji  string glyph for the head
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
    const isBorder = x === 0 || y === 0 || x === map.cols - 1 || y === map.rows - 1;
    return { key, x, y, isBorder };
  });

  return (
    <div
      className="arc-board"
      style={{ width: map.cols * cellPx, height: map.rows * cellPx }}
      aria-hidden="false"
    >
      {/* Walls — outer border cells + interior pillars */}
      {walls.map((w) => (
        <div
          key={`w_${w.key}`}
          className={w.isBorder ? "arc-border-cell" : "arc-wall"}
          style={{ width: cellPx, height: cellPx, transform: `translate(${w.x * cellPx}px, ${w.y * cellPx}px)` }}
        />
      ))}

      {/* Collectible tokens */}
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

      {/* Entity segments — body first so head renders on top */}
      {segments.map((s, i) => (
        <div
          key={s.id ?? `seg_${i}`}
          className={`arc-seg${s.head ? " arc-seg--head" : ""}${s.word ? " arc-seg--word" : ""}`}
          style={tileStyle(s.x, s.y, cellPx, reducedMotion)}
        >
          {s.head
            ? <span className="arc-seg-face">{playerEmoji}</span>
            : s.word
              ? <span className="arc-seg-word">{s.word}</span>
              : null}
        </div>
      ))}
    </div>
  );
}
