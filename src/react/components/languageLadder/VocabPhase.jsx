/**
 * VocabPhase — MCQ vocabulary cards.
 */
import { getDisplayText, getReadingHint, buildVocabOptions, TARGET_LANGUAGES } from "@/progressive-language-lesson.js";

export default function VocabPhase({ session, pack, onDispatch }) {
  const vocab = pack?.vocabulary || [];
  if (!vocab.length) return <div className="section-card pl-lesson-card"><p className="muted">No vocabulary in this pack.</p></div>;

  const current  = vocab[session.vocabIndex];
  const pct      = Math.round((session.vocabIndex / vocab.length) * 100);
  const enText   = getDisplayText(current?.translations?.en, "en");
  const reading  = getReadingHint(current?.translations?.[session.targetLang], session.targetLang);
  const isLast   = session.vocabIndex >= vocab.length - 1;
  const answered = current?.conceptId && session.answered.vocab[current.conceptId];
  const options  = session.vocabOptions.length ? session.vocabOptions : buildVocabOptions(pack, session.vocabIndex, session.targetLang);
  const langLabel = TARGET_LANGUAGES.find(l => l.code === session.targetLang)?.label || "";

  return (
    <div className="section-card pl-lesson-card">
      <div className="pl-phase-bar">
        <div className="pl-phase-bar-track"><div className="pl-phase-bar-fill" style={{ width: `${pct}%` }} /></div>
        <div className="pl-phase-bar-meta">
          <span className="pl-phase-name">📖 Vocabulary</span>
          <span className="muted tiny">{session.vocabIndex + 1} / {vocab.length}</span>
        </div>
      </div>

      <div className="question-box">
        <div className="question-box-top">
          <div className="question-box-copy">
            <span className="mode-chip blue">What is the {langLabel} for…</span>
            <div className="question-prompt">{enText}</div>
            {reading && <p className="muted tiny">{reading}</p>}
            <div className="badge-row" style={{ marginTop: 6, gap: 5 }}>
              {current?.type && <span className="badge blue">{current.type}</span>}
              {current?.semanticCategory && <span className="badge amber">{current.semanticCategory}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="option-grid" style={{ marginTop: 14 }}>
        {options.map((opt, i) => {
          let cls = "option-button";
          if (answered) {
            if (opt.correct) cls += " is-correct";
            else if (session.vocabFeedback?.selectedText === opt.text) cls += " is-wrong";
          }
          return (
            <button key={i} type="button" className={cls} disabled={!!answered}
              onClick={() => !answered && onDispatch("pl-vocab-answer", {
                correct: String(opt.correct),
                selectedText: opt.text,
                conceptId: current?.conceptId || "",
              })}>
              {opt.text}
            </button>
          );
        })}
      </div>

      {session.vocabFeedback && (
        <div className={`feedback ${session.vocabFeedback.correct ? "correct" : "wrong"}`} style={{ marginTop: 14 }}>
          <div className="feedback-header">
            <strong>
              {session.vocabFeedback.correct
                ? "Correct! Well done."
                : `The ${langLabel} word was: ${getDisplayText(current?.translations?.[session.targetLang], session.targetLang)}`}
            </strong>
          </div>
        </div>
      )}

      <div className="pl-nav-row" style={{ marginTop: answered ? 14 : 10 }}>
        <button type="button" className="button ghost" onClick={() => onDispatch("pl-vocab-back")}>← Back</button>
        {answered && (
          <button type="button" className="button" onClick={() => onDispatch("pl-vocab-next")}>
            {isLast ? "Builder →" : "Next word →"}
          </button>
        )}
      </div>
    </div>
  );
}
