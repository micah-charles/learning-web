import { useMemo } from "react";
import { useManifest } from "../context/ManifestContext.jsx";
import { useProgress } from "../context/ProgressContext.jsx";
import { listDatasets, listPassageGroups, listSentenceBuilderPacks, getDatasetSubject } from "@/data.js";
import { isWordMastered } from "@/storage.js";

function StatCard({ value, label }) {
  return (
    <div style={{ flex: "1 1 130px", background: "var(--lw-panel)", border: "1.5px solid var(--lw-line)", borderRadius: "var(--lw-radius)", padding: "16px", textAlign: "center", boxShadow: "var(--lw-shadow)" }}>
      <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--lw-blue)", fontFamily: "Georgia, serif" }}>{value}</div>
      <div style={{ fontSize: "0.8rem", color: "var(--lw-muted)", marginTop: "4px" }}>{label}</div>
    </div>
  );
}

export default function HomePage({ onNavigate }) {
  const { manifest, loading, error } = useManifest();
  const { progress } = useProgress();

  const stats = useMemo(() => {
    if (!progress) return { wordsSeen: 0, builderCorrect: 0, passagesDone: 0, lastQuizPct: null };
    const wordsSeen = Object.keys(progress.progress?.words || {}).length;
    const builderStats = progress.progress?.builderStats || {};
    const builderCorrect = Object.values(builderStats).reduce((s, b) => s + (b.totalCorrect || 0), 0);
    const passageStats = progress.progress?.passageStats || {};
    const passagesDone = Object.values(passageStats).reduce((s, p) => s + (p.passagesCompleted || 0), 0);
    const sessions = progress.progress?.sessions || [];
    const lastSession = sessions[0];
    const lastQuizPct = lastSession && lastSession.totalQuestions
      ? Math.round((lastSession.score / lastSession.totalQuestions) * 100)
      : null;
    return { wordsSeen, builderCorrect, passagesDone, lastQuizPct };
  }, [progress]);

  const featuredPacks = useMemo(() => {
    if (!manifest) return [];
    return listDatasets(manifest).slice(0, 6);
  }, [manifest]);

  if (loading) return <div className="lw-page"><p>Loading…</p></div>;
  if (error) return <div className="lw-page"><p style={{ color: "var(--lw-coral)" }}>Error: {error}</p></div>;

  return (
    <div className="lw-page">
      <div className="lw-card lw-lead-card" style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "0.78rem", color: "var(--lw-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
          React — learning-web
        </p>
        <h1 style={{ fontSize: "1.8rem", fontFamily: "Georgia, serif", marginBottom: "10px" }}>
          Learning Web
        </h1>
        <p style={{ color: "var(--lw-muted)", fontSize: "0.95rem" }}>
          Study vocabulary, take quizzes, read passages and build sentences.
          All progress saves automatically.
        </p>
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
        <StatCard value={stats.wordsSeen} label="Words seen" />
        <StatCard value={stats.builderCorrect} label="Builder solved" />
        <StatCard value={stats.passagesDone} label="Passages done" />
        <StatCard value={stats.lastQuizPct !== null ? `${stats.lastQuizPct}%` : "—"} label="Last quiz" />
      </div>

      <div className="lw-card lw-section" style={{ marginBottom: "20px" }}>
        <h2 className="lw-section-title">Quick launch</h2>
        <div className="lw-btn-group">
          <button className="lw-btn lw-btn-primary" type="button" onClick={() => onNavigate("vocab")}>Vocabulary</button>
          <button className="lw-btn lw-btn-secondary" type="button" onClick={() => onNavigate("quiz")}>Quiz</button>
          <button className="lw-btn lw-btn-secondary" type="button" onClick={() => onNavigate("reading")}>Reading</button>
          <button className="lw-btn lw-btn-secondary" type="button" onClick={() => onNavigate("builder")}>Builder</button>
          <button className="lw-btn lw-btn-ghost" type="button" onClick={() => onNavigate("review")}>Review</button>
        </div>
      </div>

      {featuredPacks.length > 0 && (
        <div className="lw-card lw-section">
          <h2 className="lw-section-title">Available packs</h2>
          <div className="lw-pack-grid">
            {featuredPacks.map(pack => (
              <div
                key={pack.id}
                className="lw-pack-card"
                role="button"
                tabIndex={0}
                onClick={() => onNavigate("quiz")}
                onKeyDown={e => e.key === "Enter" && onNavigate("quiz")}
              >
                <h3>{pack.displayName}</h3>
                <p>{getDatasetSubject(pack)}</p>
                <div className="lw-pack-badges">
                  {pack.wordCount > 0 && <span className="lw-chip blue">{pack.wordCount} words</span>}
                  {pack.sentenceCount > 0 && <span className="lw-chip amber">{pack.sentenceCount} sentences</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
