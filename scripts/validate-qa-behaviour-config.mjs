import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const rootDir = process.cwd();
const qaConfigPath = path.join(rootDir, "qa/config/qa-behaviour.config.json");
const productConfigPath = path.join(rootDir, "src/config/learningBehaviourConfig.js");

function getValue(object, dottedPath) {
  return dottedPath.split(".").reduce((current, segment) => current?.[segment], object);
}

function formatValue(value) {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function valuesMatch(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

const fieldsToCompare = [
  "version",
  "sentenceBuilder.enabled",
  "sentenceBuilder.progressionMode",
  "sentenceBuilder.expectedRounds",
  "quiz.enabled",
  "quiz.defaultQuestionsPerSession",
  "quiz.questionCountOptions",
  "vocabulary.enabled",
  "vocabulary.requireAudioButton",
  "reading.enabled",
  "reading.requirePassageTitle",
  "progressiveLearning.enabled",
  "progressiveLearning.expectedStepOrder",
  "languageArcade.enabled",
  "languageArcade.expectedRounds",
  "languageArcade.expectedSequence",
  "languageArcade.passAccuracyPercent",
  "lessonMode.enabled",
  "lessonMode.voicePracticeEnabled",
  "lessonMode.retryOnUnclearVoice",
  "lessonMode.maxVoiceAttempts",
  "studyBook.enabled",
  "studyBook.shouldSupportImages",
  "onboarding.enabled",
  "onboarding.firstTimeUserFlowEnabled",
  "onboarding.defaultPresetMode",
  "chineseInputLab.enabled",
  "chineseInputLab.rollout",
  "chineseInputLab.cangjieVersion",
  "chineseInputLab.locale",
  "chineseInputLab.defaultMethod",
  "chineseInputLab.quickProgressSeparated",
  "chineseInputLab.physicalKeyboardEnabled",
  "chineseInputLab.footballGameEnabled",
  "chineseInputLab.footballPronunciationEnabled",
  "chineseInputLab.kingdomNavigationEnabled",
  "chineseInputLab.floatingFlowerEnabled",
  "chineseInputLab.advisoryReadinessEnabled",
  "chineseInputLab.accessibleListViewEnabled",
  "mobile.gameControlsMode",
];

async function main() {
  const qaConfig = JSON.parse(await fs.readFile(qaConfigPath, "utf8"));
  const productModule = await import(pathToFileURL(productConfigPath).href);
  const productConfig = productModule.learningBehaviourConfig || productModule.default;

  const mismatches = [];
  for (const field of fieldsToCompare) {
    const productValue = getValue(productConfig, field);
    const qaValue = getValue(qaConfig, field);
    if (!valuesMatch(productValue, qaValue)) {
      mismatches.push({ field, productValue, qaValue });
    }
  }

  if (mismatches.length > 0) {
    console.error("FAIL: QA behaviour config mismatch\n");
    for (const mismatch of mismatches) {
      console.error(`${mismatch.field}:`);
      console.error(`Product config: ${formatValue(mismatch.productValue)}`);
      console.error(`QA config: ${formatValue(mismatch.qaValue)}\n`);
    }
    console.error("Please update qa/config/qa-behaviour.config.json");
    console.error("or confirm that this behaviour should not be tested.");
    process.exit(1);
  }

  console.log("PASS: QA behaviour config matches product behaviour config");
}

main().catch((error) => {
  console.error("FAIL: Could not validate QA behaviour config");
  console.error(error);
  process.exit(1);
});
