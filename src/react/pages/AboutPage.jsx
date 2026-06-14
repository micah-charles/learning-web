/**
 * AboutPage.jsx
 *
 * Static about content — direct port of vanilla renderAboutTab().
 */
export default function AboutPage({ onManageLearning }) {
  return (
    <div className="lw-page">
      <div className="lw-card">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "32px", alignItems: "flex-start" }}>
          {/* Copy */}
          <div style={{ flex: "1 1 300px", minWidth: "260px" }}>
            <p
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--lw-teal)",
                marginBottom: "6px",
              }}
            >
              Learning Web
            </p>
            <h2 className="lw-section-title">About This Project</h2>
            <p style={{ color: "var(--lw-ink)", lineHeight: 1.65 }}>
              This project started from a very simple personal idea:
            </p>
            <p
              style={{
                margin: "14px 0",
                padding: "14px 18px",
                background: "rgba(80,165,160,0.08)",
                borderLeft: "3px solid var(--lw-teal)",
                borderRadius: "0 8px 8px 0",
                fontStyle: "italic",
                color: "var(--lw-ink)",
                lineHeight: 1.6,
              }}
            >
              Can AI help parents and students turn their own study materials into interactive
              revision exercises automatically?
            </p>
            <p style={{ color: "var(--lw-ink)", lineHeight: 1.65 }}>
              When helping my child revise subjects like Geography, German, and History, I noticed
              that most revision is still very passive — reading notes repeatedly, memorising
              vocabulary lists, or manually creating questions.
            </p>
            <p style={{ color: "var(--lw-ink)", lineHeight: 1.65, marginTop: "10px" }}>
              At the same time, modern AI models are already very good at understanding educational
              content. So I started building an experimental local-first learning platform called{" "}
              <strong>Learning Web</strong>.
            </p>
            <button
              className="lw-btn lw-btn-primary"
              type="button"
              onClick={onManageLearning}
              style={{ marginTop: "14px" }}
            >
              Manage Learning
            </button>
          </div>

          {/* Visual */}
          <figure style={{ flex: "0 1 340px", margin: 0 }}>
            <a href="./brand/learning-web-overview.png" target="_blank" rel="noreferrer">
              <img
                src="./brand/learning-web-overview.png"
                alt="Learning Web project overview"
                style={{ width: "100%", borderRadius: "10px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </a>
          </figure>
        </div>
      </div>

      <div className="lw-card" style={{ marginTop: "20px" }}>
        <h2 className="lw-section-title">Why This Project Matters</h2>
        <p style={{ color: "var(--lw-ink)", lineHeight: 1.65 }}>
          Many AI education projects focus on cloud platforms, enterprise systems, or futuristic AI
          marketing concepts. This project focuses on something smaller but practical:
        </p>
        <p
          style={{
            margin: "14px 0",
            padding: "14px 18px",
            background: "rgba(80,165,160,0.08)",
            borderLeft: "3px solid var(--lw-teal)",
            borderRadius: "0 8px 8px 0",
            fontStyle: "italic",
            fontWeight: 600,
            color: "var(--lw-ink)",
          }}
        >
          Helping ordinary families create their own interactive revision content using AI on their
          local machine.
        </p>
        <p style={{ color: "var(--lw-ink)", lineHeight: 1.65 }}>
          The long-term vision is to allow anyone — even without programming experience — to
          generate personalised learning activities from their own materials with minimal effort.
        </p>
        <p style={{ color: "var(--lw-ink)", lineHeight: 1.65, marginTop: "10px" }}>
          The project is still experimental and evolving, but it already demonstrates how AI can
          assist in transforming raw educational content into reusable learning experiences.
        </p>
      </div>

      <div className="lw-card" style={{ marginTop: "20px" }}>
        <h2 className="lw-section-title">Tech Stack</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {["Vite", "React", "Vanilla JS", "SpeechSynthesis API", "localStorage", "JSON packs"].map(
            (tech) => (
              <span key={tech} className="lw-chip blue">
                {tech}
              </span>
            ),
          )}
        </div>
        <p style={{ color: "var(--lw-muted)", fontSize: "0.88rem", marginTop: "14px", lineHeight: 1.6 }}>
          Browser-only — no server, no login, no tracking. All data stays in your browser.
        </p>
      </div>
    </div>
  );
}
