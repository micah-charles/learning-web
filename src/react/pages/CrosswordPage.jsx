/**
 * CrosswordPage.jsx
 *
 * Crossword tab — React reimplementation backed by the vanilla crossword.js engine.
 * Two screens: Setup (pick pack + word count) → Game (interactive grid + clues).
 */
import { useState, useMemo, useCallback } from "react";
import { useManifest } from "../context/ManifestContext.jsx";
import { SubjectCardGrid } from "../components/layout/SubjectCardGrid.jsx";
import { LabeledSelect, PillGroup, FilterRow, EmptyState, LoadingText } from "../components/layout/Controls.jsx";
import {
  crosswordEntriesFromWords,
  generateCrossword,
  normalizeCrosswordAnswer,
} from "@/crossword.js";
import { loadVocabItems, listDatasets, listDatasetsBySubjectAndCurriculum, getDatasetSubject, SUBJECTS, listCurricula } from "@/data.js";
import { getDatasetStageOptions, usesStageSelection, getSelectedStages } from "@/quiz-helpers.js";

const WORD_COUNT_OPTIONS = [8, 10, 12, 15, 20].map((n) => ({ id: n, label: String(n) }));

// ─── Crossword Grid ───────────────────────────────────────────────────────────

function CrosswordBoard({ game, letters, onChange, checkedState, revealed }) {
  if (!game?.grid?.length) return null;
  const cols = game.grid[0]?.length || 0;
  const numbers = new Map(
    game.placedEntries.map((e) => [`${e.row}:${e.col}`, e.number]),
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(28px, 40px))`,
        gap: "2px",
        background: "var(--lw-ink)",
        padding: "2px",
        borderRadius: "6px",
        width: "fit-content",
        maxWidth: "100%",
        overflowX: "auto",
      }}
    >
      {game.grid.map((row, rowIdx) =>
        row.map((answer, colIdx) => {
          const key   = `${rowIdx}:${colIdx}`;
          const value = letters[key] || "";
          const num   = numbers.get(key);

          if (!answer) {
            // Black cell
            return (
              <div
                key={key}
                style={{
                  background: "var(--lw-ink)",
                  minHeight: "28px",
                  minWidth: "28px",
                  borderRadius: "2px",
                }}
              />
            );
          }

          const isCorrect = normalizeCrosswordAnswer(value) === normalizeCrosswordAnswer(answer);
          const showResult = checkedState || revealed;
          let bg = "white";
          if (revealed) {
            bg = "rgba(80, 165, 160, 0.1)";
          } else if (showResult && value) {
            bg = isCorrect ? "rgba(80, 180, 120, 0.2)" : "rgba(220, 100, 60, 0.2)";
          }

          return (
            <div
              key={key}
              style={{
                position: "relative",
                background: bg,
                minHeight: "28px",
                minWidth: "28px",
                transition: "background 0.2s",
              }}
            >
              {num && (
                <span
                  style={{
                    position: "absolute",
                    top: "1px",
                    left: "2px",
                    fontSize: "0.55rem",
                    fontWeight: 700,
                    color: "var(--lw-ink)",
                    lineHeight: 1,
                    pointerEvents: "none",
                  }}
                >
                  {num}
                </span>
              )}
              <input
                type="text"
                maxLength={1}
                autoComplete="off"
                value={revealed ? answer.toUpperCase() : value.toUpperCase()}
                readOnly={revealed}
                onChange={(e) => !revealed && onChange(key, e.target.value)}
                aria-label={`Row ${rowIdx + 1}, col ${colIdx + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "28px",
                  border: "none",
                  background: "transparent",
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  fontFamily: "var(--lw-font-mono, monospace)",
                  color: revealed ? "var(--lw-teal)" : "var(--lw-ink)",
                  cursor: revealed ? "default" : "text",
                  padding: "4px 2px 2px",
                  boxSizing: "border-box",
                  textTransform: "uppercase",
                  outline: "none",
                }}
              />
            </div>
          );
        }),
      )}
    </div>
  );
}

// ─── Crossword Clues ──────────────────────────────────────────────────────────

function ClueSection({ title, entries, revealed }) {
  if (!entries.length) return null;
  return (
    <section style={{ marginBottom: "18px" }}>
      <h3
        style={{
          fontSize: "0.82rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--lw-muted)",
          marginBottom: "8px",
        }}
      >
        {title}
      </h3>
      <ol style={{ paddingLeft: "22px", margin: 0 }}>
        {entries.map((entry) => (
          <li key={entry.number} value={entry.number} style={{ marginBottom: "6px", fontSize: "0.88rem", color: "var(--lw-ink)" }}>
            {entry.clue}
            <span style={{ color: "var(--lw-muted)", marginLeft: "6px", fontSize: "0.78rem" }}>
              ({entry.answer.length} letters
              {revealed && <> — <strong style={{ color: "var(--lw-teal)" }}>{entry.displayAnswer}</strong></>}
              )
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ─── Setup Screen ─────────────────────────────────────────────────────────────

function CrosswordSetup({ manifest, onStart }) {
  const datasets = useMemo(() => (manifest ? listDatasets(manifest) : []), [manifest]);
  const curriculumOptions = useMemo(
    () => [{ id: "all", label: "All" }, ...(manifest ? listCurricula(manifest) : [])],
    [manifest],
  );

  const [subject, setSubject]       = useState("language");
  const [curriculum, setCurriculum] = useState("all");

  const subjectCounts = useMemo(
    () =>
      SUBJECTS.map((id) => ({
        id,
        count: manifest ? listDatasetsBySubjectAndCurriculum(manifest, id, curriculum).length : 0,
      })),
    [manifest, curriculum],
  );
  const [datasetId, setDatasetId]   = useState(() => datasets[0]?.id || "core");
  const [wordCount, setWordCount]   = useState(10);
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState(null);

  const filteredDatasets = useMemo(
    () => manifest ? listDatasetsBySubjectAndCurriculum(manifest, subject, curriculum) : [],
    [manifest, subject, curriculum],
  );

  function handleSubjectSelect(subj) {
    setSubject(subj);
    setCurriculum("all");
    const first = listDatasetsBySubjectAndCurriculum(manifest, subj, "all")[0];
    if (first) setDatasetId(first.id);
  }

  async function handleStart() {
    setGenerating(true);
    setError(null);
    try {
      const words = await loadVocabItems(manifest, datasetId);
      const entries = crosswordEntriesFromWords(words);
      if (entries.length < 5) {
        setError("Not enough crossword-compatible words in this pack (need at least 5).");
        setGenerating(false);
        return;
      }
      const game = generateCrossword(entries, { wordCount });
      if (!game || game.placedEntries.length < 3) {
        setError("Could not generate a crossword from this pack. Try a different pack or word count.");
        setGenerating(false);
        return;
      }
      const dataset = datasets.find((d) => d.id === datasetId);
      onStart({ game, dataset, poolSize: entries.length });
    } catch (err) {
      setError(err.message || "Generation failed.");
      setGenerating(false);
    }
  }

  return (
    <div className="lw-page">
      <div className="lw-card">
        <h2 className="lw-section-title">Crossword Setup</h2>
        <p style={{ color: "var(--lw-muted)", fontSize: "0.88rem", marginBottom: "14px" }}>
          Pick a vocabulary pack and build a fresh crossword in the browser.
        </p>

        <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--lw-muted)", marginBottom: "6px" }}>
          Subject
        </h3>
        <SubjectCardGrid subjects={subjectCounts} activeSubject={subject} onSelect={handleSubjectSelect} />

        <PillGroup
          label="Curriculum"
          items={curriculumOptions}
          value={curriculum}
          onSelect={(c) => {
            setCurriculum(c);
            const first = listDatasetsBySubjectAndCurriculum(manifest, subject, c)[0];
            if (first) setDatasetId(first.id);
          }}
          style={{ marginTop: "14px" }}
        />

        <FilterRow style={{ marginTop: "18px" }}>
          <LabeledSelect label="Pack" value={datasetId} onChange={setDatasetId}>
            {filteredDatasets.map((d) => (
              <option key={d.id} value={d.id}>{d.displayName}</option>
            ))}
          </LabeledSelect>
          <PillGroup
            label="Words"
            items={WORD_COUNT_OPTIONS}
            value={wordCount}
            onSelect={(n) => setWordCount(Number(n))}
          />
        </FilterRow>

        {error && (
          <p style={{ color: "var(--lw-coral)", marginTop: "12px", fontSize: "0.88rem" }}>{error}</p>
        )}

        <div style={{ marginTop: "20px" }}>
          <button
            className="lw-btn lw-btn-primary"
            type="button"
            onClick={handleStart}
            disabled={generating || !datasetId}
          >
            {generating ? "Generating…" : "Start game"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Game Screen ──────────────────────────────────────────────────────────────

function CrosswordGame({ gameState, onNew, onOptions }) {
  const { game, dataset, poolSize } = gameState;
  const [letters, setLetters]       = useState({});
  const [checked, setChecked]       = useState(false);
  const [revealed, setRevealed]     = useState(false);
  const [message, setMessage]       = useState(null);

  const across = useMemo(
    () => game.placedEntries.filter((e) => e.direction === "across").sort((a, b) => a.number - b.number),
    [game],
  );
  const down = useMemo(
    () => game.placedEntries.filter((e) => e.direction === "down").sort((a, b) => a.number - b.number),
    [game],
  );

  const handleCellChange = useCallback((key, raw) => {
    const val = raw.replace(/[^a-zA-Z]/g, "").slice(-1);
    setLetters((prev) => ({ ...prev, [key]: val }));
    setChecked(false);
    setMessage(null);
  }, []);

  function handleCheck() {
    setChecked(true);
    const total   = game.placedEntries.reduce((sum, e) => sum + e.answer.length, 0);
    let correct = 0;
    for (const entry of game.placedEntries) {
      for (let i = 0; i < entry.answer.length; i++) {
        const key = entry.direction === "across"
          ? `${entry.row}:${entry.col + i}`
          : `${entry.row + i}:${entry.col}`;
        const val = letters[key] || "";
        if (normalizeCrosswordAnswer(val) === normalizeCrosswordAnswer(entry.answer[i])) {
          correct++;
        }
      }
    }
    const pct = Math.round((correct / total) * 100);
    if (correct === total) {
      setMessage({ text: "Excellent! All answers correct! 🎉", tone: "good" });
    } else {
      setMessage({ text: `${correct} / ${total} letters correct (${pct}%). Keep going!`, tone: "bad" });
    }
  }

  function handleReveal() {
    setRevealed(true);
    setMessage({ text: "Answers revealed.", tone: "neutral" });
  }

  const msgColor = message?.tone === "good" ? "var(--lw-green)" : message?.tone === "bad" ? "var(--lw-coral)" : "var(--lw-muted)";

  return (
    <div className="lw-page">
      <div className="lw-card" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
          <div>
            <h2 className="lw-section-title">Crossword</h2>
            {dataset && <p style={{ color: "var(--lw-muted)", fontSize: "0.85rem" }}>{dataset.displayName}</p>}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "6px" }}>
              <span className="lw-chip blue">{game.placedEntries.length} words placed</span>
              <span className="lw-chip amber">{poolSize} word pool</span>
              <span className="lw-chip">{game.grid.length}×{game.grid[0]?.length ?? 0} grid</span>
            </div>
          </div>
          <div className="lw-btn-group">
            <button className="lw-btn lw-btn-primary" type="button" onClick={handleCheck}>
              Check
            </button>
            <button className="lw-btn lw-btn-secondary" type="button" onClick={handleReveal}>
              Reveal
            </button>
            <button className="lw-btn lw-btn-ghost" type="button" onClick={onNew}>
              New game
            </button>
            <button className="lw-btn lw-btn-ghost" type="button" onClick={onOptions}>
              Options
            </button>
          </div>
        </div>
        {message && (
          <p style={{ marginTop: "10px", fontWeight: 600, color: msgColor }}>{message.text}</p>
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start" }}>
        {/* Board */}
        <div className="lw-card" style={{ overflowX: "auto", flex: "0 0 auto" }}>
          <CrosswordBoard
            game={game}
            letters={letters}
            onChange={handleCellChange}
            checkedState={checked}
            revealed={revealed}
          />
        </div>

        {/* Clues */}
        <div className="lw-card" style={{ flex: "1 1 200px", minWidth: "180px" }}>
          <ClueSection title="Across" entries={across} revealed={revealed} />
          <ClueSection title="Down"   entries={down}   revealed={revealed} />
        </div>
      </div>
    </div>
  );
}

// ─── CrosswordPage ────────────────────────────────────────────────────────────

export default function CrosswordPage() {
  const { manifest, loading } = useManifest();
  const [gameState, setGameState] = useState(null);

  if (loading) return <div className="lw-page"><LoadingText /></div>;
  if (!manifest) return (
    <div className="lw-page">
      <EmptyState title="Manifest not loaded" message="Could not load the pack manifest." />
    </div>
  );

  if (gameState) {
    return (
      <CrosswordGame
        gameState={gameState}
        onNew={() => {
          // Regenerate with same settings
          setGameState(null);
        }}
        onOptions={() => setGameState(null)}
      />
    );
  }

  return (
    <CrosswordSetup
      manifest={manifest}
      onStart={(gs) => setGameState(gs)}
    />
  );
}
