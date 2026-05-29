/**
 * promptLoader.js
 *
 * Fetches the canonical Learning Web pack-generation prompt from the
 * statically-served public path.  The markdown file must never be
 * duplicated into source — this loader is the single fetch point.
 */

/**
 * Load a prompt markdown file from the Vite public/docs/ directory.
 *
 * All prompt files must live in public/docs/ — Vite serves that directory
 * at the root URL in dev mode and copies it to dist/ during production builds.
 *
 * @param {string} [path="./docs/generate_json_pack_generation_prompt.md"]
 *   Relative URL of the markdown file to fetch.
 * @returns {Promise<string>} Raw markdown text.
 * @throws  {Error}          If the fetch fails (network / 404).
 */
export async function loadBasePrompt(path = "./docs/generate_json_pack_generation_prompt.md") {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(
      `Could not load the generation prompt (HTTP ${res.status}). ` +
        `Check that the file exists at public${path.replace(/^\./, "")}.`
    );
  }
  return res.text();
}
