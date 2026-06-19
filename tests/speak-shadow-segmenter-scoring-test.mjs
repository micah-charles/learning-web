import assert from "node:assert/strict";
import {
  createSpeakShadowSession,
  normalizeForSpeechCompare,
  splitSentenceIntoPhrases,
  tokenizePhrase,
} from "../src/react/utils/speakShadowSegmenter.js";
import { scoreSpeakShadowAttempt } from "../src/react/utils/speakShadowScoring.js";

assert.equal(normalizeForSpeechCompare("傳家寶", "zh"), normalizeForSpeechCompare("传家宝", "zh"));
assert.deepEqual(tokenizePhrase("Der kleine Junge liest.", "de").filter((token) => /[\p{L}\p{N}]/u.test(token)), [
  "Der",
  "kleine",
  "Junge",
  "liest",
]);

const germanPhrases = splitSentenceIntoPhrases(
  "Der kleine Junge liest ein interessantes Buch im Wohnzimmer.",
  "de",
  { minTokens: 3, maxTokens: 4, maxChars: 32, mergeTooShortPhrases: true },
);
assert.deepEqual(germanPhrases, [
  "Der kleine Junge liest",
  "ein interessantes Buch im",
  "Wohnzimmer.",
]);

const cjkPhrases = splitSentenceIntoPhrases(
  "小男孩在客廳裡讀一本有趣的書。",
  "zh",
  { minTokens: 3, maxTokens: 6, maxChars: 9, mergeTooShortPhrases: true },
);
assert.ok(cjkPhrases.length >= 2, "CJK text should split into child-friendly chunks");
assert.ok(cjkPhrases.every((phrase) => [...phrase].length <= 9), "CJK phrases should respect maxChars");

const session = createSpeakShadowSession({
  title: "German read aloud",
  text: "Ich habe ein Buch.",
  language: "de",
  phraseLength: "short",
});
const phrase = session.phrases[0];
assert.equal(phrase.speechTarget, "ich habe ein buch");
assert.deepEqual(phrase.speechTokens, ["ich", "habe", "ein", "buch"]);
assert.ok(phrase.requiredTokens.includes("habe"));
assert.ok(phrase.requiredTokens.includes("buch"));
assert.equal(phrase.localeHints.recognitionLang, "de-DE");

const germanNormalized = scoreSpeakShadowAttempt({
  expected: "für die Straße",
  transcript: "fuer die Strasse",
  confidence: 0.92,
  language: "de",
  settings: { minSimilarity: 0.85, minConfidence: 0.6 },
});
assert.equal(germanNormalized.passed, true);
assert.equal(germanNormalized.matchType, "normalized");

const germanArticleStrict = scoreSpeakShadowAttempt({
  expected: "der Junge liest",
  transcript: "die Junge liest",
  confidence: 0.98,
  language: "de",
  settings: { minSimilarity: 0.85, minConfidence: 0.6 },
});
assert.equal(germanArticleStrict.passed, false, "German articles must remain strict");
assert.ok(germanArticleStrict.missingTokens.includes("der"));

const chineseEquivalent = scoreSpeakShadowAttempt({
  expected: "這是傳家寶",
  transcript: "這是传家宝",
  confidence: 0.88,
  language: "zh",
  voiceLocale: "zh-HK",
  settings: { minSimilarity: 0.85, minConfidence: 0.6 },
});
assert.equal(chineseEquivalent.passed, true);

const japaneseEquivalent = scoreSpeakShadowAttempt({
  expected: "私は学校へ行きます",
  transcript: "私はがっこうへいきます",
  confidence: 0.9,
  language: "ja",
  settings: { minSimilarity: 0.85, minConfidence: 0.6 },
});
assert.equal(japaneseEquivalent.passed, true);

const alternativeMatch = scoreSpeakShadowAttempt({
  expected: "I am ready",
  transcript: "iron ready",
  confidence: 0.6,
  alternatives: [{ transcript: "I'm ready", confidence: 0.91 }],
  language: "en",
  settings: { minSimilarity: 0.85, minConfidence: 0.6 },
});
assert.equal(alternativeMatch.passed, true);
assert.equal(alternativeMatch.source, "alternative");

const lowConfidence = scoreSpeakShadowAttempt({
  expected: "I am ready",
  transcript: "I am ready",
  confidence: 0.2,
  language: "en",
  settings: { minSimilarity: 0.85, minConfidence: 0.6 },
});
assert.equal(lowConfidence.passed, false);
assert.equal(lowConfidence.matchType, "exact");

console.log("Speak Shadow segmenter and scoring tests passed");
