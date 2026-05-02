import styles from "./AnswerButton.module.css";

/**
 * AnswerButton.jsx
 *
 * Reusable answer option button.
 * Shows state: default, selected, correct, wrong.
 */
export function AnswerButton({ option, isSelected, isCorrect, showFeedback, onClick, disabled }) {
  let className = styles.btn;
  if (showFeedback) {
    className = isCorrect
      ? `${styles.btn} ${styles.correct}`
      : isSelected
      ? `${styles.btn} ${styles.wrong}`
      : styles.btn;
  } else {
    className = isSelected ? `${styles.btn} ${styles.selected}` : styles.btn;
  }

  return (
    <button
      className={className}
      onClick={() => !disabled && onClick(option)}
      disabled={disabled}
      type="button"
    >
      {option}
    </button>
  );
}