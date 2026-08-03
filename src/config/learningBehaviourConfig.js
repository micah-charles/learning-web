/**
 * Product behaviour contract for Learning Web.
 *
 * This file exists so product behaviour and QA expectations can stay aligned.
 * If any value here changes, update `qa/config/qa-behaviour.config.json` and
 * run `npm run qa:config-check` before shipping.
 */

export const learningBehaviourConfig = {
  version: "2026-06-16-qa-baseline",

  home: {
    enabled: true,
  },

  vocabulary: {
    enabled: true,
    defaultSampleSize: 5,
    requireAudioButton: true,
    voicePracticeOptional: true,
  },

  quiz: {
    enabled: true,
    defaultQuestionsPerSession: 18,
    questionCountOptions: [18, 30, "all"],
    allowRandomQuestionOrder: true,
    requireCorrectAnswerFeedback: true,
    requireIncorrectAnswerFeedback: true,
  },

  reading: {
    enabled: true,
    showTranslationDefault: false,
    voiceEnabledDefault: true,
    requirePassageTitle: true,
    requireEvidenceSupport: true,
  },

  sentenceBuilder: {
    enabled: true,
    progressionMode: "continuous-deck",
    // The standalone Builder page does not have a fixed completion threshold.
    // This is the deterministic number of cards QA should exercise per sample run.
    expectedRounds: 3,
    requireCorrectAnswerFeedback: true,
    requireIncorrectAnswerFeedback: true,
    hintEnabled: true,
    clearEnabled: true,
  },

  progressiveLearning: {
    enabled: true,
    expectedStepOrder: ["listen", "vocab", "builder", "arcade", "review"],
  },

  languageArcade: {
    enabled: true,
    expectedRounds: 1,
    expectedSequence: ["quiz-hunt"],
    passAccuracyPercent: 100,
    autoRetryUntilPerfect: true,
  },

  lessonMode: {
    enabled: true,
    voicePracticeEnabled: true,
    retryOnUnclearVoice: true,
    maxVoiceAttempts: 3,
  },

  studyBook: {
    enabled: true,
    shouldOpenCorrectPackBook: true,
    shouldSupportImages: true,
    splitModeSupported: true,
  },

  onboarding: {
    enabled: true,
    firstTimeUserFlowEnabled: true,
    defaultPresetMode: "guided",
    showEverythingShortcut: true,
  },

  chineseInputLab: {
    enabled: true,
    rollout: "public",
    cangjieVersion: "5",
    locale: "zh-HK",
    defaultMethod: "cangjie",
    quickProgressSeparated: true,
    physicalKeyboardEnabled: true,
    footballGameEnabled: true,
    footballPronunciationEnabled: true,
    lessonHintToggleEnabled: true,
    lessonHintDefault: "off",
    keyboardKeyStates: {
      inactive: "grey",
      active: "light-green",
      hinted: "yellow",
    },
    worldHomeEnabled: true,
    flowerNavigationEnabled: true,
    onePrimaryRecommendation: true,
    readinessAdvisoryOnly: true,
    accessibleKnowledgeListEnabled: true,
  },

  mobile: {
    enabled: true,
    gameControlsMode: "overlay-on-small-screens",
    navigationMode: "bottom-bar-with-more-menu",
  },
};

export default learningBehaviourConfig;
