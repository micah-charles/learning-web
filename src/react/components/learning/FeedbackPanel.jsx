import styles from "./FeedbackPanel.module.css";

/**
 * FeedbackPanel.jsx
 *
 * Shows correct/incorrect result with optional explanation.
 */
export function FeedbackPanel({ isCorrect, correctAnswer, explanation, userAnswer }) {
  const title = isCorrect ? "Correct!" : "Not quite";
  const icon = isCorrect ? "✅" : "❌";

  return (
    <div className={`${styles.panel} ${isCorrect ? styles.correct : styles.wrong}`}>
      <div className={styles.header}>
        <span className={styles.icon}>{icon}</span>
        <strong>{title}</strong>
      </div>
      {!isCorrect && correctAnswer && (
        <p className={styles.expected}>
          Correct answer: <strong>{correctAnswer}</strong>
        </p>
      )}
      {explanation && (
        <p className={styles.explanation}>{explanation}</p>
      )}
    </div>
  );
}