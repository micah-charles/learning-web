/**
 * ListenPhase — phrase-chain listen & repeat cards with grammar analysis.
 */
import { getDisplayText, getReadingHint, TARGET_LANGUAGES } from "@/progressive-language-lesson.js";

function GrammarPanel({ translation, lang }) {
  const a = translation?.analysis;
  if (!a) return null;
  const langLabel = TARGET_LANGUAGES.find(l => l.code === lang)?.label || lang;
  return (
    <div className="pl-grammar-panel">
      <div className="pl-gram-head">📚 {langLabel} Grammar</div>
      <div className="pl-gram-body">
        {a.sentencePattern && <div className="pl-gram-row"><span className="pl-gram-key">Pattern</span><span className="pl-gram-val">{a.sentencePattern}</span></div>}
        {a.literalOrderExplanation && <div className="pl-gram-row"><span className="pl-gram-key">Word order</span><span className="pl-gram-val pl-gram-literal">{a.literalOrderExplanation}</span></div>}
        {(a.grammarExplanation || []).length > 0 && (
          <ul className="pl-gram-list">{a.grammarExplanation.map((e, i) => <li key={i}>{e}</li>)}</ul>
        )}
        {(a.tokens || []).length > 0 && (
          <div className="pl-tok-details">
            {a.tokens.map((t, i) => (
              <div key={i} className="pl-tok-detail">
                <span className="pl-tok-surface">{t.text}</span>
                {t.meaning    && <span className="pl-tok-meaning">{t.meaning}</span>}
                {t.grammarNote && <span className="pl-tok-note muted tiny">{t.grammarNote}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TokenRow({ translation, showLabels }) {
  const tokens = translation?.analysis?.tokens;
  if (!tokens?.length) {
    const text = translation?.text || "";
    return text ? <div className="pl-tok-row pl-tok-plain"><span>{text}</span></div> : null;
  }
  return (
    <div className="pl-tok-row">
      {tokens.map((t, i) => (
        <div key={i} className="pl-tok" tabIndex={0} title={t.meaning || ""} aria-label={`${t.text}: ${t.meaning || ""}`}>
          <span className="pl-tok-surface">{t.text}</span>
          {showLabels && t.meaning && <span className="pl-tok-gloss">{t.meaning}</span>}
        </div>
      ))}
    </div>
  );
}

export default function ListenPhase({ session, pack, onDispatch, onSpeak }) {
  const chains = pack?.phraseProgressionChains || [];
  if (!chains.length) return <div className="section-card pl-lesson-card"><p className="muted">No phrase chains in this pack.</p></div>;

  const totalSteps = chains.reduce((n, c) => n + (c.steps?.length || 0), 0);
  const doneBefore  = chains.slice(0, session.chainIndex).reduce((n, c) => n + (c.steps?.length || 0), 0);
  const doneSteps   = doneBefore + session.stepIndex + 1;
  const pct         = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  const chain = chains[session.chainIndex];
  const step  = chain?.steps?.[session.stepIndex];
  if (!step) return <div className="section-card pl-lesson-card"><p className="muted">No step data.</p></div>;

  const enText    = step.translations?.en?.text || "";
  const targetTr  = step.translations?.[session.targetLang];
  const targetTxt = getDisplayText(targetTr, session.targetLang);
  const reading   = getReadingHint(targetTr, session.targetLang);
  const focus     = step.focus?.replace(/_/g, " ") || "";
  const hasGram   = !!(targetTr?.analysis?.grammarExplanation?.length || targetTr?.analysis?.tokens?.length);
  const isFirst   = session.chainIndex === 0 && session.stepIndex === 0;
  const isLast    = session.chainIndex === chains.length - 1 && session.stepIndex === (chain?.steps?.length ?? 1) - 1;
  const langFlag  = TARGET_LANGUAGES.find(l => l.code === session.targetLang)?.flag || "";
  const langLabel = TARGET_LANGUAGES.find(l => l.code === session.targetLang)?.label || "";

  return (
    <div className="section-card pl-lesson-card">
      <div className="pl-phase-bar">
        <div className="pl-phase-bar-track"><div className="pl-phase-bar-fill" style={{ width: `${pct}%` }} /></div>
        <div className="pl-phase-bar-meta">
          <span className="pl-phase-name">🎧 Listen &amp; Repeat</span>
          <span className="muted tiny">Step {doneSteps} / {totalSteps}</span>
        </div>
      </div>

      {focus && (
        <div className="pl-focus-row">
          <span className="mode-chip blue">{focus}</span>
          {chain?.difficulty && <span className="muted tiny" style={{ marginLeft: 6 }}>{chain.difficulty}</span>}
        </div>
      )}

      <div className="pl-phrase-grid">
        <div className="pl-phrase-card en">
          <div className="pl-phrase-lang">English</div>
          <div className="pl-phrase-text">{enText}</div>
        </div>
        <div className="pl-phrase-card target">
          <div className="pl-phrase-lang">{langFlag} {langLabel}</div>
          <div className="pl-phrase-text">{targetTxt}</div>
          {reading && <div className="pl-phrase-reading">{reading}</div>}
          <div className="pl-audio-row">
            <button className="pl-audio-btn" type="button" onClick={onSpeak} title="Play audio">
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>
              Play
            </button>
          </div>
        </div>
      </div>

      <TokenRow translation={targetTr} showLabels={session.showGrammarLabels} />

      {hasGram && (
        <div className="pl-grammar-row-actions">
          <button type="button" className={`pl-gram-chip${session.showGrammar ? " active" : ""}`}
            onClick={() => onDispatch("pl-toggle-grammar")}>
            📚 {session.showGrammar ? "Hide" : "Show"} grammar
          </button>
          <button type="button" className="button ghost pl-labels-btn"
            style={{ fontSize: "0.8rem", padding: "4px 10px" }}
            onClick={() => onDispatch("pl-toggle-grammar-labels")}>
            {session.showGrammarLabels ? "Hide labels" : "Show word labels"}
          </button>
        </div>
      )}
      {session.showGrammar && <GrammarPanel translation={targetTr} lang={session.targetLang} />}

      <div className="pl-nav-row">
        <button type="button" className="button ghost" onClick={() => onDispatch("pl-listen-back")} disabled={isFirst}>← Back</button>
        <button type="button" className="button" onClick={() => { onSpeak(); onDispatch("pl-listen-next"); }}>
          {isLast ? "Vocabulary →" : "Next →"}
        </button>
      </div>
    </div>
  );
}
