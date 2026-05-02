import styles from "./ProgressBar.module.css";

/**
 * ProgressBar.jsx
 *
 * Shows current progress through a quiz session.
 */
export function ProgressBar({ current, total, score }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={styles.shell}>
      <div className={styles.meta}>
        <span>{current} / {total}</span>
        <span className={styles.score}>{score} correct</span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}