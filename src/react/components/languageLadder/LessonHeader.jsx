/**
 * LessonHeader.jsx — pack/stage/lesson/language selector bar + title.
 */
import { TARGET_LANGUAGES } from "@/progressive-language-lesson.js";

export default function LessonHeader({ catalog, session, pack,
  onPackChange, onStageChange, onLessonChange, onLanguageChange }) {
  if (!catalog || !session) return null;

  const catPack  = catalog.packs.find(p => p.id === session.catalogPackId);
  const catStage = catPack?.stages.find(s => s.id === session.catalogStageId);

  const grammarTargets = pack?.sourceTopic?.grammarTargets?.[session.targetLang] || [];
  const langFlag = TARGET_LANGUAGES.find(l => l.code === session.targetLang)?.flag || "";
  const langLabel = TARGET_LANGUAGES.find(l => l.code === session.targetLang)?.label || session.targetLang;

  return (
    <div className="pl-header-card section-card">
      <p className="eyebrow" style={{ color: "var(--fox-teal)", marginBottom: 4 }}>Language Ladder</p>
      <h2 className="pl-lesson-title">
        {pack?.title || catStage?.lessons.find(l => l.id === session.catalogLessonId)?.label || "Lesson"}
      </h2>
      {pack?.description && <p className="muted tiny pl-lesson-desc">{pack.description}</p>}

      <div className="pl-meta-row">
        <span className="badge blue">EN</span>
        <span className="pl-arrow">→</span>
        <span className="badge coral">{langFlag} {langLabel}</span>
        {grammarTargets.slice(0, 3).map(g => (
          <span key={g} className="badge amber">{g.replace(/_/g, " ")}</span>
        ))}
      </div>

      <div className="pl-header-controls">
        <label className="pl-ctrl-label">Pack
          <select value={session.catalogPackId} onChange={e => onPackChange(e.target.value)}>
            {catalog.packs.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <label className="pl-ctrl-label">Stage
          <select value={session.catalogStageId} onChange={e => onStageChange(e.target.value)}>
            {(catPack?.stages || []).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <label className="pl-ctrl-label">Lesson
          <select value={session.catalogLessonId} onChange={e => onLessonChange(e.target.value)}>
            {(catStage?.lessons || []).map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </label>
        <label className="pl-ctrl-label">Language
          <select value={session.targetLang} onChange={e => onLanguageChange(e.target.value)}>
            {TARGET_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
