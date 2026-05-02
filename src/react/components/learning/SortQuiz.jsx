import { useCallback } from "react";
import styles from "./SortQuiz.module.css";
import { FeedbackPanel } from "./FeedbackPanel.jsx";

/**
 * SortQuiz.jsx
 *
 * Items start in a pool. User taps an item to select, then taps a category zone.
 * Items can be removed from zones back to the pool.
 */
export function SortQuiz({
  categories = [],
  items = [],
  placedItems = [],
  unplacedItems = [],
  selectedItemIndex,
  selectedCategoryIndex,
  showFeedback,
  onSelectItem,
  onPlace,
  onRemove,
  onReset,
  onCheck,
  onNext,
  isLast,
}) {
  const handleSelectItem = useCallback(
    (idx) => { if (!showFeedback) onSelectItem(idx); },
    [showFeedback, onSelectItem]
  );

  // Group placed items by category index
  const byCategory = categories.reduce((acc, _, ci) => {
    acc[ci] = placedItems.filter((p) => p.categoryIndex === ci);
    return acc;
  }, {});

  return (
    <div className={styles.arena}>
      {/* Instruction */}
      <p className={styles.instruction}>
        Tap an item to select it, then tap a category to place it.
      </p>

      {/* Unplaced pool */}
      <div className={styles.pool}>
        {unplacedItems.length === 0 ? (
          <p className={styles.poolEmpty}>All items placed ✓</p>
        ) : (
          unplacedItems.map((item, rawIdx) => {
            return (
              <div
                key={rawIdx}
                className={`${styles.chip} ${selectedItemIndex === rawIdx ? styles.selected : ""}`}
                onClick={() => handleSelectItem(rawIdx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleSelectItem(rawIdx)}
              >
                {typeof item === "string" ? item : item.text || String(item)}
              </div>
            );
          })
        )}
      </div>

      {/* Category zones */}
      <div className={styles.zones}>
        {categories.map((cat, ci) => (
          <div
            key={ci}
            className={`${styles.zone} ${selectedCategoryIndex === ci ? styles.zoneSelected : ""}`}
          >
            <h4>{cat}</h4>
            <div className={styles.placedList}>
              {byCategory[ci].map((p, pi) => (
                <div key={pi} className={styles.placedItem}>
                  <span>{p.text}</span>
                  <button
                    className={styles.removeBtn}
                    onClick={() => onRemove(placedItems.indexOf(p))}
                    type="button"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              className="lw-btn lw-btn-ghost"
              style={{ marginTop: "8px", fontSize: "0.85rem", padding: "7px 10px" }}
              onClick={() => {
                if (selectedItemIndex !== null) onPlace(ci);
              }}
              disabled={selectedItemIndex === null || showFeedback}
              type="button"
            >
              Place here
            </button>
          </div>
        ))}
      </div>

      {/* Feedback */}
      {showFeedback && (
        <FeedbackPanel
          isCorrect={
            placedItems.length === items.length &&
            placedItems.every((p) => {
              const raw = items.find((i) => (i.text || String(i)) === p.text);
              return raw && (raw.category || "") === (p.category || "");
            })
          }
          correctAnswer="Sort all items into their correct categories"
          explanation="Place each item in the correct category."
        />
      )}

      {/* Controls */}
      <div className={styles.actions}>
        {!showFeedback && (
          <button className="lw-btn lw-btn-ghost" onClick={onReset} type="button">
            🔄 Reset
          </button>
        )}
        {showFeedback ? (
          <button className="lw-btn lw-btn-primary" onClick={onNext} type="button">
            {isLast ? "See results" : "Next"}
          </button>
        ) : (
          <button className="lw-btn lw-btn-primary" onClick={onCheck} type="button">
            Check sorting
          </button>
        )}
      </div>
    </div>
  );
}
