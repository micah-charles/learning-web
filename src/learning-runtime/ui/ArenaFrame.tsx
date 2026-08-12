export interface ArenaActivity {
  id: string;
  label: string;
  localLabel?: string;
  description: string;
  icon: string;
  status: string;
  featured?: boolean;
}

export default function ArenaFrame({ activities, onSelect, onOpenAdvanced, stats }: { activities: readonly ArenaActivity[]; onSelect: (activity: ArenaActivity) => void; onOpenAdvanced?: () => void; stats?: { level?: string; accuracy?: string; streak?: string; goal?: string } }) {
  const featured = activities.find((activity) => activity.featured);
  const secondary = activities.filter((activity) => !activity.featured);
  return (
    <div className="flr-arena-hall" data-testid="chinese-input-arena-hall">
      <div className="flr-arena-banner"><span aria-hidden="true">⚑</span><div><p className="flr-eyebrow">FoxChild Arena</p><h3>Turn knowledge into instinct</h3><p>Each game uses the same verified learning evidence.</p></div><span aria-hidden="true">⚑</span></div>
      {stats && <div className="flr-arena-status" data-testid="chinese-input-arena-status"><span>🛡️ <b>Goalkeeper {stats.level || "Lv. 1"}</b></span><span>◎ <b>{stats.accuracy || "0%"}</b> accuracy</span><span>🔥 <b>{stats.streak || "0"}</b> streak</span><span>🎯 <b>{stats.goal || "0 / 20"}</b> today</span></div>}
      {featured && <button type="button" className="flr-arena-featured" onClick={() => onSelect(featured)} data-testid="chinese-input-goalkeeper-featured">
        <span className="flr-arena-featured-copy"><small>TODAY'S PRACTICE</small><strong>{featured.label} ⚽</strong><span>{featured.description}</span><b>★ Current Journey · 3 mins · +120 XP</b></span>
        <span className="flr-arena-featured-action">Play Now</span>
      </button>}
      <div className="flr-arena-section-heading"><strong>Other practice modes</strong>{onOpenAdvanced && <button type="button" className="flr-text-button" onClick={onOpenAdvanced}>Advanced practice →</button>}</div>
      <div className="flr-arena-gates">
        {secondary.map((activity) => (
          <button type="button" className={`flr-arena-gate${activity.featured ? " is-featured" : ""}`} key={activity.id} onClick={() => onSelect(activity)} disabled={activity.status === "Coming soon"}>
            <span className="flr-arena-icon" aria-hidden="true">{activity.icon}</span><strong>{activity.label}</strong>{activity.localLabel && <span lang="zh-Hant">{activity.localLabel}</span>}<p>{activity.description}</p><small>{activity.status}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
