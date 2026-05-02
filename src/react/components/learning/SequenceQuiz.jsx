import { useCallback } from "react";
import styles from "./SequenceQuiz.module.css";
import { FeedbackPanel } from "./FeedbackPanel.jsx";

/**
 * SequenceQuiz.jsx
 *
 * Tap-to-select tap-to-swap sequence ordering game.
 * User taps one item to select (highlighted), then taps another to swap.
 */
export function SequenceQuiz({
  items = [],
  selectedIndex,
  onSelect,
  onShuffle,
  showFeedback,
  correctOrder = [],
  userOrder,
  onCheck,
  onNext,
  isLast,
}) {
  const handleSelect = useCallback(
    (idx) => {
      if (!showFeedback) onSelect(idx);
    },
    [showFeedback, onSelect]
  );

  return (
    <div className={styles.arena}>
      <p className={styles.instruction}>
        Tap an item to select it, then tap another to swap positions.
      </p>

      <div className={styles.list}>
        {(userOrder || items).map((item, idx) => {
          const text = typeof item === "string" ? item : item.text || String(item);
          return (
            <div
              key={idx}
              className={`${styles.item} ${selectedIndex === idx ? styles.selected : ""} ${showFeedback ? (item === correctOrder[idx] ? styles.correct : styles.wrong) : ""}`}
              onClick={() => handleSelect(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleSelect(idx)}
            >
              <span className={styles.num}>{idx + 1}</span>
              <span className={styles.text}>{text}</span>
              {selectedIndex !== null && selectedIndex !== idx && (
                <span className={styles.hint}>↔ tap to swap</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      {showFeedback && (
        <FeedbackPanel
          isCorrect={
            showFeedback &&
            correctOrder.length > 0 &&
            JSON.stringify(userOrder || items) === JSON.stringify(correctOrder)
          }
          correctAnswer={correctOrder.join(" → ")}
          explanation="Arrange the steps in the correct order."
        />
      )}

      {/* Controls */}
      <div className={styles.actions}>
        {!showFeedback && (
          <button className="lw-btn lw-btn-ghost" onClick={onShuffle} type="button">
            🔀 Shuffle
          </button>
        )}
        {showFeedback ? (
          <button className="lw-btn lw-btn-primary" onClick={onNext} type="button">
            {isLast ? "See results" : "Next"}
          </button>
        ) : (
          <button className="lw-btn lw-btn-primary" onClick={onCheck} type="button">
            Check order
          </button>
        )}
      </div>
    </div>
  );
}