export interface MuseumWing {
  id: string;
  label: string;
  description: string;
  icon: string;
  discovered: number;
  total: number;
  samples: readonly string[];
}

export default function CollectionMuseum({ wings, onOpen }: { wings: readonly MuseumWing[]; onOpen: (wing: MuseumWing) => void }) {
  return (
    <div className="flr-museum">
      <div className="flr-museum-heading"><span aria-hidden="true">♜</span><div><p className="flr-eyebrow">Collection Museum</p><h3>Your adventure leaves treasures behind</h3><p>Inspect everything you have discovered, earned or befriended.</p></div></div>
      <div className="flr-museum-wings">
        {wings.map((wing) => (
          <button type="button" className={`flr-museum-wing is-${wing.id}`} key={wing.id} onClick={() => onOpen(wing)}>
            <span className="flr-museum-icon" aria-hidden="true">{wing.icon}</span><div><strong>{wing.label}</strong><p>{wing.description}</p><div className="flr-museum-samples">{wing.samples.map((sample) => <i key={sample}>{sample}</i>)}</div></div><span className="flr-museum-count"><b>{wing.discovered}</b><small>of {wing.total}</small></span>
          </button>
        ))}
      </div>
    </div>
  );
}
