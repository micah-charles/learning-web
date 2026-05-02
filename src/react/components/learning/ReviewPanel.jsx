import styles from "./ReviewPanel.module.css";
import { getAccuracy, gradeLabel } from "../../utils/scoring.js";

/**
 * ReviewPanel.jsx
 *
 * Display all answered questions with correct/wrong indicators.
 * Shows score summary and grade at the top.
 */
export function ReviewPanel({ answers = [], onRetry }) {
  if (!answers.length) {
    return (
      <div className={styles.empty}>
        <h3>No answers yet</h3>
        <p>Complete a quiz session to see your review.</p>
      </div>
    );
  }

  const accuracy = getAccuracy(answers);
  const grade = gradeLabel(accuracy);
  const { score, total } = answers.reduce(
    (acc, a) => ({ score: acc.score + (a.isCorrect ? 1 : 0), total: acc.total + 1 }),
    { score: 0, total: 0 }
  );

  return (
    <div className={styles.panel}>
      {/* Summary header */}
      <div className={`${styles.summary} ${styles[grade.tone]}`}>
        <div className={styles.summaryStats}>
          <strong>{score}/{total}</strong>
          <span>{accuracy}% accuracy</span>
        </div>
        <div className={styles.summaryLabel}>
          <span className={`lw-chip ${grade.tone === "green" ? "green" : grade.tone === "amber" ? "amber" : "coral"}`}>
            {grade.label}
          </span>
        </div>
      </div>

      {/* Answer list */}
      <div className={styles.list}>
        {answers.map((a, i) => (
          <div key={a.questionId || i} className={`${styles.item} ${a.isCorrect ? styles.correct : styles.wrong}`}>
            <div className={styles.itemIcon}>{a.isCorrect ? "✅" : "❌"}</div>
            <div className={styles.itemBody}>
              <p className={styles.itemQuestion}>{a.question}</p>
              {!a.isCorrect && a.correctAnswer && (
                <p className={styles.itemCorrect}>Correct: {a.correctAnswer}</p>
              )}
              {!a.isCorrect && a.selected && (
                <p className={styles.itemWrong}>Your answer: {a.selected}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Retry */}
      {onRetry && (
        <div className={styles.retryRow}>
          <button className="lw-btn lw-btn-secondary" onClick={onRetry} type="button">
            🔄 Try again
          </button>
        </div>
      )}
    </div>
  );
}