/**
 * HomePage.jsx
 *
 * Home tab content. The hero banner and progress stat cards are rendered
 * once at App level (Hero.jsx), so this page focuses on quick-start actions
 * and the study-pack grid.
 */
import { useMemo } from "react";
import { useManifest } from "../context/ManifestContext.jsx";
import { useProgress } from "../context/ProgressContext.jsx";
import { listDatasets, getDatasetSubject } from "@/data.js";
import {
  filterPacksForPrefs,
  isEverythingMode,
  onboardingSummaryLabels,
} from "../utils/personalisation.js";

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

const START_ACTIONS = [
  { id: "language", label: "Start language learning", tab: "language", primary: true },
  { id: "quiz", label: "Start a quiz", tab: "quiz", primary: true },
  { id: "arcade", label: "Play mini game", tab: "arcade" },
  { id: "reading", label: "Open reading practice", tab: "reading" },
  { id: "study-books", label: "Browse study books", href: "/revision/subjects/" },
  { id: "builder", label: "Sentence building", tab: "builder" },
  { id: "vocab", label: "Vocabulary", tab: "vocab" },
];

export default function HomePage({ onNavigate, onManageLearning, onShowEverything }) {
  const { manifest, loading, error } = useManifest();
  const { progress } = useProgress();
  const onboardingPrefs = progress?.prefs || {};
  const setupSummary = onboardingSummaryLabels(onboardingPrefs);
  const selectedModules = onboardingPrefs.selectedModules || [];
  const everythingMode = isEverythingMode(onboardingPrefs);

  const featuredPacks = useMemo(() => {
    if (!manifest) return [];
    return filterPacksForPrefs(listDatasets(manifest), onboardingPrefs).slice(0, 6);
  }, [manifest, onboardingPrefs]);

  const startActions = useMemo(() => {
    if (everythingMode || !selectedModules.length) return START_ACTIONS.slice(0, 5);
    return START_ACTIONS.filter((action) => !action.tab || selectedModules.includes(action.tab) || action.id === "study-books").slice(0, 5);
  }, [everythingMode, selectedModules]);

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

      {/* ── Quick start + Community row ────────────────────────────────── */}
      <div className="lw-home-top-row">
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
            {startActions.map((action) => action.href ? (
              <a key={action.id} className="lw-btn lw-btn-secondary" href={action.href}>
                {action.label}
              </a>
            ) : (
              <button
                key={action.id}
                className={`lw-btn ${action.primary ? "lw-btn-promote lw-btn-promote-blue" : "lw-btn-secondary"}`}
                type="button"
                onClick={() => onNavigate(action.tab)}
              >
                {action.label}
              </button>
            ))}
            <button className="lw-btn lw-btn-ghost" type="button" onClick={() => onNavigate("progress")}>
              Progress
            </button>
            <button className="lw-btn lw-btn-ghost" type="button" onClick={() => onNavigate("mypacks")}>
              My Packs
            </button>
          </div>
        </div>

        {/* ── Community ── */}
        <div className="lw-card lw-home-community">
          <h2 className="lw-section-title">Let&apos;s grow together! 💛</h2>
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
      </div>

      <div className="lw-card lw-learning-setup-card">
        <div>
          <p className="lw-onboarding-eyebrow">Your Learning Setup</p>
          <h2 className="lw-section-title">{setupSummary.mode}</h2>
          <p className="lw-subtitle">
            {everythingMode
              ? "All tabs, subjects and curricula are visible."
              : "FoxChild is showing a calmer set of tools based on your choices."}
          </p>
          <div className="lw-learning-summary-row">
            {(setupSummary.interests.length ? setupSummary.interests : ["Overview first"]).slice(0, 5).map((label) => (
              <span key={label} className="lw-chip blue">{label}</span>
            ))}
          </div>
          <div className="lw-learning-summary-row">
            {(setupSummary.modules.length ? setupSummary.modules : ["Home", "Quiz", "Reading"]).slice(0, 8).map((label) => (
              <span key={label} className="lw-chip">{label}</span>
            ))}
          </div>
        </div>
        <div className="lw-learning-setup-actions">
          <button className="lw-btn lw-btn-primary" type="button" onClick={onManageLearning}>
            Manage Learning
          </button>
          {!everythingMode && (
            <button className="lw-btn lw-btn-secondary" type="button" onClick={() => onShowEverything?.()}>
              Show everything
            </button>
          )}
        </div>
      </div>

      {/* ── Study Books (SEO revision notes) ──────────────────────────── */}
      <div className="lw-card lw-section">
        <h2 className="lw-section-title">
          Study Books <SectionStar />
        </h2>
        <p className="lw-subtitle">
          Read revision study notes across all subjects — no quiz, just the
          content.
        </p>
        <a
          className="lw-btn lw-btn-promote lw-btn-promote-blue"
          href="/revision/subjects/"
        >
          Browse all subjects &rarr;
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
