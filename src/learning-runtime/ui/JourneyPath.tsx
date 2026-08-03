import type { LearningChapter } from "../types";

export default function JourneyPath({
  chapters,
  currentId,
  onSelect,
}: {
  chapters: readonly LearningChapter[];
  currentId?: string;
  onSelect: (chapter: LearningChapter) => void;
}) {
  const currentIndex = Math.max(0, chapters.findIndex((chapter) => chapter.id === currentId));
  const start = Math.max(0, Math.min(chapters.length - 9, currentIndex - 4));
  const visible = chapters.slice(start, start + 9);
  const stages = [...new Set(chapters.map((chapter) => Number(chapter.metadata?.stage) || 0))];
  return (
    <div className="flr-journey-screen">
      <div className="flr-journey-copy"><p className="flr-eyebrow">Adventure Path</p><h3>Follow the lantern trail</h3><p>Recommendations guide you, but every landmark remains open.</p></div>
      <nav className="flr-stage-portals" aria-label="Journey stages">
        {stages.map((stage) => {
          const chapter = chapters.find((item) => Number(item.metadata?.stage) === stage);
          return <button type="button" key={stage} onClick={() => chapter && onSelect(chapter)} className={Number(chapters[currentIndex]?.metadata?.stage) === stage ? "is-current" : ""}><span>Stage {stage}</span><small>{chapters.filter((item) => Number(item.metadata?.stage) === stage).length} paths</small></button>;
        })}
      </nav>
      <div className="flr-path" role="list" aria-label="Nearby journey landmarks">
        <span className="flr-path-line" aria-hidden="true" />
        {visible.map((chapter, index) => (
          <button
            type="button"
            role="listitem"
            key={chapter.id}
            className={`flr-landmark is-${chapter.state}${chapter.id === currentId ? " is-selected" : ""}`}
            style={{ "--path-index": index } as React.CSSProperties}
            onClick={() => onSelect(chapter)}
          >
            <span className="flr-landmark-icon" aria-hidden="true">{chapter.state === "mastered" ? "★" : chapter.state === "weak" ? "!" : chapter.id === currentId ? "◆" : "✦"}</span>
            <strong>{chapter.label.en}</strong>
            {chapter.label.local && <span lang="zh-Hant">{chapter.label.local}</span>}
            <small>{chapter.estimatedMinutes} min · {chapter.state}</small>
          </button>
        ))}
      </div>
      <p className="flr-path-position">Showing paths {start + 1}–{Math.min(chapters.length, start + visible.length)} of {chapters.length}</p>
    </div>
  );
}
