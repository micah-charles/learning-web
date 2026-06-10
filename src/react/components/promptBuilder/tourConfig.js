/**
 * tourConfig.js
 *
 * Static configuration for the AI Learning Pack Creator onboarding experience:
 *   - AI_TOUR_STEPS: the guided-tour steps (see GuidedTour.jsx)
 *   - SHERLOCK_PRESET: a one-click example that fills the form
 *
 * Tour step shape:
 *   {
 *     target?: string         // id of the element to highlight (no leading #)
 *     title: string
 *     description: string
 *     skipIfMissing?: boolean // drop this step entirely if the target is absent
 *                             // (e.g. the URL field only exists in URL mode)
 *   }
 *
 * Steps with no `target` (or a missing target that is NOT skipIfMissing) render
 * as a centered card — used for cross-page guidance like the upload step.
 */

export const AI_TOUR_STEPS = [
  {
    target: "pb-subject",
    title: "1. Pick a subject",
    description:
      "Choose the subject for your pack. Some subjects auto-select a matching prompt template — literature, for example, switches to the 11+ comprehension template.",
  },
  {
    target: "pb-template",
    title: "2. Choose a prompt template",
    description:
      "The template decides what kind of pack the AI builds — a standard mixed pack, or an 11+ English comprehension passage with inferential questions.",
  },
  {
    target: "pb-topic",
    title: "3. Set the topic",
    description:
      "Tell the AI exactly what to cover, e.g. “The Black Death” or a specific story title. This is the one required field.",
  },
  {
    target: "pb-level",
    title: "4. Set the level",
    description:
      "Enter the year group or exam level (Y7, KS3, GCSE, 11+…). The quiz engine later filters questions by this level.",
  },
  {
    target: "pb-source-material",
    title: "5. Add your source material",
    description:
      "Optional but powerful: paste notes, link a URL, or tell the AI you’ll upload files in your chat. Grounding the prompt in real text gives far better packs.",
  },
  {
    target: "pb-source-url",
    title: "6. Add a source URL",
    description:
      "In URL mode, paste a webpage or document link. The AI references it when generating the pack.",
    skipIfMissing: true,
  },
  {
    target: "pb-instructions",
    title: "7. Add extra instructions",
    description:
      "Fine-tune the result: number of items, difficulty, terminology, which sections to focus on. Anything you’d normally tell a tutor.",
  },
  {
    target: "pb-generate-btn",
    title: "8. Generate the prompt",
    description:
      "Click Generate Prompt to assemble a ready-to-paste prompt. Nothing leaves your browser — this only builds text for you to copy.",
  },
  {
    target: "pb-output-actions",
    title: "9. Copy or download",
    description:
      "Copy the prompt to your clipboard or download it as a .md file, then paste it into ChatGPT, Claude, or Codex to generate your pack_unified.json.",
  },
  {
    // No target — centered card. The dropzone lives on the My Packs page.
    title: "10. Upload your pack",
    description:
      "Once the AI returns your pack_unified.json, head to My Packs and drop the file into the uploader. It becomes instantly available in Reading, Quiz, Vocabulary, and Builder.",
  },
];

/**
 * One-click example. Merged over the existing prefs so generateMode / tourSeen
 * are preserved. Subject + template are kept consistent (literature ↔ lit-11plus)
 * so no mismatch warning is triggered.
 */
export const SHERLOCK_PRESET = {
  subject: "literature",
  promptTemplate: "lit-11plus",
  topic: "The Adventure of the Speckled Band",
  level: "11+",
  locale: "en-GB",
  itemTypes: ["passage"],
  sourceMode: "url",
  sourceUrl: "https://sherlock-holm.es/stories/html/spec.html",
  sourceMaterial: "",
  additionalInstructions:
    "Generate 30–40 inferential and open comprehension questions drawing on three sections of the story: " +
    "(1) Helen Stoner’s early-morning arrival at Baker Street, " +
    "(2) the confrontation with Dr Grimesby Roylott, and " +
    "(3) the night-time investigation at Stoke Moran. " +
    "Use the passage item type, and for each question include a sourceRef with the relevant paragraph number and a short supporting quote so students can hunt for evidence.",
};
