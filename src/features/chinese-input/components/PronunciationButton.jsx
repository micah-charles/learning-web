export default function PronunciationButton({
  text,
  label = "Pronounce",
  pronounce,
  disabled = false,
  testId,
}) {
  return (
    <button
      className="lw-btn lw-btn-ghost cil-speech-button"
      data-testid={testId}
      type="button"
      onClick={() => pronounce(text)}
      disabled={disabled}
      aria-label={`${label} ${text}`}
    >
      <span aria-hidden="true">🔊</span> {label}
    </button>
  );
}
