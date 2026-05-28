/**
 * ChromeAIStatus.jsx
 *
 * Small status badge showing whether Chrome Built-in AI is available.
 * Renders inline — intended for the page header row.
 */

export default function ChromeAIStatus({ available }) {
  if (available) {
    return (
      <span className="pb-ai-badge pb-ai-badge--available" title="Chrome Built-in AI (Gemini Nano) detected">
        <span className="pb-ai-badge__dot" />
        Chrome AI detected
      </span>
    );
  }

  return (
    <span className="pb-ai-badge pb-ai-badge--unavailable" title="Chrome Built-in AI is not available — structured template mode will be used">
      <span className="pb-ai-badge__dot" />
      Chrome AI unavailable — template mode
    </span>
  );
}
