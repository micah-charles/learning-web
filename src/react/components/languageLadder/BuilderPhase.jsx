/**
 * BuilderPhase — tile-based sentence construction with optional voice practice.
 */
import { useEffect } from "react";
import { TARGET_LANGUAGES } from "@/progressive-language-lesson.js";
import VoicePracticeButton from "../learning/VoicePracticeButton.jsx";
import VoiceFeedbackPanel from "../learning/VoiceFeedbackPanel.jsx";

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
        {(a.grammarExplanation || []).map((e, i) => <p key={i} className="muted tiny" style={{ margin: "2px 0" }}>{e}</p>)}
      </div>
    </div>
  );
}

export default function BuilderPhase({ session, pack, onDispatch, voicePractice = null, speechLang = "de-DE" }) {
  const builders = pack?.sentenceBuilders || [];

  useEffect(() => {
    if (voicePractice?.phase === "correct") {
      onDispatch("pl-builder-check");
      voicePractice.reset();
    }
  }, [voicePractice?.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!builders.length) return <div className="section-card pl-lesson-card"><p className="muted">No sentence builders in this pack.</p></div>;

  const sentence = builders[session.sentenceIndex];
  const targetTr = sentence?.translations?.[session.targetLang];
  const enText   = sentence?.translations?.en?.text || "";
  const pct      = Math.round((session.sentenceIndex / builders.length) * 100);
  const hasGram  = !!(targetTr?.analysis?.grammarExplanation?.length || targetTr?.analysis?.tokens?.length);
  const sid      = sentence?.sentenceId;
  const answered = sid && session.answered.builder[sid];
  const isLast   = session.sentenceIndex >= builders.length - 1;
  const langLabel = TARGET_LANGUAGES.find(l => l.code === session.targetLang)?.label || "";

  const answerCls = answered
    ? session.builderFeedback?.correct ? "answer-correct" : "answer-wrong"
    : "";

  return (
    <div className="section-card pl-lesson-card">
      <div className="pl-phase-bar">
        <div className="pl-phase-bar-track"><div className="pl-phase-bar-fill" style={{ width: `${pct}%` }} /></div>
        <div className="pl-phase-bar-meta">
          <span className="pl-phase-name">🔧 Sentence Builder</span>
          <span className="muted tiny">{session.sentenceIndex + 1} / {builders.length}</span>
        </div>
      </div>

      <div className="question-box">
        <div className="question-box-top">
          <div className="question-box-copy">
            <span className="mode-chip blue">Build in {langLabel}</span>
            <div className="question-prompt">{enText}</div>
            {(sentence?.concepts || []).length > 0 && (
              <div className="badge-row" style={{ marginTop: 6, gap: 5 }}>
                {sentence.concepts.slice(0, 3).map(c => <span key={c} className="badge amber">{c}</span>)}
              </div>
            )}
          </div>
          {hasGram && (
            <button type="button" className="button ghost pl-gram-icon-btn"
              onClick={() => onDispatch("pl-toggle-builder-grammar")} title="Grammar help">📚</button>
          )}
        </div>
      </div>

      {session.showBuilderGrammar && targetTr && <GrammarPanel translation={targetTr} lang={session.targetLang} />}

      <div className="builder-shell" style={{ marginTop: 16 }}>
        {/* Answer zone */}
        <div className="pl-builder-zone">
          <div className="pl-builder-zone-head"><label className="pl-zone-label">Your answer</label></div>
          <div className={`tile-area ${answerCls}`}>
            {session.selectedTiles.length
              ? session.selectedTiles.map(t => (
                  <button key={t.id} type="button"
                    className={`tile answer${answered && !session.builderFeedback?.correct ? " shake" : ""}`}
                    disabled={!!answered}
                    onClick={() => !answered && onDispatch("pl-builder-remove", { tileId: t.id })}>
                    {t.text}
                  </button>
                ))
              : <span className="muted tiny" style={{ padding: "8px 12px", display: "block" }}>Tap tiles below to build the sentence</span>
            }
          </div>
        </div>
        {/* Bank zone */}
        <div className="pl-builder-zone">
          <div className="pl-builder-zone-head">
            <label className="pl-zone-label">Tiles</label>
            {hasGram && (
              <button type="button" className="button ghost pl-labels-btn"
                style={{ fontSize: "0.78rem", padding: "3px 8px" }}
                onClick={() => onDispatch("pl-toggle-grammar-labels")}>
                {session.showGrammarLabels ? "Hide labels" : "Word labels"}
              </button>
            )}
          </div>
          <div className="tile-area">
            {session.bankTiles.length
              ? session.bankTiles.map(t => (
                  <button key={t.id} type="button" className="tile" disabled={!!answered}
                    onClick={() => !answered && onDispatch("pl-builder-pick", { tileId: t.id })}>
                    {t.text}
                  </button>
                ))
              : <span className="muted tiny" style={{ padding: "8px 12px", display: "block" }}>All tiles placed</span>
            }
          </div>
        </div>
      </div>

      {session.builderFeedback && (
        <div className={`feedback ${session.builderFeedback.correct ? "correct" : "wrong"}`} style={{ marginTop: 14 }}>
          <div className="feedback-header">
            <strong>{session.builderFeedback.correct ? "Perfect! 🎉" : "Not quite — try rearranging the tiles."}</strong>
          </div>
        </div>
      )}

      <div className="pl-nav-row">
        <button type="button" className="button ghost" onClick={() => onDispatch("pl-builder-back")}>← Back</button>
        {!answered ? (
          <>
            {voicePractice && targetTr?.text && (
              <VoicePracticeButton
                state={voicePractice.buttonState}
                onClick={() => voicePractice.startPractice(targetTr.text, speechLang)}
                disabled={voicePractice.phase === "listening" || voicePractice.phase === "processing"}
              />
            )}
            <button type="button" className="button secondary" onClick={() => onDispatch("pl-builder-reset")}>Reset</button>
            <button type="button" className="button"
              disabled={!session.selectedTiles.length}
              onClick={() => onDispatch("pl-builder-check")}>Check answer</button>
          </>
        ) : (
          <button type="button" className="button" onClick={() => onDispatch("pl-builder-next")}>
            {isLast ? "Finish →" : "Next →"}
          </button>
        )}
      </div>

      {voicePractice && (
        <VoiceFeedbackPanel
          status={
            voicePractice.phase === "unclear" ? "unclear"
            : voicePractice.phase === "incorrect" ? "mispronounced"
            : voicePractice.phase === "correct" ? "correct"
            : null
          }
          expected={voicePractice.lastResult?.expected}
          recognized={voicePractice.lastResult?.transcript}
          confidence={voicePractice.lastResult?.confidence}
          attempt={voicePractice.attempt}
          maxAttempts={3}
          onRetry={voicePractice.retry}
          onCancel={voicePractice.cancel}
        />
      )}
    </div>
  );
}
