import { useEffect, useState, useMemo, useCallback } from "react";
import { useManifest } from "../context/ManifestContext.jsx";
import { useProgress } from "../context/ProgressContext.jsx";
import { useBuilderSession } from "../hooks/useBuilderSession.js";
import { useVoicePractice } from "../hooks/useVoicePractice.js";
import { useSpeech } from "../hooks/useSpeech.js";
import { TileBuilder } from "../components/learning/TileBuilder.jsx";
import { LabeledSelect, PillGroup, FilterRow, EmptyState, LoadingText } from "../components/layout/Controls.jsx";
import { SubjectCardGrid } from "../components/layout/SubjectCardGrid.jsx";
import { StudyBookButton } from "../components/learning/StudyBookDrawer.jsx";
import { LearningImage } from "../components/learning/LearningImage.jsx";
import VoicePracticeButton from "../components/learning/VoicePracticeButton.jsx";
import VoiceFeedbackPanel from "../components/learning/VoiceFeedbackPanel.jsx";
import { getBuilderPackSubject, getDatasetCurriculum, listSentenceBuilderPacks, SUBJECTS, listCurricula } from "@/data.js";
import { normLang } from "@/lang-utils.js";
import { filterPacksForPrefs } from "../utils/personalisation.js";

const FILTER_OPTIONS = [
  { id: "all",              label: "All"               },
  { id: "key_date",         label: "Key Dates"         },
  { id: "key_term",         label: "Key Terms"         },
  { id: "example_sentence", label: "Example Sentences" },
];

export default function BuilderPage() {
  const { manifest, loading: manifestLoading } = useManifest();
  const { progress, updateProgress } = useProgress();

  const allPacks = useMemo(
    () => manifest ? filterPacksForPrefs(listSentenceBuilderPacks(manifest), progress?.prefs || {}, "builder") : [],
    [manifest, progress?.prefs],
  );
  const curriculumOptions = useMemo(
    () => [{ id: "all", label: "All" }, ...(manifest ? listCurricula(manifest) : [])],
    [manifest],
  );

  // subject === "" means "not yet chosen by the user — fall back to first pack's subject".
  const [subject, setSubject]       = useState("");
  const [curriculum, setCurriculum] = useState("all");

  // ── Subject counts for the SubjectCardGrid — filtered by selected curriculum ─
  const subjectCounts = useMemo(() => {
    return SUBJECTS.map((id) => ({
      id,
      count: allPacks.filter((pack) => getBuilderPackSubject(pack) === id && (curriculum === "all" || getDatasetCurriculum(pack) === curriculum)).length,
    }));
  }, [allPacks, curriculum]);
  const [packId, setPackId]         = useState("");
  const [filter, setFilter]         = useState("all");

  // Effective subject: user's choice, or the first available pack's subject.
  const activeSubject = subject || (allPacks[0] ? getBuilderPackSubject(allPacks[0]) : "");

  // Packs in the dropdown — filtered by active subject + curriculum.
  const visiblePacks = useMemo(() => {
    if (!activeSubject) return allPacks;
    return allPacks.filter((pack) => getBuilderPackSubject(pack) === activeSubject && (curriculum === "all" || getDatasetCurriculum(pack) === curriculum));
  }, [allPacks, activeSubject, curriculum]);

  useEffect(() => {
    if (!allPacks.length || visiblePacks.length) return;
    const first = allPacks[0];
    setSubject(getBuilderPackSubject(first));
    setCurriculum("all");
    setPackId(first.id);
    setFilter("all");
  }, [allPacks, visiblePacks.length]);

  // Effective pack ID: user's choice, or first visible pack.
  const activePackId = packId || visiblePacks[0]?.id || "";

  // When subject changes: reset curriculum + pack + filter.
  function onSubjectChange(newSubject) {
    const first = allPacks.find((pack) => getBuilderPackSubject(pack) === newSubject);
    setSubject(newSubject);
    setCurriculum("all");
    setPackId(first?.id ?? "");
    setFilter("all");
  }

  const {
    currentCard, cards, index, tiles, feedback,
    loading, stats, pickTile, returnTile, clearTiles, hintTile, checkAnswer, nextCard, jumpToCard,
  } = useBuilderSession({
    manifest,
    packId: activePackId,
    filter,
    progress,
    updateProgress,
  });

  const [speakInstead, setSpeakInstead] = useState(
    progress?.prefs?.voice?.speakInsteadOfClick ?? false
  );
  const { speak } = useSpeech();

  const activePack = visiblePacks.find(p => p.id === activePackId);
  const speechLang = activePack?.sourceLanguageCode
    ? normLang(activePack.sourceLanguageCode)
    : "en-GB";

  const voice = useVoicePractice({
    languageCode: speechLang,
    onResult: useCallback((transcript, confidence) => {
      if (currentCard && feedback === null) {
        checkAnswer(transcript);
      }
    }, [currentCard, feedback, checkAnswer]),
  });

  if (manifestLoading) return <div className="lw-page"><LoadingText /></div>;

  if (!allPacks.length) {
    return (
      <div className="lw-page">
        <EmptyState
          title="No builder packs available"
          message="No sentence builder packs found in the manifest."
        />
      </div>
    );
  }

  return (
    <div className="lw-page">
      <div className="lw-card" style={{ marginBottom: "20px" }}>
        <h2 className="lw-section-title">Sentence Builder</h2>

        {/* ── Subject picker (same reusable SubjectCardGrid used in Reading) ── */}
        <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--lw-muted)", marginBottom: "2px" }}>Subject</h3>
        <SubjectCardGrid
          subjects={subjectCounts}
          activeSubject={activeSubject}
          itemTestIdPrefix="builder-subject"
          onSelect={onSubjectChange}
        />

        <PillGroup
          label="Curriculum"
          items={curriculumOptions}
          value={curriculum}
          itemTestIdPrefix="builder-curriculum"
          onSelect={(c) => {
            const first = allPacks.find((pack) => getBuilderPackSubject(pack) === activeSubject && (c === "all" || getDatasetCurriculum(pack) === c));
            setCurriculum(c);
            setPackId(first?.id ?? "");
          }}
          style={{ marginTop: "14px" }}
        />

        {/* ── Pack + filter row ── */}
        <FilterRow style={{ marginTop: "16px", marginBottom: "16px" }}>
          <LabeledSelect label="Pack" value={activePackId} onChange={setPackId} selectTestId="builder-pack-select">
            {visiblePacks.map((p) => (
              <option key={p.id} value={p.id}>{p.displayName}</option>
            ))}
          </LabeledSelect>

          <PillGroup
            label="Filter"
            items={FILTER_OPTIONS}
            value={filter}
            onSelect={setFilter}
          />
        </FilterRow>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "4px" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--lw-muted)" }}>
            Attempted: <strong>{stats.totalAttempted}</strong>
          </span>
          <span style={{ fontSize: "0.85rem", color: "var(--lw-green)" }}>
            Correct: <strong>{stats.totalCorrect}</strong>
          </span>
          <span style={{ fontSize: "0.85rem", color: "var(--lw-blue)" }}>
            Streak: <strong>{stats.streak}</strong>
          </span>
          <StudyBookButton dataset={activePack} />
          <label
            className="lw-check-row"
            data-testid="builder-speak-instead-toggle"
            style={{ fontSize: "0.82rem", marginLeft: "auto" }}
          >
            <input
              type="checkbox"
              checked={speakInstead}
              onChange={(e) => {
                setSpeakInstead(e.target.checked);
                updateProgress(state => {
                  if (!state.prefs.voice) state.prefs.voice = {};
                  state.prefs.voice.speakInsteadOfClick = e.target.checked;
                });
              }}
            />
            🎤 Speak Instead of Click
          </label>
        </div>
      </div>

      {loading && <LoadingText text="Loading cards…" />}

      {!loading && !currentCard && (
        <EmptyState
          title="No cards match the filter"
          message="Try selecting a different filter or pack."
        />
      )}

      {!loading && currentCard && (
        <div className="lw-card" data-testid="builder-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", gap: "10px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "160px" }}>
              {currentCard.type && (
                <span className="lw-chip blue" style={{ marginBottom: "8px", display: "inline-block" }}>
                  {currentCard.type.replace(/_/g, " ")}
                </span>
              )}
              <p style={{ fontWeight: 600, fontSize: "1rem", color: "var(--lw-ink)", marginTop: "8px" }}>
                {currentCard.prompt}
              </p>
            </div>

            {cards.length > 1 && (
              <select
                value={index}
                onChange={(e) => jumpToCard(Number(e.target.value))}
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
                aria-label="Jump to card"
              >
                {cards.map((c, i) => (
                  <option key={c.id || i} value={i}>
                    {i + 1}. {c.prompt || `Card ${i + 1}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {currentCard.image && (
            <LearningImage
              src={currentCard.image}
              alt={currentCard.imageAlt || currentCard.prompt || "Builder image"}
              caption={currentCard.imageCaption || ""}
              className="lw-builder-image"
            />
          )}

          <TileBuilder
            answerTiles={tiles.answerTiles}
            bankTiles={tiles.bankTiles}
            onPick={pickTile}
            onReturn={returnTile}
            disabled={!!feedback}
            speakInstead={speakInstead}
            onSpeakTile={(text) => speak(text, speechLang)}
          />

          {feedback && (
            <div className={`lw-feedback ${feedback.correct ? "correct" : "wrong"}`} data-testid={feedback.correct ? "feedback-correct" : "feedback-incorrect"} style={{ marginTop: "14px" }}>
              <span className="lw-feedback-icon">{feedback.correct ? "✓" : "✗"}</span>
              <div>
                {feedback.correct ? "Correct!" : `Incorrect — answer: ${feedback.expected}`}
              </div>
            </div>
          )}

          <div className="lw-btn-group" style={{ marginTop: "16px" }}>
            {!feedback ? (
              <>
                <button
                  className="lw-btn lw-btn-primary"
                  data-testid="sentence-submit-button"
                  type="button"
                  onClick={checkAnswer}
                  disabled={tiles.answerTiles.length === 0}
                >
                  Check
                </button>
                {speakInstead && currentCard?.answer && (
                  <VoicePracticeButton
                    dataTestId="builder-voice-practice-button"
                    state={voice.buttonState}
                    onClick={() => voice.startPractice(currentCard.answer, speechLang)}
                    disabled={voice.phase === "listening" || voice.phase === "processing"}
                  />
                )}
                <button className="lw-btn lw-btn-ghost" data-testid="sentence-hint-button" type="button" onClick={hintTile}>Hint</button>
                <button className="lw-btn lw-btn-ghost" data-testid="sentence-reset-button" type="button" onClick={clearTiles}>Clear</button>
              </>
            ) : (
              <button className="lw-btn lw-btn-primary" data-testid="builder-next-button" type="button" onClick={nextCard}>
                Next card
              </button>
            )}
          </div>

          {speakInstead && (
            <VoiceFeedbackPanel
              status={
                voice.phase === "unclear" ? "unclear"
                : voice.phase === "wrong-language" ? "wrong-language"
                : voice.phase === "incorrect" ? "mispronounced"
                : voice.phase === "correct" ? "correct"
                : null
              }
              expected={voice.lastResult?.expected}
              recognized={voice.lastResult?.transcript}
              confidence={voice.lastResult?.confidence}
              accuracy={voice.lastResult?.accuracy}
              attempt={voice.attempt}
              maxAttempts={3}
              onRetry={voice.retry}
              onCancel={voice.cancel}
            />
          )}
        </div>
      )}
    </div>
  );
}
