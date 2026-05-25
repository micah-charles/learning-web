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
        <p className="lw-quick-tip">
          First time here? Try <strong>Language Ladder</strong> for a gentle start. Or take a <strong>Start Quiz</strong> to practise.
        </p>
        <p className="lw-quick-tip lw-quick-tip-muted">
          <span aria-hidden="true">🔊</span> Speak uses your browser or mobile text-to-speech. You may need to install or enable the language voice on your device.
        </p>
        <div className="lw-btn-group">
          <button className="lw-btn lw-btn-promote lw-btn-promote-orange" type="button" onClick={() => onNavigate("language")}>
            Language Ladder <span aria-hidden="true">✨</span>
          </button>
          <button className="lw-btn lw-btn-promote lw-btn-promote-blue" type="button" onClick={() => onNavigate("quiz")}>
            Start Quiz
          </button>
          <button className="lw-btn lw-btn-secondary" type="button" onClick={() => onNavigate("vocab")}>
            Vocabulary
          </button>
          <button className="lw-btn lw-btn-secondary" type="button" onClick={() => onNavigate("reading")}>
            Reading
          </button>
          <button className="lw-btn lw-btn-secondary" type="button" onClick={() => onNavigate("builder")}>
            Builder
          </button>
          <button className="lw-btn lw-btn-secondary" type="button" onClick={() => onNavigate("crossword")}>
            Crossword
          </button>
          <button className="lw-btn lw-btn-ghost" type="button" onClick={() => onNavigate("progress")}>
            Progress
          </button>
          <button className="lw-btn lw-btn-ghost" type="button" onClick={() => onNavigate("mypacks")}>
            My Packs
          </button>
          <button className="lw-btn lw-btn-ghost" type="button" onClick={() => onNavigate("about")}>
            About
          </button>
        </div>
      </div>

      {/* ── Community ─────────────────────────────────────────────────── */}
      <div className="lw-card lw-home-community">
        <h2 className="lw-section-title">
          Let&apos;s grow together! 💛
        </h2>
        <p className="lw-subtitle">
          Follow the FoxChildIdea journey on Facebook and share your thoughts, feedback, or ideas.
        </p>
        <a
          className="lw-btn lw-btn-community"
          href="https://www.facebook.com/profile.php?id=61589170294693"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
            <path fill="currentColor" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.887v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
          </svg>
          Visit our Facebook page
        </a>
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
