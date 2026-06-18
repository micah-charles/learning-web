export default function VoiceFeedbackPanel({ status, expected, recognized, confidence, accuracy }) {
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
      <div style={styles.container} data-testid="voice-feedback-panel">
        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem" }}>
          🤔 I didn't catch that. Tap Speak to try again.
        </p>
      </div>
    );
  }

  if (status === "mispronounced") {
    styles.container.borderColor = "var(--lw-coral, #e74c3c)";
    styles.container.background = "var(--lw-coral-light, #fde8e8)";
    return (
      <div style={styles.container} data-testid="voice-feedback-panel">
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
        {accuracy !== undefined && (
          <p data-testid="voice-feedback-accuracy" style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "var(--lw-muted)" }}>
            Accuracy: {accuracy}%
          </p>
        )}
      </div>
    );
  }

  if (status === "correct") {
    styles.container.borderColor = "var(--lw-green, #27ae60)";
    styles.container.background = "var(--lw-green-light, #e8f8f0)";
    return (
      <div style={styles.container} data-testid="voice-feedback-panel">
        <p style={{ margin: 0, fontWeight: 600, color: "var(--lw-green, #27ae60)" }}>
          ✅ Excellent!
        </p>
        {accuracy !== undefined && (
          <p data-testid="voice-feedback-accuracy" style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--lw-muted)" }}>
            Accuracy: {accuracy}%
          </p>
        )}
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
    return (
      <div style={styles.container} data-testid="voice-feedback-panel">
        <p style={{ margin: 0, fontWeight: 600, color: "var(--lw-coral, #c0392b)" }}>
          ❌ Please respond in the target language.
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
        {accuracy !== undefined && (
          <p data-testid="voice-feedback-accuracy" style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "var(--lw-muted)" }}>
            Accuracy: {accuracy}%
          </p>
        )}
      </div>
    );
  }

  return null;
}
