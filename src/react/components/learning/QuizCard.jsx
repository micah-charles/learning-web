import styles from "./QuizCard.module.css";
import { AnswerButton } from "./AnswerButton.jsx";
import { FeedbackPanel } from "./FeedbackPanel.jsx";
import { ProgressBar } from "./ProgressBar.jsx";

/**
 * QuizCard.jsx
 *
 * Display one question with option buttons, feedback, and progress.
 * Works for "mcq", "gap", and "typing" question types.
 */
export function QuizCard({
  question,
  options = [],
  selectedAnswer,
  showFeedback,
  currentIndex,
  totalQuestions,
  score,
  onAnswer,
  onNext,
  isFinished,
}) {
  if (!question) return null;

  const isCorrect = showFeedback
    ? selectedAnswer
      ? String(selectedAnswer).trim().toLowerCase() ===
        String(question.correctAnswer).trim().toLowerCase()
      : false
    : null;

  return (
    <div className={styles.card}>
      <ProgressBar current={currentIndex + 1} total={totalQuestions} score={score} />

      <div className={styles.questionBox}>
        <span className={`lw-chip blue ${styles.modeChip}`}>
          {question.modeTitle || question.type}
        </span>
        <p className={styles.prompt}>{question.question || question.source}</p>
        {question.explanation && (
          <p className={styles.subtitle}>{question.explanation}</p>
        )}
      </div>

      {/* Options */}
      <div className={styles.optionGrid}>
        {options.map((opt) => (
          <AnswerButton
            key={String(opt)}
            option={opt}
            isSelected={selectedAnswer === opt}
            isCorrect={showFeedback ? opt === question.correctAnswer : null}
            showFeedback={showFeedback}
            onClick={() => !showFeedback && onAnswer(opt)}
            disabled={showFeedback}
          />
        ))}
      </div>

      {/* Feedback */}
      {showFeedback && (
        <FeedbackPanel
          isCorrect={isCorrect}
          correctAnswer={question.correctAnswer}
          explanation={question.hint || ""}
          userAnswer={selectedAnswer}
        />
      )}

      {/* Next button */}
      {showFeedback && (
        <div className={styles.actionRow}>
          <button className="lw-btn lw-btn-primary" onClick={onNext} type="button">
            {currentIndex + 1 >= totalQuestions
              ? isFinished
                ? "See results"
                : "Finish"
              : "Next question"}
          </button>
        </div>
      )}
    </div>
  );
}