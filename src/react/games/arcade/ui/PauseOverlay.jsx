/**
 * PauseOverlay.jsx — pause / game-over overlay with resume, restart, exit.
 * Reused for both the paused state and the end-of-round summary.
 */
export default function PauseOverlay({ kind, summary, onResume, onRestart, onExit }) {
  const isOver = kind === "over";
  return (
    <div className="arc-overlay" role="dialog" aria-modal="true" aria-label={isOver ? "Round complete" : "Paused"}>
      <div className="arc-overlay-card">
        <h3 className="arc-overlay-title">{isOver ? "Round complete!" : "Paused"}</h3>

        {summary && (
          <div className="arc-summary">
            <div className="arc-summary-row"><span>Score</span><strong>{summary.score}</strong></div>
            <div className="arc-summary-row"><span>Correct</span><strong>{summary.correct}</strong></div>
            <div className="arc-summary-row"><span>Best streak</span><strong>{summary.bestStreak}</strong></div>
            {typeof summary.accuracy === "number" && (
              <div className="arc-summary-row"><span>Accuracy</span><strong>{summary.accuracy}%</strong></div>
            )}
          </div>
        )}

        <div className="arc-overlay-actions">
          {!isOver && (
            <button type="button" className="lw-btn lw-btn-primary" onClick={onResume}>Resume</button>
          )}
          <button type="button" className="lw-btn lw-btn-secondary" onClick={onRestart}>
            {isOver ? "Play again" : "Restart"}
          </button>
          <button type="button" className="lw-btn lw-btn-ghost" onClick={onExit}>Exit</button>
        </div>
      </div>
    </div>
  );
}
