import assert from "node:assert/strict";

import { createQuizSession, makeFillBlankFromUnified, resolveQuizModesForUI } from "../src/quiz.js";
import { DEFAULT_STATE } from "../src/storage.js";
import { filterFillBlankByStage } from "../src/quiz-helpers.js";

const dataset = {
  id: "micah_latin_section_d_e_100_fixed_mcq",
  subject: "language",
  displayName: "Micah Latin Section D and E Drill",
  sourceLanguageLabel: "Latin",
  sourceLanguageCode: "la",
  targetLanguageLabel: "Latin",
  targetLanguageCode: "la",
  speechLanguage: "la",
  stageOptions: ["1", "2"],
  supportsSentences: false,
};

const unifiedPack = {
  packId: dataset.id,
  subject: "language",
  sourceLanguageCode: "la",
  targetLanguageCode: "la",
  speechLanguage: "la",
  items: [
    {
      id: "latin_de_001",
      type: "fillBlank",
      level: "Stage 1",
      data: {
        sentence: "What case is 'servus' in 'servus dormit'?",
        answer: "nominative",
        options: ["nominative", "accusative", "dative", "ablative"],
      },
    },
    {
      id: "latin_de_002",
      type: "fillBlank",
      level: "Stage 2",
      data: {
        sentence: "What case is 'amīcum' in 'dominus amīcum salūtat'?",
        answer: "accusative",
        options: ["nominative", "accusative", "dative", "ablative"],
      },
    },
  ],
};

const prefs = {
  year: "ALL",
  stages: ["1", "2"],
  direction: "studyToTarget",
  answerMode: "choice",
  questionCount: 4,
  excludeMastered: true,
};

const fillBlankCount = filterFillBlankByStage(unifiedPack, prefs, dataset).length;
assert.equal(fillBlankCount, 2);

const modes = resolveQuizModesForUI({
  subject: "language",
  direction: prefs.direction,
  answerMode: prefs.answerMode,
  fillBlankCount,
  vocabCount: 0,
});
assert.deepEqual(modes, ["fillBlank"]);

const session = createQuizSession({
  words: [],
  sentencePools: { combined: [] },
  config: { ...prefs, modes },
  persistedState: DEFAULT_STATE,
  dataset,
  unifiedPack,
});
assert.equal(session.questions.length, 4);
assert(session.questions.every((question) => question.kind === "gap"));
assert(session.questions.every((question) => question.options.length === 4));

const choiceQuestions = makeFillBlankFromUnified(unifiedPack.items, 2, dataset, "choice");
assert(choiceQuestions.every((question) => question.options.length === 4));

