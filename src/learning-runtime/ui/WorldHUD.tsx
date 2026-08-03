export default function WorldHUD({
  rank,
  xp,
  coins,
  progress,
  onSettings,
}: {
  rank: string;
  xp: number;
  coins: number;
  progress: number;
  onSettings: () => void;
}) {
  return (
    <div className="flr-hud" aria-label="Adventure status">
      <div className="flr-rank"><span className="flr-rank-gem" aria-hidden="true">◆</span><span><strong>{rank}</strong><small>Wayfinder rank</small></span></div>
      <div className="flr-xp"><span>World growth</span><progress max="100" value={progress}>{progress}%</progress><strong>{xp} XP</strong></div>
      <div className="flr-currency"><span aria-hidden="true">◉</span><strong>{coins}</strong></div>
      <button className="flr-hud-button" type="button" onClick={onSettings} aria-label="Open world settings">⚙</button>
    </div>
  );
}
