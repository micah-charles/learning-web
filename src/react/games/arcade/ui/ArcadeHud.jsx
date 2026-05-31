/**
 * ArcadeHud.jsx — top status bar: prompt, score, streak, lives, timer.
 * Pure presentational; colourblind-safe (hearts use ♥/♡ shape, not colour alone).
 */
export default function ArcadeHud({
  title, prompt, hint, score, streak, lives, maxLives = 3,
  timer, muted, onToggleMute, onPause,
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
        {typeof timer === "number" && (
          <span className="arc-stat" title="Time left">⏱ {Math.ceil(timer)}</span>
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
