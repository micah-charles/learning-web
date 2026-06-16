import { isSpeechRecognitionSupported } from "../../services/speechRecognitionService.js";

const STATES = {
  idle: { label: "Speak", icon: "🎤" },
  listening: { label: "Listening...", icon: "🔴" },
  processing: { label: "Checking...", icon: "⏳" },
  success: { label: "Correct", icon: "✅" },
  error: { label: "Try again", icon: "🔄" },
  unsupported: { label: "Voice not supported", icon: "⚠️" },
};

export default function VoicePracticeButton({ state = "idle", onClick, disabled = false, style, dataTestId }) {
  const s = STATES[state] || STATES.idle;
  const isUnsupported = state === "unsupported" || !isSpeechRecognitionSupported();

  if (isUnsupported) {
    return (
      <span
        style={{
          fontSize: "0.78rem",
          color: "var(--lw-muted)",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "6px 12px",
          ...style,
        }}
        title="Speech recognition is not available in this browser"
      >
        {STATES.unsupported.icon} {STATES.unsupported.label}
      </span>
    );
  }

  return (
    <button
      type="button"
      className="lw-btn"
      data-testid={dataTestId}
      onClick={onClick}
      disabled={disabled || state === "processing" || state === "success"}
      style={{
        minWidth: "44px",
        minHeight: "44px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        fontSize: "0.9rem",
        padding: "8px 16px",
        border: state === "listening" ? "2px solid var(--lw-coral, #e74c3c)" : undefined,
        background: state === "listening" ? "var(--lw-coral-light, #fde8e8)" : undefined,
        ...style,
      }}
      aria-label={s.label}
    >
      <span>{s.icon}</span>
      <span>{s.label}</span>
    </button>
  );
}
