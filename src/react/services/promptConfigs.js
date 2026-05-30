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
  {
    id: "vr-11plus",
    label: "11+ Verbal Reasoning",
    description: "Synonyms/antonyms, analogies, odd-one-out, sequences and classification",
    path: "./docs/learningweb-11plus-verbal-reasoning.md",
    allowedItemTypes: ["vocab", "fillBlank", "categorySort"],
    defaultItemTypes: ["vocab", "fillBlank", "categorySort"],
    linkedSubject: "other",
  },
  {
    id: "spelling-vocab",
    label: "Spelling & Vocabulary",
    description: "Word cards + cloze for KS2 SATs spelling lists / US spelling & sight words",
    path: "./docs/learningweb-spelling-vocab.md",
    allowedItemTypes: ["vocab", "fillBlank"],
    defaultItemTypes: ["vocab", "fillBlank"],
    linkedSubject: "other",
  },
  {
    id: "gcse-science",
    label: "GCSE / KS3 Science Revision",
    description: "Key-term cards, fill-blank recall, process sequences and classifications",
    path: "./docs/learningweb-gcse-science.md",
    allowedItemTypes: ["vocab", "fillBlank", "sequence", "categorySort"],
    defaultItemTypes: ["vocab", "fillBlank", "sequence", "categorySort"],
    linkedSubject: "science",
  },
  {
    id: "history-source",
    label: "History Source & Enquiry",
    description: "Accounts/sources with inference, source-utility and significance questions",
    path: "./docs/learningweb-history-source.md",
    allowedItemTypes: ["passage"],
    defaultItemTypes: ["passage"],
    linkedSubject: "history",
  },
  {
    id: "geography-casestudy",
    label: "Geography Case Study",
    description: "Key terms, fill-blank recall and a case-study reading passage",
    path: "./docs/learningweb-geography-casestudy.md",
    allowedItemTypes: ["vocab", "fillBlank", "passage"],
    defaultItemTypes: ["vocab", "fillBlank", "passage"],
    linkedSubject: "geography",
  },
  {
    id: "mfl-vocab",
    label: "MFL Vocabulary (French / German / Spanish)",
    description: "Translated word cards with examples + Builder sentences for language packs",
    path: "./docs/learningweb-mfl-vocab.md",
    allowedItemTypes: ["vocab", "sentenceBuilder"],
    defaultItemTypes: ["vocab", "sentenceBuilder"],
    linkedSubject: "language",
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
