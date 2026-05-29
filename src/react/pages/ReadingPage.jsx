import { useState, useMemo, useEffect } from "react";
import { useManifest } from "../context/ManifestContext.jsx";
import { useProgress } from "../context/ProgressContext.jsx";
import { useReadingSession } from "../hooks/useReadingSession.js";
import { useSpeech } from "../hooks/useSpeech.js";
import { SubjectCardGrid } from "../components/layout/SubjectCardGrid.jsx";
import { LabeledSelect, PillGroup, FilterRow, LoadingText } from "../components/layout/Controls.jsx";
import { StudyBookButton } from "../components/learning/StudyBookDrawer.jsx";
import { listPassageGroups, listPassageGroupsBySubjectAndCurriculum, listPassagePacks, getPassageGroupSubject, SUBJECTS, CURRICULUMS, CURRICULUM_LABELS } from "@/data.js";

const CURRICULUM_OPTIONS = [
  { id: "all", label: "All" },
  ...CURRICULUMS.map((c) => ({ id: c, label: CURRICULUM_LABELS[c] })),
];

// ─── Setup screen ─────────────────────────────────────────────────────────────

function PassageSetup({ manifest, prefs, setPrefs, onStart, message, loading, categoryOptions }) {
  const groups = useMemo(() => manifest ? listPassageGroups(manifest) : [], [manifest]);
  const subjectCounts = useMemo(() => {
    return SUBJECTS.map(id => ({
      id,
      count: manifest ? listPassageGroupsBySubjectAndCurriculum(manifest, id, prefs.curriculum || "all").length : 0,
    }));
  }, [manifest, prefs.curriculum]);

  const filteredGroups = useMemo(() => {
    if (!manifest) return [];
    return listPassageGroupsBySubjectAndCurriculum(manifest, prefs.subject || "", prefs.curriculum || "all");
  }, [manifest, prefs.subject, prefs.curriculum]);

  const packs = useMemo(() => {
    if (!manifest || !prefs.groupId) return [];
    return listPassagePacks(manifest, prefs.groupId);
  }, [manifest, prefs.groupId]);

  const selectedGroup = filteredGroups.find(g => g.id === prefs.groupId);
  const selectedPack = packs.find(p => p.id === prefs.packId);
  const selectedLabel = [
    selectedGroup?.displayName,
    selectedPack?.displayName && selectedPack?.displayName !== selectedGroup?.displayName ? selectedPack.displayName : "",
  ].filter(Boolean).join(" — ") || "the selected pack";

  const friendlyMessage = message === "No passages match the current filters."
    ? packs.length === 0
      ? `This group has vocabulary items but no reading passages yet. Try another group, or add passages in My Packs.`
      : `No reading passages found for “${selectedLabel}”. Try another group, or add passages in My Packs.`
    : message;

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
      <div className="lw-card lw-reading-setup-card">
        <div className="lw-reading-setup-grid">
          <div className="lw-reading-main-column">
            <h2 className="lw-section-title">Reading Setup</h2>

            <h3 className="lw-field-heading">Subject</h3>
            <SubjectCardGrid
              subjects={subjectCounts}
              activeSubject={prefs.subject}
              onSelect={(s) => {
                const firstGroup = listPassageGroupsBySubjectAndCurriculum(manifest, s, "all")[0];
                setPrefs((prev) => ({ ...prev, subject: s, curriculum: "all", groupId: firstGroup?.id ?? "", packId: "", category: "all", difficulty: "all" }));
              }}
            />

            <PillGroup
              label="Curriculum"
              items={CURRICULUM_OPTIONS}
              value={prefs.curriculum || "all"}
              onSelect={(c) => {
                const firstGroup = listPassageGroupsBySubjectAndCurriculum(manifest, prefs.subject || "", c)[0];
                setPrefs((prev) => ({ ...prev, curriculum: c, groupId: firstGroup?.id ?? "", packId: "", category: "all", difficulty: "all" }));
              }}
              style={{ marginTop: "14px" }}
            />

            <FilterRow style={{ marginTop: "18px" }}>
              {filteredGroups.length > 0 && (
                <LabeledSelect label="Book / Group" value={prefs.groupId} onChange={(v) => setPrefs((prev) => ({ ...prev, groupId: v, category: "all", difficulty: "all" }))}>
                  {filteredGroups.map((g) => <option key={g.id} value={g.id}>{g.displayName}</option>)}
                </LabeledSelect>
              )}

              {packs.length > 1 && (
                <LabeledSelect label="Set" value={prefs.packId} onChange={(v) => setPrefs((prev) => ({ ...prev, packId: v, category: "all", difficulty: "all" }))}>
                  {packs.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                </LabeledSelect>
              )}
            </FilterRow>

            <FilterRow style={{ marginTop: "14px" }}>
              {categoryOptions.length > 0 && (
                <LabeledSelect label="Topic" value={prefs.category} onChange={(v) => setPref("category", v)}>
                  <option value="all">All topics</option>
                  {categoryOptions.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
                </LabeledSelect>
              )}
              <LabeledSelect label="Difficulty" value={prefs.difficulty} onChange={(v) => setPref("difficulty", v)}>
                <option value="all">All difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </LabeledSelect>
            </FilterRow>

            <div className="lw-reading-options">
              <label className="lw-check-row">
                <input
                  type="checkbox"
                  checked={prefs.showGerman}
                  onChange={e => setPref("showGerman", e.target.checked)}
                />
                Show source text
              </label>
              <label className="lw-check-row">
                <input
                  type="checkbox"
                  checked={prefs.voiceEnabled}
                  onChange={e => setPref("voiceEnabled", e.target.checked)}
                />
                Autoplay voice
              </label>
            </div>

            {friendlyMessage && <p className="lw-reading-message">{friendlyMessage}</p>}

            <div className="lw-reading-actions">
              <button
                className="lw-btn lw-btn-primary"
                type="button"
                onClick={onStart}
                disabled={!prefs.groupId || loading}
              >
                {loading ? "Loading passages…" : "Start reading"}
              </button>
              <StudyBookButton dataset={selectedGroup} />
            </div>
          </div>

          <aside className="lw-reading-side-column" aria-label="Selected reading pack">
            <div>
              <p className="lw-side-label">Selected Pack</p>
              <h3>{selectedGroup?.displayName || "Choose a subject"}</h3>
              {selectedPack && selectedPack.displayName !== selectedGroup?.displayName && (
                <p>{selectedPack.displayName}</p>
              )}
            </div>
            <div>
              <p className="lw-side-label">About this pack</p>
              <p>
                {packs.length > 0
                  ? `${packs.length} reading set${packs.length === 1 ? "" : "s"} available. Choose a topic or difficulty to shape the session.`
                  : "No reading sets are registered for this group yet."}
              </p>
            </div>
            <div>
              <p className="lw-side-label">Need passages?</p>
              <p>Use My Packs to add reading material when a subject is vocabulary-only.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ─── Passage display ──────────────────────────────────────────────────────────

/**
 * Render a passage string as separate <p> elements, one per paragraph.
 * Paragraphs are separated by \n\n in the JSON source.
 * Single-string packs (no newlines) render as one paragraph — no regressions.
 */
function renderParagraphs(text) {
  if (!text) return null;
  const paras = text.split(/\n\n+/).map((p) => p.replace(/\n/g, " ").trim()).filter(Boolean);
  return paras.map((para, i) => (
    <p key={i} className="lw-passage-para">{para}</p>
  ));
}

function PassageDisplay({
  passage, deck, currentIndex, onJump,
  showSource, answers, onAnswer,
  revealed, onReveal, onNext, isLast,
  voiceEnabled, speak, onBack,
}) {
  const speechLang = passage?.speech_language || "en-GB";

  useEffect(() => {
    if (voiceEnabled && passage?.sourceText) {
      speak(passage.sourceText, speechLang);
    }
    // Stop any ongoing speech when the passage changes or the component unmounts.
    // This prevents stale utterances from playing after navigation.
    return () => { if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel(); };
  }, [passage?.id]);

  // Smart passage rendering:
  // For language packs: sourceText is the source language, targetText is the translation.
  // For single-language packs: sourceText IS the main text; targetText may be same/empty.
  // Rule: show targetText as "Translation" only when it differs from sourceText.
  const mainText = passage?.targetText || passage?.sourceText || "";
  const sourceText = passage?.sourceText || "";
  const hasDifferentTranslation =
    mainText &&
    sourceText &&
    sourceText !== mainText;

  const mcqQuestions = (passage?.questions || []).filter(q => q.type === "multiple_choice");
  const openQuestions = (passage?.questions || []).filter(q => q.type !== "multiple_choice");

  return (
    <div className="lw-page">
      <div className="lw-card" style={{ marginBottom: "16px" }}>
        {/* Header row: title + passage selector + audio */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "160px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--lw-ink)" }}>
              {passage?.targetTitle || passage?.sourceTitle || "Passage"}
            </h2>
            {passage?.topic && (
              <span className="lw-chip blue" style={{ marginTop: "4px" }}>{passage.topic}</span>
            )}
          </div>

          {/* Passage jump selector */}
          {deck.length > 1 && (
            <select
              value={currentIndex}
              onChange={(e) => onJump(Number(e.target.value))}
              style={{
                padding: "6px 10px",
                borderRadius: "8px",
                border: "1.5px solid var(--lw-line)",
                background: "var(--lw-panel)",
                color: "var(--lw-ink)",
                fontFamily: "inherit",
                fontSize: "0.85rem",
                flex: "0 0 auto",
                maxWidth: "200px",
              }}
              aria-label="Jump to passage"
            >
              {deck.map((p, i) => (
                <option key={p.id || i} value={i}>
                  {i + 1}. {p.targetTitle || p.sourceTitle || `Passage ${i + 1}`}
                </option>
              ))}
            </select>
          )}

          <button
            className="lw-btn lw-btn-ghost"
            type="button"
            style={{ padding: "4px 10px", fontSize: "0.85rem", flexShrink: 0 }}
            onClick={() => speak(sourceText || mainText, speechLang)}
            title="Read aloud"
          >
            🔊
          </button>
        </div>

        {/* Source text (language packs: German; shown when showSource and it differs) */}
        {showSource && hasDifferentTranslation && (
          <div className="lw-passage-block">
            <div className="lw-passage-label">Source text</div>
            <div className="lw-passage-text">{renderParagraphs(sourceText)}</div>
          </div>
        )}

        {/* For non-language packs: show source directly as main text */}
        {!hasDifferentTranslation && sourceText && (
          <div className="lw-passage-block">
            <div className="lw-passage-text">{renderParagraphs(sourceText)}</div>
          </div>
        )}

        {/* Translation (language packs only — when source ≠ target) */}
        {hasDifferentTranslation && (
          <div className="lw-passage-block">
            <div className="lw-passage-label">Translation</div>
            <div className="lw-passage-text">{renderParagraphs(mainText)}</div>
          </div>
        )}
      </div>

      {/* MCQ questions */}
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

      {/* Open questions */}
      {openQuestions.length > 0 && (
        <div className="lw-card" style={{ marginBottom: "16px" }}>
          <h3 className="lw-section-title">Open questions</h3>
          {openQuestions.map((q, qi) => (
            <div key={q.id || qi} style={{ marginBottom: "16px" }}>
              <p style={{ fontWeight: 600, marginBottom: "8px" }}>{q.question}</p>
              {revealed && q.model_answer_en && (
                <div style={{ background: "rgba(80,180,120,0.1)", border: "1.5px solid var(--lw-green)", borderRadius: "var(--lw-radius-sm)", padding: "12px 16px" }}>
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
        <button className="lw-btn lw-btn-ghost" type="button" onClick={onBack}>
          Back to setup
        </button>
      </div>
    </div>
  );
}

// ─── ReadingPage ──────────────────────────────────────────────────────────────

export default function ReadingPage() {
  const { manifest, loading: manifestLoading } = useManifest();
  const { updateProgress } = useProgress();
  const { speak } = useSpeech();

  const [prefs, setPrefs] = useState({
    subject: "language",
    curriculum: "all",
    groupId: "",
    packId: "",
    category: "all",
    difficulty: "all",   // required — getPlayable filters by difficulty; undefined → no questions match
    showGerman: false,
    voiceEnabled: false,
  });

  const {
    loading, started, current, deck, currentIndex, answers,
    revealed, completedCount, message, categoryOptions,
    startSession, answerQuestion, revealPassage, nextPassage, resetSession, jumpToPassage,
  } = useReadingSession({ manifest, groupId: prefs.groupId, packId: prefs.packId, prefs, updateProgress });

  if (manifestLoading) return <div className="lw-page"><LoadingText /></div>;

  if (!started) {
    return (
      <PassageSetup
        manifest={manifest}
        prefs={prefs}
        setPrefs={setPrefs}
        onStart={startSession}
        message={message}
        loading={loading}
        categoryOptions={categoryOptions}
      />
    );
  }

  if (loading) return <div className="lw-page"><LoadingText text="Loading passages…" /></div>;

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
      deck={deck}
      currentIndex={currentIndex}
      onJump={jumpToPassage}
      showSource={prefs.showGerman}
      answers={answers}
      onAnswer={answerQuestion}
      revealed={revealed}
      onReveal={revealPassage}
      onNext={nextPassage}
      isLast={currentIndex + 1 >= deck.length}
      voiceEnabled={prefs.voiceEnabled}
      speak={speak}
      onBack={resetSession}
    />
  );
}
