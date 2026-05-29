import { useState, useMemo, useEffect } from "react";
import { useManifest } from "../context/ManifestContext.jsx";
import { useProgress } from "../context/ProgressContext.jsx";
import { useReadingSession } from "../hooks/useReadingSession.js";
import { useSpeech } from "../hooks/useSpeech.js";
import { SubjectCardGrid } from "../components/layout/SubjectCardGrid.jsx";
import { LabeledSelect, PillGroup, FilterRow, LoadingText } from "../components/layout/Controls.jsx";
import { StudyBookButton } from "../components/learning/StudyBookDrawer.jsx";
import { listPassageGroups, listPassageGroupsBySubjectAndCurriculum, listPassagePacks, SUBJECTS, CURRICULUMS, CURRICULUM_LABELS } from "@/data.js";

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
      : `No reading passages found for "${selectedLabel}". Try another group, or add passages in My Packs.`
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

// ─── Passage paragraph renderer ───────────────────────────────────────────────

/**
 * Render a passage string as numbered paragraph elements.
 * Paragraphs are separated by \n\n in the JSON source.
 * Supports optional evidence highlighting (flash animation + quote mark).
 *
 * @param {string} text - The raw passage text.
 * @param {object} opts
 * @param {number|null} opts.highlightPara - 1-based paragraph index to highlight.
 * @param {string|null}  opts.highlightQuote - Exact quote substring to mark.
 */
function renderNumberedParagraphs(text, { highlightPara = null, highlightQuote = null } = {}) {
  if (!text) return null;
  const paras = text.split(/\n\n+/).map((p) => p.replace(/\n/g, " ").trim()).filter(Boolean);
  return paras.map((para, i) => {
    const num = i + 1;
    const isHighlighted = highlightPara === num;

    let content;
    if (isHighlighted && highlightQuote) {
      const idx = para.indexOf(highlightQuote);
      if (idx >= 0) {
        content = (
          <>
            {para.slice(0, idx)}
            <mark className="lw-evidence-mark">{highlightQuote}</mark>
            {para.slice(idx + highlightQuote.length)}
          </>
        );
      } else {
        content = para;
      }
    } else {
      content = para;
    }

    return (
      <p
        key={i}
        id={`rws-para-${num}`}
        className={`lw-rws-para${isHighlighted ? " lw-rws-para--hl" : ""}`}
      >
        <span className="lw-para-num" aria-hidden="true">[{num}]</span>
        {content}
      </p>
    );
  });
}

// ─── Single question card ─────────────────────────────────────────────────────

function QuestionCard({ question: q, answers, onAnswer, revealed, onShowEvidence }) {
  const userAnswer = answers[q.id];
  const isAnswered = userAnswer !== undefined;
  const isMCQ = q.type === "multiple_choice" || (Array.isArray(q.options) && q.options.length > 0);
  const correctOpt = isMCQ ? (q.options?.[q.correct_option_index] ?? q.correct_answer) : null;

  return (
    <div className="lw-rws-q-card">
      {/* Metadata badges */}
      <div className="lw-rws-q-meta">
        {q.difficulty && (
          <span className={`lw-chip ${q.difficulty === "hard" ? "coral" : q.difficulty === "easy" ? "green" : "blue"}`}>
            {q.difficulty}
          </span>
        )}
        <span className="lw-chip">{isMCQ ? "Multiple choice" : "Open"}</span>
      </div>

      {/* Question text */}
      <p className="lw-rws-q-text">{q.question}</p>

      {/* Evidence linker — only renders when sourceRef is present in the question */}
      {q.sourceRef && (
        <button
          className="lw-btn lw-btn-ghost lw-rws-evidence-btn"
          type="button"
          onClick={() => onShowEvidence(q.sourceRef)}
        >
          🔍 Show evidence{q.sourceRef.paragraph ? ` (¶${q.sourceRef.paragraph})` : ""}
        </button>
      )}

      {/* MCQ options */}
      {isMCQ && (
        <div className="lw-option-grid lw-rws-option-grid">
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
      )}

      {/* Open question: model answer (after reveal) */}
      {!isMCQ && revealed && q.model_answer_en && (
        <div className="lw-rws-model-answer">
          <p className="lw-rws-model-answer-label">Model answer</p>
          <p>{q.model_answer_en}</p>
        </div>
      )}

      {/* Open question: hint before reveal */}
      {!isMCQ && !revealed && (
        <p className="lw-rws-open-hint">Written response — reveal to see model answer.</p>
      )}
    </div>
  );
}

// ─── Reading workspace (split-panel context viewer) ───────────────────────────

/**
 * ReadingWorkspace — the main reading mode UI.
 *
 * Layout (desktop): two-column grid — passage left, sticky question panel right.
 * Layout (mobile):  single column stack — passage above, questions below.
 *
 * All display state (currentQuestionIndex, highlights, fontScale, lineSpacing)
 * is runtime-only — intentionally NOT persisted to localStorage.
 */
function ReadingWorkspace({
  passage, deck, currentIndex, onJump,
  showSource, answers, onAnswer,
  revealed, onReveal, onNext, isLast,
  voiceEnabled, speak, onBack,
}) {
  // ── Runtime-only display state ──────────────────────────────────────────────
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [highlightPara, setHighlightPara]   = useState(null);  // 1-based paragraph index
  const [highlightQuote, setHighlightQuote] = useState(null);  // quote substring
  const [fontScale, setFontScale]           = useState(1);     // em multiplier: 0.85–1.4
  const [lineSpacing, setLineSpacing]       = useState(1.75);  // line-height value

  const speechLang  = passage?.speech_language || "en-GB";
  const mainText    = passage?.targetText || passage?.sourceText || "";
  const sourceText  = passage?.sourceText || "";
  const hasDifferentTranslation = mainText && sourceText && sourceText !== mainText;
  // For single-language packs sourceText IS the main text (no separate translation)
  const displayText = hasDifferentTranslation ? sourceText : mainText;

  const allQuestions  = passage?.questions || [];
  const totalQ        = allQuestions.length;
  const currentQ      = allQuestions[currentQuestionIndex] || null;
  const answeredCount = Object.keys(answers).length;

  // Auto-play voice on passage change
  useEffect(() => {
    if (voiceEnabled && passage?.sourceText) {
      speak(passage.sourceText, speechLang);
    }
    return () => { if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel(); };
  }, [passage?.id]);

  // Reset question index + highlights when passage changes
  useEffect(() => {
    setCurrentQuestionIndex(0);
    setHighlightPara(null);
    setHighlightQuote(null);
  }, [passage?.id]);

  // Auto-clear evidence highlight after 3 s (RC9-safe — called outside setState)
  useEffect(() => {
    if (highlightPara === null) return;
    const t = setTimeout(() => {
      setHighlightPara(null);
      setHighlightQuote(null);
    }, 3000);
    return () => clearTimeout(t);
  }, [highlightPara, highlightQuote]);

  function goToQuestion(idx) {
    if (idx >= 0 && idx < totalQ) setCurrentQuestionIndex(idx);
  }

  /**
   * Scroll the passage to the referenced paragraph and briefly flash it.
   * Also highlights a specific quote substring if provided.
   */
  function showEvidence(sourceRef) {
    if (!sourceRef) return;
    const { paragraph, quote } = sourceRef;
    if (!paragraph) return;
    setHighlightPara(paragraph);
    setHighlightQuote(quote || null);
    const el = document.getElementById(`rws-para-${paragraph}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function nudgeFontScale(delta) {
    setFontScale(s => parseFloat(Math.min(1.4, Math.max(0.85, s + delta)).toFixed(2)));
  }

  return (
    <div className="lw-page lw-rws-page">
      <div className="lw-rws">

        {/* ── LEFT: Passage panel ── */}
        <section className="lw-rws-passage" aria-label="Reading passage">

          {/* Sticky toolbar — title + font controls + audio */}
          <div className="lw-rws-toolbar">
            <div className="lw-rws-toolbar-left">
              <h2 className="lw-rws-title">
                {passage?.targetTitle || passage?.sourceTitle || "Passage"}
              </h2>
              {passage?.topic && (
                <span className="lw-chip blue lw-rws-topic-chip">{passage.topic}</span>
              )}
            </div>
            <div className="lw-rws-toolbar-right">
              {/* Font size */}
              <button className="lw-btn lw-btn-ghost lw-rws-font-btn" type="button"
                onClick={() => nudgeFontScale(-0.1)} aria-label="Decrease font size" title="Smaller text">
                A−
              </button>
              <button className="lw-btn lw-btn-ghost lw-rws-font-btn" type="button"
                onClick={() => setFontScale(1)} aria-label="Reset font size" title="Reset size">
                A
              </button>
              <button className="lw-btn lw-btn-ghost lw-rws-font-btn" type="button"
                onClick={() => nudgeFontScale(0.1)} aria-label="Increase font size" title="Larger text">
                A+
              </button>
              {/* Line spacing toggle */}
              <button className="lw-btn lw-btn-ghost lw-rws-font-btn" type="button"
                title="Toggle line spacing"
                aria-label="Toggle line spacing"
                onClick={() => setLineSpacing(s => s < 1.9 ? 2.1 : 1.75)}>
                ≡
              </button>
              {/* Audio */}
              <button className="lw-btn lw-btn-ghost lw-rws-audio-btn" type="button"
                onClick={() => speak(displayText, speechLang)}
                title="Read aloud" aria-label="Read passage aloud">
                🔊
              </button>
            </div>
          </div>

          {/* Passage jump selector (shown when session has multiple passages) */}
          {deck.length > 1 && (
            <div className="lw-rws-jump-row">
              <select
                value={currentIndex}
                onChange={(e) => onJump(Number(e.target.value))}
                className="lw-rws-jump-select"
                aria-label="Jump to passage"
              >
                {deck.map((p, i) => (
                  <option key={p.id || i} value={i}>
                    {i + 1}. {p.targetTitle || p.sourceTitle || `Passage ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Main passage text with numbered paragraph anchors */}
          <div
            className="lw-rws-text"
            style={{ fontSize: `${fontScale}em`, lineHeight: lineSpacing }}
          >
            {renderNumberedParagraphs(displayText, { highlightPara, highlightQuote })}
          </div>

          {/* Translation block (language packs only — source ≠ target) */}
          {showSource && hasDifferentTranslation && (
            <div className="lw-passage-block lw-rws-translation">
              <div className="lw-passage-label">Translation</div>
              <div
                className="lw-rws-text lw-rws-text--translation"
                style={{ fontSize: `${fontScale}em`, lineHeight: lineSpacing }}
              >
                {renderNumberedParagraphs(mainText)}
              </div>
            </div>
          )}

          {/* Footer: back button */}
          <div className="lw-rws-passage-footer">
            <button className="lw-btn lw-btn-ghost" type="button" onClick={onBack}>
              ← Back to setup
            </button>
          </div>
        </section>

        {/* ── RIGHT: Question panel (sticky on desktop) ── */}
        <aside className="lw-rws-questions" aria-label="Questions">

          {/* Progress indicator */}
          {totalQ > 0 && (
            <div className="lw-rws-progress">
              <div className="lw-rws-progress-label">
                <span>Question {currentQuestionIndex + 1} / {totalQ}</span>
                <span className="lw-rws-answered-count">{answeredCount} answered</span>
              </div>
              <div
                className="lw-rws-progress-bar"
                role="progressbar"
                aria-valuenow={answeredCount}
                aria-valuemax={totalQ}
                aria-label={`${answeredCount} of ${totalQ} questions answered`}
              >
                <div
                  className="lw-rws-progress-fill"
                  style={{ width: `${totalQ > 0 ? (answeredCount / totalQ) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Current question */}
          {currentQ ? (
            <QuestionCard
              question={currentQ}
              answers={answers}
              onAnswer={onAnswer}
              revealed={revealed}
              onShowEvidence={showEvidence}
            />
          ) : (
            <p className="lw-rws-no-questions">No questions for this passage.</p>
          )}

          {/* Question navigation (prev / dot index / next) */}
          {totalQ > 1 && (
            <nav className="lw-rws-q-nav" aria-label="Question navigation">
              <button
                className="lw-btn lw-btn-ghost"
                type="button"
                onClick={() => goToQuestion(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
                aria-label="Previous question"
              >
                ← Prev
              </button>

              {/* Dot index — shown when ≤ 12 questions */}
              {totalQ <= 12 && (
                <div className="lw-rws-q-dots" aria-label="Question index">
                  {allQuestions.map((q, i) => (
                    <button
                      key={q.id || i}
                      type="button"
                      className={[
                        "lw-rws-q-dot",
                        i === currentQuestionIndex ? "active" : "",
                        answers[q.id] !== undefined ? "answered" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => goToQuestion(i)}
                      aria-label={`Question ${i + 1}`}
                      aria-current={i === currentQuestionIndex ? "true" : undefined}
                    />
                  ))}
                </div>
              )}

              <button
                className="lw-btn lw-btn-ghost"
                type="button"
                onClick={() => goToQuestion(currentQuestionIndex + 1)}
                disabled={currentQuestionIndex === totalQ - 1}
                aria-label="Next question"
              >
                Next →
              </button>
            </nav>
          )}

          {/* Passage-level actions: reveal / next passage */}
          <div className="lw-rws-passage-actions">
            {!revealed ? (
              <button className="lw-btn lw-btn-secondary" type="button" onClick={onReveal}
                style={{ width: "100%" }}>
                Show answers
              </button>
            ) : (
              <button className="lw-btn lw-btn-primary" type="button" onClick={onNext}
                style={{ width: "100%" }}>
                {isLast ? "Finish" : "Next passage →"}
              </button>
            )}
          </div>
        </aside>

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
    subject:     "language",
    curriculum:  "all",
    groupId:     "",
    packId:      "",
    category:    "all",
    difficulty:  "all",
    showGerman:  false,
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
            <button className="lw-btn lw-btn-primary" type="button" onClick={resetSession}>
              New session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ReadingWorkspace
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
