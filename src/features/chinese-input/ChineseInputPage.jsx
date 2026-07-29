import { useEffect, useMemo, useState } from "react";
import { getChineseInputLabAvailability } from "../../config/chineseInputLabConfig.js";
import { loadChineseInputDataset } from "./dataset.js";
import {
  configuredChineseCurriculumSource,
  loadGeneratedChineseInputDataset,
} from "./data/generated-curriculum-adapter.js";
import useChineseInputProgress from "./hooks/useChineseInputProgress.js";
import useChineseSpeech from "./hooks/useChineseSpeech.js";
import ChineseInputDashboard from "./components/ChineseInputDashboard.jsx";
import RootExplorer from "./components/RootExplorer.jsx";
import CharacterCollection from "./components/CharacterCollection.jsx";
import LessonPlayer from "./components/LessonPlayer.jsx";
import "./styles/chinese-input.css";

function buildAdaptiveReviewLesson(dataset, moduleProgress, method, now = Date.now()) {
  const candidates = dataset.characters
    .map((character) => ({ character, mastery: moduleProgress.characters?.[character.id]?.[method] }))
    .filter(({ mastery }) => mastery?.attempts && (
      (mastery.nextReviewAt && Date.parse(mastery.nextReviewAt) <= now)
      || (mastery.masteryScore || 0) < 80
    ))
    .sort((left, right) => {
      const leftDue = left.mastery.nextReviewAt && Date.parse(left.mastery.nextReviewAt) <= now ? 0 : 1;
      const rightDue = right.mastery.nextReviewAt && Date.parse(right.mastery.nextReviewAt) <= now ? 0 : 1;
      return leftDue - rightDue
        || (left.mastery.masteryScore || 0) - (right.mastery.masteryScore || 0)
        || left.character.id.localeCompare(right.character.id);
    })
    .slice(0, 20);
  if (!candidates.length) return null;
  return {
    id: `adaptive-review-${method}`,
    method,
    stage: 5,
    order: 99,
    title: { en: "Adaptive review", zhHant: "適應性複習" },
    introducedKeys: [],
    reviewedKeys: Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
    activeKeys: Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
    characterIds: candidates.map(({ character }) => character.id),
    preserveCharacterOrder: true,
    activityMix: { keyboardExplore: 0, rootRecognition: 0, guidedTyping: 10, characterBuild: 0 },
    passCriteria: { minimumAccuracy: 0.8, minimumQuestions: 10 },
    prerequisites: [],
    estimatedMinutes: 6,
    accessibilityNotes: "Weak and due characters are presented first without a time limit.",
  };
}

function LessonsView({ dataset, method, moduleProgress, onStartLesson }) {
  const lessons = dataset.lessons.filter((lesson) => lesson.method === method);
  return (
    <div data-testid="chinese-input-lessons">
      <section className="lw-card cil-section-heading">
        <div>
          <p className="lw-eyebrow">Progressive path</p>
          <h2>{method === "quick" ? "Quick lessons" : "Cangjie lessons"}</h2>
          <p className="lw-subtitle">Lessons move from keyboard exploration to root recall, construction, analysis and typing challenge.</p>
        </div>
      </section>
      <section className="cil-lesson-grid">
        {lessons.map((lesson) => {
          const saved = moduleProgress.lessons?.[lesson.id];
          const prerequisitesMet = lesson.prerequisites.every((id) => moduleProgress.lessons?.[id]?.status === "completed");
          const locked = lesson.order > 1 && !prerequisitesMet;
          return (
            <article className="lw-card cil-lesson-card" key={lesson.id}>
              <p className="lw-eyebrow">Stage {lesson.stage}</p>
              <h3>{lesson.title.en}</h3>
              <p lang="zh-Hant">{lesson.title.zhHant}</p>
              <p>{lesson.estimatedMinutes} min · {lesson.activeKeys.length} active keys</p>
              <span className={`lw-chip ${saved?.status === "completed" ? "green" : "blue"}`}>
                {saved?.status || (locked ? "Recommended after earlier lesson" : "Ready")}
              </span>
              <button
                className="lw-btn lw-btn-primary"
                type="button"
                onClick={() => onStartLesson(lesson.id)}
                aria-label={`Start ${lesson.title.en}`}
              >
                {saved?.status === "completed" ? "Practise again" : "Start"}
              </button>
            </article>
          );
        })}
      </section>
    </div>
  );
}

export default function ChineseInputPage() {
  const availability = getChineseInputLabAvailability();
  const {
    prefs,
    moduleProgress,
    updatePrefs,
    recordAttempt,
    completeSession,
    migrateCurriculum,
  } = useChineseInputProgress();
  const method = prefs.method === "quick" ? "quick" : "cangjie";
  const [view, setView] = useState(() => prefs.lastView || "dashboard");
  const [lessonId, setLessonId] = useState("");
  const [sessionLesson, setSessionLesson] = useState(null);
  const speechLocale = prefs.locale === "zh-TW" ? "zh-TW" : "zh-HK";
  const speechEnabled = prefs.speechEnabled !== false;
  const { pronounce, message: speechMessage } = useChineseSpeech(speechEnabled, speechLocale);
  const curriculumSource = useMemo(() => configuredChineseCurriculumSource(), []);
  const legacyDatasetResult = useMemo(() => {
    try {
      return { dataset: loadChineseInputDataset(), error: null, warning: "", loading: false };
    } catch (error) {
      return { dataset: null, error, warning: "", loading: false };
    }
  }, []);
  const [generatedDatasetResult, setGeneratedDatasetResult] = useState({
    dataset: null,
    error: null,
    warning: "",
    loading: curriculumSource !== "legacy",
  });
  useEffect(() => {
    if (curriculumSource === "legacy") return undefined;
    let cancelled = false;
    loadGeneratedChineseInputDataset({ source: curriculumSource })
      .then((result) => {
        if (!cancelled) {
          migrateCurriculum({
            migration: result.bundle.migration,
            lessons: result.bundle.lessons.lessons,
            inputDigest: result.bundle.manifest.inputDigest,
          });
          setGeneratedDatasetResult({ ...result, error: null, loading: false });
        }
      })
      .catch((error) => {
        if (!cancelled) setGeneratedDatasetResult({ dataset: null, error, warning: "", loading: false });
      });
    return () => { cancelled = true; };
  }, [curriculumSource, migrateCurriculum]);
  const datasetResult = curriculumSource === "legacy" ? legacyDatasetResult : generatedDatasetResult;

  if (!availability.routeEnabled) {
    return (
      <section className="lw-page lw-card">
        <h1>Chinese Input Lab is not available</h1>
        <p>This module is currently disabled.</p>
      </section>
    );
  }
  if (datasetResult.error) {
    return (
      <section className="lw-page lw-card" data-testid="chinese-input-data-error">
        <h1>Chinese Input Lab data could not be loaded</h1>
        <p>The verified dataset failed its safety checks. Other learning modules are unaffected.</p>
      </section>
    );
  }
  if (datasetResult.loading) {
    return (
      <section className="lw-page lw-card" data-testid="chinese-input-curriculum-loading">
        <h1>Loading generated Chinese curriculum…</h1>
        <p>The curriculum schema and source digests are being checked before rendering.</p>
      </section>
    );
  }
  const dataset = datasetResult.dataset;
  const reviewLesson = buildAdaptiveReviewLesson(dataset, moduleProgress, method);
  const activeLesson = dataset.lessons.find((lesson) => lesson.id === lessonId)
    || (sessionLesson?.id === lessonId ? sessionLesson : null);

  function openView(nextView) {
    setLessonId("");
    setSessionLesson(null);
    setView(nextView);
    updatePrefs({ lastView: nextView });
  }

  function startLesson(nextLessonId, lessonOverride = null) {
    if (!nextLessonId) return;
    setSessionLesson(lessonOverride);
    setLessonId(nextLessonId);
    updatePrefs({ lastLessonId: nextLessonId, lastView: "lessons" });
  }

  function changeMethod(nextMethod) {
    updatePrefs({ method: nextMethod });
    setLessonId("");
    setSessionLesson(null);
  }

  return (
    <div className="lw-page cil-page" data-testid="chinese-input-page">
      {datasetResult.warning && (
        <section className="lw-card" role="status" data-testid="chinese-input-preview-warning">
          <strong>Preview curriculum</strong>
          <p>{datasetResult.warning}</p>
        </section>
      )}
      {view !== "dashboard" && !activeLesson && (
        <button className="lw-btn lw-btn-ghost cil-back-button" type="button" onClick={() => openView("dashboard")}>
          ← Chinese Input dashboard
        </button>
      )}
      {activeLesson ? (
        <LessonPlayer
          dataset={dataset}
          lesson={activeLesson}
          method={activeLesson.method}
          guidanceLevel={prefs.guidanceLevel || "full"}
          pronounce={pronounce}
          autoPronounce={speechEnabled && prefs.autoPronounce !== false}
          recordAttempt={recordAttempt}
          completeSession={completeSession}
          onExit={() => {
            setLessonId("");
            setSessionLesson(null);
            setView("lessons");
          }}
        />
      ) : view === "roots" ? (
        <RootExplorer pronounce={pronounce} />
      ) : view === "lessons" ? (
        <LessonsView dataset={dataset} method={method} moduleProgress={moduleProgress} onStartLesson={startLesson} />
      ) : view === "review" ? (
        <CharacterCollection
          dataset={dataset}
          method={method}
          moduleProgress={moduleProgress}
          pronounce={pronounce}
          reviewOnly
          reviewCount={reviewLesson?.characterIds.length || 0}
          onStartReview={() => startLesson(reviewLesson?.id, reviewLesson)}
        />
      ) : view === "collection" ? (
        <CharacterCollection dataset={dataset} method={method} moduleProgress={moduleProgress} pronounce={pronounce} />
      ) : (
        <ChineseInputDashboard
          dataset={dataset}
          method={method}
          moduleProgress={moduleProgress}
          onMethodChange={changeMethod}
          onOpenView={openView}
          onStartLesson={startLesson}
        />
      )}
      {speechMessage && (
        <p className="lw-card lw-subtitle" role="status">{speechMessage}</p>
      )}
      {!activeLesson && (
        <section className="lw-card cil-settings">
          <h2>Lab settings</h2>
          <label>
            <span>Keyboard guidance</span>
            <select value={prefs.guidanceLevel || "full"} onChange={(event) => updatePrefs({ guidanceLevel: event.target.value })}>
              <option value="full">Full</option>
              <option value="expected">Expected key only</option>
              <option value="learned">Learned keys only</option>
              <option value="off">Off</option>
            </select>
          </label>
          <label>
            <span>Pronunciation voice</span>
            <select
              data-testid="chinese-input-pronunciation-locale"
              value={speechLocale}
              onChange={(event) => updatePrefs({ locale: event.target.value })}
            >
              <option value="zh-HK">Cantonese</option>
              <option value="zh-TW">Mandarin (Taiwan)</option>
            </select>
          </label>
          <label className="cil-checkbox">
            <input type="checkbox" checked={speechEnabled} onChange={(event) => updatePrefs({ speechEnabled: event.target.checked })} />
            <span>Enable pronunciation controls</span>
          </label>
          <label className="cil-checkbox">
            <input
              data-testid="chinese-input-auto-pronounce"
              type="checkbox"
              checked={prefs.autoPronounce !== false}
              disabled={!speechEnabled}
              onChange={(event) => updatePrefs({ autoPronounce: event.target.checked })}
            />
            <span>Auto-pronounce each new character</span>
          </label>
        </section>
      )}
    </div>
  );
}
