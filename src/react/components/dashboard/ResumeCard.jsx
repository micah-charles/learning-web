/**
 * ResumeCard.jsx — Language Ladder resume card for homepage/dashboard.
 * Shows current lesson, progress, and actions for returning users.
 */
import { useState, useEffect } from "react";
import { TARGET_LANGUAGES } from "@/progressive-language-lesson.js";
import { loadProgressiveLessonCatalog } from "@/progressive-language-lesson.js";
import { loadStoredState } from "@/storage.js";

export default function ResumeCard({ onContinue, onReview, onChooseLanguage, onViewMap }) {
  const [catalog, setCatalog] = useState(null);
  const [lessonLabel, setLessonLabel] = useState("Lesson");
  const [total, setTotal] = useState(0);

  // Load progress from localStorage directly (simpler for homepage)
  const progress = loadStoredState().prefs.languageLadder;
  const { lastLang, langs, currentLessonId } = progress || {};

  // Load catalog to get lesson details
  useEffect(() => {
    loadProgressiveLessonCatalog()
      .then(c => {
        setCatalog(c);
      })
      .catch(() => {});
  }, []);

  // Update lesson label and total when catalog loads
  useEffect(() => {
    if (!catalog || !lastLang || !langs?.[lastLang]?.currentLessonId) return;

    const langInfo = langs[lastLang];
    const lessonId = langInfo.currentLessonId;

    // Find lesson label from catalog
    let foundLabel = "Lesson";
    if (catalog) {
      for (const catPack of catalog.packs) {
        for (const stage of catPack.stages) {
          const lesson = stage.lessons.find(l => l.id === lessonId);
          if (lesson) {
            foundLabel = lesson.label || lesson.id;
            break;
          }
        }
      }
    }
    setLessonLabel(foundLabel);

    // Get total lessons for this language
    let lessonTotal = 0;
    if (catalog) {
      for (const catPack of catalog.packs) {
        for (const stage of catPack.stages) {
          lessonTotal += stage.lessons.length;
        }
      }
    }
    setTotal(lessonTotal);
  }, [catalog, lastLang, langs]);

  if (!lastLang || !langs?.[lastLang]?.currentLessonId) return null;

  const langInfo = langs[lastLang];
  const completed = langInfo.completedLessons?.length ?? 0;
  const weak = langInfo.weakLessons?.length ?? 0;
  const lastOpened = langInfo.lastOpenedAt;
  const timeAgo = formatTimeAgo(lastOpened);

  const langMeta = TARGET_LANGUAGES.find(l => l.code === lastLang);
  const langFlag = langMeta?.flag || "🌍";
  const langLabel = langMeta?.label || lastLang;

  return (
    <div className="resume-card section-card lw-home-resume">
      <div className="resume-header">
        <h3 className="resume-title">Welcome back! 👋</h3>
        {langInfo?.studyStreak?.current > 0 && (
          <span className="resume-streak" aria-label={`${langInfo.studyStreak.current} day streak`}>
            🔥 {langInfo.studyStreak.current} day streak
          </span>
        )}
      </div>

      <div className="resume-main">
        <div className="resume-lang-row">
          <span className="resume-lang-flag" aria-hidden="true">{langFlag}</span>
          <span className="resume-lang-name">{langLabel}</span>
        </div>
        <div className="resume-lesson-row">
          <span className="resume-lesson-label">{lessonLabel}</span>
        </div>
      </div>

      <div className="resume-meta">
        <span className="resume-progress">
          {completed} / {total} lessons completed
        </span>
        <span className="resume-time">Last studied {timeAgo}</span>
        {weak > 0 && (
          <span className="resume-weak-badge" aria-label={`${weak} lesson${weak > 1 ? 's' : ''} need review`}>
            ⚠ {weak} lesson{weak > 1 ? 's' : ''} need review
          </span>
        )}
      </div>

      <div className="resume-actions">
        <button
          className="button button-primary resume-continue"
          type="button"
          onClick={onContinue}
          aria-label={`Continue ${langLabel} ${lessonLabel}`}
        >
          Continue {langFlag}
        </button>
        <button
          className="button button-ghost resume-review"
          type="button"
          onClick={onReview}
          aria-label="Review completed lessons"
        >
          Review
        </button>
        <button
          className="button button-ghost resume-switch"
          type="button"
          onClick={onChooseLanguage}
          aria-label="Choose another language"
        >
          Switch Language
        </button>
        <button
          className="button button-ghost resume-map"
          type="button"
          onClick={onViewMap}
          aria-label="View learning map"
        >
          View Map
        </button>
      </div>
    </div>
  );
}

function formatTimeAgo(dateString) {
  if (!dateString) return "recently";
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateString).toLocaleDateString();
}

