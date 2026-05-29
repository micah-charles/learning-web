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
 *  - Chrome AI (Gemini Nano) is used only for prompt construction / enhancement.
 *  - Falls back to structured template assembly when Chrome AI is unavailable.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import ChromeAIStatus from "../components/promptBuilder/ChromeAIStatus.jsx";
import PromptInputPanel from "../components/promptBuilder/PromptInputPanel.jsx";
import PromptOutputPanel from "../components/promptBuilder/PromptOutputPanel.jsx";
import { detectChromeAI, createAISession, generateEnhancedPrompt, destroySession } from "../services/chromeAI.js";
import { loadBasePrompt } from "../services/promptLoader.js";
import { assembleTemplatePrompt } from "../services/promptAssembler.js";
import { getPromptConfig, promptConfigForSubject } from "../services/promptConfigs.js";
import { loadStoredState, saveStoredState } from "@/storage.js";

// ── Persist / restore prompt builder prefs via the shared storage layer ─────
function loadSavedPrefs() {
  return loadStoredState().prefs.promptBuilder;
}

function savePrefs(prefs) {
  const state = loadStoredState();
  state.prefs.promptBuilder = prefs;
  saveStoredState(state);
}

// ──────────────────────────────────────────────────────────────────────────────

export default function AIPromptBuilder({ onNavigate }) {
  const hasChromeAI = detectChromeAI();

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

  // Keep an AI session alive across multiple "Generate" clicks
  const aiSessionRef = useRef(null);

  // ── Persist prefs on every change ─────────────────────────────────────────
  useEffect(() => {
    savePrefs(values);
  }, [values]);

  // ── Cleanup AI session on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => destroySession(aiSessionRef.current);
  }, []);

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

      if (key === "subject") {
        // Auto-switch the prompt template when subject changes
        const autoTemplate = promptConfigForSubject(value);
        if (autoTemplate !== prev.promptTemplate) {
          next.promptTemplate = autoTemplate;
          const config = getPromptConfig(autoTemplate);
          const filtered = prev.itemTypes.filter((t) => config.allowedItemTypes.includes(t));
          next.itemTypes = filtered.length > 0 ? filtered : config.defaultItemTypes;
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
  }, [values, templateWarning]);

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
      level: values.level,
      curriculum: values.curriculum,
      locale: values.locale,
      itemTypes: values.itemTypes,
      sourceMode: values.sourceMode,
      sourceUrl: values.sourceUrl,
      sourceMaterial: values.sourceMaterial,
      additionalInstructions: values.additionalInstructions,
    };

    const useAI = values.generateMode === "chrome-ai" && hasChromeAI;

    setStatus("generating");
    setErrorMsg("");

    try {
      let finalPrompt;

      if (useAI) {
        if (!aiSessionRef.current) {
          aiSessionRef.current = await createAISession();
        }
        finalPrompt = await generateEnhancedPrompt(aiSessionRef.current, basePrompt, ctx);
      } else {
        finalPrompt = assembleTemplatePrompt(basePrompt, ctx, false);
      }

      setGeneratedPrompt(finalPrompt);
      setStatus("done");
    } catch (err) {
      destroySession(aiSessionRef.current);
      aiSessionRef.current = null;

      if (useAI) {
        const fallback = assembleTemplatePrompt(basePrompt, ctx, false);
        setGeneratedPrompt(fallback);
        setStatus("done");
        setErrorMsg(`Chrome AI failed (${err.message}). Fell back to structured template mode.`);
      } else {
        setStatus("error");
        setErrorMsg(err.message);
      }
    }
  }, [basePrompt, values, hasChromeAI]);

  // ── Reset output ───────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setGeneratedPrompt("");
    setStatus(basePrompt ? "idle" : "error");
    setErrorMsg("");
  }, [basePrompt]);

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
              ✦ AI Prompt Builder
            </h2>
            <p className="pb-subtitle">
              Build optimised Learning Web pack-generation prompts — then paste into ChatGPT, Codex, or Claude.
            </p>
          </div>
          <div className="pb-header-badges">
            <span className="badge blue">Local Only</span>
            <ChromeAIStatus available={hasChromeAI} />
          </div>
        </div>
      </div>

      {/* Split layout: inputs | output */}
      <div className="pb-layout">

        {/* Left: inputs */}
        <div className="lw-card pb-panel">
          <h3 className="pb-panel-title">Pack Details</h3>
          <PromptInputPanel
            values={values}
            onChange={handleChange}
            hasChromeAI={hasChromeAI}
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
    </div>
  );
}
