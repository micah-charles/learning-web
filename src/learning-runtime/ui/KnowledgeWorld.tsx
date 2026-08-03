import type { LearningNode } from "../types";

const REGION_LABELS: Record<string, { label: string; icon: string; copy: string }> = {
  philosophical: { label: "Element Springs", icon: "◉", copy: "Nature and elemental roots" },
  stroke: { label: "Stroke Highlands", icon: "⌁", copy: "Lines, forms and structures" },
  body: { label: "Living Grove", icon: "♧", copy: "People, body and action roots" },
  shape: { label: "Shape Valley", icon: "◇", copy: "Spatial and visual roots" },
  special: { label: "Mystery Peaks", icon: "✦", copy: "Special keyboard symbols" },
};

export default function KnowledgeWorld({ nodes, onSelect }: { nodes: readonly LearningNode[]; onSelect: (node: LearningNode) => void }) {
  const regions = [...new Set(nodes.map((node) => node.regionId || "world"))];
  return (
    <div className="flr-knowledge-world">
      <div className="flr-map-sky"><p className="flr-eyebrow">Living Knowledge World</p><h3>Explore the root regions</h3><p>Undiscovered places are invitations, not barriers.</p></div>
      <div className="flr-region-map">
        {regions.map((regionId, regionIndex) => {
          const regionNodes = nodes.filter((node) => (node.regionId || "world") === regionId);
          const region = REGION_LABELS[regionId] || { label: regionId, icon: "✦", copy: "Knowledge region" };
          const average = Math.round(regionNodes.reduce((sum, node) => sum + node.progress, 0) / Math.max(1, regionNodes.length));
          return (
            <section className={`flr-region flr-region-${regionIndex + 1}`} key={regionId}>
              <header><span aria-hidden="true">{region.icon}</span><div><h4>{region.label}</h4><p>{region.copy}</p></div><strong>{average}%</strong></header>
              <div className="flr-region-nodes">
                {regionNodes.map((node) => (
                  <button type="button" className={`is-${node.state}`} key={node.id} onClick={() => onSelect(node)} title={`${node.label.en}: ${node.state}`} data-testid={`knowledge-node-${node.id}`}>
                    <span lang="zh-Hant">{node.glyph}</span><strong>{String(node.metadata?.key || "")}</strong><small>{node.label.en}</small>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <div className="flr-map-legend" aria-label="Map legend"><span><i className="is-mastered" />Mastered</span><span><i className="is-current" />Current</span><span><i className="is-weak" />Needs care</span><span><i className="is-undiscovered" />Undiscovered</span></div>
    </div>
  );
}
