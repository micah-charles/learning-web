/**
 * HomePage.jsx
 *
 * Home tab content. The hero banner and progress stat cards are rendered
 * once at App level (Hero.jsx), so this page focuses on quick-start actions
 * and the study-pack grid.
 */
import { useMemo } from "react";
import { useManifest } from "../context/ManifestContext.jsx";
import { listDatasets, getDatasetSubject } from "@/data.js";

// ─── Decorative star used in section headings ────────────────────────────────
function SectionStar() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      aria-hidden="true"
      style={{ display: "inline-block", verticalAlign: "middle", marginLeft: "6px", marginBottom: "2px" }}
    >
      <path
        d="M10 0L11.6 8.4L20 10L11.6 11.6L10 20L8.4 11.6L0 10L8.4 8.4Z"
        fill="rgba(245, 197, 22, 0.9)"
      />
    </svg>
  );
}

const SUBJECT_ICONS = {
  language:   "🌍",
  history:    "📜",
  geography:  "🗺️",
  science:    "🔬",
  literature: "📚",
  computing:  "💻",
  religion:   "🕊️",
  other:      "🗂️",
};

function PackCard({ pack, onClick }) {
  const subject = getDatasetSubject(pack);
  const icon    = SUBJECT_ICONS[subject] ?? "📦";

  return (
    <div
      className="lw-pack-card"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={`Open ${pack.displayName}`}
    >
      <span className="lw-pack-card-icon" aria-hidden="true">{icon}</span>
      <h3>{pack.displayName}</h3>
      <p style={{ textTransform: "capitalize" }}>{subject}</p>
      <div className="lw-pack-badges">
        {pack.wordCount   > 0 && <span className="lw-chip blue">{pack.wordCount}   words</span>}
        {pack.sentenceCount > 0 && <span className="lw-chip amber">{pack.sentenceCount} sentences</span>}
      </div>
    </div>
  );
}

export default function HomePage({ onNavigate }) {
  const { manifest, loading, error } = useManifest();

  const featuredPacks = useMemo(() => {
    if (!manifest) return [];
    return listDatasets(manifest).slice(0, 6);
  }, [manifest]);

  if (loading) {
    return (
      <div className="lw-page">
        <div className="lw-empty">
          <p>Loading packs…</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="lw-page">
        <div className="lw-empty">
          <p style={{ color: "var(--lw-coral)" }}>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lw-page">

      {/* ── Quick start ────────────────────────────────────────────────── */}
      <div className="lw-card lw-home-quick-start">
        <h2 className="lw-section-title">
          Quick start <SectionStar />
        </h2>
        <p className="lw-subtitle">
          Pick up where you left off, or explore something new.
        </p>
        <div className="lw-btn-group">
          <button
            className="lw-btn lw-btn-primary"
            type="button"
            onClick={() => onNavigate("quiz")}
          >
            Start Quiz
          </button>
          <button
            className="lw-btn lw-btn-secondary"
            type="button"
            onClick={() => onNavigate("vocab")}
          >
            Vocabulary
          </button>
          <button
            className="lw-btn lw-btn-secondary"
            type="button"
            onClick={() => onNavigate("reading")}
          >
            Reading
          </button>
          <button
            className="lw-btn lw-btn-secondary"
            type="button"
            onClick={() => onNavigate("builder")}
          >
            Builder
          </button>
          <button
            className="lw-btn lw-btn-ghost"
            type="button"
            onClick={() => onNavigate("review")}
          >
            Review
          </button>
        </div>
      </div>

      {/* ── Study packs ────────────────────────────────────────────────── */}
      {featuredPacks.length > 0 && (
        <div className="lw-card lw-section">
          <h2 className="lw-section-title">
            Study packs <SectionStar />
          </h2>
          <div className="lw-pack-grid">
            {featuredPacks.map((pack) => (
              <PackCard
                key={pack.id}
                pack={pack}
                onClick={() => onNavigate("quiz")}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
