/**
 * PromptOutputPanel.jsx
 *
 * Right panel — shows the generated prompt + Copy / Download / Reset actions.
 * Stateless: receives the prompt text and callbacks from AIPromptBuilder.jsx.
 */
import { useState } from "react";

const STATUS_LABELS = {
  idle:        null,
  loading:     "⏳ Loading base prompt…",
  generating:  "✨ Generating prompt…",
  done:        "✅ Prompt ready",
  error:       null,  // error is shown separately
};

export default function PromptOutputPanel({
  prompt,
  status,
  error,
  topic,
  onGenerate,
  onReset,
  basePromptLoaded,
}) {
  const [copied, setCopied] = useState(false);

  const canGenerate = basePromptLoaded && topic.trim() && status !== "generating";

  async function handleCopy() {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      // Fallback: select the textarea text
      const ta = document.getElementById("pb-output-textarea");
      if (ta) { ta.select(); document.execCommand("copy"); }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleDownload() {
    if (!prompt) return;
    const safeTopic = (topic || "prompt").replace(/[^a-z0-9]+/gi, "_").toLowerCase();
    const filename = `learning_web_prompt_${safeTopic}.md`;
    const blob = new Blob([prompt], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="pb-output-panel">

      {/* Action buttons */}
      <div className="pb-output-actions">
        <button
          className="lw-btn lw-btn-primary"
          onClick={onGenerate}
          disabled={!canGenerate}
          type="button"
        >
          {status === "generating" ? "Generating…" : "Generate Prompt"}
        </button>

        <button
          className="lw-btn"
          onClick={handleCopy}
          disabled={!prompt}
          type="button"
          title="Copy to clipboard"
        >
          {copied ? "✓ Copied!" : "Copy Prompt"}
        </button>

        <button
          className="lw-btn"
          onClick={handleDownload}
          disabled={!prompt}
          type="button"
          title="Download as .md file"
        >
          Download .md
        </button>

        <button
          className="lw-btn lw-btn-ghost"
          onClick={onReset}
          type="button"
          title="Clear the generated prompt"
        >
          Reset
        </button>
      </div>

      {/* Status message */}
      {STATUS_LABELS[status] && (
        <p className="pb-status-msg">{STATUS_LABELS[status]}</p>
      )}
      {status === "error" && error && (
        <div className="pb-alert pb-alert--error">{error}</div>
      )}

      {/* Output textarea */}
      <textarea
        id="pb-output-textarea"
        className="pb-output-textarea"
        readOnly
        value={prompt}
        placeholder={
          basePromptLoaded
            ? "Fill in the topic and click Generate Prompt…"
            : "Loading base prompt…"
        }
        spellCheck={false}
      />

      {/* Char count */}
      {prompt && (
        <p className="pb-char-count">
          {prompt.length.toLocaleString()} characters
          {" · "}
          ~{Math.round(prompt.split(/\s+/).filter(Boolean).length / 0.75).toLocaleString()} tokens (est.)
        </p>
      )}
    </div>
  );
}
