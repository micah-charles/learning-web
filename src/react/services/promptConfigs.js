/**
 * promptConfigs.js
 *
 * Registry of prompt templates available in the AI Prompt Builder.
 *
 * Each config entry defines:
 *  - id:               unique key stored in prefs.promptBuilder.promptTemplate
 *  - label:            shown in the template dropdown
 *  - description:      one-liner shown under the label
 *  - path:             fetch path relative to the app root (must be in public/docs/)
 *  - allowedItemTypes: which items[].type values are valid for this prompt
 *  - defaultItemTypes: the pre-selected item types when this template is chosen
 *  - linkedSubject:    auto-set subject to this value when this template is chosen
 *                      (null = no automatic subject change)
 */

export const PROMPT_CONFIGS = [
  {
    id: "standard",
    label: "Standard Pack Generator",
    description: "All item types — vocab, quiz questions, sentence builder, passages",
    path: "./docs/generate_json_pack_generation_prompt.md",
    allowedItemTypes: ["vocab", "fillBlank", "sequence", "categorySort", "sentenceBuilder", "passage"],
    defaultItemTypes: ["vocab"],
    linkedSubject: null,
  },
  {
    id: "lit-11plus",
    label: "11+ English Comprehension",
    description: "Literary passage + inferential MCQ and open comprehension questions",
    path: "./docs/learningweb-11plus-english-inferential.md",
    allowedItemTypes: ["passage"],
    defaultItemTypes: ["passage"],
    linkedSubject: "literature",
  },
];

/** Look up a config by its id, falling back to the first (standard) config. */
export function getPromptConfig(id) {
  return PROMPT_CONFIGS.find((c) => c.id === id) || PROMPT_CONFIGS[0];
}

/**
 * Given the current subject value, return the prompt config id that should be
 * auto-selected.  Literature always maps to "lit-11plus"; everything else
 * maps to "standard".
 */
export function promptConfigForSubject(subject) {
  if (subject === "literature") return "lit-11plus";
  return "standard";
}
