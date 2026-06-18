import assert from "node:assert/strict";
import {
  FULL_LANGUAGE_ARCADE_SEQUENCE,
  LANGUAGE_LADDER_ARCADE_SEQUENCE,
  resolveLanguageArcadeRoundState,
} from "../src/react/hooks/useLanguageArcadeSession.js";

assert.deepEqual(
  FULL_LANGUAGE_ARCADE_SEQUENCE.map((round) => round.mode),
  ["quiz-hunt", "snake-builder"],
  "the full arcade sequence should stay available for future modules",
);

assert.deepEqual(
  LANGUAGE_LADDER_ARCADE_SEQUENCE.map((round) => round.mode),
  ["quiz-hunt", "snake-builder"],
  "Language Ladder should run Quiz Hunt followed by Sentence Snake",
);

const firstAttempt = resolveLanguageArcadeRoundState(
  { roundIndex: 0, done: false, lastAccuracy: null, retryNonce: 0, retryItemIds: [] },
  { accuracy: 80, missedItemIds: ["pl_v_2"] },
  LANGUAGE_LADDER_ARCADE_SEQUENCE,
);
assert.equal(firstAttempt.roundIndex, 0);
assert.equal(firstAttempt.done, false);
assert.equal(firstAttempt.retryNonce, 1);
assert.equal(firstAttempt.lastAccuracy, 80);
assert.deepEqual(firstAttempt.retryItemIds, ["pl_v_2"]);

const passAttempt = resolveLanguageArcadeRoundState(
  firstAttempt,
  { accuracy: 100 },
  LANGUAGE_LADDER_ARCADE_SEQUENCE,
);
assert.equal(passAttempt.done, false);
assert.equal(passAttempt.roundIndex, 1);
assert.equal(passAttempt.lastAccuracy, 100);
assert.deepEqual(passAttempt.retryItemIds, []);

const snakePassAttempt = resolveLanguageArcadeRoundState(
  passAttempt,
  { accuracy: 100 },
  LANGUAGE_LADDER_ARCADE_SEQUENCE,
);
assert.equal(snakePassAttempt.done, true);
assert.equal(snakePassAttempt.roundIndex, 1);
assert.equal(snakePassAttempt.lastAccuracy, 100);

console.log("language arcade session behavior passed");
