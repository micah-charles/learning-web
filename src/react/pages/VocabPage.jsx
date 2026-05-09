import { useState, useMemo } from "react";
import { useManifest } from "../context/ManifestContext.jsx";
import { useProgress } from "../context/ProgressContext.jsx";
import { useVocabBrowser } from "../hooks/useVocabBrowser.js";
import { useSpeech } from "../hooks/useSpeech.js";
import { listDatasets } from "@/data.js";
import { isWordMastered, getWordProgress } from "@/storage.js";
import { getDatasetStageOptions, usesStageSelection, getSelectedStages } from "@/quiz-helpers.js";

const YEAR_OPTIONS = ["ALL", "Y7", "Y8", "Y9", "Y10", "Y11"];

function MasteryBadge({ correct, streak }) {
  if (correct >= 3 && streak >= 2) {
    return <span className="lw-chip green">Mastered</span>;
  }
  if (correct >= 1) {
    return <span className="lw-chip amber">Practising</span>;
  }
  return <span className="lw-chip coral">New</span>;
}

function VocabCard({ word, progress, onSpeak, speechLang }) {
  const wp = getWordProgress(progress, word.id);
  return (
    <div className="lw-pack-card" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
        <div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: "Georgia, serif", color: "var(--lw-ink)" }}>{word.de}</div>
          <div style={{ fontSize: "0.88rem", color: "var(--lw-muted)", marginTop: "2px" }}>{word.en}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
          <MasteryBadge correct={wp.correct} streak={wp.streak} />
          <button
            className="lw-btn lw-btn-ghost"
            style={{ fontSize: "0.8rem", padding: "4px 10px" }}
            type="button"
            onClick={() => onSpeak(word.de, speechLang)}
            title="Speak"
          >
            🔊
          </button>
        </div>
      </div>
      {word.pos && <div style={{ fontSize: "0.75rem", color: "var(--lw-muted)" }}>{word.pos}</div>}
      {word.exampleDe && (
        <div style={{ fontSize: "0.82rem", color: "var(--lw-muted)", fontStyle: "italic", borderTop: "1px solid var(--lw-line)", paddingTop: "6px" }}>
          {word.exampleDe}
          {word.exampleEn && <span style={{ display: "block" }}>{word.exampleEn}</span>}
        </div>
      )}
    </div>
  );
}

export default function VocabPage() {
  const { manifest, loading: manifestLoading } = useManifest();
  const { progress } = useProgress();
  const { speak } = useSpeech();

  const datasets = useMemo(() => manifest ? listDatasets(manifest) : [], [manifest]);

  const [prefs, setPrefs] = useState({
    datasetId: "core",
    year: "ALL",
    stages: [],
    partOfSpeech: "",
    category: "",
    search: "",
  });

  const { dataset, filtered, posOptions, categoryOptions, loading } = useVocabBrowser({
    manifest,
    datasetId: prefs.datasetId,
    prefs,
  });

  const stageOptions = dataset ? getDatasetStageOptions(dataset) : [];
  const isStage = dataset ? usesStageSelection(dataset) : false;
  const selectedStages = dataset ? getSelectedStages(prefs, dataset) : [];

  const speechLang = dataset?.speechLanguage || dataset?.sourceLanguageCode || "de-DE";

  function setPref(key, value) {
    setPrefs(prev => ({ ...prev, [key]: value }));
  }

  function toggleStage(stage) {
    setPrefs(prev => {
      const current = Array.isArray(prev.stages) ? prev.stages.map(String) : [];
      const exists = current.includes(String(stage));
      return {
        ...prev,
        stages: exists ? current.filter(s => s !== String(stage)) : [...current, String(stage)],
      };
    });
  }

  const displayWords = filtered.slice(0, 120);

  if (manifestLoading) return <div className="lw-page"><p>Loading…</p></div>;

  return (
    <div className="lw-page">
      <div className="lw-card" style={{ marginBottom: "20px" }}>
        <h2 className="lw-section-title">Vocabulary</h2>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--lw-muted)", fontWeight: 600 }}>Dataset</label>
            <select
              value={prefs.datasetId}
              onChange={e => setPref("datasetId", e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--lw-line)", background: "var(--lw-panel)", color: "var(--lw-ink)", fontFamily: "inherit" }}
            >
              {datasets.map(d => (
                <option key={d.id} value={d.id}>{d.displayName}</option>
              ))}
            </select>
          </div>

          {isStage ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--lw-muted)", fontWeight: 600 }}>Stage</label>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {stageOptions.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`lw-nav-pill ${selectedStages.includes(s) ? "active" : ""}`}
                    style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                    onClick={() => toggleStage(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--lw-muted)", fontWeight: 600 }}>Year</label>
              <select
                value={prefs.year}
                onChange={e => setPref("year", e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--lw-line)", background: "var(--lw-panel)", color: "var(--lw-ink)", fontFamily: "inherit" }}
              >
                {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          {posOptions.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--lw-muted)", fontWeight: 600 }}>Part of speech</label>
              <select
                value={prefs.partOfSpeech}
                onChange={e => setPref("partOfSpeech", e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--lw-line)", background: "var(--lw-panel)", color: "var(--lw-ink)", fontFamily: "inherit" }}
              >
                <option value="">All</option>
                {posOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}

          {categoryOptions.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--lw-muted)", fontWeight: 600 }}>Category</label>
              <select
                value={prefs.category}
                onChange={e => setPref("category", e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--lw-line)", background: "var(--lw-panel)", color: "var(--lw-ink)", fontFamily: "inherit" }}
              >
                <option value="">All</option>
                {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
        </div>

        <input
          type="search"
          placeholder="Search words..."
          value={prefs.search}
          onChange={e => setPref("search", e.target.value)}
          style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid var(--lw-line)", background: "var(--lw-panel)", color: "var(--lw-ink)", fontFamily: "inherit", fontSize: "0.95rem" }}
        />
      </div>

      {loading && <p style={{ color: "var(--lw-muted)" }}>Loading words…</p>}

      {!loading && (
        <>
          <p style={{ color: "var(--lw-muted)", fontSize: "0.85rem", marginBottom: "14px" }}>
            Showing {displayWords.length} of {filtered.length} words
          </p>
          <div className="lw-pack-grid">
            {displayWords.map(word => (
              <VocabCard
                key={word.id}
                word={word}
                progress={progress?.progress || { words: {} }}
                onSpeak={speak}
                speechLang={speechLang}
              />
            ))}
            {displayWords.length === 0 && (
              <div className="lw-empty" style={{ gridColumn: "1/-1" }}>
                <h3>No words found</h3>
                <p>Try adjusting your filters or search term.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
