/**
 * ReviewPhase — lesson score, mistakes, restart options.
 */
import { TARGET_LANGUAGES } from "@/progressive-language-lesson.js";

export default function ReviewPhase({ session, pack, onDispatch, nextLesson, onNextLesson }) {
  const { score, mistakes } = session;
  const total   = score.vocabTotal + score.builderTotal;
  const correct = score.vocabCorrect + score.builderCorrect;
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0;
  const color   = pct >= 70 ? "var(--color-success)" : pct >= 50 ? "var(--color-attention)" : "var(--color-error)";

  const otherLangs = TARGET_LANGUAGES.filter(l => l.code !== session.targetLang).slice(0, 2);

  return (
    <div className="section-card pl-lesson-card pl-review-card">
      <div className="pl-review-hero">
        <div>
          <h2 className="pl-review-title">Lesson complete!</h2>
          <p className="muted tiny">{pack?.title || ""}</p>
        </div>
      </div>

      <div className="pl-score-grid">
        <div className="pl-score-item">
          <span className="pl-score-big" style={{ color }}>{pct}%</span>
          <span className="pl-score-lbl">Overall</span>
        </div>
        <div className="pl-score-item">
          <span className="pl-score-big">{score.vocabCorrect}<span className="pl-score-denom">/{score.vocabTotal}</span></span>
          <span className="pl-score-lbl">Vocabulary</span>
        </div>
        <div className="pl-score-item">
          <span className="pl-score-big">{score.builderCorrect}<span className="pl-score-denom">/{score.builderTotal}</span></span>
          <span className="pl-score-lbl">Sentences</span>
        </div>
        {mistakes.length > 0 && (
          <div className="pl-score-item">
            <span className="pl-score-big" style={{ color: "var(--color-attention)" }}>{mistakes.length}</span>
            <span className="pl-score-lbl">To revisit</span>
          </div>
        )}
      </div>

      {mistakes.length > 0 ? (
        <div className="pl-mistakes">
          <h3 className="pl-mistakes-title">Items to review</h3>
          <div className="pl-mistake-list">
            {mistakes.map((m, i) => (
              <div key={i} className="pl-mistake">
                <span className={`badge ${m.phase === "Vocabulary" ? "blue" : "amber"}`}>{m.phase}</span>
                <div className="pl-mistake-body">
                  <div className="pl-mistake-prompt">{m.prompt}</div>
                  <div className="pl-mistake-compare">
                    <span className="badge coral">{m.selected || "(nothing)"}</span>
                    <span className="muted tiny">→</span>
                    <span className="badge green">{m.expected}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="pl-perfect">🎉 No mistakes — excellent work!</p>
      )}

      <div className="pl-nav-row pl-review-nav">
        {nextLesson && onNextLesson && (
          <button type="button" className="button" onClick={onNextLesson} style={{ background: "var(--fox-teal)", color: "#fff", border: "none" }}>
            Next Lesson →
          </button>
        )}
        <button type="button" className="button" onClick={() => onDispatch("pl-restart")}>🔄 Restart</button>
        {otherLangs.map(l => (
          <button key={l.code} type="button" className="button ghost"
            style={{ fontSize: "0.85rem" }}
            onClick={() => onDispatch("pl-change-language", { lang: l.code })}>
            {l.flag} Try in {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
