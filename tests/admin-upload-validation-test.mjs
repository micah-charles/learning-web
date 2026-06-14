import assert from "node:assert/strict";

import { validatePack } from "../src/admin-storage.js";

function pack(overrides = {}) {
  return {
    packId: "upload_validation_fixture",
    schemaVersion: "1.1",
    subject: "history",
    sourceLanguageCode: "en-GB",
    targetLanguageCode: "en-GB",
    items: [
      {
        id: "mcq_001",
        type: "multipleChoice",
        level: "Y7",
        topics: ["Test"],
        data: {
          question: "Which answer is correct?",
          answer: "A",
          options: ["A", "B", "C"],
        },
      },
    ],
    ...overrides,
  };
}

assert.equal(validatePack(pack()).ok, true, "valid uploaded MCQ pack should pass");

const badMcq = pack({
  items: [
    {
      id: "mcq_002",
      type: "multipleChoice",
      data: {
        question: "Which answer is correct?",
        answer: "A",
        options: ["B", "C"],
      },
    },
  ],
});
assert.equal(validatePack(badMcq).ok, false, "MCQ answer must be present in options");

const copiedDefinition = pack({
  items: [
    {
      id: "vocab_001",
      type: "vocab",
      data: {
        partOfSpeech: "keyword",
        sourceWord: "Feudalism",
        targetWord: "Feudalism",
      },
    },
  ],
});
assert.equal(validatePack(copiedDefinition).ok, false, "monolingual vocab needs a real definition");

const zipLocalImage = pack({
  items: [
    {
      id: "mcq_003",
      type: "multipleChoice",
      data: {
        question: "Which answer is correct?",
        answer: "A",
        options: ["A", "B"],
        image: "images/local-only.png",
      },
    },
  ],
});
const imageResult = validatePack(zipLocalImage);
assert.equal(imageResult.ok, false, "ZIP-local image paths should be rejected");
assert.match(imageResult.error, /ZIP image assets are not imported/);

const httpsImage = pack({
  items: [
    {
      id: "mcq_004",
      type: "multipleChoice",
      data: {
        question: "Which answer is correct?",
        answer: "A",
        options: ["A", "B"],
        image: "https://example.com/image.png",
      },
    },
  ],
});
assert.equal(validatePack(httpsImage).ok, true, "HTTPS images should be allowed");

console.log("admin upload validation checks passed");
