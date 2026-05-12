import { useState, useMemo } from "react";
import { useManifest } from "../context/ManifestContext.jsx";
import { useProgress } from "../context/ProgressContext.jsx";
import { useBuilderSession } from "../hooks/useBuilderSession.js";
import { TileBuilder } from "../components/learning/TileBuilder.jsx";
import { listSentenceBuilderPacks } from "@/data.js";

const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "key_date", label: "Key Dates" },
  { id: "key_term", label: "Key Terms" },
  { id: "example_sentence", label: "Example Sentences" },
];

export default function BuilderPage() {
  const { manifest, loading: manifestLoading } = useManifest();
  const { progress, updateProgress } = useProgress();

  const packs = useMemo(() => manifest ? listSentenceBuilderPacks(manifest) : [], [manifest]);

  const [packId, setPackId] = useState("");
  const [filter, setFilter] = useState("all");

  const resolvedPackId = packId || (packs[0]?.id || "");

  const { currentCard, tiles, feedback, loading, stats, pickTile, returnTile, clearTiles, hintTile, checkAnswer, nextCard } = useBuilderSession({
    manifest,
    packId: resolvedPackId,
    filter,
    progress,
    updateProgress,
  });

  if (manifestLoading) return <div className="lw-page"><p>Loading…</p></div>;

  if (!packs.length) {
    return (
      <div className="lw-page">
        <div className="lw-empty">
          <h3>No builder packs available</h3>
          <p>No sentence builder packs found in the manifest.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lw-page">
      <div className="lw-card" style={{ marginBottom: "20px" }}>
        <h2 className="lw-section-title">Sentence Builder</h2>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 200px" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--lw-muted)", fontWeight: 600 }}>Pack</label>
            <select
              value={resolvedPackId}
              onChange={e => setPackId(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--lw-line)", background: "var(--lw-panel)", color: "var(--lw-ink)", fontFamily: "inherit" }}
            >
              {packs.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--lw-muted)", fontWeight: 600 }}>Filter</label>
            <div className="lw-nav-pills">
              {FILTER_OPTIONS.map(f => (
                <button
                  key={f.id}
                  type="button"
                  className={`lw-nav-pill ${filter === f.id ? "active" : ""}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "4px" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--lw-muted)" }}>Attempted: <strong>{stats.totalAttempted}</strong></span>
          <span style={{ fontSize: "0.85rem", color: "var(--lw-green)" }}>Correct: <strong>{stats.totalCorrect}</strong></span>
          <span style={{ fontSize: "0.85rem", color: "var(--lw-blue)" }}>Streak: <strong>{stats.streak}</strong></span>
        </div>
      </div>

      {loading && <p style={{ color: "var(--lw-muted)" }}>Loading cards…</p>}

      {!loading && !currentCard && (
        <div className="lw-empty">
          <h3>No cards match the filter</h3>
          <p>Try selecting a different filter or pack.</p>
        </div>
      )}

      {!loading && currentCard && (
        <div className="lw-card">
          <div style={{ marginBottom: "12px" }}>
            {currentCard.type && (
              <span className="lw-chip blue" style={{ marginBottom: "8px", display: "inline-block" }}>
                {currentCard.type.replace(/_/g, " ")}
              </span>
            )}
            <p style={{ fontWeight: 600, fontSize: "1rem", color: "var(--lw-ink)", marginTop: "8px" }}>
              {currentCard.prompt}
            </p>
          </div>

          <TileBuilder
            answerTiles={tiles.answerTiles}
            bankTiles={tiles.bankTiles}
            onPick={pickTile}
            onReturn={returnTile}
            disabled={!!feedback}
          />

          {feedback && (
            <div className={`lw-feedback ${feedback.correct ? "correct" : "wrong"}`} style={{ marginTop: "14px" }}>
              <span className="lw-feedback-icon">{feedback.correct ? "✓" : "✗"}</span>
              <div>
                {feedback.correct ? "Correct!" : `Incorrect — answer: ${feedback.expected}`}
              </div>
            </div>
          )}

          <div className="lw-btn-group" style={{ marginTop: "16px" }}>
            {!feedback ? (
              <>
                <button className="lw-btn lw-btn-primary" type="button" onClick={checkAnswer} disabled={tiles.answerTiles.length === 0}>
                  Check
                </button>
                <button className="lw-btn lw-btn-ghost" type="button" onClick={hintTile}>
                  Hint
                </button>
                <button className="lw-btn lw-btn-ghost" type="button" onClick={clearTiles}>
                  Clear
                </button>
              </>
            ) : (
              <button className="lw-btn lw-btn-primary" type="button" onClick={nextCard}>
                Next card
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
