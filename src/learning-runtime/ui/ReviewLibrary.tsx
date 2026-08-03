export interface ReviewShelf {
  id: string;
  label: string;
  icon: string;
  count: number;
  description: string;
  tone: "amber" | "jade" | "blue" | "violet";
}

export default function ReviewLibrary({ shelves, onStart }: { shelves: readonly ReviewShelf[]; onStart: (shelf: ReviewShelf) => void }) {
  return (
    <div className="flr-library">
      <div className="flr-library-window"><span aria-hidden="true">☾</span><div><p className="flr-eyebrow">Review Library</p><h3>Knowledge waits on every shelf</h3><p>The Director has placed the most useful memories within easy reach.</p></div></div>
      <div className="flr-shelves">
        {shelves.map((shelf) => (
          <button type="button" className={`flr-shelf is-${shelf.tone}`} key={shelf.id} onClick={() => onStart(shelf)}>
            <span className="flr-shelf-icon" aria-hidden="true">{shelf.icon}</span>
            <span><strong>{shelf.label}</strong><small>{shelf.description}</small></span>
            <b>{shelf.count}</b>
            <i aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}
