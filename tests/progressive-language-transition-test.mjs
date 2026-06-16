import assert from "node:assert/strict";
import {
  buildVocabOptions,
  createProgressiveLessonState,
  runProgressiveLessonAction,
} from "../src/progressive-language-lesson.js";

const catalog = {
  packs: [
    {
      id: "test-pack",
      stages: [
        {
          id: "stage",
          lessons: [{ id: "lesson", path: "./fake.json" }],
        },
      ],
    },
  ],
};

function makeVocab(index) {
  return {
    conceptId: `WORD_${index}`,
    translations: {
      en: { text: `word ${index}` },
      de: { text: `Wort ${index}` },
    },
  };
}

function makeBuilder() {
  return {
    sentenceId: "SENTENCE_1",
    translations: {
      en: { text: "I see a word" },
      de: { text: "Ich sehe ein Wort", tiles: ["Ich", "sehe", "ein", "Wort"] },
    },
  };
}

function baseState(pack) {
  return {
    ...createProgressiveLessonState(catalog),
    targetLang: "de",
    vocabOptions: buildVocabOptions(pack, 0, "de"),
  };
}

{
  const pack = {
    phraseProgressionChains: [],
    vocabulary: [0, 1, 2, 3].map(makeVocab),
    sentenceBuilders: [makeBuilder()],
  };
  let state = runProgressiveLessonAction(baseState(pack), pack, "pl-jump-phase", { phase: "vocab" }).state;

  for (let i = 0; i < pack.vocabulary.length; i += 1) {
    const current = pack.vocabulary[state.vocabIndex];
    const correctOption = state.vocabOptions.find((option) => option.correct);
    state = runProgressiveLessonAction(state, pack, "pl-vocab-answer", {
      correct: "true",
      selectedText: correctOption.text,
      conceptId: current.conceptId,
    }).state;
    state = runProgressiveLessonAction(state, pack, "pl-vocab-next").state;
  }

  assert.equal(state.phase, "builder");
  assert.equal(state.sentenceIndex, 0);
  assert.equal(state.bankTiles.length, 4);
}

{
  const pack = {
    phraseProgressionChains: [{ steps: [{ translations: { de: { text: "Hallo" } } }] }],
    vocabulary: [],
    sentenceBuilders: [makeBuilder()],
  };

  const stateAfterListen = runProgressiveLessonAction(baseState(pack), pack, "pl-listen-next").state;
  assert.equal(stateAfterListen.phase, "builder");
  assert.equal(stateAfterListen.bankTiles.length, 4);

  const stateAfterJump = runProgressiveLessonAction(baseState(pack), pack, "pl-jump-phase", { phase: "vocab" }).state;
  assert.equal(stateAfterJump.phase, "builder");
  assert.equal(stateAfterJump.bankTiles.length, 4);
}

console.log("progressive language transition tests passed");
