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

const STORAGE_KEY = "learningGermanWeb.v1";

// ── Persist / restore prompt builder prefs ─────────────────────────────────
function loadSavedPrefs() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.prefs?.promptBuilder ?? null;
  } catch (_) {
    return null;
  }
}

function savePrefs(prefs) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const state = raw ? JSON.parse(raw) : {};
    if (!state.prefs) state.prefs = {};
    state.prefs.promptBuilder = prefs;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {
    // localStorage may be unavailable — graceful no-op.
  }
}

const DEFAULT_VALUES = {
  subject: "geography",
  topic: "",
  level: "KS3",
  curriculum: "",
  locale: "en-GB",
  itemTypes: ["vocab"],
  sourceMode: "paste",       // "url" | "ai-upload" | "paste"
  sourceUrl: "",
  sourceMaterial: "",
  additionalInstructions: "",
  generateMode: "template",
};

// ──────────────────────────────────────────────────────────────────────────────

export default function AIPromptBuilder({ onNavigate }) {
  const hasChromeAI = detectChromeAI();

  // Form values
  const saved = loadSavedPrefs();
  const [values, setValues] = useState({ ...DEFAULT_VALUES, ...saved });

  // Prompt output
  const [basePrompt, setBasePrompt]         = useState("");
  const [basePromptError, setBasePromptError] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [status, setStatus]                 = useState("idle"); // idle | loading | generating | done | error
  const [errorMsg, setErrorMsg]             = useState("");

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

  // ── Load base prompt on mount ──────────────────────────────────────────────
  useEffect(() => {
    setStatus("loading");
    loadBasePrompt()
      .then((text) => {
        setBasePrompt(text);
        setStatus("idle");
      })
      .catch((err) => {
        setBasePromptError(err.message);
        setStatus("error");
        setErrorMsg(err.message);
      });
  }, []);

  // ── Field change handler ───────────────────────────────────────────────────
  const handleChange = useCallback((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

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
        // Create or reuse an AI session
        if (!aiSessionRef.current) {
          aiSessionRef.current = await createAISession();
        }
        finalPrompt = await generateEnhancedPrompt(aiSessionRef.current, basePrompt, ctx);
      } else {
        // Structured template — always available, synchronous
        finalPrompt = assembleTemplatePrompt(basePrompt, ctx, false);
      }

      setGeneratedPrompt(finalPrompt);
      setStatus("done");
    } catch (err) {
      // If AI session failed, clear it so a fresh one is made next time
      destroySession(aiSessionRef.current);
      aiSessionRef.current = null;

      // Fall back to template on AI failure
      if (useAI) {
        const fallback = assembleTemplatePrompt(basePrompt, ctx, false);
        setGeneratedPrompt(fallback);
        setStatus("done");
        setErrorMsg(
          `Chrome AI failed (${err.message}). Fell back to structured template mode.`
        );
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

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="lw-page">

      {/* Back to My Packs */}
      <button
        className="lw-btn lw-btn--ghost"
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
