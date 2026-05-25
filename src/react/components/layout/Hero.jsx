/**
 * Hero.jsx
 *
 * Full-width hero banner matching FoxChild@Learn production branding:
 *   – brand/hero-bg.jpg background with teal gradient overlay
 *   – brand/logo.png character artwork on the left
 *   – "FoxChild@Learn" title with @Learn in fox-orange
 *   – pack count badges + optional 4 stat cards
 */
import { useMemo } from "react";
import { useManifest } from "../../context/ManifestContext.jsx";
import { useProgress } from "../../context/ProgressContext.jsx";
import {
  listDatasets,
  listPassageGroups,
  listSentenceBuilderPacks,
} from "@/data.js";
import heroBg  from "../../../../brand/hero-bg.jpg";
import logoImg from "../../../../brand/logo.png";

// ─── Count badge ─────────────────────────────────────────────────────────────

function CountBadge({ icon, n, label }) {
  return (
    <span className="lw-hero-count-badge">
      <span aria-hidden="true">{icon}</span>
      <strong>{n}</strong>
      {" "}{label}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ value, label, icon }) {
  return (
    <div className="lw-stat-card">
      <div className="lw-stat-card-icon" aria-hidden="true">{icon}</div>
      <div className="lw-stat-card-value">{value}</div>
      <div className="lw-stat-card-label">{label}</div>
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

export default function Hero({ hideStats = false }) {
  const { manifest } = useManifest();
  const { progress } = useProgress();

  const packCount    = useMemo(() => (manifest ? listDatasets(manifest).length : 0),            [manifest]);
  const groupCount   = useMemo(() => (manifest ? listPassageGroups(manifest).length : 0),       [manifest]);
  const builderCount = useMemo(() => (manifest ? listSentenceBuilderPacks(manifest).length : 0),[manifest]);

  const wordsSeen = useMemo(
    () => Object.keys(progress?.progress?.words ?? {}).length,
    [progress],
  );
  const masterCount = useMemo(
    () =>
      Object.values(progress?.progress?.words ?? {}).filter(
        (w) => w.correct >= 3 && w.streak >= 2,
      ).length,
    [progress],
  );
  const sessionCount = useMemo(
    () => (progress?.progress?.sessions ?? []).length,
    [progress],
  );
  const lastQuizPct = useMemo(() => {
    const s = progress?.progress?.sessions;
    if (!s?.length) return null;
    const last = s[0];
    return last.totalQuestions
      ? Math.round((last.score / last.totalQuestions) * 100)
      : null;
  }, [progress]);

  return (
    <div
      className="lw-app-header"
      style={{
        background: [
          "radial-gradient(circle at 20% 55%, rgba(255,255,255,0.10), transparent 40%)",
          "radial-gradient(circle at 85% 20%, rgba(237,184,50,0.18), transparent 30%)",
          "linear-gradient(135deg, rgba(43,126,133,0.85) 0%, rgba(61,158,165,0.80) 45%, rgba(79,179,186,0.74) 100%)",
          `url(${heroBg}) center / cover no-repeat`,
        ].join(", "),
      }}
    >
      {/* ── Main layout: logo left | copy + stats right ───────────────────── */}
      <div className="lw-header-inner" style={{ alignItems: "flex-end" }}>

        {/* Logo panel */}
        <div className="lw-header-mascot" aria-hidden="true">
          <img
            src={logoImg}
            alt=""
            className="lw-mascot-img"
          />
        </div>

        {/* Right side */}
        <div className="lw-header-right">
          {/* Hero copy */}
          <div className="lw-hero-copy">
            <p className="lw-hero-eyebrow">POWERED BY FOXCHILD IDEA</p>
            <h1 className="lw-hero-title">
              <span style={{ color: "#fff" }}>FoxChild</span>
              <span style={{ color: "var(--fox-orange, #e8841a)" }}>@Learn</span>
            </h1>
            <p className="lw-hero-sub">
              Your cosy space for learning, practising, and growing —
              powered by curiosity and AI.
            </p>
            {manifest && (
              <div className="lw-hero-counts">
                <CountBadge icon="📦" n={packCount}    label="packs"          />
                <CountBadge icon="📖" n={groupCount}   label="reading groups" />
                <CountBadge icon="🧩" n={builderCount} label="builder sets"   />
              </div>
            )}
          </div>

          {/* Stat cards – hidden when hideStats is true (e.g. Language tab) */}
          {!hideStats && (
            <div className="lw-stats-row">
              <StatCard value={wordsSeen}    label="vocab items"      icon="📚" />
              <StatCard value={masterCount}  label="words mastered"   icon="🌱" />
              <StatCard value={sessionCount} label="quiz sessions"    icon="📋" />
              <StatCard
                value={lastQuizPct !== null ? `${lastQuizPct}%` : "—"}
                label={lastQuizPct !== null ? "last quiz score" : "no quiz yet"}
                icon={lastQuizPct !== null ? "✅" : "🔒"}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
