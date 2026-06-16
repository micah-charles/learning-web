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
  ["quiz-hunt"],
  "Language Ladder should currently use a single quiz-hunt arcade round",
);

const firstAttempt = resolveLanguageArcadeRoundState(
  { roundIndex: 0, done: false, lastAccuracy: null, retryNonce: 0 },
  { accuracy: 70 },
  LANGUAGE_LADDER_ARCADE_SEQUENCE,
);
assert.equal(firstAttempt.roundIndex, 0);
assert.equal(firstAttempt.done, false);
assert.equal(firstAttempt.retryNonce, 1);
assert.equal(firstAttempt.lastAccuracy, 70);

const passAttempt = resolveLanguageArcadeRoundState(
  firstAttempt,
  { accuracy: 100 },
  LANGUAGE_LADDER_ARCADE_SEQUENCE,
);
assert.equal(passAttempt.done, true);
assert.equal(passAttempt.roundIndex, 0);
assert.equal(passAttempt.lastAccuracy, 100);

console.log("language arcade session behavior passed");
