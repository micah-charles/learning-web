/**
 * promptAssembler.js
 *
 * Builds the final copyable prompt using a structured template.
 * This is the always-available fallback path (no Chrome AI required).
 *
 * Output shape:
 *   header metadata → item types → instructions → source material →
 *   base master prompt → final generation + output instructions
 */

/**
 * Assemble a ready-to-paste prompt from the base markdown + user context.
 *
 * @param {string} basePrompt  Raw markdown from the master prompt file.
 * @param {object} ctx         User context collected from the UI form.
 * @param {string}   ctx.subject
 * @param {string}   ctx.topic
 * @param {string}   ctx.level
 * @param {string}   ctx.curriculum
 * @param {string}   ctx.locale
 * @param {string[]} ctx.itemTypes
 * @param {string}   ctx.sourceMode        "paste" | "url" | "ai-upload"
 * @param {string}   ctx.sourceUrl         URL when sourceMode === "url"
 * @param {string}   ctx.sourceMaterial    Pasted text when sourceMode === "paste"
 * @param {string}   ctx.additionalInstructions
 * @param {boolean} [usedChromeAI=false]
 * @returns {string}
 */
export function assembleTemplatePrompt(basePrompt, ctx, usedChromeAI = false) {
  const {
    subject = "",
    topic = "",
    level = "",
    curriculum = "",
    locale = "en-GB",
    itemTypes = [],
    sourceMode = "paste",
    sourceUrl = "",
    sourceMaterial = "",
    additionalInstructions = "",
  } = ctx;

  const lines = [];

  // ── Header ────────────────────────────────────────────────────────────────
  lines.push("# Learning Web Pack Generation Request");
  lines.push("");

  // ── Pack metadata ──────────────────────────────────────────────────────────
  lines.push("## Pack Metadata");
  lines.push("");
  if (subject)    lines.push(`- **Subject:** ${capitalize(subject)}`);
  if (topic)      lines.push(`- **Topic:** ${topic}`);
  if (level)      lines.push(`- **Level / Year group:** ${level}`);
  if (curriculum) lines.push(`- **Curriculum / Exam board:** ${curriculum}`);
  if (locale)     lines.push(`- **Source language / Locale:** ${locale}`);
  lines.push("");

  // ── Item types ─────────────────────────────────────────────────────────────
  if (itemTypes.length > 0) {
    lines.push("## Focus Item Types");
    lines.push("");
    lines.push("Generate items of the following JSON schema types (items[].type):");
    lines.push("");
    itemTypes.forEach((t) => lines.push(`- \`${t}\``));
    lines.push("");
    lines.push(itemTypeNotes(itemTypes));
    lines.push("");
  }

  // ── Additional instructions ────────────────────────────────────────────────
  if (additionalInstructions.trim()) {
    lines.push("## Additional Instructions");
    lines.push("");
    additionalInstructions
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((l) => lines.push(`- ${l}`));
    lines.push("");
  }

  // ── Source material ────────────────────────────────────────────────────────
  if (sourceMode === "url" && sourceUrl.trim()) {
    lines.push("## Source Material");
    lines.push("");
    lines.push(
      "The following URL contains the source content. " +
        "Use it as a factual and terminology anchor for the pack:"
    );
    lines.push("");
    lines.push(`**URL:** ${sourceUrl.trim()}`);
    lines.push("");
    lines.push(
      "> If you cannot access the URL, ask the user to paste the content directly."
    );
    lines.push("");
  } else if (sourceMode === "ai-upload") {
    lines.push("## Source Material");
    lines.push("");
    lines.push(
      "📎 **Source material will be provided as attached files in this chat.**"
    );
    lines.push("");
    lines.push(
      "The user will upload photos, PDFs, worksheets, or screenshots alongside this prompt. " +
        "Use the uploaded materials as factual grounding and terminology anchors for the pack. " +
        "Do not limit the dataset only to the attached source — " +
        "expand with accurate curriculum-relevant knowledge to ensure a complete pack."
    );
    lines.push("");
  } else if (sourceMode === "paste" && sourceMaterial.trim()) {
    lines.push("## Source Material");
    lines.push("");
    lines.push(
      "Use the following pasted content as a factual and terminology anchor for the pack:"
    );
    lines.push("");
    lines.push("```");
    lines.push(sourceMaterial.trim());
    lines.push("```");
    lines.push("");
  }

  // ── Base master prompt ─────────────────────────────────────────────────────
  lines.push("---");
  lines.push("");
  lines.push("## Learning Web Pack Generation Specification");
  lines.push("");
  lines.push(basePrompt.trim());
  lines.push("");

  // ── Final generation instruction ───────────────────────────────────────────
  lines.push("---");
  lines.push("");
  lines.push("## Your Task");
  lines.push("");
  lines.push(
    "Using the metadata, item types, and source material above, " +
      "generate **exactly ONE valid `pack_unified.json`** file."
  );
  lines.push("");
  lines.push("Requirements:");
  lines.push("- Follow all schema rules in the specification above strictly.");
  lines.push("- Do **not** generate multiple files or variations.");
  lines.push(`- Set \`packId\` to a snake_case slug derived from the topic: \`${toSlug(topic)}\``);
  if (level) {
    lines.push(
      `- Set \`item.level\` to \`"${level}"\` on every item — this controls which year group sees the question in the quiz engine.`
    );
  }
  if (curriculum) {
    lines.push(
      `- Set the top-level \`curriculum\` field to \`"${curriculum}"\` (the curriculum / exam board exactly as written). ` +
        `The app normalises this for grouping and shows custom curricula automatically in the Quiz / Reading / Vocabulary / Builder filters.`
    );
  }
  lines.push("");
  lines.push("## Output — Save as a Downloadable File");
  lines.push("");
  lines.push(
    `When you have finished generating the JSON, **save it as a file named \`${toSlug(topic)}_pack_unified.json\`** and provide a download link so the user can save it directly.`
  );
  lines.push("");
  lines.push("- If you are **ChatGPT** (with code interpreter / data analysis enabled): use Python to write the file and call `files.download()` to give the user a direct download link.");
  lines.push("- If you are **Claude**: place the complete JSON inside a single `json` code block — the user will copy and save it manually.");
  lines.push("- If you are **Codex / another agent**: write the file to disk at the path the user specifies, or output it as a downloadable artefact.");
  lines.push("");
  lines.push("The file must contain **only valid JSON** — no markdown, no commentary, no trailing text inside the file.");
  lines.push("");

  if (!usedChromeAI) {
    lines.push(
      "> _Note: This prompt was assembled using structured template mode " +
        "(Chrome Built-in AI was unavailable or not selected)._"
    );
    lines.push("");
  }

  return lines.join("\n");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Convert topic text to a snake_case pack ID slug. */
function toSlug(topic) {
  return (topic || "my_pack")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60) || "my_pack";
}

/** Add brief notes clarifying how each requested item type maps to the app. */
function itemTypeNotes(types) {
  const notes = [];
  if (types.includes("vocab"))
    notes.push("- `vocab` items appear in the **Vocabulary** tab and power **Quiz** word-choice / typed-answer questions.");
  if (types.includes("fillBlank"))
    notes.push("- `fillBlank` items generate **fill-in-the-blank** Quiz questions.");
  if (types.includes("multipleChoice"))
    notes.push("- `multipleChoice` items generate standalone **multiple-choice** Quiz questions.");
  if (types.includes("sequence"))
    notes.push("- `sequence` items generate **ordering** Quiz questions.");
  if (types.includes("categorySort"))
    notes.push("- `categorySort` items generate **category-sort** Quiz questions.");
  if (types.includes("sentenceBuilder"))
    notes.push("- `sentenceBuilder` items go into a **sentenceBuilderPack** and appear in the **Builder** tab as tile-arrangement cards.");
  if (types.includes("passage"))
    notes.push("- `passage` items go into a **PassagePack** and appear in the **Reading** tab.");
  return notes.join("\n");
}
