import { useState, useMemo, useCallback, useRef } from "react";
import { useManifest } from "../context/ManifestContext.jsx";
import { useProgress } from "../context/ProgressContext.jsx";
import { useQuizSession } from "../hooks/useQuizSession.js";
import { useSpeech } from "../hooks/useSpeech.js";
import { SubjectCardGrid } from "../components/layout/SubjectCardGrid.jsx";
import { LabeledSelect, PillGroup, ToggleGroup, FilterRow } from "../components/layout/Controls.jsx";
import { TileBuilder } from "../components/learning/TileBuilder.jsx";
import { StudyBookButton } from "../components/learning/StudyBookDrawer.jsx";
import { listDatasets, listDatasetsBySubject, getDatasetSubject, SUBJECTS, getDatasetDirections, findDataset } from "@/data.js";
import { getDatasetStageOptions, usesStageSelection, getSelectedStages } from "@/quiz-helpers.js";

const QUESTION_COUNTS = [12, 18, 24, 30].map((n) => ({ id: n, label: String(n) }));
const ANSWER_MODES_ALL = [
  { id: "mixed",  label: "Mixed"  },
  { id: "choice", label: "Choice" },
  { id: "typed",  label: "Typed"  },
  { id: "build",  label: "Build"  }, // language packs only (requires sentence pools)
];
const ANSWER_MODES_BASIC = ANSWER_MODES_ALL.filter(m => m.id !== "build");

// ─── Setup Phase ─────────────────────────────────────────────────────────────

function QuizSetup({ manifest, prefs, setPrefs, onStart }) {
  const datasets = useMemo(() => manifest ? listDatasets(manifest) : [], [manifest]);
  const subjectCounts = useMemo(() => {
    return SUBJECTS.map(id => ({
      id,
      count: datasets.filter(d => getDatasetSubject(d) === id).length,
    }));
  }, [datasets]);

  const filteredDatasets = useMemo(() => {
    if (!prefs.subject) return datasets;
    return datasets.filter(d => getDatasetSubject(d) === prefs.subject);
  }, [datasets, prefs.subject]);

  const dataset = useMemo(() => {
    if (!manifest) return null;
    return findDataset(manifest, prefs.datasetId);
  }, [manifest, prefs.datasetId]);

  const stageOptions = dataset ? getDatasetStageOptions(dataset) : [];
  const isStage = dataset ? usesStageSelection(dataset) : false;
  const selectedStages = dataset && isStage ? getSelectedStages(prefs, dataset) : [];
  const directions = dataset ? getDatasetDirections(dataset) : [];

  // "Build" requires sentence pools — only available for language packs.
  const isLanguage = dataset ? getDatasetSubject(dataset) === "language" : false;
  const answerModes = isLanguage ? ANSWER_MODES_ALL : ANSWER_MODES_BASIC;

  function setPref(key, value) {
    setPrefs(prev => ({ ...prev, [key]: value }));
  }

  function safeAnswerMode(currentMode, subjectIsLanguage) {
    return !subjectIsLanguage && currentMode === "build" ? "mixed" : currentMode;
  }

  function toggleStage(stage) {
    setPrefs(prev => {
      const current = Array.isArray(prev.stages) ? prev.stages.map(String) : [];
      const exists = current.includes(String(stage));
      return {
        ...prev,
        stages: exists ? current.filter(s => s !== String(stage)) : [...current, String(stage)],
      };
    });
  }

  return (
    <div className="lw-page">
      <div className="lw-card" style={{ marginBottom: "20px" }}>
        <h2 className="lw-section-title">Quiz Setup</h2>

        <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--lw-muted)", marginBottom: "6px" }}>Subject</h3>
        <SubjectCardGrid
          subjects={subjectCounts}
          activeSubject={prefs.subject}
          onSelect={(subj) => {
            const firstMatch = datasets.find((d) => getDatasetSubject(d) === subj);
            const newIsLanguage = subj === "language";
            setPrefs((prev) => ({
              ...prev,
              subject: subj,
              datasetId: firstMatch?.id ?? prev.datasetId,
              stages: [],
              direction: "",
              answerMode: safeAnswerMode(prev.answerMode, newIsLanguage),
            }));
          }}
        />

        <FilterRow style={{ marginTop: "18px" }}>
          <LabeledSelect label="Dataset" value={prefs.datasetId} onChange={(v) => {
            const newDataset = findDataset(manifest, v);
            const newIsLanguage = newDataset ? getDatasetSubject(newDataset) === "language" : false;
            setPrefs(prev => ({
              ...prev,
              datasetId: v,
              answerMode: safeAnswerMode(prev.answerMode, newIsLanguage),
            }));
          }}>
            {filteredDatasets.map((d) => <option key={d.id} value={d.id}>{d.displayName}</option>)}
          </LabeledSelect>

          {isStage && (
            <ToggleGroup
              label="Stage"
              items={stageOptions}
              selected={selectedStages}
              onToggle={toggleStage}
            />
          )}

          <PillGroup
            label="Questions"
            items={QUESTION_COUNTS}
            value={prefs.questionCount}
            onSelect={(n) => setPref("questionCount", Number(n))}
          />
        </FilterRow>

        <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem" }}>
            <input
              type="checkbox"
              checked={prefs.excludeMastered}
              onChange={(e) => setPref("excludeMastered", e.target.checked)}
              style={{ width: "16px", height: "16px" }}
            />
            Exclude mastered words
          </label>
        </div>

        {directions.length > 0 && (
          <PillGroup
            label="Direction"
            items={directions}
            value={prefs.direction}
            onSelect={(v) => setPref("direction", v)}
            style={{ marginTop: "16px" }}
          />
        )}

        <PillGroup
          label="Answer mode"
          items={answerModes}
          value={prefs.answerMode}
          onSelect={(v) => setPref("answerMode", v)}
          style={{ marginTop: "16px" }}
        />

        <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button className="lw-btn lw-btn-primary" type="button" onClick={onStart}>
            Start quiz
          </button>
          <StudyBookButton dataset={dataset} />
        </div>
      </div>
    </div>
  );
}

// ─── Question display ─────────────────────────────────────────────────────────

function TypedInput({ onSubmit, disabled }) {
  const [value, setValue] = useState("");
  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue("");
  }
  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer..."
        autoFocus
        style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1.5px solid var(--lw-line)", background: "var(--lw-panel)", color: "var(--lw-ink)", fontFamily: "inherit", fontSize: "0.95rem" }}
      />
      <button className="lw-btn lw-btn-primary" type="submit" disabled={disabled || !value.trim()}>
        Check
      </button>
    </form>
  );
}

function GapInput({ sentence, onSubmit, disabled }) {
  const [value, setValue] = useState("");
  const parts = (sentence || "").split("___");
  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue("");
  }
  return (
    <div style={{ marginTop: "16px" }}>
      <div style={{ fontSize: "1.1rem", fontFamily: "Georgia, serif", lineHeight: "1.8", padding: "16px", background: "var(--lw-blue-soft)", borderRadius: "var(--lw-radius)", border: "1.5px solid rgba(21,102,168,0.18)" }}>
        {parts[0]}
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          disabled={disabled}
          placeholder="___"
          style={{ display: "inline", width: "120px", padding: "2px 8px", borderRadius: "4px", border: "1.5px solid var(--lw-blue)", background: "white", fontFamily: "inherit", fontSize: "inherit" }}
        />
        {parts[1] || ""}
      </div>
      <button
        className="lw-btn lw-btn-primary"
        type="button"
        style={{ marginTop: "12px" }}
        disabled={disabled || !value.trim()}
        onClick={() => { if (value.trim()) { onSubmit(value.trim()); setValue(""); } }}
      >
        Check
      </button>
    </div>
  );
}

function QuizQuestion({ session, onAnswer, onNext, updateBuildState, speak }) {
  const question = session.questions[session.index];
  const { feedback, awaitingNext, buildState } = session;

  const speechLang = question?.speechLanguage || "de-DE";

  function handleSpeakPrompt() {
    if (question?.speechText) speak(question.speechText, speechLang);
    else if (question?.prompt) speak(question.prompt, speechLang);
  }

  const feedbackEl = feedback && (
    <div className={`lw-feedback ${feedback.correct ? "correct" : "wrong"}`}>
      <span className="lw-feedback-icon">{feedback.correct ? "✓" : "✗"}</span>
      <div>
        {feedback.correct ? "Correct!" : `Incorrect — correct answer: ${question?.answer || ""}`}
        {feedback.message && <div style={{ marginTop: "4px", fontSize: "0.85rem", opacity: 0.85 }}>{feedback.message}</div>}
      </div>
    </div>
  );

  if (!question) return null;

  return (
    <div className="lw-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span style={{ color: "var(--lw-muted)", fontSize: "0.85rem" }}>
          {session.index + 1} / {session.questions.length} · Score: {session.score}
        </span>
        <button className="lw-btn lw-btn-ghost" type="button" style={{ fontSize: "0.85rem", padding: "4px 10px" }} onClick={handleSpeakPrompt}>
          🔊 Speak
        </button>
      </div>

      <div className="lw-question-box">
        {question.modeTitle && (
          <div style={{ fontSize: "0.75rem", color: "var(--lw-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
            {question.modeTitle}
          </div>
        )}
        <div className="lw-question-prompt">{question.prompt}</div>
        {question.subtitle && <div className="lw-question-subtitle">{question.subtitle}</div>}
      </div>

      {question.kind === "choice" && (
        <div className="lw-option-grid" style={{ marginTop: "16px" }}>
          {(question.options || []).map((opt, i) => {
            let cls = "lw-option-btn";
            if (awaitingNext) {
              if (opt === question.answer) cls += " correct";
              else if (opt === session.answers[session.answers.length - 1]?.userAnswer) cls += " wrong";
            }
            return (
              <button
                key={i}
                type="button"
                className={cls}
                disabled={awaitingNext}
                onClick={() => !awaitingNext && onAnswer(opt)}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {question.kind === "typed" && (
        <TypedInput onSubmit={onAnswer} disabled={awaitingNext} />
      )}

      {question.kind === "gap" && (
        <GapInput sentence={question.sentence} onSubmit={onAnswer} disabled={awaitingNext} />
      )}

      {question.kind === "build" && buildState && (
        <TileBuilder
          answerTiles={buildState.answerTiles || []}
          bankTiles={buildState.bankTiles || []}
          onPick={(id) => updateBuildState(prev => ({
            ...prev,
            answerTiles: [...(prev.answerTiles || []), (prev.bankTiles || []).find(t => t.id === id)].filter(Boolean),
            bankTiles: (prev.bankTiles || []).filter(t => t.id !== id),
          }))}
          onReturn={(id) => updateBuildState(prev => ({
            ...prev,
            bankTiles: [...(prev.bankTiles || []), (prev.answerTiles || []).find(t => t.id === id)].filter(Boolean),
            answerTiles: (prev.answerTiles || []).filter(t => t.id !== id),
          }))}
          disabled={awaitingNext}
        />
      )}

      {question.kind === "sequence" && buildState && (
        <div style={{ marginTop: "16px" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--lw-muted)", marginBottom: "8px" }}>Click items to reorder them:</p>
          <div className="lw-sequence-list">
            {(buildState.userOrder || []).map((item, i) => (
              <div
                key={i}
                className={`lw-sequence-item ${buildState.selectedIndex === i ? "selected" : ""}`}
                onClick={() => {
                  if (awaitingNext) return;
                  updateBuildState(prev => {
                    const sel = prev.selectedIndex;
                    if (sel === null || sel === i) return { ...prev, selectedIndex: sel === i ? null : i };
                    const newOrder = [...prev.userOrder];
                    [newOrder[sel], newOrder[i]] = [newOrder[i], newOrder[sel]];
                    return { ...prev, userOrder: newOrder, selectedIndex: null };
                  });
                }}
              >
                <span className="lw-sequence-num">{i + 1}</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          {!awaitingNext && (
            <button className="lw-btn lw-btn-primary" type="button" style={{ marginTop: "12px" }}
              onClick={() => onAnswer(buildState.userOrder, { extra: buildState.userOrder })}>
              Check order
            </button>
          )}
        </div>
      )}

      {question.kind === "sort" && buildState && (
        <div style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", padding: "10px", background: "rgba(255,255,255,0.6)", borderRadius: "var(--lw-radius-sm)", border: "1.5px dashed rgba(24,34,45,0.2)", marginBottom: "14px" }}>
            {(buildState.unplacedItems || []).map((item, i) => (
              <button
                key={i}
                type="button"
                className={`lw-sort-chip ${buildState.selectedItemIndex === i ? "selected" : ""}`}
                disabled={awaitingNext}
                onClick={() => !awaitingNext && updateBuildState(prev => ({ ...prev, selectedItemIndex: prev.selectedItemIndex === i ? null : i }))}
              >
                {item.label || item.text || item}
              </button>
            ))}
          </div>
          <div className="lw-sort-arena">
            {(question.categories || []).map((cat, ci) => {
              const placed = (buildState.placedItems || []).filter(p => p.categoryIndex === ci);
              return (
                <div
                  key={ci}
                  className="lw-sort-zone"
                  onClick={() => {
                    if (awaitingNext) return;
                    updateBuildState(prev => {
                      if (prev.selectedItemIndex === null) return prev;
                      const item = prev.unplacedItems[prev.selectedItemIndex];
                      if (!item) return prev;
                      return {
                        ...prev,
                        placedItems: [...prev.placedItems, { ...item, categoryIndex: ci }],
                        unplacedItems: prev.unplacedItems.filter((_, i) => i !== prev.selectedItemIndex),
                        selectedItemIndex: null,
                      };
                    });
                  }}
                >
                  <h4>{cat.label || cat}</h4>
                  {placed.map((p, pi) => (
                    <span key={pi} className="lw-sort-placed-item">
                      {p.label || p.text || p}
                      {!awaitingNext && (
                        <button
                          type="button"
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", color: "var(--lw-green)" }}
                          onClick={e => { e.stopPropagation(); updateBuildState(prev => ({
                            ...prev,
                            unplacedItems: [...prev.unplacedItems, p],
                            placedItems: prev.placedItems.filter((_, j) => !(prev.placedItems[j] === p && j === prev.placedItems.indexOf(p))),
                          })); }}
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
          {!awaitingNext && (
            <button className="lw-btn lw-btn-primary" type="button" style={{ marginTop: "12px" }}
              onClick={() => onAnswer(buildState.placedItems, { extra: buildState.placedItems })}>
              Check answers
            </button>
          )}
        </div>
      )}

      {feedbackEl}

      {awaitingNext && (
        <div style={{ marginTop: "14px" }}>
          <button className="lw-btn lw-btn-primary" type="button" onClick={onNext}>
            {session.index + 1 >= session.questions.length ? "Finish" : "Next question"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Summary Phase ────────────────────────────────────────────────────────────

function QuizSummary({ session, onRetry, onReviewMissed, onReset }) {
  const pct = session.questions.length > 0
    ? Math.round((session.score / session.questions.length) * 100)
    : 0;

  return (
    <div className="lw-page">
      <div className="lw-card" style={{ marginBottom: "20px" }}>
        <h2 className="lw-section-title">Quiz complete!</h2>
        <div style={{ fontSize: "2.5rem", fontWeight: 700, color: pct >= 70 ? "var(--lw-green)" : "var(--lw-coral)", fontFamily: "Georgia, serif" }}>
          {pct}%
        </div>
        <p style={{ color: "var(--lw-muted)", marginTop: "6px" }}>
          {session.score} correct out of {session.questions.length} questions
        </p>
        <div className="lw-btn-group" style={{ marginTop: "20px" }}>
          <button className="lw-btn lw-btn-primary" type="button" onClick={onRetry}>Try again</button>
          {session.missedWords?.length > 0 && (
            <button className="lw-btn lw-btn-secondary" type="button" onClick={onReviewMissed}>
              Quiz missed ({session.missedWords.length})
            </button>
          )}
          <button className="lw-btn lw-btn-ghost" type="button" onClick={onReset}>New quiz</button>
        </div>
      </div>

      <div className="lw-card">
        <h3 className="lw-section-title">Answer log</h3>
        <div className="lw-review-list">
          {session.answers.map((ans, i) => (
            <div key={i} className={`lw-review-item ${ans.correct ? "correct" : "wrong"}`}>
              <span className="lw-review-item-icon">{ans.correct ? "✓" : "✗"}</span>
              <div>
                <div className="lw-review-answer">{ans.prompt}</div>
                {!ans.correct && (
                  <div className="lw-review-wrong">Your answer: {String(ans.userAnswer)}</div>
                )}
                {!ans.correct && ans.expected && (
                  <div className="lw-review-correct">Correct: {ans.expected}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Root QuizPage ────────────────────────────────────────────────────────────

export default function QuizPage({ initialCustomWords = null }) {
  const { manifest, loading: manifestLoading } = useManifest();
  const { progress, updateProgress } = useProgress();
  const { speak } = useSpeech();
  const { session, loading, error, startQuiz, answerQuestion, nextQuestion, updateBuildState, resetQuiz } = useQuizSession();

  const [prefs, setPrefs] = useState({
    subject: "language",
    datasetId: "core",
    year: "ALL",
    stages: [],
    questionCount: 18,
    excludeMastered: true,
    direction: "studyToTarget",
    answerMode: "mixed",
  });

  const [phase, setPhase] = useState("setup"); // setup | session | summary

  async function handleStart() {
    if (!manifest) return;
    const dataset = (listDatasets(manifest).find(d => d.id === prefs.datasetId)) || { id: prefs.datasetId };
    const fullDataset = dataset.id ? dataset : { id: "core" };
    await startQuiz({ manifest, dataset: fullDataset, prefs, progress, customWords: initialCustomWords || null });
    setPhase("session");
  }

  function handleAnswer(response, extra) {
    answerQuestion(response, { progress, updateProgress, extra });
  }

  function handleNext() {
    nextQuestion({ updateProgress });
    const s = session;
    if (s && s.index + 1 >= s.questions.length) {
      setPhase("summary");
    }
  }

  function handleRetry() {
    resetQuiz();
    setPhase("setup");
  }

  function handleReviewMissed() {
    if (!manifest || !session?.missedWords?.length) return;
    const dataset = findDataset(manifest, prefs.datasetId);
    startQuiz({ manifest, dataset, prefs: { ...prefs, questionCount: session.missedWords.length }, progress, customWords: session.missedWords });
    setPhase("session");
  }

  if (manifestLoading) return <div className="lw-page"><p>Loading…</p></div>;
  if (error) return <div className="lw-page"><p style={{ color: "var(--lw-coral)" }}>Error: {error}</p></div>;

  if (phase === "setup" || !session) {
    return <QuizSetup manifest={manifest} prefs={prefs} setPrefs={setPrefs} onStart={handleStart} />;
  }

  if (loading) return <div className="lw-page"><p>Building quiz…</p></div>;

  if (phase === "summary" || session.completed) {
    return (
      <QuizSummary
        session={session}
        onRetry={handleRetry}
        onReviewMissed={handleReviewMissed}
        onReset={() => { resetQuiz(); setPhase("setup"); }}
      />
    );
  }

  return (
    <div className="lw-page">
      <QuizQuestion
        session={session}
        onAnswer={handleAnswer}
        onNext={handleNext}
        updateBuildState={updateBuildState}
        speak={speak}
      />
    </div>
  );
}
