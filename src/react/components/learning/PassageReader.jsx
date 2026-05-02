import styles from "./PassageReader.module.css";

/**
 * PassageReader.jsx
 *
 * Display passage title, text in source and target languages.
 * Optionally show comprehension questions.
 */
export function PassageReader({
  passage,
  showTranslation = true,
  showQuestions = false,
  questions = [],
  onAnswerQuestion,
}) {
  if (!passage) return null;

  const sourceTitle = passage.sourceTitle || passage.title || "Passage";
  const targetTitle = passage.targetTitle || "";
  const sourceText = passage.sourcePassage || passage.source || "";
  const targetText = passage.targetPassage || passage.target || "";

  return (
    <div className={styles.block}>
      {/* Header */}
      <div className={styles.header}>
        {passage.chapter && <span className={`lw-chip amber`}>{passage.chapter}</span>}
        {passage.level && <span className={`lw-chip blue`}>{passage.level}</span>}
        <h2 className={styles.title}>{sourceTitle}</h2>
        {targetTitle && targetTitle !== sourceTitle && (
          <p className={styles.subtitle}>{targetTitle}</p>
        )}
      </div>

      {/* Source text */}
      <div className={styles.textBlock}>
        <span className={styles.langLabel}>Source</span>
        <p className={styles.passageText}>{sourceText}</p>
      </div>

      {/* Translation */}
      {showTranslation && targetText && (
        <div className={`${styles.textBlock} ${styles.translation}`}>
          <span className={styles.langLabel}>Translation</span>
          <p className={styles.passageText}>{targetText}</p>
        </div>
      )}

      {/* Questions */}
      {showQuestions && questions.length > 0 && (
        <div className={styles.questions}>
          <h3 className={styles.questionsTitle}>Comprehension questions</h3>
          {questions.map((q, i) => (
            <div key={q.id || i} className={styles.question}>
              <p className={styles.questionText}>
                <strong>{i + 1}.</strong> {q.question}
              </p>
              {q.options && q.options.length > 0 && (
                <div className={styles.optionGrid}>
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      className="lw-btn lw-btn-ghost"
                      style={{ fontSize: "0.9rem", padding: "8px 12px" }}
                      onClick={() => onAnswerQuestion?.(q, opt)}
                      type="button"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}