import assert from "node:assert/strict";

const instances = [];

class MockSpeechRecognition {
  constructor() {
    this.lang = "";
    this.continuous = false;
    this.interimResults = false;
    this.maxAlternatives = 1;
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
    this.started = 0;
    this.stopped = 0;
    this.aborted = 0;
    instances.push(this);
  }

  start() {
    this.started += 1;
  }

  stop() {
    this.stopped += 1;
  }

  abort() {
    this.aborted += 1;
  }
}

globalThis.window = {
  SpeechRecognition: MockSpeechRecognition,
  clearTimeout,
  setTimeout,
};

const {
  __speechRecognitionTestHooks,
  abortListening,
  getSpeechRecognitionStatus,
  isSpeechRecognitionSupported,
  startListening,
} = await import("../src/react/services/speechRecognitionService.js");

function resultEvent(transcript, confidence = 0.9, isFinal = true) {
  const result = [{ transcript, confidence }];
  result.isFinal = isFinal;
  return {
    resultIndex: 0,
    results: [result],
  };
}

__speechRecognitionTestHooks.reset();

assert.equal(isSpeechRecognitionSupported(), true);

let interimPayload = null;
let finalPayload = null;
const firstAttemptId = startListening({
  languageCode: "de",
  interimResults: true,
  maxAlternatives: 3,
  onInterim: (payload) => { interimPayload = payload; },
  onFinal: (payload) => { finalPayload = payload; },
});

const recognizer = instances[0];
assert.equal(recognizer.lang, "de-DE");
assert.equal(recognizer.interimResults, true);
assert.equal(recognizer.maxAlternatives, 3);
assert.equal(getSpeechRecognitionStatus().running, true);

recognizer.onresult(resultEvent("ich", 0.5, false));
assert.equal(interimPayload.interimTranscript, "ich");
assert.equal(finalPayload, null);

recognizer.onresult(resultEvent("ich bin bereit", 0.95, true));
assert.equal(finalPayload.attemptId, firstAttemptId);
assert.equal(finalPayload.transcript, "ich bin bereit");
assert.equal(finalPayload.confidence, 0.95);
assert.equal(getSpeechRecognitionStatus().running, false);

let staleCalled = false;
const staleAttemptId = startListening({
  languageCode: "en",
  onFinal: () => { staleCalled = true; },
});
const staleHandler = recognizer.onresult;
const currentAttemptId = startListening({
  languageCode: "en",
  onFinal: () => {},
});
assert.notEqual(staleAttemptId, currentAttemptId);
staleHandler(resultEvent("late old result", 0.99, true));
assert.equal(staleCalled, false, "stale attempt callback should be ignored");

abortListening();
assert.equal(getSpeechRecognitionStatus().running, false);

console.log("Speech recognition service tests passed");
