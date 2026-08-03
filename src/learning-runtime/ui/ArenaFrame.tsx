export interface ArenaActivity {
  id: string;
  label: string;
  localLabel?: string;
  description: string;
  icon: string;
  status: string;
  featured?: boolean;
}

export default function ArenaFrame({ activities, onSelect }: { activities: readonly ArenaActivity[]; onSelect: (activity: ArenaActivity) => void }) {
  return (
    <div className="flr-arena-hall">
      <div className="flr-arena-banner"><span aria-hidden="true">⚑</span><div><p className="flr-eyebrow">FoxChild Arena</p><h3>Turn knowledge into instinct</h3><p>Each game uses the same verified learning evidence.</p></div><span aria-hidden="true">⚑</span></div>
      <div className="flr-arena-gates">
        {activities.map((activity) => (
          <button type="button" className={`flr-arena-gate${activity.featured ? " is-featured" : ""}`} key={activity.id} onClick={() => onSelect(activity)} disabled={activity.status === "Coming soon"}>
            <span className="flr-arena-icon" aria-hidden="true">{activity.icon}</span><strong>{activity.label}</strong>{activity.localLabel && <span lang="zh-Hant">{activity.localLabel}</span>}<p>{activity.description}</p><small>{activity.status}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
