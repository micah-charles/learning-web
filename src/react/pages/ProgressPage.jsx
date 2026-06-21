/**
 * ProgressPage.jsx
 *
 * Full progress dashboard matching the production "Progress" tab:
 *   – Summary stat cards (7 metrics)
 *   – Recommended Practice
 *   – Recent Learning Activity (last 5 days)
 *   – Package Progress table
 *   – Most Struggled Words table (top 20)
 *   – Clear/reset buttons + export/import JSON
 */
import { useState, useEffect, useMemo } from "react";
import { useManifest } from "../context/ManifestContext.jsx";
import { useProgress } from "../context/ProgressContext.jsx";
import {
  clearAllSessions,
  clearAllWordProgress,
} from "@/storage.js";
import {
  getDashboardSummary,
  getPackageProgress,
  getRecentActivity,
  getStruggledItems,
  getRecommendedPractice,
} from "@/progress.js";
import {
  listDatasets,
  loadUnifiedPack,
  getDatasetSubject,
  getDatasetCurriculum,
} from "@/data.js";
import { formatPercent } from "@/utils.js";
import {
  formatLocalDateTime,
  getLanguageLadderSummary,
  getSpeakShadowSummary,
} from "../utils/localLearningAssets.js";

// ─── Progress catalog builder ─────────────────────────────────────────────────

function itemFromUnified(item, pack) {
  const d    = item.data || {};
  const src  = pack.sourceLanguageCode || "en-GB";
  const tgt  = pack.targetLanguageCode || "en-GB";
  const tr   = d.translations || {};
  const question = tr[src] || Object.values(tr)[0] || d.sourceWord || d.prompt || d.sentence || item.id;
  const answer   = tr[tgt] || Object.values(tr).slice(1)[0] || d.targetWord || d.definition || d.answer || "";
  return { id: item.id, packId: pack.id, packTitle: pack.displayName || pack.id, type: item.type, questionText: question, expectedAnswer: answer };
}

function itemsFromPack(pack, unifiedPack) {
  const result = [];
  for (const item of (unifiedPack.items || [])) {
    if (item.type === "passage") {
      for (const [qi, q] of ((item.data?.questions || item.data?.mcqQuestions || []).entries())) {
        const opts = q.options || [];
        const ci   = q.correctOptionIndex ?? q.correct_option_index ?? -1;
        result.push({ id: `${item.id}::${q.id || qi}`, packId: pack.id, packTitle: pack.displayName || pack.id, type: "passage", questionText: q.question || q.question_en || item.id, expectedAnswer: q.correctAnswer || q.correct_answer || (ci >= 0 ? opts[ci] : "") });
      }
      continue;
    }
    result.push(itemFromUnified(item, pack));
  }
  return result;
}

async function buildProgressCatalog(manifest) {
  const packages = [];
  const packItems = {};
  const itemsById = {};
  const datasets  = listDatasets(manifest);

  await Promise.all(datasets.map(async (pack) => {
    let items = [];
    try {
      const unified = await loadUnifiedPack(manifest, pack.id);
      items = itemsFromPack(pack, unified);
    } catch { items = []; }

    const totalItems = items.length || Number(pack.wordCount) || 0;
    packages.push({
      id: pack.id, title: pack.displayName || pack.id,
      subject: getDatasetSubject(pack), curriculum: getDatasetCurriculum(pack),
      totalItems, type: "revision",
    });
    packItems[pack.id] = items;
    items.forEach(item => { itemsById[item.id] = item; });
  }));

  packages.sort((a, b) => a.title.localeCompare(b.title));
  return { packages, packItems, itemsById };
}

// ─── Small UI atoms ───────────────────────────────────────────────────────────

function SummaryCard({ label, value }) {
  return (
    <div style={{ flex: "1 1 130px", minWidth: "110px", padding: "12px 14px", borderRadius: "10px", background: "var(--lw-panel)", border: "1.5px solid var(--lw-line)", textAlign: "center" }}>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--lw-ink)" }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "var(--lw-muted)", marginTop: "3px" }}>{label}</div>
    </div>
  );
}

function SnapshotCard({ value, label, icon }) {
  return (
    <div className="lw-progress-snapshot-card">
      <div className="lw-progress-snapshot-icon" aria-hidden="true">{icon}</div>
      <div className="lw-progress-snapshot-value">{value}</div>
      <div className="lw-progress-snapshot-label">{label}</div>
    </div>
  );
}

function ProgressBar({ value }) {
  const pct = Math.round(Math.max(0, Math.min(1, value || 0)) * 100);
  return (
    <div style={{ height: "8px", background: "var(--lw-line)", borderRadius: "4px", overflow: "hidden", minWidth: "60px" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: "var(--lw-green)", borderRadius: "4px", transition: "width 0.3s ease" }} />
    </div>
  );
}

const TONE_COLOR = {
  blue:  { bg: "rgba(21,102,168,0.08)",  border: "rgba(21,102,168,0.25)",  text: "var(--lw-blue)"  },
  green: { bg: "rgba(40,160,80,0.08)",   border: "rgba(40,160,80,0.25)",   text: "var(--lw-green)" },
  coral: { bg: "rgba(210,70,50,0.08)",   border: "rgba(210,70,50,0.25)",   text: "var(--lw-coral)" },
  amber: { bg: "rgba(200,140,0,0.08)",   border: "rgba(200,140,0,0.25)",   text: "#c88000"         },
};

function RecommendCard({ tone = "blue", title, body }) {
  const c = TONE_COLOR[tone] || TONE_COLOR.blue;
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "12px 16px", borderRadius: "10px", background: c.bg, border: `1.5px solid ${c.border}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: c.text, fontSize: "0.9rem" }}>{title}</div>
        <div style={{ fontSize: "0.8rem", color: "var(--lw-muted)", marginTop: "3px" }}>{body}</div>
      </div>
    </div>
  );
}

function ActivityDayCard({ row }) {
  const hasActivity = row.questionsAttempted > 0;
  const tone = !hasActivity ? "" : row.averageAccuracy >= 0.75 ? "green" : row.averageAccuracy >= 0.5 ? "amber" : "coral";
  const dateLabel = new Date(`${row.dateKey}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  return (
    <div style={{ flex: "1 1 160px", padding: "12px 14px", borderRadius: "10px", background: "var(--lw-panel)", border: "1.5px solid var(--lw-line)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <strong style={{ fontSize: "0.85rem" }}>{dateLabel}</strong>
        {hasActivity && <span className={`lw-chip ${tone}`}>{formatPercent(row.averageAccuracy)}</span>}
        {!hasActivity && <span style={{ fontSize: "0.75rem", color: "var(--lw-muted)" }}>No practice</span>}
      </div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", fontSize: "0.78rem", color: "var(--lw-muted)" }}>
        <span>{row.quizSessions} sessions</span>
        <span>{row.questionsAttempted} answered</span>
        <span style={{ color: "var(--lw-green)" }}>{row.correct} right</span>
        <span style={{ color: "var(--lw-coral)" }}>{row.wrong} wrong</span>
      </div>
      {row.packs?.length > 0 && (
        <div style={{ fontSize: "0.72rem", color: "var(--lw-muted)", marginTop: "5px" }}>
          {row.packs.slice(0, 3).join(", ")}
        </div>
      )}
    </div>
  );
}

function HistoryTable({ columns, rows, emptyText, renderRow }) {
  if (!rows.length) {
    return (
      <p style={{ color: "var(--lw-muted)", fontSize: "0.85rem", margin: "8px 0 0" }}>
        {emptyText}
      </p>
    );
  }
  return (
    <div className="lw-history-table-wrap">
      <table className="lw-history-table">
        <thead>
          <tr>
            {columns.map((column) => <th key={column}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(renderRow)}
        </tbody>
      </table>
    </div>
  );
}

function languageLabel(code) {
  const labels = {
    de: "German",
    es: "Spanish",
    fr: "French",
    zh: "Chinese",
    "de-DE": "German",
    "es-ES": "Spanish",
    "fr-FR": "French",
    "zh-CN": "Chinese",
    "zh-HK": "Chinese",
  };
  return labels[code] || code || "Language";
}

function statusLabel(status) {
  return String(status || "in_progress").replace(/_/g, " ");
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const { manifest } = useManifest();
  const { progress, updateProgress } = useProgress();

  const [catalog, setCatalog]     = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Build the progress catalog (loads all pack items) once manifest is ready
  useEffect(() => {
    if (!manifest) return;
    setCatalogLoading(true);
    buildProgressCatalog(manifest)
      .then(setCatalog)
      .catch(() => setCatalog({ packages: [], packItems: {}, itemsById: {} }))
      .finally(() => setCatalogLoading(false));
  }, [manifest]);

  const prog = progress?.progress || { words: {}, sessions: [], attemptEvents: [] };
  const wordCount    = Object.keys(prog.words || {}).length;
  const sessionCount = (prog.sessions || []).length;
  const masterCount  = Object.values(prog.words || {}).filter((w) => w.correct >= 3 && w.streak >= 2).length;
  const lastQuizPct  = useMemo(() => {
    const s = prog.sessions || [];
    if (!s.length) return null;
    const last = s[0];
    return last.totalQuestions
      ? Math.round((last.score / last.totalQuestions) * 100)
      : null;
  }, [prog.sessions]);

  const summary      = useMemo(() => catalog ? getDashboardSummary(progress, catalog, 5)   : null, [progress, catalog]);
  const packageRows  = useMemo(() => catalog ? getPackageProgress(progress, catalog).filter(p => p.totalItems > 0 || p.totalAttempts > 0).sort((a, b) => b.strugglingItems - a.strugglingItems || b.attemptedItems - a.attemptedItems || a.title.localeCompare(b.title)) : [], [progress, catalog]);
  const recentDays   = useMemo(() => getRecentActivity(progress, 5),                        [progress]);
  const struggled    = useMemo(() => catalog ? getStruggledItems(progress, 20, catalog)    : [], [progress, catalog]);
  const recommend    = useMemo(() => catalog ? getRecommendedPractice(progress, catalog, 6) : [], [progress, catalog]);
  const speakLabSummary = useMemo(() => getSpeakShadowSummary(progress), [progress]);
  const languageLadderSummary = useMemo(() => getLanguageLadderSummary(progress), [progress]);

  function handleClearSessions() {
    if (!window.confirm(`Clear all ${sessionCount} quiz sessions? This cannot be undone.`)) return;
    updateProgress(state => { clearAllSessions(state); });
  }

  function handleClearWords() {
    if (!window.confirm(`Reset word progress for all ${wordCount} words? This cannot be undone.`)) return;
    updateProgress(state => { clearAllWordProgress(state); });
  }

  function handleExport() {
    const json = JSON.stringify(progress, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `learning-web-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type  = "file";
    input.accept = ".json,application/json";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.progress) {
          updateProgress(state => { Object.assign(state, data); });
        }
      } catch {
        alert("Could not read progress file.");
      }
    };
    input.click();
  }

  return (
    <div className="lw-page">

      <div className="lw-progress-snapshot" aria-label="Learning performance summary">
        <SnapshotCard value={wordCount} label="vocab items" icon="📚" />
        <SnapshotCard value={masterCount} label="words mastered" icon="🌱" />
        <SnapshotCard value={sessionCount} label="quiz sessions" icon="📋" />
        <SnapshotCard
          value={lastQuizPct !== null ? `${lastQuizPct}%` : "—"}
          label={lastQuizPct !== null ? "last quiz score" : "no quiz yet"}
          icon={lastQuizPct !== null ? "✅" : "🔒"}
        />
        <SnapshotCard value={speakLabSummary.practiceCount} label="speak lab practices" icon="🎙️" />
        <SnapshotCard value={languageLadderSummary.completed} label="ladder lessons done" icon="✨" />
      </div>

      {/* ── Management card ─────────────────────────────────────────────── */}
      <div className="lw-card" style={{ marginBottom: "20px" }}>
        <h2 className="lw-section-title">Progress Management</h2>
        <p style={{ fontSize: "0.82rem", color: "var(--lw-muted)", marginBottom: "16px" }}>
          All progress is stored in this browser only — nothing is sent anywhere.
        </p>

        {/* 7-metric summary */}
        {summary && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
            <SummaryCard label="Total items"     value={summary.totalItems}                     />
            <SummaryCard label="Attempted"        value={summary.attemptedItems}                />
            <SummaryCard label="Mastered"         value={summary.masteredItems}                 />
            <SummaryCard label="Struggling"       value={summary.strugglingItems}               />
            <SummaryCard label="5-day answers"    value={summary.recentQuestions}               />
            <SummaryCard label="Avg accuracy"     value={formatPercent(summary.averageAccuracy)}/>
            <SummaryCard label="Study streak"     value={`${summary.studyStreakDays}d`}         />
          </div>
        )}

        <div className="lw-btn-group" style={{ flexWrap: "wrap" }}>
          <button className="lw-btn lw-btn-secondary" type="button" onClick={handleExport}>
            Export JSON
          </button>
          <button className="lw-btn lw-btn-secondary" type="button" onClick={handleImport}>
            Import JSON
          </button>
          <button className="lw-btn lw-btn-ghost" type="button" onClick={handleClearSessions}
            disabled={sessionCount === 0} style={{ fontSize: "0.83rem" }}>
            Clear sessions ({sessionCount})
          </button>
          <button className="lw-btn lw-btn-ghost" type="button" onClick={handleClearWords}
            disabled={wordCount === 0} style={{ fontSize: "0.83rem" }}>
            Reset words ({wordCount})
          </button>
        </div>
      </div>

      {catalogLoading && (
        <div className="lw-card" style={{ marginBottom: "16px" }}>
          <p style={{ color: "var(--lw-muted)", fontStyle: "italic", fontSize: "0.88rem" }}>Loading pack data…</p>
        </div>
      )}

      {/* ── Recommended Practice ────────────────────────────────────────── */}
      <div className="lw-card" style={{ marginBottom: "16px" }}>
        <h2 className="lw-section-title">Recommended Practice</h2>
        {recommend.length === 0 ? (
          <p style={{ color: "var(--lw-muted)", fontSize: "0.85rem" }}>
            No recommendations yet. Try a quiz and this area will suggest what to revisit next.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recommend.map((item, i) => (
              <RecommendCard key={i} tone={item.tone} title={item.title} body={item.body} />
            ))}
          </div>
        )}
      </div>

      {/* ── Recent Learning Activity ─────────────────────────────────────── */}
      <div className="lw-card" style={{ marginBottom: "16px" }}>
        <h2 className="lw-section-title">Recent Learning Activity</h2>
        {recentDays.every(d => d.questionsAttempted === 0) ? (
          <p style={{ color: "var(--lw-muted)", fontSize: "0.85rem" }}>
            No recent practice yet. Start a quiz to build your learning history.
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {recentDays.map((row, i) => <ActivityDayCard key={i} row={row} />)}
          </div>
        )}
      </div>

      {/* ── Speak Lab and Language Ladder History ───────────────────────── */}
      <div className="lw-card" style={{ marginBottom: "16px" }}>
        <h2 className="lw-section-title">Speak Lab & Language Ladder History</h2>
        <p style={{ color: "var(--lw-muted)", fontSize: "0.85rem", marginBottom: "14px" }}>
          Read-aloud practice and language lessons are tracked in this browser alongside quiz progress.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
          <SummaryCard label="Speak Lab practices" value={speakLabSummary.practiceCount} />
          <SummaryCard label="Speak Lab attempts" value={speakLabSummary.totalAttempts} />
          <SummaryCard label="Phrases passed" value={`${speakLabSummary.passedPhrases}/${speakLabSummary.totalPhrases}`} />
          <SummaryCard label="Speak Lab avg" value={speakLabSummary.averageScore !== null ? `${speakLabSummary.averageScore}%` : "—"} />
          <SummaryCard label="Ladder complete" value={languageLadderSummary.completed} />
          <SummaryCard label="Ladder review" value={languageLadderSummary.needsReview} />
          <SummaryCard label="Ladder attempts" value={languageLadderSummary.attempts} />
          <SummaryCard label="Ladder avg" value={languageLadderSummary.averageScore !== null ? `${languageLadderSummary.averageScore}%` : "—"} />
        </div>

        <div className="lw-history-grid">
          <section>
            <h3 className="lw-history-heading">Speak Lab Practice</h3>
            <HistoryTable
              columns={["Practice", "Mode", "Progress", "Attempts", "Average", "Last practised"]}
              rows={speakLabSummary.rows.slice(0, 12)}
              emptyText="No saved Speak Lab practice yet."
              renderRow={(row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.title}</strong>
                    <div className="lw-history-muted">{languageLabel(row.language)}</div>
                  </td>
                  <td><span className="lw-chip blue">{row.mode === "challenge" ? "Challenge" : "Tutor"}</span></td>
                  <td>{row.passedPhrases}/{row.phraseCount} passed</td>
                  <td>{row.attempts}</td>
                  <td>{row.averageScore !== null ? `${row.averageScore}%` : "—"}</td>
                  <td>{formatLocalDateTime(row.lastPractisedAt)}</td>
                </tr>
              )}
            />
          </section>

          <section>
            <h3 className="lw-history-heading">Language Ladder Lessons</h3>
            <HistoryTable
              columns={["Lesson", "Language", "Status", "Attempts", "Score", "Last practised"]}
              rows={languageLadderSummary.rows.slice(0, 12)}
              emptyText="No Language Ladder lesson history yet."
              renderRow={(row) => {
                const tone = row.status === "completed" ? "green" : row.status === "needs_review" ? "coral" : "blue";
                return (
                  <tr key={row.id}>
                    <td><strong>{row.lessonId}</strong></td>
                    <td>{languageLabel(row.targetLang)}</td>
                    <td><span className={`lw-chip ${tone}`}>{statusLabel(row.status)}</span></td>
                    <td>{row.attempts}</td>
                    <td>{row.lastScore !== null ? `${row.lastScore}%` : "—"}</td>
                    <td>{formatLocalDateTime(row.practisedAt)}</td>
                  </tr>
                );
              }}
            />
          </section>
        </div>
      </div>

      {/* ── Package Progress ─────────────────────────────────────────────── */}
      <div className="lw-card" style={{ marginBottom: "16px" }}>
        <h2 className="lw-section-title">Package Progress</h2>
        {packageRows.length === 0 ? (
          <p style={{ color: "var(--lw-muted)", fontSize: "0.85rem" }}>No package data yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  {["Package", "Total", "Attempted", "State", "Accuracy", "Last practised", "Progress"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", borderBottom: "1.5px solid var(--lw-line)", color: "var(--lw-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {packageRows.map((pack, i) => (
                  <tr key={pack.id || i} style={{ borderBottom: "1px solid var(--lw-line)" }}>
                    <td style={{ padding: "8px 10px" }}>
                      <div style={{ fontWeight: 600 }}>{pack.title}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--lw-muted)" }}>{pack.subject} · {pack.curriculum}</div>
                    </td>
                    <td style={{ padding: "8px 10px" }}>{pack.totalItems}</td>
                    <td style={{ padding: "8px 10px" }}>{pack.attemptedItems}</td>
                    <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                      {pack.masteredItems > 0   && <span className="lw-chip green" style={{ marginRight: 3 }}>✓ {pack.masteredItems}</span>}
                      {pack.strugglingItems > 0 && <span className="lw-chip coral" style={{ marginRight: 3 }}>! {pack.strugglingItems}</span>}
                    </td>
                    <td style={{ padding: "8px 10px" }}>{pack.totalAttempts ? formatPercent(pack.averageAccuracy) : "—"}</td>
                    <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{pack.lastPractisedLabel}</td>
                    <td style={{ padding: "8px 10px", minWidth: "100px" }}>
                      <ProgressBar value={pack.progressPercentage} />
                      <div style={{ fontSize: "0.72rem", color: "var(--lw-muted)", marginTop: "3px" }}>{formatPercent(pack.progressPercentage)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Most Struggled Words ─────────────────────────────────────────── */}
      <div className="lw-card">
        <h2 className="lw-section-title">Most Struggled Words (top 20)</h2>
        {struggled.length === 0 ? (
          <p style={{ color: "var(--lw-muted)", fontSize: "0.85rem" }}>
            No struggled items yet. Once you answer a few questions, the trickiest ones appear here.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  {["Word / Question", "Answer", "Pack", "✓", "✗", "Accuracy", "Streak", "State"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", borderBottom: "1.5px solid var(--lw-line)", color: "var(--lw-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {struggled.map((item, i) => {
                  const toneMap = { Mastered: "green", Struggling: "coral", Reviewing: "amber", Learning: "blue" };
                  const tone = toneMap[item.state] || "blue";
                  return (
                    <tr key={item.id || i} style={{ borderBottom: "1px solid var(--lw-line)" }}>
                      <td style={{ padding: "8px 10px", fontWeight: 600 }}>{item.questionText || item.id}</td>
                      <td style={{ padding: "8px 10px", color: "var(--lw-muted)" }}>{item.expectedAnswer || "—"}</td>
                      <td style={{ padding: "8px 10px", color: "var(--lw-muted)", fontSize: "0.75rem" }}>{item.packTitle}</td>
                      <td style={{ padding: "8px 10px", color: "var(--lw-green)" }}>{item.correct}</td>
                      <td style={{ padding: "8px 10px", color: "var(--lw-coral)" }}>{item.wrong}</td>
                      <td style={{ padding: "8px 10px" }}>{formatPercent(item.accuracy)}</td>
                      <td style={{ padding: "8px 10px" }}>{item.streak}</td>
                      <td style={{ padding: "8px 10px" }}><span className={`lw-chip ${tone}`}>{item.state}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
