import assert from "node:assert/strict";
import {
  createProgressiveLessonState,
  runProgressiveLessonAction,
} from "../src/progressive-language-lesson.js";

const catalog = {
  packs: [
    {
      id: "test-pack",
      stages: [
        {
          id: "stage-1",
          lessons: [{ id: "lesson-1", path: "./fake.json" }],
        },
      ],
    },
  ],
};

const pack = {
  phraseProgressionChains: [],
  vocabulary: [],
  sentenceBuilders: [
    {
      sentenceId: "sentence-1",
      concepts: ["greeting"],
      translations: {
        en: { text: "I see a word" },
        de: { text: "Ich sehe ein Wort", tiles: ["Ich", "sehe", "ein", "Wort"] },
      },
    },
  ],
};

{
  const base = createProgressiveLessonState(catalog);
  const state = {
    ...base,
    phase: "builder",
    targetLang: "de",
    sentenceIndex: 0,
    selectedTiles: [],
  };

  const { state: next, effect } = runProgressiveLessonAction(
    state,
    pack,
    "pl-builder-check",
    { spokenAnswer: "Ich sehe ein Wort" },
  );

  assert.equal(next.builderFeedback?.correct, true);
  assert.equal(next.answered.builder["sentence-1"], true);
  assert.equal(next.score.builderCorrect, 1);
  assert.equal(next.score.builderTotal, 1);
  assert.equal(effect?.speak?.text, "Ich sehe ein Wort");
}

{
  const base = createProgressiveLessonState(catalog);
  const state = {
    ...base,
    phase: "builder",
    targetLang: "de",
    sentenceIndex: 0,
    selectedTiles: [],
  };

  const { state: next } = runProgressiveLessonAction(
    state,
    pack,
    "pl-builder-check",
    { spokenAnswer: "Ein Wort sehe ich" },
  );

  assert.equal(next.builderFeedback?.correct, false);
  assert.equal(next.mistakes[0]?.selected, "Ein Wort sehe ich");
  assert.equal(next.mistakes[0]?.expected, "Ich sehe ein Wort");
}

console.log("progressive language voice tests passed");
