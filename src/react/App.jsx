/**
 * App.jsx
 *
 * React root component.
 * Routes between Home, Quiz, Flashcard, and Review pages.
 * Currently wired:
 *  - MCQ mode using useQuizEngine + QuizCard
 *  - Flashcard mode using Flashcard component
 *  - Sequence mode using SequenceQuiz component
 *  - Sort mode using SortQuiz component
 *
 * LEGACY NOTE: The vanilla main.js app (index.html) continues to work
 * independently. This React app shares the same data/ files.
 */

import { useState, useCallback } from "react";
import { usePackList, usePackLoader } from "./hooks/usePackLoader.js";
import { useQuizEngine } from "./hooks/useQuizEngine.js";
import { QuizCard } from "./components/learning/QuizCard.jsx";
import { Flashcard } from "./components/learning/Flashcard.jsx";
import { SequenceQuiz } from "./components/learning/SequenceQuiz.jsx";
import { SortQuiz } from "./components/learning/SortQuiz.jsx";
import { ReviewPanel } from "./components/learning/ReviewPanel.jsx";
import { PackSelector } from "./components/learning/PackSelector.jsx";

// ─── Nav pills ───────────────────────────────────────────────────────

const TABS = [
  { id: "home",      label: "Home" },
  { id: "quiz",      label: "Quiz" },
  { id: "flashcard", label: "Flashcards" },
  { id: "review",    label: "Review" },
];

function Nav({ active, onChange }) {
  return (
    <div className="lw-nav-pills" style={{ marginBottom: "20px" }}>
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`lw-nav-pill ${active === t.id ? "active" : ""}`}
          onClick={() => onChange(t.id)}
          type="button"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Home page ───────────────────────────────────────────────────

function HomePage({ packs, onSelectPack, selectedPackId }) {
  return (
    <div className="lw-page">
      <div className="lw-card lw-lead-card">
        <p className="eyebrow" style={{ fontSize: "0.78rem", color: "var(--lw-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
          React — learning-web v2
        </p>
        <h1 style={{ fontSize: "1.8rem", fontFamily: "Georgia, serif", marginBottom: "10px" }}>
          Learning Web
        </h1>
        <p style={{ color: "var(--lw-muted)", fontSize: "0.95rem" }}>
          Select a pack and choose a study mode below.
          Progress saves to your browser's local storage.
        </p>
      </div>

      <div className="lw-section lw-card">
        <h2 className="lw-section-title">Choose a pack</h2>
        <PackSelector packs={packs} onSelectPack={onSelectPack} selectedPackId={selectedPackId} />
      </div>
    </div>
  );
}

// ─── Quiz page (MCQ + Sequence + Sort) ───────────────────────────

function QuizPage({ pack }) {
  // For now, pick a mode based on what's in the pack
  const mode = pack?.byType?.sequence?.length
    ? "sequence"
    : pack?.byType?.sort?.length
    ? "sort"
    : "mcq";

  const questions = pack
    ? (mode === "sequence"
      ? pack.byType.sequence
      : mode === "sort"
      ? pack.byType.sort
      : pack.byType.mcq)
    : [];

  const engine = useQuizEngine({ questions, mode, count: 12 });

  const {
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    selectedAnswer,
    showFeedback,
    score,
    answers,
    isFinished,
    buildState,
    answerQuestion,
    nextQuestion,
    resetQuiz,
    selectSequenceIndex,
    shuffleSequence,
    checkSequenceAnswer,
    selectSortItem,
    placeSortItem,
    removeSortItem,
    resetSort,
    checkSortAnswer,
  } = engine;

  if (!pack) {
    return (
      <div className="lw-page">
        <div className="lw-empty">
          <h3>No pack selected</h3>
          <p>Go to Home and choose a learning pack.</p>
        </div>
      </div>
    );
  }

  if (isFinished || !currentQuestion) {
    return (
      <div className="lw-page">
        <div className="lw-card">
          <ReviewPanel answers={answers} onRetry={resetQuiz} />
        </div>
      </div>
    );
  }

  if (mode === "sequence") {
    return (
      <div className="lw-page">
        <div className="lw-card">
          <h2 className="lw-section-title">{currentQuestion.question || "Arrange in order"}</h2>
          <SequenceQuiz
            items={currentQuestion.options || []}
            selectedIndex={buildState?.selectedIndex ?? null}
            onSelect={selectSequenceIndex}
            onShuffle={shuffleSequence}
            showFeedback={showFeedback}
            correctOrder={currentQuestion.correctOrder || []}
            userOrder={buildState?.userOrder}
            onCheck={() => checkSequenceAnswer(buildState?.userOrder || [])}
            onNext={nextQuestion}
            isLast={currentQuestionIndex + 1 >= totalQuestions}
          />
        </div>
      </div>
    );
  }

  if (mode === "sort") {
    return (
      <div className="lw-page">
        <div className="lw-card">
          <h2 className="lw-section-title">{currentQuestion.question || "Sort into categories"}</h2>
          <SortQuiz
            categories={currentQuestion.sortCategories || []}
            items={currentQuestion.sortItems || []}
            placedItems={buildState?.placedItems || []}
            unplacedItems={buildState?.unplacedItems || []}
            selectedItemIndex={buildState?.selectedItemIndex ?? null}
            selectedCategoryIndex={buildState?.selectedCategoryIndex ?? null}
            showFeedback={showFeedback}
            onSelectItem={selectSortItem}
            onPlace={placeSortItem}
            onRemove={removeSortItem}
            onReset={resetSort}
            onCheck={() => checkSortAnswer(buildState?.placedItems || [])}
            onNext={nextQuestion}
            isLast={currentQuestionIndex + 1 >= totalQuestions}
          />
        </div>
      </div>
    );
  }

  // MCQ mode
  return (
    <div className="lw-page">
      <QuizCard
        question={currentQuestion}
        options={currentQuestion.options || []}
        selectedAnswer={selectedAnswer}
        showFeedback={showFeedback}
        currentIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        score={score}
        onAnswer={answerQuestion}
        onNext={nextQuestion}
        isFinished={isFinished}
      />
    </div>
  );
}

// ─── Flashcard page ───────────────────────────────────────────────

function FlashcardPage({ pack }) {
  const questions = pack?.byType?.mcq || [];
  const engine = useQuizEngine({ questions, mode: "flashcard", count: 12 });

  const { currentQuestion, currentQuestionIndex, totalQuestions, isFinished, flipped, flipCard, nextQuestion, resetQuiz } = engine;

  if (!pack) {
    return (
      <div className="lw-page">
        <div className="lw-empty">
          <h3>No pack selected</h3>
          <p>Go to Home and choose a learning pack.</p>
        </div>
      </div>
    );
  }

  if (isFinished || !currentQuestion) {
    return (
      <div className="lw-page">
        <div className="lw-card">
          <ReviewPanel answers={engine.answers} onRetry={resetQuiz} />
        </div>
      </div>
    );
  }

  return (
    <div className="lw-page">
      <div className="lw-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <span style={{ color: "var(--lw-muted)", fontSize: "0.88rem" }}>
            {currentQuestionIndex + 1} / {totalQuestions}
          </span>
          <button className="lw-btn lw-btn-ghost" style={{ fontSize: "0.85rem" }} onClick={nextQuestion} type="button">
            Skip →
          </button>
        </div>
        <Flashcard
          front={currentQuestion.source || currentQuestion.question}
          back={currentQuestion.target || currentQuestion.correctAnswer}
          hint={currentQuestion.hint}
          example={currentQuestion.explanation}
        />
        <div className="lw-btn-group" style={{ marginTop: "18px" }}>
          <button className="lw-btn lw-btn-ghost" onClick={nextQuestion} type="button">
            ← Previous
          </button>
          <button className="lw-btn lw-btn-primary" onClick={nextQuestion} type="button">
            {currentQuestionIndex + 1 >= totalQuestions ? "Finish" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Review page ──────────────────────────────────────────────────

function ReviewPage({ pack }) {
  const { pack: loadedPack, loading, error } = usePackLoader({ rawPack: pack });

  if (!pack) {
    return (
      <div className="lw-page">
        <div className="lw-empty">
          <h3>No pack selected</h3>
          <p>Go to Home and choose a learning pack.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="lw-page"><p>Loading…</p></div>;
  if (error) return <div className="lw-page"><p style={{ color: "var(--lw-coral)" }}>{error}</p></div>;

  return (
    <div className="lw-page">
      <div className="lw-card">
        <h2 className="lw-section-title">All words in this pack</h2>
        <p className="lw-subtitle">{loadedPack?.title} — {loadedPack?.items?.length || 0} items</p>
        <ReviewPanel answers={[]} onRetry={() => {}} />
      </div>
    </div>
  );
}

// ─── Root App ────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedPackId, setSelectedPackId] = useState(null);
  const { revisionPacks, loading: packsLoading, error: packsError } = usePackList();

  // Load the selected pack
  const { pack, loading: packLoading, error: packError } = usePackLoader({
    packId: selectedPackId,
    mode: "mcq",
  });

  const handleSelectPack = useCallback((id) => {
    setSelectedPackId(id);
    setActiveTab("quiz");
  }, []);

  return (
    <div>
      <Nav active={activeTab} onChange={setActiveTab} />

      {activeTab === "home" && (
        <HomePage
          packs={revisionPacks}
          onSelectPack={handleSelectPack}
          selectedPackId={selectedPackId}
        />
      )}
      {activeTab === "quiz" && (
        <QuizPage pack={pack} />
      )}
      {activeTab === "flashcard" && (
        <FlashcardPage pack={pack} />
      )}
      {activeTab === "review" && (
        <ReviewPage pack={pack} />
      )}
    </div>
  );
}