/**
 * PromptInputPanel.jsx
 *
 * Left panel — all user-configurable fields that feed the prompt builder.
 * Stateless: receives values + onChange callbacks from AIPromptBuilder.jsx.
 *
 * Field order:
 *   Subject → Prompt Template → (inline warning if subject/template mismatch)
 *   → Topic → Level → Curriculum → Locale → Item Types
 *   → Source Material → Additional Instructions → Generate Mode
 */
import { SUBJECTS as SUBJECT_VALUES } from "@/data.js";
import { PROMPT_CONFIGS } from "../../services/promptConfigs.js";

// Derive display objects from the canonical SUBJECTS array in data.js so this
// list stays in sync automatically (includes "religion", "computing", etc.).
const SUBJECTS = SUBJECT_VALUES.map((v) => ({
  value: v,
  label: v.charAt(0).toUpperCase() + v.slice(1),
}));

const LOCALES = [
  { value: "en-GB", label: "English (UK) — en-GB" },
  { value: "en-US", label: "English (US) — en-US" },
  { value: "de-DE", label: "German — de-DE"        },
  { value: "fr-FR", label: "French — fr-FR"         },
  { value: "es-ES", label: "Spanish — es-ES"        },
  { value: "la",    label: "Latin — la"             },
];

/**
 * Item types = JSON schema types used inside pack_unified.json items[].type
 * Each maps to a specific Learning Web tab:
 *
 *   vocab        → Vocabulary tab cards + Quiz word-choice / typed questions
 *   fillBlank    → Quiz fill-in-the-blank questions
 *   sequence     → Quiz ordering questions
 *   categorySort → Quiz category-sort questions
 *   sentenceBuilder → Builder tab (sentence tile cards; go in sentenceBuilderPacks)
 *   passage         → Reading tab (go in passageGroups / PassagePacks)
 */
const ITEM_TYPES = [
  { value: "vocab",           label: "vocab",           tab: "Vocab + Quiz"  },
  { value: "fillBlank",       label: "fillBlank",       tab: "Quiz"          },
  { value: "sequence",        label: "sequence",        tab: "Quiz"          },
  { value: "categorySort",    label: "categorySort",    tab: "Quiz"          },
  { value: "sentenceBuilder", label: "sentenceBuilder", tab: "Builder"       },
  { value: "passage",         label: "passage",         tab: "Reading"       },
];

const GENERATE_MODES = [
  { value: "template",  label: "Structured Template", desc: "Always available" },
  { value: "chrome-ai", label: "Chrome AI Enhanced",  desc: "Requires Chrome Built-in AI" },
];

const SOURCE_MODES = [
  {
    value: "paste",
    label: "Paste text",
    desc: "Type or paste notes, OCR, textbook extracts directly here",
  },
  {
    value: "url",
    label: "URL",
    desc: "Provide a webpage or document URL — the AI will reference it",
  },
  {
    value: "ai-upload",
    label: "Upload in my AI chat",
    desc: "You'll attach photos, PDFs or files directly in ChatGPT / Claude / Codex",
  },
];

const field = {
  label: {
    fontSize: "0.78rem",
    color: "var(--lw-muted)",
    fontWeight: 600,
    marginBottom: 4,
    display: "block",
  },
  hint: {
    fontSize: "0.72rem",
    color: "var(--lw-muted)",
    marginTop: 3,
    lineHeight: 1.4,
  },
  input: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1.5px solid var(--lw-line)",
    background: "var(--lw-panel)",
    color: "var(--lw-ink)",
    fontFamily: "inherit",
    fontSize: "0.9rem",
  },
};

/** Capitalise the first letter of a subject name for display in the warning. */
function titleCase(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function PromptInputPanel({
  values,
  onChange,
  hasChromeAI,
  basePromptLoaded,
  basePromptError,
  allowedItemTypes,           // string[] from the active prompt config
  templateWarning,            // { requestedId, requiredSubject } | null
  onResolveWarning,           // (apply: boolean) => void
}) {
  const {
    subject, topic, level, curriculum, locale,
    itemTypes, sourceMode, sourceUrl, sourceMaterial,
    additionalInstructions, generateMode, promptTemplate,
  } = values;

  // Only show item types permitted by the currently loaded prompt template
  const visibleItemTypes = allowedItemTypes
    ? ITEM_TYPES.filter((t) => allowedItemTypes.includes(t.value))
    : ITEM_TYPES;

  function handleItemTypeToggle(typeValue) {
    const next = itemTypes.includes(typeValue)
      ? itemTypes.filter((t) => t !== typeValue)
      : [...itemTypes, typeValue];
    onChange("itemTypes", next);
  }

  // Resolve the human-readable label for the blocked template
  const warningTemplateLabel = templateWarning
    ? (PROMPT_CONFIGS.find((c) => c.id === templateWarning.requestedId)?.label ?? templateWarning.requestedId)
    : null;

  return (
    <div className="pb-input-panel">

      {/* Prompt load status */}
      {basePromptError && (
        <div className="pb-alert pb-alert--error">
          ⚠ Could not load generation prompt: {basePromptError}
        </div>
      )}

      {/* ── Subject ──────────────────────────────────────────────────── */}
      <div className="pb-field">
        <label style={field.label} htmlFor="pb-subject">Subject</label>
        <select
          id="pb-subject"
          style={field.input}
          value={subject}
          onChange={(e) => onChange("subject", e.target.value)}
        >
          {SUBJECTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* ── Prompt Template ──────────────────────────────────────────── */}
      <div className="pb-field pb-template-field">
        <label style={field.label} htmlFor="pb-template">Prompt Template</label>
        <select
          id="pb-template"
          style={field.input}
          value={promptTemplate}
          onChange={(e) => onChange("promptTemplate", e.target.value)}
        >
          {PROMPT_CONFIGS.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        {/* Description of the active template */}
        {PROMPT_CONFIGS.find((c) => c.id === promptTemplate) && (
          <p style={field.hint}>
            {PROMPT_CONFIGS.find((c) => c.id === promptTemplate).description}
          </p>
        )}
      </div>

      {/* ── Inline subject/template mismatch warning ─────────────────── */}
      {templateWarning && (
        <div className="pb-alert pb-alert--warning" role="alert">
          <p style={{ margin: "0 0 8px" }}>
            <strong>"{warningTemplateLabel}"</strong> requires subject{" "}
            <strong>{titleCase(templateWarning.requiredSubject)}</strong>, but your
            current subject is <strong>{titleCase(subject)}</strong>.
          </p>
          <p style={{ margin: "0 0 10px", fontSize: "0.82rem" }}>
            Switch subject automatically, or cancel to keep the current template.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="lw-btn lw-btn-primary"
              style={{ fontSize: "0.82rem", padding: "6px 14px" }}
              onClick={() => onResolveWarning(true)}
            >
              Switch subject to {titleCase(templateWarning.requiredSubject)} + apply
            </button>
            <button
              type="button"
              className="lw-btn lw-btn-ghost"
              style={{ fontSize: "0.82rem", padding: "6px 14px" }}
              onClick={() => onResolveWarning(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Topic ────────────────────────────────────────────────────── */}
      <div className="pb-field">
        <label style={field.label} htmlFor="pb-topic">
          Topic <span style={{ color: "var(--lw-coral)" }}>*</span>
        </label>
        <input
          id="pb-topic"
          type="text"
          placeholder="e.g. Weather and Climate, The Black Death, Particles…"
          style={field.input}
          value={topic}
          onChange={(e) => onChange("topic", e.target.value)}
        />
      </div>

      {/* Level — affects item.level on every generated item, used by quiz engine
          to filter which questions appear for a given year group */}
      <div className="pb-field">
        <label style={field.label} htmlFor="pb-level">Level / Year group</label>
        <input
          id="pb-level"
          type="text"
          placeholder="e.g. Y7, Y8, KS3, GCSE, Stage 1"
          style={field.input}
          value={level}
          onChange={(e) => onChange("level", e.target.value)}
        />
        <p style={field.hint}>
          Stored on each item — the quiz engine filters questions by year group.
          KS3 = Y7–Y9 · GCSE = Y10–Y11
        </p>
      </div>

      {/* Curriculum — sets the manifest curriculum field (ks3/other) AND
          the curriculum context used by the AI for content accuracy */}
      <div className="pb-field">
        <label style={field.label} htmlFor="pb-curriculum">
          Curriculum / Exam board <span style={{ color: "var(--lw-muted)" }}>(optional)</span>
        </label>
        <input
          id="pb-curriculum"
          type="text"
          placeholder="e.g. AQA GCSE, Edexcel A-Level, Cambridge IGCSE, OCR"
          style={field.input}
          value={curriculum}
          onChange={(e) => onChange("curriculum", e.target.value)}
        />
        <p style={field.hint}>
          Filters packs in the Vocab / Quiz / Reading tabs and guides AI content accuracy.
        </p>
      </div>

      {/* Locale */}
      <div className="pb-field">
        <label style={field.label} htmlFor="pb-locale">
          Source language / Locale
        </label>
        <select
          id="pb-locale"
          style={field.input}
          value={locale}
          onChange={(e) => onChange("locale", e.target.value)}
        >
          {LOCALES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
        <p style={field.hint}>
          Non-language subjects: keep en-GB. Language packs: pick the source language (e.g. de-DE for German).
        </p>
      </div>

      {/* Item types — these are the JSON schema types for items[].type */}
      <div className="pb-field">
        <span style={field.label}>Item Types to generate</span>
        <div className="pb-item-types">
          {visibleItemTypes.map((t) => (
            <label
              key={t.value}
              className={`pb-chip${itemTypes.includes(t.value) ? " pb-chip--on" : ""}`}
              title={`Maps to the ${t.tab} tab`}
            >
              <input
                type="checkbox"
                style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                checked={itemTypes.includes(t.value)}
                onChange={() => handleItemTypeToggle(t.value)}
              />
              <span>{t.label}</span>
              <span className="pb-chip-tab">{t.tab}</span>
            </label>
          ))}
        </div>
        {visibleItemTypes.length > 1 ? (
          <p style={field.hint}>
            <strong>vocab</strong> = Vocabulary + Quiz cards ·
            <strong> fillBlank / sequence / categorySort</strong> = Quiz question types ·
            <strong> sentenceBuilder</strong> = Builder tab ·
            <strong> passage</strong> = Reading tab
          </p>
        ) : (
          <p style={field.hint}>
            Item types are fixed by the selected prompt template.
          </p>
        )}
      </div>

      {/* Source material — three modes */}
      <div className="pb-field">
        <span style={field.label}>Source Material <span style={{ color: "var(--lw-muted)" }}>(optional)</span></span>

        {/* Mode selector */}
        <div className="pb-source-modes">
          {SOURCE_MODES.map((m) => (
            <label
              key={m.value}
              className={`pb-mode-option${sourceMode === m.value ? " pb-mode-option--on" : ""}`}
              style={{ marginBottom: 6 }}
            >
              <input
                type="radio"
                name="sourceMode"
                value={m.value}
                checked={sourceMode === m.value}
                onChange={() => onChange("sourceMode", m.value)}
                style={{ accentColor: "var(--lw-blue)", flexShrink: 0, marginTop: 2 }}
              />
              <span>
                <strong>{m.label}</strong>
                <span className="pb-mode-desc">{m.desc}</span>
              </span>
            </label>
          ))}
        </div>

        {/* URL input */}
        {sourceMode === "url" && (
          <div style={{ marginTop: 8 }}>
            <input
              id="pb-source-url"
              type="url"
              placeholder="https://…"
              style={field.input}
              value={sourceUrl}
              onChange={(e) => onChange("sourceUrl", e.target.value)}
            />
            <p style={field.hint}>
              The URL will be included in the prompt. The AI must be able to access it,
              or you can paste its text in "Paste text" mode instead.
            </p>
          </div>
        )}

        {/* Paste textarea */}
        {sourceMode === "paste" && (
          <textarea
            id="pb-source"
            rows={5}
            placeholder="Paste OCR text, textbook notes, worksheet content, teacher notes…"
            style={{ ...field.input, marginTop: 8, resize: "vertical", lineHeight: 1.5 }}
            value={sourceMaterial}
            onChange={(e) => onChange("sourceMaterial", e.target.value)}
          />
        )}

        {/* AI upload notice */}
        {sourceMode === "ai-upload" && (
          <div className="pb-ai-upload-notice">
            <span style={{ fontSize: "1.1rem" }}>📎</span>
            <span>
              A note will be added to the prompt telling the AI to expect uploaded files.
              When you paste the generated prompt into ChatGPT / Claude / Codex,
              attach your photos, PDFs, or screenshots in that same message.
            </span>
          </div>
        )}
      </div>

      {/* Additional instructions */}
      <div className="pb-field">
        <label style={field.label} htmlFor="pb-instructions">
          Additional Instructions <span style={{ color: "var(--lw-muted)" }}>(optional)</span>
        </label>
        <textarea
          id="pb-instructions"
          rows={3}
          placeholder="e.g. Include 30 items, add difficult distractors, use GCSE terminology, focus on key dates…"
          style={{ ...field.input, resize: "vertical", lineHeight: 1.5 }}
          value={additionalInstructions}
          onChange={(e) => onChange("additionalInstructions", e.target.value)}
        />
      </div>

      {/* Generate mode */}
      <div className="pb-field">
        <span style={field.label}>Generate Mode</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {GENERATE_MODES.map((m) => {
            const disabled = m.value === "chrome-ai" && !hasChromeAI;
            return (
              <label
                key={m.value}
                className={`pb-mode-option${generateMode === m.value ? " pb-mode-option--on" : ""}${disabled ? " pb-mode-option--disabled" : ""}`}
              >
                <input
                  type="radio"
                  name="generateMode"
                  value={m.value}
                  checked={generateMode === m.value}
                  disabled={disabled}
                  onChange={() => onChange("generateMode", m.value)}
                  style={{ accentColor: "var(--lw-blue)" }}
                />
                <span>
                  <strong>{m.label}</strong>
                  <span className="pb-mode-desc">
                    {disabled ? "Chrome AI not detected" : m.desc}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

    </div>
  );
}
