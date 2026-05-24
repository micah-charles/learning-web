import { useState, useMemo } from "react";
import { useManifest } from "../context/ManifestContext.jsx";
import { useProgress } from "../context/ProgressContext.jsx";
import { useVocabBrowser } from "../hooks/useVocabBrowser.js";
import { useSpeech } from "../hooks/useSpeech.js";
import { LabeledSelect, LoadingText } from "../components/layout/Controls.jsx";
import { listDatasets } from "@/data.js";
import { getWordProgress, isWordMastered, isMasteredProgress } from "@/storage.js";

function WordRow({ word, progress, onSpeak, speechLang }) {
  const wp = getWordProgress(progress, word.id);
  const mastered = isMasteredProgress(wp);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: "var(--lw-radius-sm)", border: "1.5px solid var(--lw-line)", background: "var(--lw-panel)", marginBottom: "8px" }}>
      <div>
        <span style={{ fontWeight: 600, color: "var(--lw-ink)" }}>{word.de}</span>
        <span style={{ color: "var(--lw-muted)", marginLeft: "10px", fontSize: "0.88rem" }}>{word.en}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--lw-muted)" }}>
          {wp.correct}✓ {wp.wrong}✗ streak:{wp.streak}
        </span>
        <button
          className="lw-btn lw-btn-ghost"
          type="button"
          style={{ padding: "4px 8px", fontSize: "0.8rem" }}
          onClick={() => onSpeak(word.de, speechLang)}
          title="Speak"
        >
          🔊
        </button>
      </div>
    </div>
  );
}

export default function ReviewPage({ onNavigate }) {
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

  const { dataset, scopedWords, loading } = useVocabBrowser({
    manifest,
    datasetId: prefs.datasetId,
    prefs,
  });

  const speechLang = dataset?.speechLanguage || dataset?.sourceLanguageCode || "de-DE";
  const prog = progress?.progress || { words: {} };

  const reviewedWords = useMemo(() => {
    return scopedWords.filter(w => {
      const wp = getWordProgress(prog, w.id);
      return wp.correct > 0 || wp.wrong > 0;
    });
  }, [scopedWords, prog]);

  const masteredWords = useMemo(() => {
    return scopedWords.filter(w => isWordMastered(prog, w.id));
  }, [scopedWords, prog]);

  const hardestWords = useMemo(() => {
    return reviewedWords
      .filter(w => !isWordMastered(prog, w.id))
      .sort((a, b) => {
        const wa = getWordProgress(prog, a.id);
        const wb = getWordProgress(prog, b.id);
        const ratioA = wa.wrong / Math.max(1, wa.correct + wa.wrong);
        const ratioB = wb.wrong / Math.max(1, wb.correct + wb.wrong);
        return ratioB - ratioA;
      })
      .slice(0, 20);
  }, [reviewedWords, prog]);

  if (manifestLoading) return <div className="lw-page"><LoadingText /></div>;

  return (
    <div className="lw-page">
      <div className="lw-card" style={{ marginBottom: "20px" }}>
        <h2 className="lw-section-title">Review</h2>

        <LabeledSelect
          label="Dataset"
          value={prefs.datasetId}
          onChange={(v) => setPrefs((prev) => ({ ...prev, datasetId: v }))}
          style={{ maxWidth: "300px", marginBottom: "16px" }}
          flex={false}
        >
          {datasets.map((d) => <option key={d.id} value={d.id}>{d.displayName}</option>)}
        </LabeledSelect>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span className="lw-chip blue">{reviewedWords.length} reviewed</span>
          <span className="lw-chip green">{masteredWords.length} mastered</span>
          <span className="lw-chip amber">{hardestWords.length} needs practice</span>
        </div>

        <div className="lw-btn-group">
          {hardestWords.length > 0 && (
            <button
              className="lw-btn lw-btn-primary"
              type="button"
              onClick={() => onNavigate && onNavigate("quiz", { customWords: hardestWords })}
            >
              Quiz hardest ({hardestWords.length})
            </button>
          )}
          {masteredWords.length > 0 && (
            <button
              className="lw-btn lw-btn-secondary"
              type="button"
              onClick={() => onNavigate && onNavigate("quiz", { customWords: masteredWords })}
            >
              Review mastered ({masteredWords.length})
            </button>
          )}
        </div>
      </div>

      {loading && <LoadingText text="Loading words…" />}

      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <h3 className="lw-section-title">Needs practice</h3>
            {hardestWords.length === 0 ? (
              <p style={{ color: "var(--lw-muted)", fontSize: "0.88rem" }}>No words need practice yet.</p>
            ) : (
              hardestWords.map(w => (
                <WordRow key={w.id} word={w} progress={prog} onSpeak={speak} speechLang={speechLang} />
              ))
            )}
          </div>

          <div>
            <h3 className="lw-section-title">Mastered</h3>
            {masteredWords.length === 0 ? (
              <p style={{ color: "var(--lw-muted)", fontSize: "0.88rem" }}>No mastered words yet.</p>
            ) : (
              masteredWords.map(w => (
                <WordRow key={w.id} word={w} progress={prog} onSpeak={speak} speechLang={speechLang} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
