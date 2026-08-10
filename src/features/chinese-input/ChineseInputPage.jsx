import { useCallback, useEffect, useMemo, useState } from "react";
import { getChineseInputLabAvailability } from "../../config/chineseInputLabConfig.js";
import { useMiniGame } from "../../react/games/framework/MiniGameProvider.jsx";
import { LearningRuntimeProvider } from "../../learning-runtime/runtime/LearningRuntimeProvider.tsx";
import { useLearningRuntimeProgress } from "../../learning-runtime/runtime/useLearningRuntimeProgress.ts";
import ChineseFootballGame from "./components/ChineseFootballGame.jsx";
import LessonPlayer from "./components/LessonPlayer.jsx";
import WordChallenge from "./components/WordChallenge.jsx";
import {
  configuredChineseCurriculumSource,
  loadGeneratedChineseInputDataset,
} from "./data/generated-curriculum-adapter.js";
import useChineseInputProgress from "./hooks/useChineseInputProgress.js";
import useChineseSpeech from "./hooks/useChineseSpeech.js";
import ChineseInputKingdom from "./kingdom/ChineseInputKingdom.jsx";
import { chineseInputWorldAdapter } from "./runtime/chinese-input-world-adapter.ts";
import {
  buildFootballChallengeLesson,
  buildKingdomModel,
} from "./kingdom/kingdom-model.js";
import { buildWordDependencyIndex } from "./domain/word-unlock-engine.js";
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

export default function ChineseInputPage() {
  const availability = getChineseInputLabAvailability();
  const {
    prefs,
    moduleProgress,
    updatePrefs,
    recordAttempt,
    completeSession,
    completeGameSession,
    recordWordAttempt,
    discoverNode,
    migrateCurriculum,
  } = useChineseInputProgress();
  const {
    profile: miniGameProfile,
    recordResult: recordMiniGameResult,
  } = useMiniGame();
  const { checkpoint: runtimeCheckpoint, saveCheckpoint: saveRuntimeCheckpoint } = useLearningRuntimeProgress("foxchild.chinese-input");
  const method = prefs.method === "quick" ? "quick" : "cangjie";
  const [panel, setPanel] = useState("");
  const [sessionLesson, setSessionLesson] = useState(null);
  const [sessionType, setSessionType] = useState("");
  const [wordChallenge, setWordChallenge] = useState(null);
  const [completion, setCompletion] = useState(null);
  const speechLocale = prefs.locale === "zh-TW" ? "zh-TW" : "zh-HK";
  const speechEnabled = prefs.speechEnabled !== false;
  const { pronounce, message: speechMessage } = useChineseSpeech(speechEnabled, speechLocale);
  const curriculumSource = useMemo(() => configuredChineseCurriculumSource(), []);
  const runtimeClock = useMemo(() => new Date().toISOString(), [curriculumSource, method]);
  const [generatedDatasetResult, setGeneratedDatasetResult] = useState({
    dataset: null,
    error: null,
    warning: "",
    loading: true,
  });

  useEffect(() => {
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

  const datasetResult = generatedDatasetResult;
  const datasetForIndex = datasetResult.dataset;
  const wordIndex = useMemo(() => datasetForIndex ? buildWordDependencyIndex({
    words: datasetForIndex.words,
    wordGraph: datasetForIndex.wordGraph,
    datasetVersion: datasetForIndex.manifest.datasetVersion,
  }) : { wordsById: {}, wordIdsByCharacterId: {}, wordIdsByLessonId: {}, wordCount: 0, mappedWordCount: 0, excludedWords: [] }, [datasetForIndex]);
  const recordChineseAttempt = useCallback((attempt) => recordAttempt({ ...attempt, wordIndex }), [recordAttempt, wordIndex]);
  const recentWordDiscoveries = useMemo(() => (moduleProgress.wordDiscoveryEvents || [])
    .slice(-8)
    .map((event) => wordIndex.wordsById[event.wordId])
    .filter(Boolean), [moduleProgress.wordDiscoveryEvents, wordIndex]);
  const dataset = datasetResult.dataset;
  const reviewLesson = useMemo(() => !dataset || sessionLesson ? null : buildAdaptiveReviewLesson(dataset, moduleProgress, method), [dataset, method, moduleProgress, sessionLesson]);
  const model = useMemo(() => !dataset || sessionLesson ? null : buildKingdomModel({
    dataset,
    moduleProgress,
    miniGameProfile,
    method,
    preferredJourneyId: prefs.activeJourneyId || prefs.lastLessonId,
    currentRootKey: prefs.currentRootKey || "A",
  }), [dataset, method, miniGameProfile, moduleProgress, prefs.activeJourneyId, prefs.currentRootKey, prefs.lastLessonId, sessionLesson]);

  if (!availability.routeEnabled) {
    return <section className="lw-page lw-card"><h1>Chinese Input Kingdom is not available</h1><p>This module is currently disabled.</p></section>;
  }
  if (datasetResult.error) {
    return <section className="lw-page lw-card" data-testid="chinese-input-data-error"><h1>Chinese Input data could not be loaded</h1><p>The verified dataset failed its safety checks. Other learning modules are unaffected.</p></section>;
  }
  if (datasetResult.loading) {
    return <section className="lw-page lw-card" data-testid="chinese-input-curriculum-loading"><h1>Opening Chinese Input Kingdom…</h1><p>The curriculum schema and source digests are being checked before rendering.</p></section>;
  }

  function startLesson(lesson) {
    if (!lesson) return;
    setPanel("");
    setCompletion(null);
    setSessionLesson(lesson);
    setSessionType("lesson");
    updatePrefs({ activeJourneyId: lesson.id, lastLessonId: lesson.id, lastWorldView: "kingdom" });
  }

  function startWordChallenge(word) {
    if (!word) return;
    setPanel("");
    setCompletion(null);
    setWordChallenge(word);
    setSessionLesson({ id: `word-challenge-${word.wordId}`, title: { en: `Word challenge: ${word.word}` }, method });
    setSessionType("word");
  }

  function startReview() {
    if (reviewLesson) startLesson(reviewLesson);
  }

  function startFootballChallenge(challengeId) {
    const lesson = buildFootballChallengeLesson({
      challengeId,
      dataset,
      moduleProgress,
      method,
      journeyLesson: model.journey?.lesson,
      reviewLesson,
      currentRootKey: model.currentRoot.key,
    });
    if (!lesson) return;
    setPanel("");
    setCompletion(null);
    setSessionLesson(lesson);
    setSessionType("football");
  }

  function finishSession(result = {}) {
    const finishedType = sessionType;
    setSessionLesson(null);
    setSessionType("");
    setWordChallenge(null);
    saveRuntimeCheckpoint(null);
    setCompletion(result.completed === false ? null : { type: finishedType, passed: result.passed !== false });
  }

  function selectRoot(key, characterId = "") {
    updatePrefs({ currentRootKey: key });
    discoverNode(`root-${key.toLowerCase()}`, "root");
    if (characterId) discoverNode(characterId, "character");
  }

  function changeMethod(nextMethod) {
    saveRuntimeCheckpoint(null);
    updatePrefs({ method: nextMethod, activeJourneyId: "" });
    setPanel("");
  }

  const runtimeContext = {
    method,
    currentRootKey: prefs.currentRootKey || "A",
    preferredJourneyId: prefs.activeJourneyId || prefs.lastLessonId || model?.journey?.id || "",
  };

  if (sessionLesson) {
    return (
      <div className={`lw-page cil-page flr-session-shell${sessionType === "lesson" ? " is-lesson-session" : ""}`} data-testid="chinese-input-page">
      {sessionType === "word" ? (
        <WordChallenge word={wordChallenge} dataset={dataset} pronounce={pronounce} recordWordAttempt={recordWordAttempt} onExit={finishSession} />
      ) : sessionType === "football" ? (
        <ChineseFootballGame
          dataset={dataset}
          lesson={sessionLesson}
          method={sessionLesson.method}
          recordAttempt={recordChineseAttempt}
          completeSession={completeSession}
          completeGameSession={completeGameSession}
          miniGameProfile={miniGameProfile}
          recordMiniGameResult={recordMiniGameResult}
          pronounce={pronounce}
          autoPronounce={speechEnabled && prefs.autoPronounce !== false}
          onExit={finishSession}
        />
      ) : (
        <LessonPlayer
          dataset={dataset}
          lesson={sessionLesson}
          method={sessionLesson.method}
          pronounce={pronounce}
          autoPronounce={speechEnabled && prefs.autoPronounce !== false}
          recordAttempt={recordChineseAttempt}
          completeSession={completeSession}
          onExit={finishSession}
        />
      )}
      {speechMessage && <p className="lw-card lw-subtitle" role="status">{speechMessage}</p>}
      </div>
    );
  }

  return (
    <LearningRuntimeProvider
      adapter={chineseInputWorldAdapter}
      dataset={dataset}
      progress={moduleProgress}
      adapterContext={runtimeContext}
      now={runtimeClock}
      seed={`${runtimeClock.slice(0, 10)}:${method}`}
      checkpoint={runtimeCheckpoint}
      onCheckpointChange={saveRuntimeCheckpoint}
    >
      <div data-testid="chinese-input-page">
          <ChineseInputKingdom
            dataset={dataset}
            method={method}
            moduleProgress={moduleProgress}
            miniGameProfile={miniGameProfile}
            model={model}
            wordIndex={wordIndex}
            onStartWordChallenge={startWordChallenge}
            panel={panel}
            prefs={prefs}
            reviewLesson={reviewLesson}
            pronounce={pronounce}
            onMethodChange={changeMethod}
            onOpenPanel={setPanel}
            onStartLesson={startLesson}
            onStartReview={startReview}
            onStartFootballChallenge={startFootballChallenge}
            onSelectRoot={selectRoot}
            onUpdatePrefs={updatePrefs}
          />
          {completion && (
            <div className="cik-overlay-layer">
              <div className="cik-overlay-scrim" />
              <section className="cik-overlay cik-completion" role="dialog" aria-modal="true" aria-labelledby="cik-completion-title">
                <div className="cik-overlay-body">
                  <p className="cik-eyebrow">Journey recorded</p>
                  <h2 id="cik-completion-title">{completion.passed ? "Knowledge gained" : "Practice added"}</h2>
                  <p>Choose your next action. Nothing is locked and your mastery evidence is saved locally.</p>
                  {recentWordDiscoveries.length > 0 && <section className="cik-word-discovery" data-testid="chinese-input-word-discovery"><p className="cik-eyebrow">New words discovered</p><h3>{recentWordDiscoveries.length} new word{recentWordDiscoveries.length === 1 ? "" : "s"}</h3><div className="cik-word-discovery-grid">{recentWordDiscoveries.slice(0, 3).map((word) => <article key={word.wordId}><strong lang="zh-Hant">{word.word}</strong><span>{word.meaning || "Meaning pending educational review"}</span><small>Discovered · not mastered</small></article>)}</div><p className="cik-word-discovery-note">These words are now available for a short challenge or later review.</p></section>}
                  <div className="cik-choice-grid">
                    {recentWordDiscoveries[0] && <button type="button" onClick={() => startWordChallenge(recentWordDiscoveries[0])}><strong>Try a word challenge</strong><span>Practise meaning, order and typing.</span></button>}
                    <button type="button" onClick={() => { setCompletion(null); startLesson(model.journey?.lesson); }}><strong>Continue journey</strong><span>Follow the next recommendation.</span></button>
                    <button type="button" onClick={() => { setCompletion(null); setPanel("explore"); }}><strong>Choose another root</strong><span>Explore any keyboard mapping.</span></button>
                    <button type="button" onClick={() => { setCompletion(null); setPanel("review"); }}><strong>Review</strong><span>Revisit due or weaker characters.</span></button>
                    <button type="button" onClick={() => { setCompletion(null); setPanel("arena"); }}><strong>Arena</strong><span>Use a compatible game challenge.</span></button>
                    <button type="button" onClick={() => { setCompletion(null); setPanel("collection"); }}><strong>Collection</strong><span>Visit your museum.</span></button>
                    <button type="button" onClick={() => setCompletion(null)}><strong>Return to Kingdom</strong><span>See the knowledge world.</span></button>
                  </div>
                </div>
              </section>
            </div>
          )}
          {speechMessage && <p className="lw-card lw-subtitle" role="status">{speechMessage}</p>}
      </div>
    </LearningRuntimeProvider>
  );
}
