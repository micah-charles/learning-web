import { useState, useMemo } from "react";
import { useManifest } from "../context/ManifestContext.jsx";
import { useProgress } from "../context/ProgressContext.jsx";
import { useBuilderSession } from "../hooks/useBuilderSession.js";
import { TileBuilder } from "../components/learning/TileBuilder.jsx";
import { LabeledSelect, PillGroup, FilterRow, EmptyState, LoadingText } from "../components/layout/Controls.jsx";
import { SubjectCardGrid } from "../components/layout/SubjectCardGrid.jsx";
import { listSentenceBuilderPacks, listSentenceBuilderPacksBySubject, getBuilderPackSubject, SUBJECTS } from "@/data.js";

const FILTER_OPTIONS = [
  { id: "all",              label: "All"               },
  { id: "key_date",         label: "Key Dates"         },
  { id: "key_term",         label: "Key Terms"         },
  { id: "example_sentence", label: "Example Sentences" },
];

export default function BuilderPage() {
  const { manifest, loading: manifestLoading } = useManifest();
  const { progress, updateProgress } = useProgress();

  const allPacks = useMemo(() => manifest ? listSentenceBuilderPacks(manifest) : [], [manifest]);

  // ── Subject counts for the SubjectCardGrid ────────────────────────────────
  const subjectCounts = useMemo(() => {
    return SUBJECTS.map((id) => ({
      id,
      count: allPacks.filter((p) => getBuilderPackSubject(p) === id).length,
    }));
  }, [allPacks]);

  // subject === "" means "not yet chosen by the user — fall back to first pack's subject".
  const [subject, setSubject] = useState("");
  const [packId, setPackId]   = useState("");
  const [filter, setFilter]   = useState("all");

  // Effective subject: user's choice, or the first available pack's subject.
  const activeSubject = subject || (allPacks[0] ? getBuilderPackSubject(allPacks[0]) : "");

  // Packs in the dropdown — filtered by active subject.
  const visiblePacks = useMemo(() => {
    if (!activeSubject) return allPacks;
    return listSentenceBuilderPacksBySubject(manifest, activeSubject);
  }, [allPacks, activeSubject, manifest]);

  // Effective pack ID: user's choice, or first visible pack.
  const activePackId = packId || visiblePacks[0]?.id || "";

  // When subject changes: reset to first pack of new subject, clear filter.
  function onSubjectChange(newSubject) {
    const first = allPacks.find((p) => getBuilderPackSubject(p) === newSubject);
    setSubject(newSubject);
    setPackId(first?.id ?? "");
    setFilter("all");
  }

  const {
    currentCard, cards, index, tiles, feedback,
    loading, stats, pickTile, returnTile, clearTiles, hintTile, checkAnswer, nextCard, jumpToCard,
  } = useBuilderSession({
    manifest,
    packId: activePackId,
    filter,
    progress,
    updateProgress,
  });

  if (manifestLoading) return <div className="lw-page"><LoadingText /></div>;

  if (!allPacks.length) {
    return (
      <div className="lw-page">
        <EmptyState
          title="No builder packs available"
          message="No sentence builder packs found in the manifest."
        />
      </div>
    );
  }

  return (
    <div className="lw-page">
      <div className="lw-card" style={{ marginBottom: "20px" }}>
        <h2 className="lw-section-title">Sentence Builder</h2>

        {/* ── Subject picker (same reusable SubjectCardGrid used in Reading) ── */}
        <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--lw-muted)", marginBottom: "2px" }}>Subject</h3>
        <SubjectCardGrid
          subjects={subjectCounts}
          activeSubject={activeSubject}
          onSelect={onSubjectChange}
        />

        {/* ── Pack + filter row ── */}
        <FilterRow style={{ marginTop: "16px", marginBottom: "16px" }}>
          <LabeledSelect label="Pack" value={activePackId} onChange={setPackId}>
            {visiblePacks.map((p) => (
              <option key={p.id} value={p.id}>{p.displayName}</option>
            ))}
          </LabeledSelect>

          <PillGroup
            label="Filter"
            items={FILTER_OPTIONS}
            value={filter}
            onSelect={setFilter}
          />
        </FilterRow>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "4px" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--lw-muted)" }}>
            Attempted: <strong>{stats.totalAttempted}</strong>
          </span>
          <span style={{ fontSize: "0.85rem", color: "var(--lw-green)" }}>
            Correct: <strong>{stats.totalCorrect}</strong>
          </span>
          <span style={{ fontSize: "0.85rem", color: "var(--lw-blue)" }}>
            Streak: <strong>{stats.streak}</strong>
          </span>
        </div>
      </div>

      {loading && <LoadingText text="Loading cards…" />}

      {!loading && !currentCard && (
        <EmptyState
          title="No cards match the filter"
          message="Try selecting a different filter or pack."
        />
      )}

      {!loading && currentCard && (
        <div className="lw-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "160px" }}>
              {currentCard.type && (
                <span className="lw-chip blue" style={{ marginBottom: "8px", display: "inline-block" }}>
                  {currentCard.type.replace(/_/g, " ")}
                </span>
              )}
              <p style={{ fontWeight: 600, fontSize: "1rem", color: "var(--lw-ink)", marginTop: "8px" }}>
                {currentCard.prompt}
              </p>
            </div>

            {cards.length > 1 && (
              <select
                value={index}
                onChange={(e) => jumpToCard(Number(e.target.value))}
                style={{
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: "1.5px solid var(--lw-line)",
                  background: "var(--lw-panel)",
                  color: "var(--lw-ink)",
                  fontFamily: "inherit",
                  fontSize: "0.85rem",
                  flex: "0 0 auto",
                  maxWidth: "200px",
                }}
                aria-label="Jump to card"
              >
                {cards.map((c, i) => (
                  <option key={c.id || i} value={i}>
                    {i + 1}. {c.prompt || `Card ${i + 1}`}
                  </option>
                ))}
              </select>
            )}
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
                <button
                  className="lw-btn lw-btn-primary"
                  type="button"
                  onClick={checkAnswer}
                  disabled={tiles.answerTiles.length === 0}
                >
                  Check
                </button>
                <button className="lw-btn lw-btn-ghost" type="button" onClick={hintTile}>Hint</button>
                <button className="lw-btn lw-btn-ghost" type="button" onClick={clearTiles}>Clear</button>
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
