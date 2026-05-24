/**
 * ProgressPage.jsx
 *
 * Progress overview tab — shows session history, word mastery summary,
 * and recent activity. Data comes from the ProgressContext (localStorage).
 */
import { useMemo } from "react";
import { useProgress } from "../context/ProgressContext.jsx";
import { clearAllSessions, clearAllWordProgress } from "@/storage.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function formatPercent(n) {
  return `${Math.round(n * 100)}%`;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ icon, value, label, tone = "blue" }) {
  const bg = {
    blue:  "rgba(80, 140, 210, 0.08)",
    green: "rgba(80, 180, 120, 0.08)",
    amber: "rgba(220, 160, 40, 0.08)",
    coral: "rgba(220, 100, 60, 0.08)",
  }[tone] || "rgba(80, 140, 210, 0.08)";

  const color = {
    blue:  "var(--lw-blue)",
    green: "var(--lw-green)",
    amber: "var(--lw-amber, #d49b2f)",
    coral: "var(--lw-coral)",
  }[tone] || "var(--lw-blue)";

  return (
    <div
      style={{
        flex: "1 1 140px",
        minWidth: "120px",
        padding: "16px 18px",
        borderRadius: "12px",
        background: bg,
        border: `1.5px solid ${color}33`,
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <span style={{ fontSize: "1.5rem" }} aria-hidden="true">{icon}</span>
      <span style={{ fontSize: "1.6rem", fontWeight: 800, color, lineHeight: 1.1 }}>{value}</span>
      <span style={{ fontSize: "0.8rem", color: "var(--lw-muted)", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// ─── SessionRow ───────────────────────────────────────────────────────────────

function SessionRow({ session }) {
  const pct = session.totalQuestions > 0
    ? Math.round((session.score / session.totalQuestions) * 100)
    : null;
  const tone = pct === null ? "blue" : pct >= 85 ? "green" : pct >= 50 ? "amber" : "coral";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 14px",
        borderRadius: "8px",
        border: "1.5px solid var(--lw-line)",
        background: "var(--lw-panel)",
        marginBottom: "6px",
        gap: "8px",
        flexWrap: "wrap",
      }}
    >
      <div>
        <div style={{ fontWeight: 600, color: "var(--lw-ink)", fontSize: "0.92rem" }}>
          {session.datasetName || session.datasetId || "Quiz session"}
        </div>
        <div style={{ fontSize: "0.78rem", color: "var(--lw-muted)", marginTop: "2px" }}>
          {formatDate(session.completedAt || session.startedAt)}
          {session.mode && <> · {session.mode}</>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "0.82rem", color: "var(--lw-muted)" }}>
          {session.score ?? "—"} / {session.totalQuestions ?? "—"}
        </span>
        {pct !== null && (
          <span className={`lw-chip ${tone}`} style={{ fontWeight: 700 }}>
            {pct}%
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const { progress, updateProgress } = useProgress();
  const prog = progress?.progress || { words: {}, sessions: [] };
  const words = prog.words || {};
  const sessions = [...(prog.sessions || [])].sort(
    (a, b) => (b.completedAt || b.startedAt || "").localeCompare(a.completedAt || a.startedAt || ""),
  );

  const wordRows = useMemo(() => Object.values(words), [words]);

  const totalSeen = wordRows.filter((w) => (w.correct || 0) + (w.wrong || 0) > 0).length;
  const totalMastered = wordRows.filter(
    (w) => (w.correct || 0) >= 3 && (w.streak || 0) >= 2,
  ).length;
  const totalStruggling = wordRows.filter(
    (w) => (w.wrong || 0) > (w.correct || 0) && (w.correct || 0) + (w.wrong || 0) >= 3,
  ).length;
  const totalCorrect = wordRows.reduce((s, w) => s + (w.correct || 0), 0);
  const totalWrong   = wordRows.reduce((s, w) => s + (w.wrong   || 0), 0);
  const overallAcc   = totalCorrect + totalWrong > 0
    ? formatPercent(totalCorrect / (totalCorrect + totalWrong))
    : "—";

  function handleClearSessions() {
    if (!window.confirm(`Clear all ${sessions.length} quiz sessions? This cannot be undone.`)) return;
    updateProgress((state) => { clearAllSessions(state); });
  }

  function handleClearWords() {
    if (!window.confirm(`Reset word progress for all ${totalSeen} words? This cannot be undone.`)) return;
    updateProgress((state) => { clearAllWordProgress(state); });
  }

  return (
    <div className="lw-page">
      {/* ── Summary cards ──────────────────────────────────────────────── */}
      <div className="lw-card" style={{ marginBottom: "20px" }}>
        <h2 className="lw-section-title">Your Progress</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <StatCard icon="📚" value={totalSeen}       label="words seen"        tone="blue"  />
          <StatCard icon="🌱" value={totalMastered}   label="words mastered"    tone="green" />
          <StatCard icon="🔥" value={totalStruggling} label="needs practice"    tone="coral" />
          <StatCard icon="📋" value={sessions.length} label="quiz sessions"     tone="blue"  />
          <StatCard icon="🎯" value={overallAcc}      label="overall accuracy"  tone={overallAcc !== "—" && parseInt(overallAcc) >= 70 ? "green" : "amber"} />
        </div>

        <div className="lw-btn-group">
          <button
            className="lw-btn lw-btn-ghost"
            type="button"
            onClick={handleClearSessions}
            disabled={sessions.length === 0}
            style={{ fontSize: "0.85rem" }}
          >
            Clear sessions ({sessions.length})
          </button>
          <button
            className="lw-btn lw-btn-ghost"
            type="button"
            onClick={handleClearWords}
            disabled={totalSeen === 0}
            style={{ fontSize: "0.85rem" }}
          >
            Reset word progress ({totalSeen} words)
          </button>
        </div>
      </div>

      {/* ── Recent sessions ────────────────────────────────────────────── */}
      <div className="lw-card">
        <h2 className="lw-section-title">Recent Sessions</h2>
        {sessions.length === 0 ? (
          <p style={{ color: "var(--lw-muted)", fontSize: "0.88rem" }}>
            No quiz sessions yet. Complete a quiz to see your history here.
          </p>
        ) : (
          sessions.slice(0, 20).map((s, i) => (
            <SessionRow key={s.id || i} session={s} />
          ))
        )}
        {sessions.length > 20 && (
          <p style={{ color: "var(--lw-muted)", fontSize: "0.8rem", marginTop: "8px" }}>
            Showing 20 of {sessions.length} sessions.
          </p>
        )}
      </div>
    </div>
  );
}
