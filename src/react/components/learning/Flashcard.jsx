import { useState } from "react";
import styles from "./Flashcard.module.css";

/**
 * Flashcard.jsx
 *
 * Show front/back card. Click to flip.
 * Designed for vocab items (source → target) and builder prompts.
 */
export function Flashcard({ front, back, hint, example, showHint = true }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={`${styles.card} ${flipped ? styles.flipped : ""}`}
      onClick={() => setFlipped((f) => !f)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setFlipped((f) => !f)}
      aria-label={flipped ? "Show question" : "Show answer"}
    >
      <div className={styles.inner}>
        {/* Front */}
        <div className={`${styles.face} ${styles.front}`}>
          <span className={styles.label}>Question</span>
          <p className={styles.word}>{front}</p>
          {showHint && hint && <p className={styles.hint}>{hint}</p>}
          <p className={styles.flipHint}>Tap to reveal answer</p>
        </div>
        {/* Back */}
        <div className={`${styles.face} ${styles.back}`}>
          <span className={styles.label}>Answer</span>
          <p className={styles.word}>{back}</p>
          {example && <p className={styles.example}>{example}</p>}
          <p className={styles.flipHint}>Tap to see question</p>
        </div>
      </div>
    </div>
  );
}