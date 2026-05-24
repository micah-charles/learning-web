/**
 * Hero.jsx
 *
 * Full-width watercolor hero banner: mascot, title, pack counts, progress stats.
 * Visual language: warm teal watercolour, paper grain, scattered golden sparkles,
 * floating cloud/book doodles, organic rounded stat cards below.
 */
import { useMemo } from "react";
import { useManifest } from "../../context/ManifestContext.jsx";
import { useProgress } from "../../context/ProgressContext.jsx";
import {
  listDatasets,
  listPassageGroups,
  listSentenceBuilderPacks,
} from "@/data.js";

// ─── Decorative SVG atoms ────────────────────────────────────────────────────

function Sparkle({ size = 14, opacity = 0.85, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      aria-hidden="true"
      style={{ display: "block", ...style }}
    >
      <path
        d="M10 0L11.6 8.4L20 10L11.6 11.6L10 20L8.4 11.6L0 10L8.4 8.4Z"
        fill={`rgba(255, 218, 55, ${opacity})`}
      />
    </svg>
  );
}

function DotStar({ size = 5, opacity = 0.7, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 6 6"
      aria-hidden="true"
      style={{ display: "block", ...style }}
    >
      <circle cx="3" cy="3" r="2.5" fill={`rgba(255, 218, 55, ${opacity})`} />
    </svg>
  );
}

/** Thought-cloud shape containing a softly lit lightbulb. */
function IdeaCloudDoodle({ style = {} }) {
  return (
    <svg
      viewBox="0 0 145 115"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={style}
    >
      {/* cloud body */}
      <path
        d="M28 74Q13 74 11 61Q9 48 22 46Q18 33 31 29Q34 15 49 14Q63 12 68 25Q80 22 85 35Q97 34 97 48Q97 62 83 64Q81 74 66 74Z"
        fill="rgba(255,255,255,0.48)"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
      />
      {/* bulb glow */}
      <ellipse cx="53" cy="47" rx="11" ry="12" fill="rgba(255,218,55,0.55)" />
      {/* bulb base / filament area */}
      <rect x="47" y="58" width="12" height="5" rx="2.5" fill="rgba(255,218,55,0.38)" />
      {/* rays */}
      <line x1="53" y1="33" x2="53" y2="30" stroke="rgba(255,218,55,0.7)" strokeWidth="2" strokeLinecap="round" />
      <line x1="64" y1="37" x2="66" y2="34" stroke="rgba(255,218,55,0.7)" strokeWidth="2" strokeLinecap="round" />
      <line x1="42" y1="37" x2="40" y2="34" stroke="rgba(255,218,55,0.7)" strokeWidth="2" strokeLinecap="round" />
      {/* thought-bubble trail */}
      <circle cx="103" cy="82" r="7.5" fill="rgba(255,255,255,0.35)" />
      <circle cx="117" cy="94" r="5"   fill="rgba(255,255,255,0.27)" />
      <circle cx="126" cy="103" r="3.5" fill="rgba(255,255,255,0.20)" />
    </svg>
  );
}

/** Simple open book doodle. */
function BookDoodle({ style = {} }) {
  return (
    <svg
      viewBox="0 0 92 68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={style}
    >
      <path d="M44 15Q31 11 12 15L12 54Q30 50 44 53Z" fill="rgba(255,255,255,0.42)" />
      <path d="M48 15Q61 11 80 15L80 54Q62 50 48 53Z" fill="rgba(255,255,255,0.42)" />
      <rect x="42" y="13" width="8" height="42" rx="2" fill="rgba(255,255,255,0.28)" />
      {/* page lines – left */}
      <line x1="18" y1="26" x2="39" y2="26" stroke="rgba(80,165,160,0.32)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="33" x2="39" y2="33" stroke="rgba(80,165,160,0.32)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="40" x2="34" y2="40" stroke="rgba(80,165,160,0.32)" strokeWidth="1.5" strokeLinecap="round" />
      {/* page lines – right */}
      <line x1="53" y1="26" x2="74" y2="26" stroke="rgba(80,165,160,0.32)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="53" y1="33" x2="74" y2="33" stroke="rgba(80,165,160,0.32)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="53" y1="40" x2="69" y2="40" stroke="rgba(80,165,160,0.32)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

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
    <div className="lw-app-header">
      {/* ── Teal watercolour background (hero zone only) ────────────────── */}
      <div className="lw-header-teal-bg" aria-hidden="true" />

      {/* ── Atmospheric doodles – upper-right corner ─────────────────────── */}
      <div className="lw-hero-doodles" aria-hidden="true">
        <IdeaCloudDoodle
          style={{ position: "absolute", top: "6px", right: "18px", width: "155px", opacity: 0.92 }}
        />
        <BookDoodle
          style={{ position: "absolute", top: "125px", right: "42px", width: "82px", opacity: 0.82 }}
        />
        {/* scattered sparkles */}
        <Sparkle size={18} opacity={0.92} style={{ position: "absolute", top: "14px",  right: "195px" }} />
        <Sparkle size={11} opacity={0.72} style={{ position: "absolute", top: "5px",   right: "290px" }} />
        <Sparkle size={9}  opacity={0.62} style={{ position: "absolute", top: "78px",  right: "175px" }} />
        <DotStar size={7}  opacity={0.78} style={{ position: "absolute", top: "50px",  right: "330px" }} />
        <DotStar size={5}  opacity={0.58} style={{ position: "absolute", top: "98px",  right: "228px" }} />
        <Sparkle size={13} opacity={0.68} style={{ position: "absolute", top: "150px", right: "118px" }} />
        <DotStar size={5}  opacity={0.52} style={{ position: "absolute", top: "160px", right: "205px" }} />
        <DotStar size={4}  opacity={0.42} style={{ position: "absolute", top: "32px",  right: "240px" }} />
      </div>

      {/* ── Main layout: mascot left | copy + stats right ─────────────────── */}
      <div className="lw-header-inner">
        {/* Mascot: spans both teal and cream zone */}
        <div className="lw-header-mascot" aria-hidden="true">
          <img
            src="/mascot.png"
            alt=""
            className="lw-mascot-img"
          />
        </div>

        {/* Right side */}
        <div className="lw-header-right">
          {/* Hero copy – lives on the teal zone */}
          <div className="lw-hero-copy">
            <p className="lw-hero-eyebrow">POWERED BY FOXCHILD IDEA</p>
            <h1 className="lw-hero-title">Learning Web</h1>
            <p className="lw-hero-sub">
              Your personal study desk — vocabulary drills, reading practice,
              sentence builder and progress tracking, all in one place.
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
