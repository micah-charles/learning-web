import { useState, useMemo } from "react";
import { useManifest } from "../context/ManifestContext.jsx";
import { useProgress } from "../context/ProgressContext.jsx";
import { useVocabBrowser } from "../hooks/useVocabBrowser.js";
import { useSpeech } from "../hooks/useSpeech.js";
import { LabeledSelect, PillGroup, ToggleGroup, FilterRow, EmptyState, LoadingText } from "../components/layout/Controls.jsx";
import { SubjectCardGrid } from "../components/layout/SubjectCardGrid.jsx";
import { listDatasets, listDatasetsBySubjectAndCurriculum, getDatasetSubject, SUBJECTS, listCurricula } from "@/data.js";
import { isWordMastered, getWordProgress } from "@/storage.js";
import { getDatasetStageOptions, usesStageSelection, getSelectedStages } from "@/quiz-helpers.js";

function MasteryBadge({ correct, streak }) {
  if (correct >= 3 && streak >= 2) {
    return <span className="lw-chip green">Mastered</span>;
  }
  if (correct >= 1) {
    return <span className="lw-chip amber">Practising</span>;
  }
  return <span className="lw-chip coral">New</span>;
}

// VocabCard renders one word card.
// For language packs (isLanguage=true):  primary = foreign word (word.de), secondary = translation (word.en)
// For non-language packs (isLanguage=false): primary = definition (word.en), secondary = term (word.de)
// Speak: language packs → speak foreign word only; non-language → speak "term: definition" in English.
function VocabCard({ word, state, onSpeak, speechLang, isLanguage }) {
  const wp = getWordProgress(state, word.id);

  const primaryText   = isLanguage ? word.de : word.en;
  const secondaryText = isLanguage ? word.en : word.de;

  function handleSpeak() {
    if (isLanguage) {
      // Speak the foreign-language word in its own voice.
      onSpeak(word.de, speechLang);
    } else {
      // Speak both the term and its definition in English so the student
      // hears the full card content ("Coast: the zone where the land meets the sea").
      onSpeak(`${word.de}: ${word.en}`, speechLang);
    }
  }

  return (
    <div className="lw-pack-card" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "1.05rem", fontWeight: 700, fontFamily: "Georgia, serif", color: "var(--lw-ink)" }}>
            {primaryText}
          </div>
          {secondaryText && (
            <div style={{ fontSize: "0.88rem", color: "var(--lw-muted)", marginTop: "2px" }}>
              {secondaryText}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
          <MasteryBadge correct={wp.correct} streak={wp.streak} />
          <button
            className="lw-btn lw-btn-ghost"
            style={{ fontSize: "0.8rem", padding: "4px 10px" }}
            type="button"
            onClick={handleSpeak}
            title={isLanguage ? "Speak word" : "Speak word and definition"}
          >
            🔊
          </button>
        </div>
      </div>
      {word.pos && <div style={{ fontSize: "0.75rem", color: "var(--lw-muted)" }}>{word.pos}</div>}
      {/* Example sentence — only shown for language packs (srcCode ≠ tgtCode) */}
      {word.exampleDe && (
        <div style={{ fontSize: "0.82rem", color: "var(--lw-muted)", fontStyle: "italic", borderTop: "1px solid var(--lw-line)", paddingTop: "6px" }}>
          {word.exampleDe}
          {word.exampleEn && <span style={{ display: "block" }}>{word.exampleEn}</span>}
        </div>
      )}
    </div>
  );
}

export default function VocabPage() {
  const { manifest, loading: manifestLoading } = useManifest();
  const { progress } = useProgress();
  const { speak } = useSpeech();

  const allDatasets = useMemo(() => manifest ? listDatasets(manifest) : [], [manifest]);
  const curriculumOptions = useMemo(
    () => [{ id: "all", label: "All" }, ...(manifest ? listCurricula(manifest) : [])],
    [manifest],
  );

  const [prefs, setPrefs] = useState({
    subject:      "language",
    curriculum:   "all",
    datasetId:    "core",
    year:         "ALL",
    stages:       [],
    partOfSpeech: "",
    category:     "",
    categories:   [],
    search:       "",
  });

  // ── Subject counts for the SubjectCardGrid — filtered by selected curriculum ─
  const subjectCounts = useMemo(() => {
    return SUBJECTS.map((id) => ({
      id,
      count: manifest ? listDatasetsBySubjectAndCurriculum(manifest, id, prefs.curriculum || "all").length : 0,
    }));
  }, [manifest, prefs.curriculum]);

  // Datasets visible in the dropdown — filtered by subject + curriculum.
  const subjectDatasets = useMemo(() => {
    if (!manifest) return [];
    return listDatasetsBySubjectAndCurriculum(manifest, prefs.subject || "", prefs.curriculum || "all");
  }, [manifest, prefs.subject, prefs.curriculum]);

  // When subject changes: reset curriculum + pick first dataset, reset filters.
  function onSubjectChange(newSubject) {
    const first = listDatasetsBySubjectAndCurriculum(manifest, newSubject, "all")[0];
    setPrefs({
      subject:      newSubject,
      curriculum:   "all",
      datasetId:    first?.id ?? "",
      year:         "ALL",
      stages:       [],
      partOfSpeech: "",
      category:     "",
      categories:   [],
      search:       "",
    });
  }

  const { dataset, filtered, posOptions, categoryOptions, useCheckboxCategories, loading } =
    useVocabBrowser({ manifest, datasetId: prefs.datasetId, prefs });

  const stageOptions   = dataset ? getDatasetStageOptions(dataset) : [];
  const isStage        = dataset ? usesStageSelection(dataset) : false;
  const selectedStages = dataset ? getSelectedStages(prefs, dataset) : [];

  // Language check — determines speak behaviour and primary/secondary text order.
  const isLanguage = dataset ? getDatasetSubject(dataset) === "language" : false;
  const speechLang = dataset?.speechLanguage || dataset?.sourceLanguageCode || "en-GB";

  // Full stored-state fallback so VocabCard never crashes before progress loads.
  const storedState = progress || { prefs: {}, progress: { words: {}, sessions: [] } };

  function setPref(key, value) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }

  function toggleStage(stage) {
    setPrefs((prev) => {
      const current = Array.isArray(prev.stages) ? prev.stages.map(String) : [];
      const exists  = current.includes(String(stage));
      return { ...prev, stages: exists ? current.filter((s) => s !== String(stage)) : [...current, String(stage)] };
    });
  }

  function toggleCategory(cat) {
    setPrefs((prev) => {
      const current = Array.isArray(prev.categories) ? prev.categories : [];
      const exists  = current.includes(cat);
      return { ...prev, categories: exists ? current.filter((c) => c !== cat) : [...current, cat] };
    });
  }

  const YEAR_OPTIONS = ["ALL", "Y7", "Y8", "Y9", "Y10", "Y11"].map((y) => ({ id: y, label: y }));

  const displayWords = filtered.slice(0, 120);

  if (manifestLoading) return <div className="lw-page"><LoadingText /></div>;

  return (
    <div className="lw-page">
      <div className="lw-card" style={{ marginBottom: "20px" }}>
        <h2 className="lw-section-title">Vocabulary</h2>

        {/* ── Subject picker ── */}
        <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--lw-muted)", marginBottom: "2px" }}>Subject</h3>
        <SubjectCardGrid
          subjects={subjectCounts}
          activeSubject={prefs.subject}
          onSelect={onSubjectChange}
        />

        <PillGroup
          label="Curriculum"
          items={curriculumOptions}
          value={prefs.curriculum || "all"}
          onSelect={(c) => {
            const first = listDatasetsBySubjectAndCurriculum(manifest, prefs.subject || "", c)[0];
            setPrefs((prev) => ({ ...prev, curriculum: c, datasetId: first?.id ?? prev.datasetId }));
          }}
          style={{ marginTop: "14px" }}
        />

        {/* ── Dataset + filters ── */}
        <FilterRow style={{ marginTop: "16px", marginBottom: "14px" }}>
          {subjectDatasets.length > 0 && (
            <LabeledSelect
              label="Pack"
              value={prefs.datasetId}
              onChange={(v) => setPref("datasetId", v)}
            >
              {subjectDatasets.map((d) => (
                <option key={d.id} value={d.id}>{d.displayName}</option>
              ))}
            </LabeledSelect>
          )}

          {isStage ? (
            <ToggleGroup
              label="Stage"
              items={stageOptions}
              selected={selectedStages}
              onToggle={toggleStage}
            />
          ) : isLanguage ? (
            // Year filter — only meaningful for language packs structured by year.
            <LabeledSelect label="Year" value={prefs.year} onChange={(v) => setPref("year", v)} flex={false}>
              {YEAR_OPTIONS.map((y) => <option key={y.id} value={y.id}>{y.label}</option>)}
            </LabeledSelect>
          ) : null}

          {posOptions.length > 0 && (
            <LabeledSelect label="Part of speech" value={prefs.partOfSpeech} onChange={(v) => setPref("partOfSpeech", v)} flex={false}>
              <option value="">All</option>
              {posOptions.map((p) => <option key={p} value={p}>{p}</option>)}
            </LabeledSelect>
          )}

          {categoryOptions.length > 0 && (
            useCheckboxCategories ? (
              <ToggleGroup
                label="Category"
                items={categoryOptions}
                selected={prefs.categories}
                onToggle={toggleCategory}
              />
            ) : (
              <LabeledSelect label="Category" value={prefs.category} onChange={(v) => setPref("category", v)} flex={false}>
                <option value="">All</option>
                {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </LabeledSelect>
            )
          )}
        </FilterRow>

        <input
          type="search"
          placeholder="Search words..."
          value={prefs.search}
          onChange={(e) => setPref("search", e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1.5px solid var(--lw-line)",
            background: "var(--lw-panel)",
            color: "var(--lw-ink)",
            fontFamily: "inherit",
            fontSize: "0.95rem",
          }}
        />
      </div>

      {loading && <LoadingText text="Loading words…" />}

      {!loading && (
        <>
          <p style={{ color: "var(--lw-muted)", fontSize: "0.85rem", marginBottom: "14px" }}>
            Showing {displayWords.length} of {filtered.length} words
          </p>
          <div className="lw-pack-grid">
            {displayWords.map((word) => (
              <VocabCard
                key={word.id}
                word={word}
                state={storedState}
                onSpeak={speak}
                speechLang={speechLang}
                isLanguage={isLanguage}
              />
            ))}
            {displayWords.length === 0 && (
              <EmptyState
                title="No words found"
                message="Try adjusting your filters or search term."
                style={{ gridColumn: "1/-1" }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
