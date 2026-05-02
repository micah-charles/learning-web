import styles from "./PackSelector.module.css";

/**
 * PackSelector.jsx
 *
 * Display available learning packs in a grid.
 * Shows pack title, subject, word count, and tags.
 */
export function PackSelector({ packs = [], onSelectPack, selectedPackId }) {
  if (!packs.length) {
    return (
      <div className={styles.empty}>
        <h3>No packs available</h3>
        <p>No learning packs found. Try refreshing.</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {packs.map((pack) => {
        const runtimeId = pack.runtimeId || pack.id;
        const isSelected = runtimeId === selectedPackId;
        return (
          <div
            key={runtimeId}
            className={`${styles.card} ${isSelected ? styles.selected : ""}`}
            onClick={() => onSelectPack(runtimeId)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelectPack(runtimeId)}
          >
            <h3>{pack.displayName || pack.title || pack.id}</h3>
            <p>{pack.grammarFocusEn || pack.topicEn || pack.subject || "Study pack"}</p>
            <div className={styles.badges}>
              {pack.wordCount && (
                <span className={`lw-chip blue ${styles.badge}`}>{pack.wordCount} words</span>
              )}
              {pack.level && (
                <span className={`lw-chip amber ${styles.badge}`}>{pack.level}</span>
              )}
              {pack.topics?.slice(0, 2).map((t) => (
                <span key={t} className={`lw-chip ${styles.badge}`}>{t}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
