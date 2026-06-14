/**
 * Hero.jsx
 *
 * Full-width hero banner matching FoxChild@Learn production branding:
 *   – brand/hero-bg.jpg background with teal gradient overlay
 *   – brand/logo.png character artwork on the left
 *   – "FoxChild@Learn" title with @Learn in fox-orange
 *   – pack count badges
 */
import { useMemo } from "react";
import { useManifest } from "../../context/ManifestContext.jsx";
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

// ─── Hero ────────────────────────────────────────────────────────────────────

export default function Hero({ variant = "standard", onNavigate, showAiPrompt = true }) {
  const { manifest } = useManifest();

  const packCount    = useMemo(() => (manifest ? listDatasets(manifest).length : 0),            [manifest]);
  const groupCount   = useMemo(() => (manifest ? listPassageGroups(manifest).length : 0),       [manifest]);
  const builderCount = useMemo(() => (manifest ? listSentenceBuilderPacks(manifest).length : 0),[manifest]);

  return (
    <div
      className={`lw-app-header lw-app-header--${variant}`}
      style={{
        background: [
          "radial-gradient(circle at 20% 55%, rgba(255,255,255,0.10), transparent 40%)",
          "radial-gradient(circle at 85% 20%, rgba(237,184,50,0.18), transparent 30%)",
          "linear-gradient(135deg, rgba(43,126,133,0.85) 0%, rgba(61,158,165,0.80) 45%, rgba(79,179,186,0.74) 100%)",
          `url(${heroBg}) center / cover no-repeat`,
        ].join(", "),
      }}
    >
      {/* ── Top row: logo left | hero copy right ────────────────────────── */}
      <div className="lw-header-inner">

        {/* Logo panel — bottom-aligned to the copy zone height only */}
        <div className="lw-header-mascot">
          <img
            src={logoImg}
            alt="FoxChild Idea — Fox Tutor and Girl Tutor"
            className="lw-mascot-img"
          />
          <a
            className="lw-social-badge lw-social-badge--facebook"
            href="https://www.facebook.com/profile.php?id=61589170294693"
            target="_blank"
            rel="noopener noreferrer"
            title="Visit FoxChildIdea on Facebook"
            aria-label="Visit FoxChildIdea on Facebook"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.887v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
            </svg>
          </a>
        </div>

        {/* Hero copy (no stats here — stats are full-width below) */}
        <div className="lw-hero-copy">
          <div className="lw-hero-brand-block">
            <p className="lw-hero-eyebrow">POWERED BY FOXCHILD IDEA</p>
            <h1 className="lw-hero-title">
              <span style={{ color: "#fff" }}>FoxChild</span>
              <span style={{ color: "var(--fox-orange, #e8841a)" }}>@Learn</span>
            </h1>
            <p className="lw-hero-sub">
              Your cosy space for learning, practising, and growing —
              powered by curiosity and AI.
            </p>
          </div>
          {/* Right column: stat badges + AI Learning Pack Creator promo */}
          <div className="lw-hero-right-col">
            {manifest && (
              <div className="lw-hero-counts">
                <CountBadge icon="📦" n={packCount}    label="packs"          />
                <CountBadge icon="📖" n={groupCount}   label="reading groups" />
                <CountBadge icon="🧩" n={builderCount} label="builder sets"   />
              </div>
            )}
            <div className="lw-hero-action-stack">
              {showAiPrompt && (
                <button
                  type="button"
                  className="lw-hero-promo"
                  onClick={() => onNavigate?.("ai-prompt")}
                  aria-label="Open AI Learning Pack Creator"
                >
                  <span className="lw-hero-promo-title">✦ AI Learning Pack Creator</span>
                  <span className="lw-hero-promo-sub">
                    <span>Build quizzes, readings, and revision packs with AI.</span>
                    <span>Then upload the JSON in My Packs.</span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
