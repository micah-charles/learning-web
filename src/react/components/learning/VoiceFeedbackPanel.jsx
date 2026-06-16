export default function VoiceFeedbackPanel({ status, expected, recognized, confidence, attempt, maxAttempts, onRetry, onCancel }) {
  if (!status) return null;

  const styles = {
    container: {
      marginTop: "12px",
      padding: "12px 16px",
      borderRadius: "10px",
      border: "1.5px solid",
    },
  };

  if (status === "unclear") {
    styles.container.borderColor = "var(--lw-line, #ddd)";
    styles.container.background = "var(--lw-panel, #f9f9f9)";
    return (
      <div style={styles.container}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>
          🤔 I didn't catch that. Please try again.
        </p>
        <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
          <button className="lw-btn lw-btn-primary" type="button" onClick={onRetry}>
            🎤 Try Again
          </button>
          <button className="lw-btn lw-btn-ghost" type="button" onClick={onCancel}>
            ❌ Cancel
          </button>
        </div>
      </div>
    );
  }

  if (status === "mispronounced") {
    styles.container.borderColor = "var(--lw-coral, #e74c3c)";
    styles.container.background = "var(--lw-coral-light, #fde8e8)";
    const remaining = maxAttempts - attempt;
    return (
      <div style={styles.container}>
        <p style={{ margin: 0, fontWeight: 600, color: "var(--lw-coral, #c0392b)" }}>
          ❌ Almost correct.
        </p>
        {expected && (
          <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "var(--lw-muted)" }}>
            Expected: <strong>{expected}</strong>
          </p>
        )}
        {recognized && (
          <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "var(--lw-muted)" }}>
            Heard: <em>{recognized}</em>
          </p>
        )}
        {remaining > 0 && (
          <p style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "var(--lw-muted)" }}>
            {remaining} attempt{remaining > 1 ? "s" : ""} remaining.
          </p>
        )}
        <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
          {remaining > 0 && (
            <button className="lw-btn lw-btn-primary" type="button" onClick={onRetry}>
              🔄 Try again
            </button>
          )}
          <button className="lw-btn lw-btn-ghost" type="button" onClick={onCancel}>
            ❌ Cancel
          </button>
        </div>
      </div>
    );
  }

  if (status === "correct") {
    styles.container.borderColor = "var(--lw-green, #27ae60)";
    styles.container.background = "var(--lw-green-light, #e8f8f0)";
    return (
      <div style={styles.container}>
        <p style={{ margin: 0, fontWeight: 600, color: "var(--lw-green, #27ae60)" }}>
          ✅ Excellent!
        </p>
        {confidence !== undefined && (
          <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--lw-muted)" }}>
            Confidence: {Math.round(confidence * 100)}%
          </p>
        )}
      </div>
    );
  }

  if (status === "wrong-language") {
    styles.container.borderColor = "var(--lw-coral, #e74c3c)";
    styles.container.background = "var(--lw-coral-light, #fde8e8)";
    const remaining = maxAttempts - attempt;
    return (
      <div style={styles.container}>
        <p style={{ margin: 0, fontWeight: 600, color: "var(--lw-coral, #c0392b)" }}>
          ❌ Please respond in the target language.
        </p>
        {expected && (
          <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "var(--lw-muted)" }}>
            Expected: <strong>{expected}</strong>
          </p>
        )}
        {remaining > 0 && (
          <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
            <button className="lw-btn lw-btn-primary" type="button" onClick={onRetry}>
              🔄 Try again
            </button>
            <button className="lw-btn lw-btn-ghost" type="button" onClick={onCancel}>
              ❌ Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
