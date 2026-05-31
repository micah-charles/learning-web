/**
 * ArcadeHud.jsx — top status bar: prompt, score, streak, lives, timer.
 * Pure presentational; colourblind-safe (hearts use ♥/♡ shape, not colour alone).
 */
function formatTime(secs) {
  const s = Math.max(0, Math.ceil(secs));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export default function ArcadeHud({
  title, prompt, hint, score, streak, lives, maxLives = 3,
  timer, goalText, muted, onToggleMute, onPause,
}) {
  const hearts = Array.from({ length: maxLives }, (_, i) => (i < lives ? "♥" : "♡"));
  return (
    <div className="arc-hud">
      <div className="arc-hud-prompt">
        {title && <span className="arc-hud-label">{title}</span>}
        <strong className="arc-hud-question">{prompt}</strong>
        {hint && <span className="arc-hud-hint">{hint}</span>}
      </div>
      <div className="arc-hud-stats">
        <span className="arc-stat" title="Score">⭐ {score}</span>
        <span className="arc-stat" title="Streak">🔥 {streak}</span>
        {goalText && <span className="arc-stat" title="Progress">🎯 {goalText}</span>}
        {typeof timer === "number" && (
          <span className="arc-stat" title="Time left">⏱ {formatTime(timer)}</span>
        )}
        <span className="arc-stat arc-lives" title={`${lives} of ${maxLives} lives`} aria-label={`${lives} of ${maxLives} lives`}>
          {hearts.join(" ")}
        </span>
        <button type="button" className="arc-icon-btn" onClick={onToggleMute}
          aria-pressed={muted} title={muted ? "Unmute" : "Mute"}>
          {muted ? "🔇" : "🔊"}
        </button>
        <button type="button" className="arc-icon-btn" onClick={onPause} title="Pause">
          ⏸
        </button>
      </div>
    </div>
  );
}
