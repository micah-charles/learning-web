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
  const journeyChapters = chapters.filter((chapter) => chapter.metadata?.category !== "input-tools");
  const inputToolChapters = chapters.filter((chapter) => chapter.metadata?.category === "input-tools");
  const currentChapter = chapters.find((chapter) => chapter.id === currentId);
  const pathChapters = currentChapter?.metadata?.category === "input-tools" ? inputToolChapters : journeyChapters;
  const currentIndex = Math.max(0, pathChapters.findIndex((chapter) => chapter.id === currentId));
  const start = Math.max(0, Math.min(pathChapters.length - 9, currentIndex - 4));
  const visible = pathChapters.slice(start, start + 9);
  const stages = [...new Set(journeyChapters.map((chapter) => Number(chapter.metadata?.stage) || 0))];
  return (
    <div className="flr-journey-screen">
      <div className="flr-journey-copy"><p className="flr-eyebrow">Adventure Path</p><h3>Follow the lantern trail</h3><p>Recommendations guide you, but every landmark remains open.</p></div>
      <nav className="flr-stage-portals" aria-label="Journey stages">
        {stages.map((stage) => {
          const chapter = journeyChapters.find((item) => Number(item.metadata?.stage) === stage);
          return <button type="button" key={stage} onClick={() => chapter && onSelect(chapter)} className={Number(currentChapter?.metadata?.stage) === stage ? "is-current" : ""}><span>Stage {stage}</span><small>{journeyChapters.filter((item) => Number(item.metadata?.stage) === stage).length} paths</small></button>;
        })}
      </nav>
      {inputToolChapters.length > 0 && <section className="flr-journey-category" aria-label="Input Tools category"><div><p className="flr-eyebrow">Input Tools</p><h4>Special keys and advanced IME tools</h4><p>These lessons teach input-method behavior and do not count toward character-root mastery.</p></div><div>{inputToolChapters.map((chapter) => <button type="button" key={chapter.id} onClick={() => onSelect(chapter)} className={chapter.id === currentId ? "is-current" : ""}><strong>{chapter.label.en}</strong><small>{chapter.estimatedMinutes} min · {chapter.state}</small></button>)}</div></section>}
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
            <small className="flr-landmark-category">{chapter.metadata?.category === "input-tools" ? "Input Tools" : "Journey"}</small>
            <strong>{chapter.label.en}</strong>
            {chapter.label.local && <span lang="zh-Hant">{chapter.label.local}</span>}
            <small>{chapter.estimatedMinutes} min · {chapter.state}</small>
          </button>
        ))}
      </div>
      <p className="flr-path-position">Showing paths {start + 1}–{Math.min(pathChapters.length, start + visible.length)} of {pathChapters.length}</p>
    </div>
  );
}
