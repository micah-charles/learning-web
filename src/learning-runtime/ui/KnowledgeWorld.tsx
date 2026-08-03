import { lazy, Suspense, useState } from "react";
import type { LearningNode } from "../types";
import type { RegionAction } from "./RegionActionPanel";

const RegionActionPanel = lazy(() => import("./RegionActionPanel"));

const REGION_LABELS: Record<string, { label: string; icon: string; copy: string }> = {
  philosophical: { label: "Element Springs", icon: "◉", copy: "Nature and elemental roots" },
  stroke: { label: "Stroke Highlands", icon: "⌁", copy: "Lines, forms and structures" },
  body: { label: "Living Grove", icon: "♧", copy: "People, body and action roots" },
  shape: { label: "Shape Valley", icon: "◇", copy: "Spatial and visual roots" },
  special: { label: "Mystery Peaks", icon: "✦", copy: "Special keyboard symbols" },
};

export default function KnowledgeWorld({ nodes, selectedNode, onSelect, onRegionAction, onCloseRegion, actions, onStartCustomAdventure }: { nodes: readonly LearningNode[]; selectedNode?: LearningNode | null; onSelect: (node: LearningNode) => void; onRegionAction?: (action: RegionAction, node: LearningNode) => void; onCloseRegion?: () => void; actions?: readonly RegionAction[]; onStartCustomAdventure?: (nodes: readonly LearningNode[]) => void }) {
  const regions = [...new Set(nodes.map((node) => node.regionId || "world"))];
  const [customRegionIds, setCustomRegionIds] = useState<string[]>([]);
  const selectedRegion = selectedNode?.regionId || "world";
  const region = REGION_LABELS[selectedRegion] || { label: selectedRegion, icon: "✦", copy: "Knowledge region" };
  return (
    <div className="flr-knowledge-world">
      {!selectedNode && <div className="flr-map-sky"><p className="flr-eyebrow">Living Knowledge World</p><h3>Explore the root regions</h3><p>Undiscovered places are invitations, not barriers.</p></div>}
      {selectedNode && actions && <Suspense fallback={<div className="flr-region-action-panel" role="status">Opening region actions…</div>}><RegionActionPanel node={selectedNode} regionLabel={region.label} regionIcon={region.icon} actions={actions} onAction={(action) => onRegionAction?.(action, selectedNode)} onClose={() => onCloseRegion?.()} /></Suspense>}
      {!selectedNode && (
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
      )}
      {!selectedNode && <div className="flr-custom-adventure"><div><p className="flr-eyebrow">Freedom to choose</p><h4>Build a Custom Adventure</h4><p>Select multiple regions and let the Director mix a practice session.</p></div><div className="flr-custom-region-list">{regions.map((regionId) => { const region = REGION_LABELS[regionId] || { label: regionId, icon: "✦", copy: "Knowledge region" }; const selected = customRegionIds.includes(regionId); return <button type="button" key={regionId} className={selected ? "is-selected" : ""} aria-pressed={selected} onClick={() => setCustomRegionIds((current) => selected ? current.filter((id) => id !== regionId) : [...current, regionId])}><span aria-hidden="true">{region.icon}</span>{region.label} {selected ? "✓" : ""}</button>; })}</div><button type="button" className="flr-custom-adventure-start" disabled={!customRegionIds.length} onClick={() => onStartCustomAdventure?.(nodes.filter((node) => customRegionIds.includes(node.regionId || "world")))}>Start Custom Adventure</button></div>}
      {!selectedNode && <div className="flr-map-legend" aria-label="Map legend"><span><i className="is-mastered" />Mastered</span><span><i className="is-current" />Current</span><span><i className="is-weak" />Needs care</span><span><i className="is-undiscovered" />Undiscovered</span></div>}
    </div>
  );
}
