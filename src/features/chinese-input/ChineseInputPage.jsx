import { useEffect, useMemo, useState } from "react";
import { getChineseInputLabAvailability } from "../../config/chineseInputLabConfig.js";
import { buildChineseDirectorModel } from "./director/chinese-director.js";
import { configuredChineseCurriculumSource, loadGeneratedChineseInputDataset } from "./data/generated-curriculum-adapter.js";
import useChineseInputProgress from "./hooks/useChineseInputProgress.js";
import useChineseSpeech from "./hooks/useChineseSpeech.js";
import ChineseInputWorldHome from "./components/ChineseInputWorldHome.jsx";
import RootExplorer from "./components/RootExplorer.jsx";
import CharacterCollection from "./components/CharacterCollection.jsx";
import LessonPlayer from "./components/LessonPlayer.jsx";
import ChineseFootballGame from "./components/ChineseFootballGame.jsx";
import FloatingFlower from "../../react/learning-world/FloatingFlower.jsx";
import WorldOverlay from "../../react/learning-world/WorldOverlay.jsx";
import { useMiniGame } from "../../react/games/framework/MiniGameProvider.jsx";
import "./styles/chinese-input.css";

function JourneyPicker({ model, onStart, onStartFootball }) {
  return <div className="cik-choice-grid" data-testid="chinese-input-journey-picker">{model.lessons.map((lesson) => <article className="cik-choice-card" key={lesson.id}><p className="lw-eyebrow">Journey</p><h3>{lesson.title.en}</h3><p lang="zh-Hant">{lesson.title.zhHant}</p><p>{lesson.estimatedMinutes || 5} min · {lesson.characterIds?.length || 0} verified characters</p><div className="lw-btn-group"><button className="lw-btn lw-btn-primary" type="button" onClick={() => onStart(lesson)}>Start Journey</button><button className="lw-btn lw-btn-secondary" type="button" onClick={() => onStartFootball(lesson)}>Arena</button></div></article>)}</div>;
}

function WhyPanel({ model }) {
  const copy = { REVIEW_DUE: "Some characters are ready to revisit.", RESUME_SESSION: "You can safely continue the saved session from this world.", CONTINUE_CHAPTER: "It continues the journey you were already exploring.", NEW_FOUNDATION: "It introduces a reviewed foundation for the next group of characters.", WEAK_KNOWLEDGE: "It gives extra practice to a developing skill.", LEARNER_SELECTED_NODE: "It follows the focus you selected.", ARENA_READY: "This content is ready for a compatible game challenge.", EXPEDITION_PRIORITY: "It supports an active optional objective." };
  return <div className="cik-why-panel" data-testid="chinese-input-why"><p className="lw-subtitle">{model.learner.hasEvidence ? "FoxChild chose this as a useful next step from your local learning evidence." : "This is a reviewed starting point while FoxChild learns what you want to practise."}</p><ul>{model.reasonCodes.map((reason) => <li key={reason}>{copy[reason] || "It is a useful next step for your current practice."}</li>)}</ul><p className="cik-standard-note">Recommendations are guidance, not locks. You can choose another activity at any time.</p></div>;
}

function ProgressPanel({ model, moduleProgress }) {
  const events = model.learner.recentAttempts;
  const accuracy = events.length ? Math.round(events.filter((event) => event.correct).length / events.length * 100) : 0;
  const roots = Object.values(moduleProgress.roots || {});
  const characters = Object.values(moduleProgress.characters || {}).map((record) => record?.[model.method]).filter(Boolean);
  const dimensions = [["Keyboard familiarity", Math.round(roots.filter((root) => root.exposures > 0).length / 26 * 100)], ["Root recognition", Math.round(roots.reduce((sum, root) => sum + (root.masteryScore || 0), 0) / Math.max(1, roots.length))], ["Character recall", Math.round(characters.reduce((sum, record) => sum + (record.masteryScore || 0), 0) / Math.max(1, characters.length))], ["Recent accuracy", accuracy], ["Exploration", Math.min(100, Object.keys(moduleProgress.discoveredNodes || {}).length)]];
  return <div className="cik-progress-panel" data-testid="chinese-input-progress-panel"><p className="lw-subtitle">Your Garden shows separate evidence dimensions. It is not one completion score.</p><div className="cik-dimension-list">{dimensions.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}%</strong><progress max="100" value={Math.min(100, value)}>{value}%</progress></div>)}</div><p className="cik-standard-note">Method: {model.method === "quick" ? "Quick 速成" : "Cangjie 5 倉頡五代"}. Evidence stays separate from cosmetic game rewards.</p></div>;
}

function SettingsPanel({ prefs, updatePrefs }) {
  const speechEnabled = prefs.speechEnabled !== false;
  return <div className="cik-settings-panel" data-testid="chinese-input-settings-panel"><label><span>Pronunciation voice</span><select data-testid="chinese-input-pronunciation-locale" value={prefs.locale === "zh-TW" ? "zh-TW" : "zh-HK"} onChange={(event) => updatePrefs({ locale: event.target.value })}><option value="zh-HK">Cantonese</option><option value="zh-TW">Mandarin (Taiwan)</option></select></label><label className="cil-checkbox"><input type="checkbox" checked={speechEnabled} onChange={(event) => updatePrefs({ speechEnabled: event.target.checked })} /><span>Enable pronunciation controls</span></label><label className="cil-checkbox"><input data-testid="chinese-input-auto-pronounce" type="checkbox" checked={prefs.autoPronounce !== false} disabled={!speechEnabled} onChange={(event) => updatePrefs({ autoPronounce: event.target.checked })} /><span>Auto-pronounce each new character</span></label><label className="cil-checkbox"><input type="checkbox" checked={prefs.accessibleListView === true} onChange={(event) => updatePrefs({ accessibleListView: event.target.checked })} /><span>Use accessible knowledge list view</span></label></div>;
}

export default function ChineseInputPage() {
  const availability = getChineseInputLabAvailability();
  const { prefs, moduleProgress, updatePrefs, recordAttempt, completeSession, completeGameSession, beginSession, abandonSession, checkpointSession, discoverNode, migrateCurriculum } = useChineseInputProgress();
  const { profile: miniGameProfile, recordResult: recordMiniGameResult } = useMiniGame();
  const method = prefs.method === "quick" ? "quick" : "cangjie";
  const speechLocale = prefs.locale === "zh-TW" ? "zh-TW" : "zh-HK";
  const speechEnabled = prefs.speechEnabled !== false;
  const { pronounce, message: speechMessage } = useChineseSpeech(speechEnabled, speechLocale);
  const curriculumSource = useMemo(() => configuredChineseCurriculumSource(), []);
  const [generatedDatasetResult, setGeneratedDatasetResult] = useState({ dataset: null, error: null, warning: "", loading: true });
  const [panel, setPanel] = useState("");
  const [sessionLesson, setSessionLesson] = useState(null);
  const [sessionType, setSessionType] = useState("");
  const [completion, setCompletion] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadGeneratedChineseInputDataset({ source: curriculumSource }).then((result) => { if (!cancelled) { migrateCurriculum({ migration: result.bundle.migration, lessons: result.bundle.lessons.lessons, inputDigest: result.bundle.manifest.inputDigest }); setGeneratedDatasetResult({ ...result, error: null, loading: false }); } }).catch((error) => { if (!cancelled) setGeneratedDatasetResult({ dataset: null, error, warning: "", loading: false }); });
    return () => { cancelled = true; };
  }, [curriculumSource, migrateCurriculum]);

  const datasetResult = generatedDatasetResult;
  const dataset = datasetResult.dataset;
  const model = useMemo(() => dataset ? buildChineseDirectorModel({ dataset, moduleProgress, method, preferredId: prefs.activeJourneyId || prefs.lastLessonId, currentRootKey: prefs.currentRootKey || "A", now: Date.now() }) : null, [dataset, method, moduleProgress, prefs.activeJourneyId, prefs.currentRootKey, prefs.lastLessonId]);

  if (!availability.routeEnabled) return <section className="lw-page lw-card"><h1>Chinese Input is not available</h1><p>This world is currently disabled.</p></section>;
  if (datasetResult.error) return <section className="lw-page lw-card" data-testid="chinese-input-data-error"><h1>Chinese Input data could not be loaded</h1><p>The verified dataset failed its safety checks. Other learning worlds are unaffected.</p></section>;
  if (datasetResult.loading || !dataset || !model) return <section className="lw-page lw-card" data-testid="chinese-input-curriculum-loading"><h1>Opening Chinese Input Kingdom…</h1><p>The curriculum schema and source digests are being checked before rendering.</p></section>;

  function openPanel(nextPanel) { setPanel(nextPanel === "world" ? "" : nextPanel); }
  function planFor(candidate, intent = "journey") {
    if (candidate?.id === model.selected?.id && model.learner.activeSession?.plan?.sessionId && model.reasonCodes.includes("RESUME_SESSION")) return model.learner.activeSession.plan;
    return buildChineseDirectorModel({ dataset, moduleProgress, method, preferredId: candidate?.id || "", intent, requestId: `start:${Date.now()}:${candidate?.id || "unknown"}`, currentRootKey: prefs.currentRootKey || "A", now: Date.now() }).sessionPlan;
  }
  function startSession(candidate, type = "lesson") {
    if (!candidate) return;
    const plan = planFor(candidate, type === "football" ? "arena" : type === "review" ? "review" : type === "training" ? "training" : "journey");
    setPanel(""); setCompletion(null); setSessionLesson(candidate); setSessionType(type);
    beginSession(plan);
    updatePrefs({ activeJourneyId: candidate.kind === "review" ? "" : candidate.id, lastLessonId: candidate.id, lastView: "session" });
  }
  function startFootball(candidate = model.selected) { startSession(candidate, "football"); }
  function finishSession() { const finishedType = sessionType; abandonSession("user-exit"); setSessionLesson(null); setSessionType(""); setCompletion({ type: finishedType }); updatePrefs({ lastView: "world" }); }
  function selectRoot(key) { updatePrefs({ currentRootKey: key, lastWorldView: "world" }); discoverNode(`root-${key.toLowerCase()}`, "root"); }
  function changeMethod(nextMethod) { updatePrefs({ method: nextMethod, activeJourneyId: "", lastWorldView: "world" }); setPanel(""); }

  const activeDirectorPlan = moduleProgress.activeSession
    ? { ...moduleProgress.activeSession.plan, status: moduleProgress.activeSession.status, cursor: moduleProgress.activeSession.cursor || {} }
    : model.sessionPlan;
  if (sessionLesson) return <div className="lw-page cil-page" data-testid="chinese-input-page">{sessionType === "football" ? <ChineseFootballGame dataset={dataset} lesson={sessionLesson} directorPlan={activeDirectorPlan} method={sessionLesson.method} recordAttempt={recordAttempt} completeSession={completeSession} completeGameSession={completeGameSession} miniGameProfile={miniGameProfile} recordMiniGameResult={recordMiniGameResult} pronounce={pronounce} autoPronounce={speechEnabled && prefs.autoPronounce !== false} onExit={finishSession} /> : <LessonPlayer dataset={dataset} lesson={sessionLesson} reviewLesson={sessionType === "lesson" ? model.reviewLesson : null} directorPlan={activeDirectorPlan} method={sessionLesson.method} pronounce={pronounce} autoPronounce={speechEnabled && prefs.autoPronounce !== false} recordAttempt={recordAttempt} completeSession={completeSession} checkpointSession={checkpointSession} onExit={finishSession} />}{speechMessage && <p className="lw-card lw-subtitle" role="status">{speechMessage}</p>}</div>;

  const actions = [{ id: "journeys", label: "Choose Journey", shortLabel: "Journey", icon: "▶", recommended: Boolean(model.selected && model.selected.kind !== "review") }, { id: "training", label: "Training", shortLabel: "Training", icon: "✦", description: "Practise a focused skill." }, { id: "review", label: "Review", shortLabel: "Review", icon: "↻", status: model.learner.dueCount ? `${model.learner.dueCount} ready` : "Healthy" }, { id: "explore", label: "Explore", shortLabel: "Explore", icon: "⌕" }, { id: "football", label: "Football Arena", shortLabel: "Arena", icon: "⚽" }, { id: "collection", label: "Collection & Search", shortLabel: "Collection", icon: "▣" }, { id: "progress", label: "Knowledge Garden", shortLabel: "Garden", icon: "◔" }, { id: "settings", label: "Settings", shortLabel: "Settings", icon: "⚙" }];
  const panelTitles = { journeys: "Choose a Journey", training: "Focused Training", review: "Review", explore: "Explore the Knowledge World", football: "Football Arena", collection: "Collection & Search", progress: "Knowledge Garden", keyboard: "Root Workbench", why: "Why this Journey?", settings: "Kingdom Settings" };

  return <div className="lw-page cil-page" data-testid="chinese-input-page"><ChineseInputWorldHome dataset={dataset} method={method} moduleProgress={moduleProgress} model={model} prefs={prefs} warning={datasetResult.warning} pronounce={pronounce} onMethodChange={changeMethod} onOpenPanel={openPanel} onStart={(candidate) => startSession(candidate)} onSelectRoot={selectRoot} onToggleList={() => updatePrefs({ accessibleListView: prefs.accessibleListView !== true })} onToggleCompanion={() => updatePrefs({ companionMinimized: prefs.companionMinimized !== true })} /><FloatingFlower actions={actions} activePanel={panel} onAction={openPanel} />{panel && <WorldOverlay title={panelTitles[panel] || "Learning World"} eyebrow="Chinese Input Kingdom" onClose={() => setPanel("")} wide={["journeys", "collection", "review", "football"].includes(panel)}>{panel === "journeys" && <div className="cik-choice-grid" data-testid="chinese-input-journey-picker">{model.lessons.map((lesson) => <article className="cik-choice-card" key={lesson.id}><p className="lw-eyebrow">Journey</p><h3>{lesson.title.en}</h3><p lang="zh-Hant">{lesson.title.zhHant}</p><p>{lesson.estimatedMinutes || 5} min · {lesson.characterIds?.length || 0} verified characters</p><div className="lw-btn-group"><button className="lw-btn lw-btn-primary" type="button" onClick={() => startSession(lesson)}>Start Journey</button><button className="lw-btn lw-btn-secondary" type="button" onClick={() => startFootball(lesson)}>Arena</button></div></article>)}</div>}{panel === "training" && <div className="cik-choice-grid"><button className="cik-choice-card" type="button" onClick={() => startSession(model.selected, "training")}><strong>Practise the current recommendation</strong><span>Keep the focus narrow and work at your pace.</span></button><button className="cik-choice-card" type="button" onClick={() => openPanel("keyboard")}><strong>Choose a root</strong><span>Open the workbench and select any keyboard root.</span></button></div>}{panel === "review" && <CharacterCollection dataset={dataset} method={method} moduleProgress={moduleProgress} pronounce={pronounce} reviewOnly reviewCount={model.reviewLesson?.characterIds.length || 0} onStartReview={() => startSession(model.reviewLesson, "review")} />}{(panel === "explore" || panel === "keyboard") && <RootExplorer pronounce={pronounce} />}{panel === "collection" && <CharacterCollection dataset={dataset} method={method} moduleProgress={moduleProgress} pronounce={pronounce} />}{panel === "football" && <div className="cik-choice-grid"><button className="cik-choice-card" type="button" onClick={() => startFootball(model.selected)} disabled={!model.selected}><span className="cik-choice-icon" aria-hidden="true">⚽</span><strong>Play with today’s focus</strong><span>Type the canonical code to make the save. Pronunciation follows your settings.</span></button></div>}{panel === "progress" && <ProgressPanel model={model} moduleProgress={moduleProgress} />}{panel === "why" && <WhyPanel model={model} />}{panel === "settings" && <SettingsPanel prefs={prefs} updatePrefs={updatePrefs} />}</WorldOverlay>}{completion && <WorldOverlay title="Journey recorded" eyebrow="Saved locally" onClose={() => setCompletion(null)}><div className="cik-completion-panel" data-testid="chinese-input-completion-choice"><h3>What would you like to do next?</h3><p>Your completed answers are saved. Choose another action, or finish for now.</p><div className="cik-choice-grid"><button className="cik-choice-card" type="button" onClick={() => { setCompletion(null); startSession(model.selected); }}><strong>Continue Journey</strong><span>Follow the current recommendation.</span></button><button className="cik-choice-card" type="button" onClick={() => { setCompletion(null); setPanel("review"); }}><strong>Review</strong><span>Revisit characters ready now.</span></button><button className="cik-choice-card" type="button" onClick={() => { setCompletion(null); setPanel("explore"); }}><strong>Explore</strong><span>Choose any root in the world.</span></button><button className="cik-choice-card" type="button" onClick={() => { setCompletion(null); setPanel("football"); }}><strong>Arena</strong><span>Use a compatible game challenge.</span></button><button className="cik-choice-card" type="button" onClick={() => setCompletion(null)}><strong>Finish for now</strong><span>Return to the world when you are ready.</span></button></div></div></WorldOverlay>}{speechMessage && <p className="lw-card lw-subtitle" role="status">{speechMessage}</p>}</div>;
}
