import { useState, useMemo, useEffect, useRef } from "react";
import { useManifest } from "../context/ManifestContext.jsx";
import { useProgress } from "../context/ProgressContext.jsx";
import { useReadingSession } from "../hooks/useReadingSession.js";
import { useSpeech } from "../hooks/useSpeech.js";
import { SubjectCardGrid } from "../components/layout/SubjectCardGrid.jsx";
import { listPassageGroups, listPassageGroupsBySubject, listPassagePacks, getPassageGroupSubject, SUBJECTS } from "@/data.js";

const DIFFICULTY_OPTIONS = ["all", "easy", "medium", "hard"];

function PassageSetup({ manifest, prefs, setPrefs, onStart, message }) {
  const groups = useMemo(() => manifest ? listPassageGroups(manifest) : [], [manifest]);
  const subjectCounts = useMemo(() => {
    return SUBJECTS.map(id => ({
      id,
      count: groups.filter(g => getPassageGroupSubject(g) === id).length,
    }));
  }, [groups]);

  const filteredGroups = useMemo(() => {
    if (!prefs.subject) return groups;
    return listPassageGroupsBySubject(manifest, prefs.subject);
  }, [manifest, groups, prefs.subject]);

  const packs = useMemo(() => {
    if (!manifest || !prefs.groupId) return [];
    return listPassagePacks(manifest, prefs.groupId);
  }, [manifest, prefs.groupId]);

  function setPref(key, value) {
    setPrefs(prev => ({ ...prev, [key]: value }));
  }

  useEffect(() => {
    if (filteredGroups.length > 0 && !filteredGroups.find(g => g.id === prefs.groupId)) {
      setPref("groupId", filteredGroups[0].id);
    }
  }, [filteredGroups]);

  useEffect(() => {
    if (packs.length > 0 && !packs.find(p => p.id === prefs.packId)) {
      setPref("packId", packs[0].id);
    }
  }, [packs]);

  return (
    <div className="lw-page">
      <div className="lw-card">
        <h2 className="lw-section-title">Reading Setup</h2>

        <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--lw-muted)", marginBottom: "6px" }}>Subject</h3>
        <SubjectCardGrid subjects={subjectCounts} activeSubject={prefs.subject} onSelect={s => setPref("subject", s)} />

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "18px" }}>
          {filteredGroups.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 200px" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--lw-muted)", fontWeight: 600 }}>Book / Group</label>
              <select
                value={prefs.groupId}
                onChange={e => setPref("groupId", e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--lw-line)", background: "var(--lw-panel)", color: "var(--lw-ink)", fontFamily: "inherit" }}
              >
                {filteredGroups.map(g => <option key={g.id} value={g.id}>{g.displayName}</option>)}
              </select>
            </div>
          )}

          {packs.length > 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1 1 200px" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--lw-muted)", fontWeight: 600 }}>Set</label>
              <select
                value={prefs.packId}
                onChange={e => setPref("packId", e.target.value)}
                style={{ padding: "8px 12px", borderRadius: "8px", border: "1.5px solid var(--lw-line)", background: "var(--lw-panel)", color: "var(--lw-ink)", fontFamily: "inherit" }}
              >
                {packs.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
              </select>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.8rem", color: "var(--lw-muted)", fontWeight: 600 }}>Difficulty</label>
            <div className="lw-nav-pills">
              {DIFFICULTY_OPTIONS.map(d => (
                <button
                  key={d}
                  type="button"
                  className={`lw-nav-pill ${prefs.difficulty === d ? "active" : ""}`}
                  onClick={() => setPref("difficulty", d)}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "16px", display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem" }}>
            <input
              type="checkbox"
              checked={prefs.showGerman}
              onChange={e => setPref("showGerman", e.target.checked)}
              style={{ width: "16px", height: "16px" }}
            />
            Show source text
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem" }}>
            <input
              type="checkbox"
              checked={prefs.voiceEnabled}
              onChange={e => setPref("voiceEnabled", e.target.checked)}
              style={{ width: "16px", height: "16px" }}
            />
            Autoplay voice
          </label>
        </div>

        {message && <p style={{ marginTop: "12px", color: "var(--lw-coral)" }}>{message}</p>}

        <div style={{ marginTop: "20px" }}>
          <button
            className="lw-btn lw-btn-primary"
            type="button"
            onClick={onStart}
            disabled={!prefs.groupId}
          >
            Start reading
          </button>
        </div>
      </div>
    </div>
  );
}

function PassageDisplay({ passage, showSource, answers, onAnswer, revealed, onReveal, onNext, isLast, voiceEnabled, speak }) {
  const speechLang = passage?.speech_language || "de-DE";

  useEffect(() => {
    if (voiceEnabled && passage?.passage_de) {
      speak(passage.passage_de, speechLang);
    }
    return () => {};
  }, [passage?.id]);

  const mcqQuestions = (passage?.questions || []).filter(q => q.type === "multiple_choice");
  const openQuestions = (passage?.questions || []).filter(q => q.type !== "multiple_choice");

  return (
    <div className="lw-page">
      <div className="lw-card" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--lw-ink)" }}>{passage?.title_en || passage?.title_de || "Passage"}</h2>
            {passage?.topic && <span className="lw-chip blue" style={{ marginTop: "4px" }}>{passage.topic}</span>}
          </div>
          <button
            className="lw-btn lw-btn-ghost"
            type="button"
            style={{ padding: "4px 10px", fontSize: "0.85rem", flexShrink: 0 }}
            onClick={() => speak(passage?.passage_de || "", speechLang)}
          >
            🔊
          </button>
        </div>

        {showSource && passage?.passage_de && (
          <div className="lw-passage-block">
            <div className="lw-passage-label">Source text</div>
            <div className="lw-passage-text">{passage.passage_de}</div>
          </div>
        )}

        {passage?.passage_en && (
          <div className="lw-passage-block">
            <div className="lw-passage-label">Translation</div>
            <div className="lw-passage-text">{passage.passage_en}</div>
          </div>
        )}
      </div>

      {mcqQuestions.length > 0 && (
        <div className="lw-card" style={{ marginBottom: "16px" }}>
          <h3 className="lw-section-title">Questions</h3>
          {mcqQuestions.map((q, qi) => {
            const userAnswer = answers[q.id];
            const isAnswered = userAnswer !== undefined;
            const correctOpt = q.options?.[q.correct_option_index] || q.correct_answer;
            return (
              <div key={q.id || qi} style={{ marginBottom: "16px" }}>
                <p style={{ fontWeight: 600, marginBottom: "8px" }}>{q.question}</p>
                <div className="lw-option-grid">
                  {(q.options || []).map((opt, oi) => {
                    let cls = "lw-option-btn";
                    if (isAnswered && revealed) {
                      if (opt === correctOpt) cls += " correct";
                      else if (opt === userAnswer) cls += " wrong";
                    } else if (isAnswered && opt === userAnswer) {
                      cls += " selected";
                    }
                    return (
                      <button
                        key={oi}
                        type="button"
                        className={cls}
                        disabled={revealed}
                        onClick={() => onAnswer(q.id, opt)}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openQuestions.length > 0 && (
        <div className="lw-card" style={{ marginBottom: "16px" }}>
          <h3 className="lw-section-title">Open questions</h3>
          {openQuestions.map((q, qi) => (
            <div key={q.id || qi} style={{ marginBottom: "16px" }}>
              <p style={{ fontWeight: 600, marginBottom: "8px" }}>{q.question}</p>
              {revealed && q.model_answer_en && (
                <div style={{ background: "var(--lw-green-soft)", border: "1.5px solid var(--lw-green)", borderRadius: "var(--lw-radius-sm)", padding: "12px 16px" }}>
                  <p style={{ fontSize: "0.85rem", color: "var(--lw-green)", fontWeight: 600, marginBottom: "4px" }}>Model answer:</p>
                  <p style={{ fontSize: "0.9rem" }}>{q.model_answer_en}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="lw-btn-group">
        {!revealed && (
          <button className="lw-btn lw-btn-secondary" type="button" onClick={onReveal}>
            Reveal answers
          </button>
        )}
        {revealed && (
          <button className="lw-btn lw-btn-primary" type="button" onClick={onNext}>
            {isLast ? "Finish" : "Next passage"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ReadingPage() {
  const { manifest, loading: manifestLoading } = useManifest();
  const { updateProgress } = useProgress();
  const { speak } = useSpeech();

  const [prefs, setPrefs] = useState({
    subject: "language",
    groupId: "",
    packId: "",
    category: "all",
    difficulty: "all",
    showGerman: false,
    voiceEnabled: false,
  });

  const {
    loading, started, current, deck, currentIndex, answers,
    revealed, completedCount, message, categoryOptions,
    startSession, answerQuestion, revealPassage, nextPassage, resetSession,
  } = useReadingSession({ manifest, groupId: prefs.groupId, packId: prefs.packId, prefs, updateProgress });

  if (manifestLoading) return <div className="lw-page"><p>Loading…</p></div>;

  if (!started) {
    return (
      <PassageSetup
        manifest={manifest}
        prefs={prefs}
        setPrefs={setPrefs}
        onStart={startSession}
        message={message}
      />
    );
  }

  if (loading) return <div className="lw-page"><p>Loading passages…</p></div>;

  if (!current) {
    return (
      <div className="lw-page">
        <div className="lw-card">
          <h2 className="lw-section-title">Session complete</h2>
          <p style={{ color: "var(--lw-muted)" }}>You completed {completedCount} passages.</p>
          <div className="lw-btn-group" style={{ marginTop: "16px" }}>
            <button className="lw-btn lw-btn-primary" type="button" onClick={resetSession}>New session</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PassageDisplay
      passage={current}
      showSource={prefs.showGerman}
      answers={answers}
      onAnswer={answerQuestion}
      revealed={revealed}
      onReveal={revealPassage}
      onNext={nextPassage}
      isLast={currentIndex + 1 >= deck.length}
      voiceEnabled={prefs.voiceEnabled}
      speak={speak}
    />
  );
}
