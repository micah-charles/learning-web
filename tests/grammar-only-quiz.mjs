import assert from "node:assert/strict";

import { createQuizSession, makeMultipleChoiceFromUnified, resolveQuizModesForUI } from "../src/quiz.js";
import { DEFAULT_STATE } from "../src/storage.js";
import { filterMultipleChoiceByStage } from "../src/quiz-helpers.js";
import { buildQuizHuntQuestionsFromMultipleChoiceItems } from "../src/react/games/arcade/utils/gameQuestionAdapter.js";

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
      type: "multipleChoice",
      level: "Stage 1",
      data: {
        question: "What case is 'servus' in 'servus dormit'?",
        questionType: "multiple_choice",
        answer: "nominative",
        options: ["nominative", "accusative", "dative", "ablative"],
      },
    },
    {
      id: "latin_de_002",
      type: "multipleChoice",
      level: "Stage 2",
      data: {
        question: "What case is 'amīcum' in 'dominus amīcum salūtat'?",
        questionType: "multiple_choice",
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

const multipleChoiceCount = filterMultipleChoiceByStage(unifiedPack, prefs, dataset).length;
assert.equal(multipleChoiceCount, 2);

const modes = resolveQuizModesForUI({
  subject: "language",
  direction: prefs.direction,
  answerMode: prefs.answerMode,
  multipleChoiceCount,
  vocabCount: 0,
});
assert.deepEqual(modes, ["multipleChoice"]);

const session = createQuizSession({
  words: [],
  sentencePools: { combined: [] },
  config: { ...prefs, modes },
  persistedState: DEFAULT_STATE,
  dataset,
  unifiedPack,
});
assert.equal(session.questions.length, 4);
assert(session.questions.every((question) => question.kind === "choice"));
assert(session.questions.every((question) => question.modeTitle === "Multiple choice"));
assert(session.questions.every((question) => question.modeId === "multipleChoice"));
assert(session.questions.every((question) => question.options.length === 4));
assert(session.questions.some((question) => question.prompt === "What case is 'servus' in 'servus dormit'?"));

const choiceQuestions = makeMultipleChoiceFromUnified(unifiedPack.items, 2, dataset);
assert(choiceQuestions.every((question) => question.kind === "choice"));
assert(choiceQuestions.every((question) => question.options.length === 4));

const arcadeQuestions = buildQuizHuntQuestionsFromMultipleChoiceItems(unifiedPack.items, { speechLanguage: "la" });
assert.equal(arcadeQuestions.length, 2);
assert.equal(arcadeQuestions[0].questionText, "What case is 'servus' in 'servus dormit'?");
assert.equal(arcadeQuestions[0].correctAnswer, "nominative");
assert.deepEqual(arcadeQuestions[0].distractors, ["accusative", "dative", "ablative"]);
