/**
 * promptLoader.js
 *
 * Fetches the canonical Learning Web pack-generation prompt from the
 * statically-served public path.  The markdown file must never be
 * duplicated into source — this loader is the single fetch point.
 */

const PROMPT_PATH = "./docs/generate_json_pack_generation_prompt.md";

/**
 * Load the base prompt markdown.
 * @returns {Promise<string>} Raw markdown text.
 * @throws  {Error}          If the fetch fails (network / 404).
 */
export async function loadBasePrompt() {
  const res = await fetch(PROMPT_PATH);
  if (!res.ok) {
    throw new Error(
      `Could not load the generation prompt (HTTP ${res.status}). ` +
        "Check that the file exists at src/react/public/docs/generate_json_pack_generation_prompt.md."
    );
  }
  return res.text();
}
