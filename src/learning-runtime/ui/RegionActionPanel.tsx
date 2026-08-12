import { useState } from "react";
import type { LearningNode } from "../types";

export interface RegionAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  recommended?: boolean;
  disabled?: boolean;
  hint?: string;
}

interface PreviewItem {
  id?: string;
  glyph?: string;
  label?: string;
  word?: string;
  meaning?: string;
  progress?: number;
  state?: string;
}

function metadataList(node: LearningNode, key: string): PreviewItem[] {
  const value = node.metadata?.[key];
  return Array.isArray(value) ? value as PreviewItem[] : [];
}

export default function RegionActionPanel({
  node,
  regionLabel,
  regionIcon,
  actions,
  onAction,
  onLessonSelect,
  onClose,
}: {
  node: LearningNode;
  regionLabel: string;
  regionIcon: string;
  actions: readonly RegionAction[];
  onAction: (action: RegionAction) => void;
  onLessonSelect?: (lesson: PreviewItem) => void;
  onClose: () => void;
}) {
  const [detailView, setDetailView] = useState<"actions" | "statistics">("actions");
  const metadata = node.metadata || {};
  const completion = Number(metadata.completion || node.progress || 0);
  const characters = metadataList(node, "relatedCharacters");
  const weak = metadataList(node, "weakCharacters");
  const mastered = metadataList(node, "masteredCharacters");
  const words = metadataList(node, "relatedWords");
  const lessons = metadataList(node, "relatedLessons");
  const reason = String(metadata.recommendationReason || "A useful next place to explore.");

  if (detailView === "statistics") {
    return <section className="flr-region-action-panel" aria-label={`${regionLabel} statistics`}><header className="flr-region-action-hero"><div className="flr-region-action-emblem" aria-hidden="true">{regionIcon}</div><div className="flr-region-action-copy"><p className="flr-eyebrow">Region statistics</p><h3>{regionLabel}</h3><p><span lang="zh-Hant" className="flr-region-action-glyph">{node.glyph}</span>{node.label.en}</p></div><button type="button" className="flr-text-button flr-region-action-back" onClick={() => setDetailView("actions")}>← Region actions</button></header><div className="flr-region-statistics"><div><b>{completion}%</b><span>Completion</span><small>Mastery projection</small></div><div><b>{characters.length}</b><span>Characters</span><small>Connected to this root</small></div><div><b>{weak.length}</b><span>Needs care</span><small>Review candidates</small></div><div><b>{lessons.length}</b><span>Lessons</span><small>Nearby chapters</small></div><p className="flr-muted-copy">Statistics describe this region only. The Learning Director still chooses session content from the full learner evidence snapshot.</p></div></section>;
  }

  return (
    <section className="flr-region-action-panel" aria-label={`${regionLabel} actions`}>
      <header className="flr-region-action-hero">
        <div className="flr-region-action-emblem" aria-hidden="true">{regionIcon}</div>
        <div className="flr-region-action-copy">
          <p className="flr-eyebrow">{node.state === "current" ? "Current focus" : "Knowledge region"}</p>
          <h3>{regionLabel}</h3>
          <p><span lang="zh-Hant" className="flr-region-action-glyph">{node.glyph}</span>{node.label.en}</p>
          <div className="flr-region-action-badges"><span>{completion}% complete</span><span>{mastered.length} mastered</span><span>{characters.length} related characters</span><span>{weak.length} weak</span></div>
          <p className="flr-region-action-reason"><strong>Why this is here:</strong> {reason}</p>
        </div>
        <button type="button" className="flr-text-button flr-region-action-back" onClick={onClose}>← Back to world</button>
      </header>

      <div className="flr-region-action-content">
        <section className="flr-region-action-actions" aria-labelledby="region-actions-heading">
          <div className="flr-section-heading"><div><p className="flr-eyebrow">Choose your next move</p><h4 id="region-actions-heading">What would you like to do?</h4></div><span aria-hidden="true">✦</span></div>
          <div className="flr-region-action-grid">
            {actions.map((action) => (
              <button type="button" key={action.id} className={`flr-region-action-card${action.recommended ? " is-recommended" : ""}`} disabled={action.disabled} onClick={() => action.id === "statistics" ? setDetailView("statistics") : onAction(action)}>
                <span className="flr-region-action-icon" aria-hidden="true">{action.icon}</span>
                <strong>{action.label}{action.recommended ? " ⭐" : ""}</strong>
                <small>{action.description}</small>
                {action.hint && <em>{action.hint}</em>}
              </button>
            ))}
          </div>
        </section>

        <aside className="flr-region-action-detail" aria-label="Region detail">
          <div className="flr-detail-stat-grid"><div><b>{completion}%</b><small>Completion</small></div><div><b>{mastered.length}</b><small>Mastered preview</small></div><div><b>{weak.length}</b><small>Needs care</small></div><div><b>{Number(metadata.upcomingDiscoveries || 0)}</b><small>Upcoming</small></div></div>
          <div className="flr-detail-block"><h5>Characters</h5><div className="flr-preview-chips">{characters.length ? characters.map((item) => <span key={item.id || item.glyph} className={`is-${item.state || "available"}`} title={`${item.label || "Character"}: ${item.progress || 0}%`}><b lang="zh-Hant">{item.glyph}</b><small>{item.progress || 0}%</small></span>) : <p className="flr-muted-copy">Discover the first character in this region to begin its collection.</p>}</div></div>
          <div className="flr-detail-block"><h5>Related words</h5><div className="flr-related-list">{words.length ? words.map((item) => <span key={item.word}><b lang="zh-Hant">{item.word}</b><small>{item.meaning || "Meaning pending review"}</small></span>) : <p className="flr-muted-copy">Words will appear as the reviewed curriculum grows.</p>}</div></div>
          <div className="flr-detail-block"><h5>Related lessons</h5><div className="flr-related-list">{lessons.length ? lessons.slice(0, 4).map((item) => <button type="button" className="flr-related-lesson" key={item.id} onClick={() => onLessonSelect?.(item)} disabled={!onLessonSelect}><b>{item.label}</b><small>{item.progress || 0}% complete · Play lesson</small></button>) : <p className="flr-muted-copy">No nearby chapters yet.</p>}</div></div>
        </aside>
      </div>
    </section>
  );
}
