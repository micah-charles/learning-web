/**
 * chromeAI.js
 *
 * Wraps Chrome Built-in AI (Gemini Nano Prompt API).
 * All cloud APIs (OpenAI, Gemini cloud) are explicitly excluded.
 *
 * Detection strategy: feature-detect window.ai / window.LanguageModel —
 * never rely solely on userAgent strings.
 */

/** Returns true if Chrome Built-in AI Prompt API is available. */
export function detectChromeAI() {
  return !!(
    (typeof window !== "undefined" && window.ai) ||
    (typeof window !== "undefined" && window.LanguageModel) ||
    (typeof window !== "undefined" && window.promptAI)
  );
}

/**
 * Return the best available AI namespace object, or null.
 * @returns {object|null}
 */
function getAINamespace() {
  if (typeof window === "undefined") return null;
  return window.ai ?? window.LanguageModel ?? window.promptAI ?? null;
}

/**
 * Build a Chrome AI session configured as a prompt-construction assistant.
 * @returns {Promise<object>} The AI session.
 * @throws  {Error}          If AI is unavailable or session creation fails.
 */
export async function createAISession() {
  const ai = getAINamespace();
  if (!ai) throw new Error("Chrome Built-in AI is not available in this browser.");

  // Chrome 127+ Prompt API shape: ai.languageModel.create()
  // Older experiment shape:        ai.createTextSession()
  if (ai.languageModel?.create) {
    return ai.languageModel.create({
      systemPrompt: `You are a Learning Web Prompt Construction Assistant.

You receive a base Learning Web JSON-generation prompt together with user topic metadata and optional source material.

Your ONLY task is to produce a final prompt that a user will paste into ChatGPT, Codex, or Claude to generate a pack_unified.json file.

Rules you must follow without exception:
- Preserve ALL schema rules from the base prompt.
- Preserve ALL validation rules.
- Preserve ALL formatting requirements.
- Preserve ALL hard constraints.
- Cleanly append the user's topic metadata.
- Cleanly append source material when provided.
- End with an explicit instruction to generate exactly ONE valid pack_unified.json.
- DO NOT generate any JSON yourself.
- DO NOT include any commentary or preamble — output only the final prompt text.`,
    });
  }

  if (ai.createTextSession) {
    return ai.createTextSession();
  }

  throw new Error("Chrome AI is present but no supported session API was found.");
}

/**
 * Use the AI session to produce an enhanced final prompt.
 * @param {object} session     Active AI session returned by createAISession().
 * @param {string} basePrompt  Raw markdown of the master generation prompt.
 * @param {object} userContext Metadata collected from the UI form.
 * @returns {Promise<string>}  The finished prompt text ready to paste elsewhere.
 */
export async function generateEnhancedPrompt(session, basePrompt, userContext) {
  const contextBlock = JSON.stringify(userContext, null, 2);

  const input = `BASE PROMPT:
${basePrompt}

USER CONTEXT:
${contextBlock}`;

  // Detect which API shape we have
  const result =
    typeof session.prompt === "function"
      ? await session.prompt(input)
      : typeof session.promptStreaming === "function"
      ? await collectStream(session.promptStreaming(input))
      : await session.execute?.(input);

  if (result == null) {
    throw new Error("Chrome AI returned an empty result. Please try again.");
  }

  return typeof result === "string" ? result : String(result);
}

/** Collect a ReadableStream of strings into a single string. */
async function collectStream(stream) {
  let text = "";
  for await (const chunk of stream) {
    text += chunk;
  }
  return text;
}

/** Destroy a session when done to release GPU resources. */
export function destroySession(session) {
  try {
    session?.destroy?.();
  } catch (_) {
    // Best-effort cleanup — ignore errors.
  }
}
