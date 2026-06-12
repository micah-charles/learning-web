/**
 * AIPromptBuilder.jsx
 *
 * Browser-only AI Prompt Builder page.
 *
 * Purpose: help users construct a ready-to-paste prompt for ChatGPT / Codex /
 * Claude to generate a Learning Web pack_unified.json file.
 *
 * Architecture rules:
 *  - NEVER generate pack JSON directly in the browser.
 *  - NEVER send prompts or source material to a backend.
 *  - NEVER use OpenAI API or Gemini cloud API.
 *  - Uses deterministic structured template assembly.
 */
import { useState, useEffect, useCallback } from "react";
import PromptInputPanel from "../components/promptBuilder/PromptInputPanel.jsx";
import PromptOutputPanel from "../components/promptBuilder/PromptOutputPanel.jsx";
import GuidedTour from "../components/promptBuilder/GuidedTour.jsx";
import { AI_TOUR_STEPS, SHERLOCK_PRESET } from "../components/promptBuilder/tourConfig.js";
import { loadBasePrompt } from "../services/promptLoader.js";
import { assembleTemplatePrompt } from "../services/promptAssembler.js";
import { getPromptConfig, normalizePromptConfigId, promptConfigForSubject } from "../services/promptConfigs.js";
import { loadStoredState, saveStoredState } from "@/storage.js";

// ── Persist / restore prompt builder prefs via the shared storage layer ─────
function loadSavedPrefs() {
  const saved = loadStoredState().prefs.promptBuilder;
  const promptTemplate = normalizePromptConfigId(saved.promptTemplate, saved.subject);
  const config = getPromptConfig(promptTemplate);
  const itemTypes = Array.isArray(saved.itemTypes)
    ? saved.itemTypes.filter((type) => config.allowedItemTypes.includes(type))
    : [];

  return {
    ...saved,
    promptTemplate,
    generateMode: "template",
    itemTypes: itemTypes.length > 0 ? itemTypes : [...config.defaultItemTypes],
    additionalInstructions:
      hasSherlockExampleInstructions(saved.additionalInstructions) && !hasSherlockSource(saved)
        ? ""
        : saved.additionalInstructions,
  };
}

function savePrefs(prefs) {
  const state = loadStoredState();
  state.prefs.promptBuilder = { ...prefs, generateMode: "template" };
  saveStoredState(state);
}

function hasSherlockExampleInstructions(text = "") {
  const value = String(text);
  return value === SHERLOCK_PRESET.additionalInstructions ||
    /Helen Stoner|Baker Street|Grimesby Roylott|Stoke Moran|Speckled Band/i.test(value);
}

function hasSherlockSource(values = {}) {
  const topic = String(values.topic || "");
  const sourceUrl = String(values.sourceUrl || "");
  return /Speckled Band/i.test(topic) || /sherlock-holm\.es\/stories\/html\/spec/i.test(sourceUrl);
}

// ──────────────────────────────────────────────────────────────────────────────

export default function AIPromptBuilder({ onNavigate }) {
  // Form values — initialised from the merged stored state (includes defaults)
  const [values, setValues] = useState(() => loadSavedPrefs());

  // When the user selects a template whose linkedSubject doesn't match the
  // current subject, we block the switch and surface a warning instead of
  // silently overriding their subject choice.
  // Shape: { requestedId: string, requiredSubject: string } | null
  const [templateWarning, setTemplateWarning] = useState(null);

  // Prompt output
  const [basePrompt, setBasePrompt]           = useState("");
  const [basePromptError, setBasePromptError] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [status, setStatus]                   = useState("idle");
  const [errorMsg, setErrorMsg]               = useState("");

  // Onboarding: guided tour + one-click example feedback
  const [tourOpen, setTourOpen] = useState(false);
  const [exampleLoaded, setExampleLoaded] = useState(false);

  // ── Persist prefs on every change ─────────────────────────────────────────
  useEffect(() => {
    savePrefs(values);
  }, [values]);

  // ── Load base prompt whenever the selected template changes ────────────────
  useEffect(() => {
    const config = getPromptConfig(values.promptTemplate);
    setStatus("loading");
    setBasePrompt("");
    setBasePromptError("");
    setGeneratedPrompt(""); // clear stale output from a previous template
    loadBasePrompt(config.path)
      .then((text) => {
        setBasePrompt(text);
        setStatus("idle");
      })
      .catch((err) => {
        setBasePromptError(err.message);
        setStatus("error");
        setErrorMsg(err.message);
      });
  }, [values.promptTemplate]);

  // ── Field change handler with bidirectional subject ↔ template linking ─────
  // `values` is in the dependency array so we can read the current subject
  // before entering setValues — this keeps side-effects (setTemplateWarning)
  // safely outside the state-updater function (see RC9).
  const handleChange = useCallback((key, value) => {
    const sourceIdentityKeys = new Set(["topic", "sourceMode", "sourceUrl", "sourceMaterial"]);

    if (key === "promptTemplate") {
      const config = getPromptConfig(value);
      if (config.linkedSubject && config.linkedSubject !== values.subject) {
        // Subject mismatch — block the switch and ask the user to resolve it.
        setTemplateWarning({ requestedId: value, requiredSubject: config.linkedSubject });
        return; // leave values.promptTemplate unchanged
      }
      // No conflict — fall through to setValues below.
    }

    setValues((prev) => {
      const next = { ...prev, [key]: value };

      if (
        sourceIdentityKeys.has(key) &&
        hasSherlockExampleInstructions(prev.additionalInstructions)
      ) {
        next.additionalInstructions = "";
      }

      if (key === "subject") {
        // Auto-switch the prompt template when subject changes
        const autoTemplate = promptConfigForSubject(value);
        if (autoTemplate !== prev.promptTemplate) {
          next.promptTemplate = autoTemplate;
          const config = getPromptConfig(autoTemplate);
          // Always reset to the new template's defaults on a subject-driven switch.
          // Preserving an intersection (e.g. "passage" surviving from lit-11plus into
          // Standard) produces odd results — a History/Geography pack with only passage
          // selected despite no 11+ prompt being used.
          next.itemTypes = config.defaultItemTypes;
        }
      }

      if (key === "promptTemplate") {
        // linkedSubject already matched (checked above) — just filter item types
        const config = getPromptConfig(value);
        const filtered = prev.itemTypes.filter((t) => config.allowedItemTypes.includes(t));
        next.itemTypes = filtered.length > 0 ? filtered : config.defaultItemTypes;
      }

      return next;
    });

    // Dismiss any pending template warning when the user manually changes subject.
    // Called OUTSIDE setValues to comply with RC9 (side effects must not live inside
    // state-updater functions — StrictMode fires them twice).
    if (key === "subject" && templateWarning) {
      setTemplateWarning(null);
    }

    if (sourceIdentityKeys.has(key) && exampleLoaded) {
      setExampleLoaded(false);
    }
  }, [values, templateWarning, exampleLoaded]);

  // ── Resolve a template/subject conflict from the inline warning ─────────────
  // apply=true  → switch both promptTemplate and subject automatically
  // apply=false → dismiss the warning, keep the current template
  const handleResolveWarning = useCallback((apply) => {
    if (apply && templateWarning) {
      const { requestedId, requiredSubject } = templateWarning;
      const config = getPromptConfig(requestedId);
      setValues((prev) => {
        const filtered = prev.itemTypes.filter((t) => config.allowedItemTypes.includes(t));
        return {
          ...prev,
          promptTemplate: requestedId,
          subject: requiredSubject,
          itemTypes: filtered.length > 0 ? filtered : config.defaultItemTypes,
        };
      });
    }
    setTemplateWarning(null);
  }, [templateWarning]);

  // ── Generate prompt ────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!basePrompt || !values.topic.trim()) return;

    const ctx = {
      subject: values.subject,
      topic: values.topic.trim(),
      // Level only matters for language packs (Vocab "Year" filter) / stage packs.
      // The field is hidden for other subjects, so don't leak a stale level into
      // the prompt or the generated item.level for non-language packs.
      level: values.subject === "language" ? values.level : "",
      curriculum: values.curriculum,
      locale: values.locale,
      itemTypes: values.itemTypes,
      sourceMode: values.sourceMode,
      sourceUrl: values.sourceUrl,
      sourceMaterial: values.sourceMaterial,
      additionalInstructions: values.additionalInstructions,
    };

    setStatus("generating");
    setErrorMsg("");

    try {
      const finalPrompt = assembleTemplatePrompt(basePrompt, ctx, false);

      setGeneratedPrompt(finalPrompt);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }, [basePrompt, values]);

  // ── Reset output ───────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setGeneratedPrompt("");
    setStatus(basePrompt ? "idle" : "error");
    setErrorMsg("");
  }, [basePrompt]);

  // ── Onboarding handlers ─────────────────────────────────────────────────────
  const handleStartTour = useCallback(() => setTourOpen(true), []);

  // Mark the tour as seen (UI hint only) when it closes/completes.
  const handleCloseTour = useCallback(() => {
    setTourOpen(false);
    setValues((prev) => (prev.tourSeen ? prev : { ...prev, tourSeen: true }));
  }, []);

  // One-click example. Merge over prev so tourSeen is preserved.
  // Subject + template stay consistent, so no mismatch warning fires.
  const handleLoadExample = useCallback(() => {
    setValues((prev) => ({ ...prev, ...SHERLOCK_PRESET, generateMode: "template" }));
    setTemplateWarning(null);   // independent setState — safe outside the updater
    setGeneratedPrompt("");     // clear any stale output from a previous run
    setExampleLoaded(true);
  }, []);

  // ── Derive the active config for passing down ──────────────────────────────
  const activeConfig = getPromptConfig(values.promptTemplate);

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="lw-page">

      {/* Back to My Packs */}
      <button
        className="lw-btn lw-btn-ghost"
        style={{ marginBottom: 12, paddingLeft: 0 }}
        type="button"
        onClick={() => onNavigate?.("mypacks")}
      >
        ← My Packs
      </button>

      {/* Page header */}
      <div className="lw-card pb-header">
        <div className="pb-header-row">
          <div>
            <h2 className="lw-section-title" style={{ marginBottom: 4 }}>
              ✦ AI Learning Pack Creator
            </h2>
            <p className="pb-subtitle">
              Build your own quizzes, readings, and revision packs using AI. Generate a prompt,
              send it to ChatGPT or Claude, then upload the returned JSON pack in My Packs.
            </p>
          </div>
          <div className="pb-header-badges">
            <span className="badge blue">Local Only</span>
          </div>
        </div>

        {/* Quickstart: guided tour + one-click example */}
        <div className="pb-quickstart">
          <div className="pb-quickstart-text">
            <strong>New here?</strong> Take the guided tour, or load a worked example to see the
            whole workflow.
          </div>
          <div className="pb-quickstart-actions">
            <button
              type="button"
              className={`lw-btn lw-btn-secondary${values.tourSeen ? "" : " pb-quickstart-pulse"}`}
              onClick={handleStartTour}
            >
              Show me how
            </button>
            <button
              type="button"
              className="lw-btn"
              onClick={handleLoadExample}
            >
              Try example: Sherlock Holmes 11+
            </button>
          </div>
        </div>
        {exampleLoaded && (
          <p className="pb-quickstart-success" role="status">
            ✓ Example loaded. Click <strong>Generate Prompt</strong> to continue.
          </p>
        )}
      </div>

      {/* Split layout: inputs | output */}
      <div className="pb-layout">

        {/* Left: inputs */}
        <div className="lw-card pb-panel">
          <h3 className="pb-panel-title">Pack Details</h3>
          <PromptInputPanel
            values={values}
            onChange={handleChange}
            basePromptLoaded={!!basePrompt}
            basePromptError={basePromptError}
            allowedItemTypes={activeConfig.allowedItemTypes}
            templateWarning={templateWarning}
            onResolveWarning={handleResolveWarning}
          />
        </div>

        {/* Right: output */}
        <div className="lw-card pb-panel">
          <h3 className="pb-panel-title">Generated Prompt</h3>
          <PromptOutputPanel
            prompt={generatedPrompt}
            status={status}
            error={errorMsg}
            topic={values.topic}
            onGenerate={handleGenerate}
            onReset={handleReset}
            basePromptLoaded={!!basePrompt}
          />
        </div>

      </div>

      {/* Next steps — shown once a prompt has been generated */}
      {generatedPrompt && (
        <div className="lw-card pb-nextsteps">
          <h3 className="pb-panel-title" style={{ marginBottom: 10 }}>Next steps</h3>
          <ol className="pb-nextsteps-list">
            <li>Copy the prompt above (or download it as a <code>.md</code> file).</li>
            <li>Open ChatGPT, Claude, or Codex in a new tab.</li>
            <li>Paste the prompt{values.sourceMode === "ai-upload" ? " and attach your files" : ""}, then send it.</li>
            <li>Wait for the AI to return a <code>pack_unified.json</code> block.</li>
            <li>Save / download that JSON to your computer.</li>
            <li>Come back here and open <strong>My Packs</strong> to upload it.</li>
            <li>Practise it in Reading, Quiz, Vocabulary, or Builder.</li>
          </ol>
          <div className="pb-nextsteps-actions">
            <button
              type="button"
              className="lw-btn lw-btn-primary"
              onClick={() => onNavigate?.("mypacks")}
            >
              Go to My Packs to upload →
            </button>
            <button
              type="button"
              className="lw-btn lw-btn-ghost"
              onClick={handleStartTour}
            >
              Replay the tour
            </button>
          </div>
        </div>
      )}

      <GuidedTour steps={AI_TOUR_STEPS} open={tourOpen} onClose={handleCloseTour} />
    </div>
  );
}
