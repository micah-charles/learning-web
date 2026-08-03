import { isReviewDue } from "../domain/review-scheduler.js";

function countMastered(records, method) {
  return Object.values(records || {}).filter((record) => (record?.[method]?.masteryScore || 0) >= 80).length;
}

export default function ChineseInputDashboard({
  dataset,
  method,
  moduleProgress,
  onMethodChange,
  onOpenView,
  onStartLesson,
}) {
  const lessons = dataset.lessons.filter((lesson) => lesson.method === method);
  const lessonProgress = moduleProgress.lessons || {};
  const firstIncomplete = lessons.find((lesson) => lessonProgress[lesson.id]?.status !== "completed") || lessons.at(-1);
  const events = (moduleProgress.attemptEvents || []).filter((event) => event.method === method).slice(-20);
  const accuracy = events.length ? Math.round(events.filter((event) => event.correct).length / events.length * 100) : 0;
  const due = Object.values(moduleProgress.characters || {}).filter((record) => isReviewDue(record?.[method])).length;
  const learnedRoots = Object.values(moduleProgress.roots || {}).filter((root) => (root.exposures || 0) > 0).length;

  return (
    <div data-testid="chinese-input-dashboard">
      <section className="lw-card cil-dashboard-hero">
        <div>
          <p className="lw-eyebrow">Language Lab · 中文輸入實驗室</p>
          <h1>Chinese Input Lab</h1>
          <p className="lw-subtitle">
            Learn Traditional Chinese typing with verified Cangjie 5 and Quick codes, a visual keyboard, guided lessons and local review.
          </p>
          <p className="cil-standard-note">
            Dataset: Cangjie 5 · Traditional Chinese · zh-HK · Jyutping · {dataset.characters.length.toLocaleString()} characters · {dataset.lessons.length.toLocaleString()} lessons · v{dataset.manifest.datasetVersion}
          </p>
        </div>
        <div className="cil-method-switch" role="group" aria-label="Input method">
          {["cangjie", "quick"].map((option) => (
            <button
              key={option}
              className={`lw-btn ${method === option ? "lw-btn-primary" : "lw-btn-secondary"}`}
              type="button"
              aria-pressed={method === option}
              onClick={() => onMethodChange(option)}
            >
              {option === "cangjie" ? "Cangjie 倉頡" : "Quick 速成"}
            </button>
          ))}
        </div>
      </section>

      <section className="cil-stat-grid" aria-label="Chinese Input progress">
        <div className="lw-card"><strong>{due}</strong><span>reviews due</span></div>
        <div className="lw-card"><strong>{learnedRoots}/26</strong><span>roots practised</span></div>
        <div className="lw-card"><strong>{countMastered(moduleProgress.characters, method)}</strong><span>characters mastered</span></div>
        <div className="lw-card"><strong>{accuracy}%</strong><span>recent accuracy</span></div>
      </section>

      <section className="lw-card cil-continue-card">
        <div>
          <p className="lw-eyebrow">Continue learning</p>
          <h2>{firstIncomplete?.title.en || "Choose a lesson"}</h2>
          <p className="lw-subtitle" lang="zh-Hant">{firstIncomplete?.title.zhHant}</p>
        </div>
        <button
          className="lw-btn lw-btn-primary"
          type="button"
          data-testid="chinese-input-start-lesson"
          onClick={() => onStartLesson(firstIncomplete?.id)}
        >
          Start lesson
        </button>
      </section>

      <section className="cil-dashboard-grid">
        {[
          ["roots", "Root Explorer", "Explore every QWERTY key and its Cangjie root."],
          ["lessons", "Lessons", "Follow the staged keyboard-to-character progression."],
          ["review", "Review", "Practise characters that are weak or due."],
          ["collection", "Collection", "Search verified characters, codes, meanings and Jyutping."],
        ].map(([view, title, copy]) => (
          <button className="lw-card cil-dashboard-link" type="button" key={view} onClick={() => onOpenView(view)}>
            <strong>{title}</strong>
            <span>{copy}</span>
          </button>
        ))}
      </section>
    </div>
  );
}
