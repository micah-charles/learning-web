/**
 * SmartTestPage.jsx
 *
 * Smart Test / Integrated Practice mode.
 * Orchestrates MCQ, flashcard, reading, and argument sections from a single pack.
 *
 * Phases:
 *   setup → running (per section) → section_complete → done
 *
 * Architecture: follows existing page patterns (QuizPage, ReadingPage).
 * Uses ManifestContext, ProgressContext. No direct localStorage.
 */

import { useState, useMemo, useCallback } from "react";
import { useManifest }  from "../context/ManifestContext.jsx";
import { useProgress }  from "../context/ProgressContext.jsx";
import { useSmartTestSession, calcScore } from "../hooks/useSmartTestSession.js";
import { SubjectCardGrid } from "../components/layout/SubjectCardGrid.jsx";
import { LabeledSelect, FilterRow, EmptyState, LoadingText } from "../components/layout/Controls.jsx";
import {
  listDatasetsBySubjectAndCurriculum,
  listCurricula,
  findDataset,
  getDatasetSubject,
  SUBJECTS,
} from "@/data.js";

// ─── Tiny shared style helpers (inline — keeps this self-contained) ───────────

const card = {
  background: "var(--lw-panel)",
  borderRadius: "var(--lw-radius)",
  border: "1px solid var(--lw-line)",
  padding: "20px",
  marginBottom: "16px",
};

const btn = (variant = "primary") => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 22px",
  borderRadius: "var(--lw-radius-sm)",
  fontWeight: 600,
  fontSize: "0.95rem",
  cursor: "pointer",
  border: "none",
  ...(variant === "primary"   ? { background: "var(--lw-blue)",   color: "#fff" } : {}),
  ...(variant === "secondary" ? { background: "var(--lw-panel)",  color: "var(--lw-ink)", border: "1px solid var(--lw-line)" } : {}),
  ...(variant === "green"     ? { background: "var(--lw-green)",  color: "#fff" } : {}),
  ...(variant === "amber"     ? { background: "var(--lw-amber)",  color: "#fff" } : {}),
  ...(variant === "ghost"     ? { background: "transparent",      color: "var(--lw-muted)", border: "1px solid var(--lw-line)" } : {}),
});

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, max, label }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--lw-muted)", marginBottom: "4px" }}>
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div style={{ height: "6px", background: "var(--lw-line)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "var(--lw-blue)", borderRadius: "3px", transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ section, sectionNumber, totalSections }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ fontSize: "0.78rem", color: "var(--lw-muted)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "4px" }}>
        Section {sectionNumber} of {totalSections}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "1.4rem" }}>{section.icon}</span>
        <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--lw-ink)" }}>{section.title}</h2>
      </div>
      {section.description && (
        <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "var(--lw-muted)" }}>{section.description}</p>
      )}
    </div>
  );
}

// ─── MCQ Section ─────────────────────────────────────────────────────────────

function McqSection({ section, sectionNumber, totalSections, onAnswer, onNext, onFinishSection }) {
  const question  = section.questions[section.currentIndex];
  const answered  = section.answers[question?.id];
  const allDone   = section.currentIndex >= section.questions.length - 1 && answered;
  const isLast    = section.currentIndex >= section.questions.length - 1;

  if (!question) return null;

  return (
    <div>
      <SectionHeader section={section} sectionNumber={sectionNumber} totalSections={totalSections} />
      <ProgressBar value={section.currentIndex + (answered ? 1 : 0)} max={section.questions.length} label={`Question ${section.currentIndex + 1} of ${section.questions.length}`} />

      <div style={card}>
        <div style={{ fontSize: "0.75rem", color: "var(--lw-muted)", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          What does this term mean?
        </div>
        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--lw-ink)", marginBottom: "18px" }}>
          {question.term}
        </div>

        <div style={{ display: "grid", gap: "8px" }}>
          {question.options.map(opt => {
            let bg = "var(--lw-panel)";
            let border = "1px solid var(--lw-line)";
            let color = "var(--lw-ink)";
            if (answered) {
              if (opt.correct) { bg = "var(--lw-green-soft, #e8f5e9)"; border = "2px solid var(--lw-green)"; color = "var(--lw-green)"; }
              else if (answered.selected === opt.letter && !opt.correct) { bg = "var(--lw-coral-soft, #fdecea)"; border = "2px solid var(--lw-coral)"; color = "var(--lw-coral)"; }
            }
            return (
              <button
                key={opt.letter}
                style={{ textAlign: "left", padding: "10px 14px", borderRadius: "var(--lw-radius-sm)", background: bg, border, color, cursor: answered ? "default" : "pointer", fontWeight: 500, fontSize: "0.92rem", transition: "border 0.15s, background 0.15s" }}
                onClick={() => !answered && onAnswer(question.id, opt.letter)}
                disabled={!!answered}
                aria-pressed={answered?.selected === opt.letter}
              >
                <span style={{ fontWeight: 700, marginRight: "8px" }}>{opt.letter}</span>
                {opt.text.length > 100 ? opt.text.slice(0, 100) + "…" : opt.text}
              </button>
            );
          })}
        </div>

        {answered && (
          <div style={{ marginTop: "14px", padding: "10px 14px", borderRadius: "var(--lw-radius-sm)", background: answered.correct ? "var(--lw-green-soft, #e8f5e9)" : "var(--lw-coral-soft, #fdecea)", fontSize: "0.9rem", fontWeight: 600, color: answered.correct ? "var(--lw-green)" : "var(--lw-coral)" }}>
            {answered.correct ? "✓ Correct!" : `✗ The correct answer was: ${question.options.find(o => o.correct)?.text?.slice(0, 80)}`}
          </div>
        )}
      </div>

      {answered && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          {isLast
            ? <button style={btn("primary")} onClick={onFinishSection}>Next Section →</button>
            : <button style={btn("primary")} onClick={onNext}>Next Question →</button>
          }
        </div>
      )}
    </div>
  );
}

// ─── Flashcard Section ────────────────────────────────────────────────────────

function FlashcardSection({ section, sectionNumber, totalSections, onAssess, onFinishSection }) {
  const [revealed, setRevealed] = useState(false);
  const card_ = section.cards[section.currentIndex];
  const isLast = section.currentIndex >= section.cards.length - 1;
  const assessed = card_ ? section.answers[card_.id] : null;

  // Reset revealed state when card changes
  const prevCardId = useMemo(() => null, []); // eslint-disable-line

  if (!card_) return null;

  function handleAssess(assessment) {
    setRevealed(false);
    onAssess(card_.id, assessment);
  }

  return (
    <div>
      <SectionHeader section={section} sectionNumber={sectionNumber} totalSections={totalSections} />
      <ProgressBar value={section.currentIndex + (assessed ? 1 : 0)} max={section.cards.length} label={`Card ${section.currentIndex + 1} of ${section.cards.length}`} />

      <div style={{ ...card, textAlign: "center", minHeight: "160px" }}>
        {card_.topic && (
          <div style={{ fontSize: "0.75rem", color: "var(--lw-muted)", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{card_.topic}</div>
        )}
        <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--lw-ink)", marginBottom: "16px" }}>
          {card_.term}
        </div>

        {!revealed && !assessed ? (
          <button style={{ ...btn("secondary"), margin: "0 auto" }} onClick={() => setRevealed(true)}>
            Reveal Definition
          </button>
        ) : (
          <div style={{ fontSize: "0.95rem", color: "var(--lw-ink)", lineHeight: 1.6, padding: "0 4px" }}>
            {card_.definition}
          </div>
        )}
      </div>

      {(revealed || assessed) && !assessed && (
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button style={btn("green")}  onClick={() => handleAssess("known")}>  ✓ Got it</button>
          <button style={btn("amber")}  onClick={() => handleAssess("review")}> ↻ Review again</button>
        </div>
      )}

      {assessed && isLast && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
          <button style={btn("primary")} onClick={onFinishSection}>Next Section →</button>
        </div>
      )}
    </div>
  );
}

// ─── Reading Section ──────────────────────────────────────────────────────────

function ReadingSection({ section, sectionNumber, totalSections, onComplete }) {
  const { passage } = section;
  return (
    <div>
      <SectionHeader section={section} sectionNumber={sectionNumber} totalSections={totalSections} />
      <div style={card}>
        <h3 style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: 700 }}>{passage.title}</h3>
        <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.7, color: "var(--lw-ink)", whiteSpace: "pre-wrap" }}>
          {passage.text}
        </p>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button style={btn("primary")} onClick={onComplete}>Next Section →</button>
      </div>
    </div>
  );
}

// ─── Argument Section ─────────────────────────────────────────────────────────

function ArgumentSection({ section, sectionNumber, totalSections, onComplete }) {
  return (
    <div>
      <SectionHeader section={section} sectionNumber={sectionNumber} totalSections={totalSections} />

      {section.statement && (
        <div style={{ ...card, borderLeft: "3px solid var(--lw-blue)", background: "var(--lw-blue-soft, #e3f2fd)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--lw-muted)", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase" }}>Statement to evaluate</div>
          <p style={{ margin: 0, fontStyle: "italic", color: "var(--lw-ink)", fontWeight: 600 }}>{section.statement}</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
        {/* FOR column */}
        <div>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--lw-green)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>
            ✓ Arguments For
          </div>
          {section.forItems.length === 0
            ? <p style={{ fontSize: "0.85rem", color: "var(--lw-muted)" }}>None available</p>
            : section.forItems.map(item => (
              <ArgumentCard key={item.id} item={item} color="var(--lw-green)" softColor="var(--lw-green-soft, #e8f5e9)" />
            ))
          }
        </div>

        {/* AGAINST column */}
        <div>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--lw-coral)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>
            ✗ Arguments Against
          </div>
          {section.againstItems.length === 0
            ? <p style={{ fontSize: "0.85rem", color: "var(--lw-muted)" }}>None available</p>
            : section.againstItems.map(item => (
              <ArgumentCard key={item.id} item={item} color="var(--lw-coral)" softColor="var(--lw-coral-soft, #fdecea)" />
            ))
          }
        </div>
      </div>

      {section.neutralItems.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--lw-amber)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>
            ↔ Additional Points
          </div>
          {section.neutralItems.map(item => (
            <ArgumentCard key={item.id} item={item} color="var(--lw-amber)" softColor="var(--lw-amber-soft, #fff8e1)" />
          ))}
        </div>
      )}

      <div style={{ ...card, background: "var(--lw-panel)", borderStyle: "dashed" }}>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--lw-muted)", lineHeight: 1.5 }}>
          <strong>Tip:</strong> Use the points above to write a balanced evaluation. Refer to specific beliefs, give reasoned arguments for both sides, and reach a justified conclusion.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button style={btn("primary")} onClick={onComplete}>Finish Test →</button>
      </div>
    </div>
  );
}

function ArgumentCard({ item, color, softColor }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: softColor, border: `1px solid ${color}`, borderRadius: "var(--lw-radius-sm)", padding: "10px 12px", marginBottom: "8px" }}>
      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--lw-ink)", marginBottom: open ? "6px" : 0, cursor: item.detail ? "pointer" : "default" }}
           onClick={() => item.detail && setOpen(o => !o)}>
        {item.claim}
        {item.detail && <span style={{ marginLeft: "6px", fontSize: "0.75rem", color }}>{open ? "▲" : "▼"}</span>}
      </div>
      {open && item.detail && (
        <div style={{ fontSize: "0.85rem", color: "var(--lw-ink)", lineHeight: 1.55, borderTop: `1px solid ${color}`, paddingTop: "6px" }}>
          {item.detail}
        </div>
      )}
    </div>
  );
}

// ─── Results Page ─────────────────────────────────────────────────────────────

function ResultsPage({ score, session, onRetry, onReset }) {
  if (!score) return null;

  const label = score.pct >= 80 ? "Excellent!" : score.pct >= 60 ? "Good work" : "Keep practising";
  const labelColor = score.pct >= 80 ? "var(--lw-green)" : score.pct >= 60 ? "var(--lw-amber)" : "var(--lw-coral)";

  return (
    <div className="lw-page">
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "8px" }}>
          {score.pct >= 80 ? "🏆" : score.pct >= 60 ? "⭐" : "💪"}
        </div>
        <h2 style={{ margin: "0 0 4px", fontSize: "1.4rem", color: labelColor }}>{label}</h2>
        <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--lw-ink)" }}>{score.pct}%</div>
        <div style={{ fontSize: "0.9rem", color: "var(--lw-muted)" }}>{score.totalCorrect} / {score.totalQuestions} scored questions</div>
      </div>

      {/* Breakdown by section */}
      <div style={card}>
        <h3 style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: 700 }}>Score breakdown</h3>
        {score.sections.mcq && (
          <ScoreRow icon="✓" label="Knowledge Check (MCQ)" correct={score.sections.mcq.correct} total={score.sections.mcq.total} />
        )}
        {score.sections.flashcard && (
          <ScoreRow icon="💡" label="Key Concepts (Flashcard)" correct={score.sections.flashcard.known} total={score.sections.flashcard.total} />
        )}
        {score.sections.reading?.done && (
          <ScoreRow icon="📖" label="Reading" correct={null} total={null} done />
        )}
        {score.sections.argument?.done && (
          <ScoreRow icon="⚖️" label="Evaluation Practice" correct={null} total={null} done />
        )}
      </div>

      {/* Weak items */}
      {score.weakItems.length > 0 && (
        <div style={card}>
          <h3 style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: 700, color: "var(--lw-coral)" }}>
            Review these ({score.weakItems.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {score.weakItems.slice(0, 8).map((w, i) => (
              <div key={i} style={{ padding: "8px 12px", background: "var(--lw-coral-soft, #fdecea)", borderRadius: "var(--lw-radius-sm)", fontSize: "0.9rem" }}>
                <strong>{(w.de || w.sourceWord || "").trim()}</strong>
                {" — "}
                <span style={{ color: "var(--lw-muted)" }}>{(w.en || w.targetWord || "").slice(0, 70).trim()}{(w.en || w.targetWord || "").length > 70 ? "…" : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
        {score.weakItems.length > 0 && (
          <button style={btn("primary")} onClick={() => onRetry(score.weakItems)}>
            Retry weak items
          </button>
        )}
        <button style={btn("secondary")} onClick={onReset}>New Test</button>
      </div>
    </div>
  );
}

function ScoreRow({ icon, label, correct, total, done }) {
  const pct = total ? Math.round((correct / total) * 100) : null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--lw-line)" }}>
      <span style={{ fontSize: "0.9rem" }}>{icon} {label}</span>
      {done
        ? <span style={{ fontSize: "0.85rem", color: "var(--lw-green)", fontWeight: 600 }}>✓ Done</span>
        : <span style={{ fontSize: "0.9rem", fontWeight: 700, color: pct >= 80 ? "var(--lw-green)" : pct >= 60 ? "var(--lw-amber)" : "var(--lw-coral)" }}>
            {correct}/{total} ({pct}%)
          </span>
      }
    </div>
  );
}

// ─── Setup Page ───────────────────────────────────────────────────────────────

function SetupPage({ manifest, prefs, setPrefs, onStart }) {
  const curriculumOptions = useMemo(
    () => [{ id: "all", label: "All Curricula" }, ...(manifest ? listCurricula(manifest) : [])],
    [manifest],
  );

  const subjectCounts = useMemo(() =>
    SUBJECTS.map(id => ({
      id,
      count: manifest ? listDatasetsBySubjectAndCurriculum(manifest, id, prefs.curriculum || "all").length : 0,
    })),
    [manifest, prefs.curriculum],
  );

  const filteredDatasets = useMemo(() => {
    if (!manifest) return [];
    return listDatasetsBySubjectAndCurriculum(manifest, prefs.subject || "", prefs.curriculum || "all");
  }, [manifest, prefs.subject, prefs.curriculum]);

  const datasetOptions = filteredDatasets.map(d => ({ id: d.id, label: d.displayName }));

  const dataset = useMemo(() => {
    if (!manifest || !prefs.datasetId) return null;
    return findDataset(manifest, prefs.datasetId);
  }, [manifest, prefs.datasetId]);

  const canStart = !!dataset;

  return (
    <div className="lw-page">
      <div style={card}>
        <h2 style={{ margin: "0 0 4px", fontSize: "1.2rem", fontWeight: 700 }}>Smart Test</h2>
        <p style={{ margin: "0 0 20px", fontSize: "0.88rem", color: "var(--lw-muted)" }}>
          Mix quiz, reading, and argument practice in one session.
        </p>

        <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--lw-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>Subject</h3>
        <SubjectCardGrid
          subjects={subjectCounts}
          activeSubject={prefs.subject}
          onSelect={subj => {
            const first = manifest ? listDatasetsBySubjectAndCurriculum(manifest, subj, "all")[0] : null;
            setPrefs(p => ({ ...p, subject: subj, curriculum: "all", datasetId: first?.id || "" }));
          }}
        />

        <FilterRow style={{ marginTop: "16px" }}>
          <LabeledSelect
            label="Curriculum"
            value={prefs.curriculum || "all"}
            onChange={v => setPrefs(p => ({ ...p, curriculum: v }))}
          >
            {curriculumOptions.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </LabeledSelect>
          <LabeledSelect
            label="Pack"
            value={prefs.datasetId || ""}
            onChange={v => setPrefs(p => ({ ...p, datasetId: v }))}
          >
            {!prefs.subject && <option value="">— select a subject first —</option>}
            {datasetOptions.length === 0 && prefs.subject && <option value="">— no packs —</option>}
            {datasetOptions.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </LabeledSelect>
        </FilterRow>
      </div>

      {/* Preview of what sections will be available */}
      <div style={card}>
        <h3 style={{ margin: "0 0 12px", fontSize: "0.9rem", fontWeight: 700, color: "var(--lw-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          What's in a Smart Test
        </h3>
        <div style={{ display: "grid", gap: "8px" }}>
          {[
            { icon: "✓", title: "Knowledge Check", desc: "5 multiple-choice questions from vocab items" },
            { icon: "💡", title: "Key Concepts",    desc: "3 flashcard-style self-assessment cards" },
            { icon: "📖", title: "Reading",          desc: "Passage study (if pack has reading content)" },
            { icon: "⚖️", title: "Evaluation",       desc: "FOR / AGAINST argument scaffold (if available)" },
          ].map(s => (
            <div key={s.icon} style={{ display: "flex", gap: "10px", padding: "8px 10px", borderRadius: "var(--lw-radius-sm)", background: "var(--lw-bg, #fafaf8)" }}>
              <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{s.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{s.title}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--lw-muted)" }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          style={{ ...btn("primary"), fontSize: "1rem", padding: "12px 32px", opacity: canStart ? 1 : 0.4 }}
          onClick={() => canStart && onStart()}
          disabled={!canStart}
          aria-disabled={!canStart}
        >
          Start Smart Test
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SmartTestPage() {
  const { manifest } = useManifest();
  const { progress, updateProgress } = useProgress();

  const {
    session, loading, error,
    currentSection, sectionNumber, totalSections,
    answered, total,
    startSession, answerMcq, nextMcqQuestion,
    assessFlashcard, completeSection, nextSection, resetSession,
    calcScore: getScore,
  } = useSmartTestSession();

  // Local prefs — not persisted (session-only)
  const [prefs, setPrefs] = useState({
    subject: "",
    curriculum: "all",
    datasetId: "",
  });

  const dataset = useMemo(() => {
    if (!manifest || !prefs.datasetId) return null;
    return findDataset(manifest, prefs.datasetId);
  }, [manifest, prefs.datasetId]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleStart() {
    if (!manifest || !dataset) return;
    startSession({ manifest, dataset });
  }

  function handleAnswerMcq(questionId, letter) {
    answerMcq(questionId, letter, updateProgress);
  }

  function handleAssessFlashcard(cardId, assessment) {
    assessFlashcard(cardId, assessment, updateProgress);
  }

  function handleSectionComplete() {
    completeSection();
    nextSection();
  }

  function handleRetryWeak(weakItems) {
    // Navigate back to quiz with weak items (reuse existing quiz cross-tab pattern)
    // For now: reset to setup — full retry support via Quiz tab
    resetSession();
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="lw-page">
        <LoadingText />
      </div>
    );
  }

  // Results phase
  if (session?.phase === "done") {
    const score = getScore();
    return (
      <ResultsPage
        score={score}
        session={session}
        onRetry={handleRetryWeak}
        onReset={resetSession}
      />
    );
  }

  // Setup phase (no session yet)
  if (!session) {
    return (
      <>
        {error && (
          <div style={{ padding: "12px 16px", background: "var(--lw-coral-soft, #fdecea)", color: "var(--lw-coral)", borderRadius: "var(--lw-radius-sm)", margin: "0 0 12px" }}>
            {error}
          </div>
        )}
        <SetupPage manifest={manifest} prefs={prefs} setPrefs={setPrefs} onStart={handleStart} />
      </>
    );
  }

  // Running phase
  const sec = currentSection;
  if (!sec) {
    nextSection();
    return null;
  }

  return (
    <div className="lw-page">
      {/* Overall progress */}
      {total > 0 && (
        <ProgressBar value={answered} max={total} label={`Overall — ${answered} of ${total} scored questions`} />
      )}

      {/* Current section */}
      {sec.type === "mcq" && (
        <McqSection
          section={sec}
          sectionNumber={sectionNumber}
          totalSections={totalSections}
          onAnswer={handleAnswerMcq}
          onNext={nextMcqQuestion}
          onFinishSection={handleSectionComplete}
        />
      )}

      {sec.type === "flashcard" && (
        <FlashcardSection
          section={sec}
          sectionNumber={sectionNumber}
          totalSections={totalSections}
          onAssess={handleAssessFlashcard}
          onFinishSection={handleSectionComplete}
        />
      )}

      {sec.type === "reading" && (
        <ReadingSection
          section={sec}
          sectionNumber={sectionNumber}
          totalSections={totalSections}
          onComplete={handleSectionComplete}
        />
      )}

      {sec.type === "argument" && (
        <ArgumentSection
          section={sec}
          sectionNumber={sectionNumber}
          totalSections={totalSections}
          onComplete={handleSectionComplete}
        />
      )}

      {/* Exit */}
      <div style={{ marginTop: "24px", textAlign: "center" }}>
        <button style={btn("ghost")} onClick={resetSession}>← Exit test</button>
      </div>
    </div>
  );
}
