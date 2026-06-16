/**
 * ArcadeGamePage.jsx — "FoxChild Arcade Learning" mode.
 *
 * Setup screen → pick mode (Quiz Hunt / Snake Builder), subject, pack, and map
 * style → play. Reuses the existing manifest + normalised loaders + progress
 * providers. No parallel content or storage system.
 *
 * Architecture
 *   ArcadeGamePage           orchestration: setup, content load, progress, sound
 *     ├─ QuizHuntGame        Mode 1 (vocab → hunt)
 *     └─ SnakeBuilderGame    Mode 2 (builder → ordered snake)
 *   engine/  grid + game loop      hooks/  controls, content, sound, metrics
 *   maps/    layouts               ui/     HUD, D-pad, overlay
 *   utils/   gameQuestionAdapter   components/ GameBoard
 */
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useManifest } from "../../context/ManifestContext.jsx";
import { useProgress } from "../../context/ProgressContext.jsx";
import { SubjectCardGrid } from "../../components/layout/SubjectCardGrid.jsx";
import { LabeledSelect, PillGroup, FilterRow, LoadingText } from "../../components/layout/Controls.jsx";
import {
  SUBJECTS, getBuilderPackSubject, getDatasetCurriculum, getDatasetSubject, listCurricula, listDatasets, listSentenceBuilderPacks,
} from "@/data.js";
import { recordWordAnswer, recordArcadeResult } from "@/storage.js";
import { filterPacksForPrefs } from "../../utils/personalisation.js";
import { useArcadeContent } from "./hooks/useArcadeContent.js";
import { useArcadeSound } from "./hooks/useArcadeSound.js";
import QuizHuntGame from "./QuizHuntGame.jsx";
import SnakeBuilderGame from "./SnakeBuilderGame.jsx";

const MODES = [
  { id: "quiz-hunt", label: "Quiz Hunt", icon: "/images/foxchild-fox.png", desc: "Eat the correct answer" },
  { id: "snake-builder", label: "Sentence Snake", icon: "/images/foxchild-girl.png", desc: "Build sentences in order" },
];
// Quiz Hunt uses the pillar map (fox never grows, pillars add navigation challenge).
// Sentence Snake uses an open map (no walls) so the growing body isn't boxed in.
const MAP_TYPE = { "quiz-hunt": "pillars", "snake-builder": "open" };

// Round goals. All modes keep the 3-heart limit; these add a win/end condition.
const GOALS = [
  { id: "fullset", label: "Full Set (default) — repeat wrongs until all correct" },
  { id: "q20", label: "20 questions" },
  { id: "q40", label: "40 questions" },
  { id: "q60", label: "60 questions" },
  { id: "time5", label: "5-minute rush" },
  { id: "endless", label: "Endless (3 hearts)" },
];
const GOAL_CONFIG = {
  fullset: { mode: "fullset", target: 0 }, // complete every item; wrong ones re-queue
  q20:     { mode: "questions", target: 20 },
  q40:     { mode: "questions", target: 40 },
  q60:     { mode: "questions", target: 60 },
  time5:   { mode: "time", target: 300 },
  endless: { mode: "endless", target: 0 },
};

const REDUCED_MOTION =
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

export default function ArcadeGamePage() {
  const { manifest, loading: manifestLoading } = useManifest();
  // `progress` is the full stored state (incl. prefs); persist arcade prefs THROUGH
  // the provider so normal progress writes (recordWordAnswer/recordArcadeResult)
  // never clobber them with stale provider state.
  const { progress, updateProgress } = useProgress();

  const [prefs, setPrefs] = useState(() => progress.prefs.arcade);
  const [started, setStarted] = useState(false);

  // Persist prefs through the provider whenever they change.
  useEffect(() => {
    updateProgress((state) => { state.prefs.arcade = prefs; });
  }, [prefs, updateProgress]);

  function setPref(key, value) { setPrefs((p) => ({ ...p, [key]: value })); }

  // ── Two independent audio channels ─────────────────────────────────────────
  // Channel 1: sound effects (blips)   — mutedRef
  // Channel 2: speak correct word aloud — speechEnabledRef
  const mutedRef = useRef(!prefs.sound);
  mutedRef.current = !prefs.sound;
  const speechEnabledRef = useRef(!!prefs.speech);
  speechEnabledRef.current = !!prefs.speech;
  const audio = useArcadeSound(mutedRef, speechEnabledRef);
  const sound = useMemo(() => ({
    play: audio.play,
    speakWord: audio.speakWord,
    stop: audio.stop,
    muted: !prefs.sound,
    speech: !!prefs.speech,
    toggleMute: () => setPref("sound", !prefs.sound),
    toggleSpeech: () => setPref("speech", !prefs.speech),
  }), [audio, prefs.sound, prefs.speech]);

  // ── Setup option lists ──────────────────────────────────────────────────────
  const isBuilder = prefs.mode === "snake-builder";
  const visibleDatasets = useMemo(
    () => manifest ? filterPacksForPrefs(listDatasets(manifest), progress?.prefs || {}, "dataset") : [],
    [manifest, progress?.prefs],
  );
  const visibleBuilderPacks = useMemo(
    () => manifest ? filterPacksForPrefs(listSentenceBuilderPacks(manifest), progress?.prefs || {}, "builder") : [],
    [manifest, progress?.prefs],
  );

  const curriculumOptions = useMemo(
    () => [{ id: "all", label: "All" }, ...(manifest ? listCurricula(manifest) : [])],
    [manifest],
  );

  const subjectCounts = useMemo(() => SUBJECTS.map((id) => ({
    id,
    count: (isBuilder ? visibleBuilderPacks : visibleDatasets)
      .filter((pack) => {
        const subject = isBuilder ? getBuilderPackSubject(pack) : getDatasetSubject(pack);
        return subject === id && ((prefs.curriculum || "all") === "all" || getDatasetCurriculum(pack) === prefs.curriculum);
      }).length,
  })), [isBuilder, prefs.curriculum, visibleBuilderPacks, visibleDatasets]);

  const packs = useMemo(() => {
    const source = isBuilder ? visibleBuilderPacks : visibleDatasets;
    return source.filter((pack) => {
      const subject = isBuilder ? getBuilderPackSubject(pack) : getDatasetSubject(pack);
      return subject === prefs.subject && ((prefs.curriculum || "all") === "all" || getDatasetCurriculum(pack) === prefs.curriculum);
    });
  }, [isBuilder, prefs.subject, prefs.curriculum, visibleBuilderPacks, visibleDatasets]);

  useEffect(() => {
    const source = isBuilder ? visibleBuilderPacks : visibleDatasets;
    if (!source.length || packs.length) return;
    const first = source[0];
    setPrefs((prev) => ({
      ...prev,
      subject: isBuilder ? getBuilderPackSubject(first) : getDatasetSubject(first),
      curriculum: "all",
      ...(isBuilder ? { packId: first.id } : { datasetId: first.id }),
    }));
  }, [isBuilder, packs.length, visibleBuilderPacks, visibleDatasets]);

  // Keep a valid pack/dataset selected as filters change.
  useEffect(() => {
    if (packs.length === 0) return;
    const key = isBuilder ? "packId" : "datasetId";
    const current = prefs[key];
    if (!packs.find((p) => p.id === current)) {
      setPref(key, packs[0].id);
    }
  }, [packs, isBuilder]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Content (only loads once a round starts) ────────────────────────────────
  const activeId = isBuilder ? prefs.packId : prefs.datasetId;
  const { questions, loading, error } = useArcadeContent({
    manifest,
    mode: prefs.mode,
    datasetId: started && !isBuilder ? prefs.datasetId : null,
    packId: started && isBuilder ? prefs.packId : null,
    builderPacks: started && isBuilder ? packs : null,
  });

  // ── Progress recording ──────────────────────────────────────────────────────
  const handleRecord = useCallback((kind, payload) => {
    if (kind === "answer" && payload?.wordId) {
      updateProgress((state) => recordWordAnswer(state, payload.wordId, !!payload.correct));
    } else if (kind === "over" && payload) {
      updateProgress((state) => recordArcadeResult(state, prefs.mode, payload));
    }
    // "builderComplete" is summarised into the "over" record (kept light for MVP).
  }, [updateProgress, prefs.mode]);

  const exitToSetup = useCallback(() => { sound.stop(); setStarted(false); }, [sound]);

  if (manifestLoading) return <div className="lw-page"><LoadingText /></div>;

  // ── Playing ─────────────────────────────────────────────────────────────────
  if (started) {
    if (loading) return <div className="lw-page"><LoadingText text="Loading game…" /></div>;
    if (error) {
      return (
        <div className="lw-page"><div className="lw-card">
          <p style={{ color: "var(--lw-coral)" }}>Could not load this pack: {error}</p>
          <button className="lw-btn lw-btn-primary" type="button" onClick={exitToSetup}>Back</button>
        </div></div>
      );
    }
    const commonProps = {
      questions, mapType: MAP_TYPE[prefs.mode] || "pillars", goal: GOAL_CONFIG[prefs.goal] || GOAL_CONFIG.q20, sound,
      reducedMotion: REDUCED_MOTION, onExit: exitToSetup, onRecord: handleRecord,
    };
    return (
      <div className="lw-page arc-page">
        {isBuilder ? <SnakeBuilderGame {...commonProps} /> : <QuizHuntGame {...commonProps} />}
      </div>
    );
  }

  // ── Setup ───────────────────────────────────────────────────────────────────
  const canStart = !!activeId && packs.length > 0;
  return (
    <div className="lw-page">
      <div className="lw-card arc-setup">
        <h2 className="lw-section-title"><img src="/images/foxchild-fox.png" alt="" className="arc-page-fox" /> FoxChild Arcade</h2>
        <p className="arc-setup-sub">
          Turn your packs into an arcade game. Move with swipes, arrow keys, or the on-screen pad —
          eat the right answers, dodge the wrong ones. Best on a phone or tablet in landscape.
        </p>

        <h3 className="lw-field-heading">Game mode</h3>
        <div className="arc-mode-grid">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`arc-mode-card${prefs.mode === m.id ? " is-active" : ""}`}
              onClick={() => setPref("mode", m.id)}
              aria-pressed={prefs.mode === m.id}
            >
              <span className="arc-mode-label">
                <img src={m.icon} alt="" className="arc-mode-icon" /> {m.label}
              </span>
              <span className="arc-mode-desc">{m.desc}</span>
            </button>
          ))}
        </div>

        <h3 className="lw-field-heading" style={{ marginTop: 18 }}>Subject</h3>
        <SubjectCardGrid
          subjects={subjectCounts}
          activeSubject={prefs.subject}
          onSelect={(s) => setPrefs((p) => ({ ...p, subject: s }))}
        />

        <PillGroup
          label="Curriculum"
          items={curriculumOptions}
          value={prefs.curriculum || "all"}
          onSelect={(c) => setPref("curriculum", c)}
          style={{ marginTop: 14 }}
        />

        <FilterRow style={{ marginTop: 16 }}>
          {packs.length > 0 ? (
            <LabeledSelect
              label={isBuilder ? "Builder pack" : "Pack"}
              value={activeId}
              onChange={(v) => setPref(isBuilder ? "packId" : "datasetId", v)}
              selectTestId="arcade-pack-select"
            >
              {packs.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
            </LabeledSelect>
          ) : (
            <p className="arc-setup-empty">
              No {isBuilder ? "sentence-builder packs" : "vocab packs"} for this subject/curriculum yet.
            </p>
          )}
          <LabeledSelect label="Challenge" value={prefs.goal} onChange={(v) => setPref("goal", v)}>
            {GOALS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </LabeledSelect>
        </FilterRow>

        <label className="arc-sound-row">
          <input type="checkbox" checked={prefs.sound} onChange={(e) => setPref("sound", e.target.checked)} />
          🔊 Sound effects
        </label>
        <label className="arc-sound-row">
          <input type="checkbox" checked={!!prefs.speech} onChange={(e) => setPref("speech", e.target.checked)} />
          🗣 Speak correct word aloud
        </label>

        <div className="arc-setup-actions">
          <button
            className="lw-btn lw-btn-primary arc-start-btn"
            data-testid="arcade-start-button"
            type="button"
            disabled={!canStart}
            onClick={() => setStarted(true)}
          >
            ▶ Start game
          </button>
        </div>
      </div>
    </div>
  );
}
