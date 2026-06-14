import {
  getBuilderPackSubject,
  getDatasetCurriculum,
  getDatasetSubject,
  getPassageGroupSubject,
} from "@/data.js";

export const ONBOARDING_VERSION = 1;

export const ALL_MODULE_IDS = [
  "home",
  "language",
  "quiz",
  "smart-test",
  "arcade",
  "vocab",
  "reading",
  "builder",
  "crossword",
  "progress",
  "mypacks",
  "about",
  "ai-prompt",
  "learning-settings",
];

export const ALWAYS_AVAILABLE_TABS = ["home", "progress", "mypacks", "about", "learning-settings"];

export const INTEREST_OPTIONS = [
  {
    id: "languages",
    title: "Learn languages",
    description: "Language Ladder, vocabulary, quizzes, reading and sentence practice.",
    modules: ["language", "quiz", "vocab", "builder", "reading"],
    subjects: ["language"],
  },
  {
    id: "mini-games",
    title: "Play learning mini games",
    description: "Arcade practice, quiz challenges and builder games.",
    modules: ["arcade", "quiz", "builder"],
  },
  {
    id: "uk-curriculum",
    title: "UK curriculum",
    description: "KS3 and GCSE-friendly revision routes.",
    modules: ["quiz", "reading", "builder", "progress", "about"],
    curriculums: ["ks3", "gcse"],
  },
  {
    id: "us-curriculum",
    title: "US curriculum",
    description: "Middle-school style geography and science practice.",
    modules: ["quiz", "reading", "builder", "progress", "about"],
    curriculums: ["us-middle-school"],
  },
  {
    id: "ks3-gcse",
    title: "GCSE / KS3 revision",
    description: "Quiz, reading, Study Book notes and progress tracking.",
    modules: ["quiz", "reading", "progress"],
    curriculums: ["ks3", "gcse"],
  },
  {
    id: "reading",
    title: "Reading and comprehension",
    description: "Passages, quiz follow-up and Study Book support.",
    modules: ["reading", "quiz"],
  },
  {
    id: "sentence-building",
    title: "Sentence building",
    description: "Builder practice for key terms, dates and language sentences.",
    modules: ["builder", "quiz", "language"],
  },
  {
    id: "study-books",
    title: "Study book / revision notes",
    description: "Use Study Books beside quiz, reading and builder practice.",
    modules: ["quiz", "reading", "builder", "progress"],
  },
  {
    id: "overview",
    title: "I want an overview first",
    description: "Start gently with Home and About before choosing a route.",
    modules: ["home", "about", "quiz", "reading", "arcade"],
  },
  {
    id: "everything",
    title: "Show me everything",
    description: "Full app access with all tabs, packs and curricula visible.",
    modules: ALL_MODULE_IDS,
    everything: true,
  },
];

const INTEREST_BY_ID = new Map(INTEREST_OPTIONS.map((option) => [option.id, option]));

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

export function getDefaultOnboardingPrefs() {
  return {
    onboardingCompleted: false,
    learningMode: "guided",
    selectedInterests: [],
    selectedModules: [],
    selectedCurriculums: [],
    selectedSubjects: [],
    onboardingVersion: ONBOARDING_VERSION,
  };
}

export function isEverythingMode(prefs = {}) {
  return prefs.learningMode === "everything" || (prefs.selectedInterests || []).includes("everything");
}

export function getRecommendedModulesFromInterests(interests = []) {
  if (interests.includes("everything")) return [...ALL_MODULE_IDS];
  return unique(interests.flatMap((id) => INTEREST_BY_ID.get(id)?.modules || []));
}

export function getRecommendedSubjectsFromInterests(interests = []) {
  return unique(interests.flatMap((id) => INTEREST_BY_ID.get(id)?.subjects || []));
}

export function getRecommendedCurriculumsFromInterests(interests = []) {
  return unique(interests.flatMap((id) => INTEREST_BY_ID.get(id)?.curriculums || []));
}

export function normaliseOnboardingPrefs(nextPrefs = {}) {
  const selectedInterests = unique(nextPrefs.selectedInterests);
  if (selectedInterests.includes("everything") || nextPrefs.learningMode === "everything") {
    return {
      onboardingCompleted: true,
      learningMode: "everything",
      selectedInterests: ["everything"],
      selectedModules: [],
      selectedCurriculums: [],
      selectedSubjects: [],
      onboardingVersion: ONBOARDING_VERSION,
    };
  }

  const selectedModules = unique(
    nextPrefs.selectedModules?.length
      ? nextPrefs.selectedModules
      : getRecommendedModulesFromInterests(selectedInterests),
  );

  return {
    onboardingCompleted: true,
    learningMode: "guided",
    selectedInterests,
    selectedModules,
    selectedCurriculums: unique(
      nextPrefs.selectedCurriculums?.length
        ? nextPrefs.selectedCurriculums
        : getRecommendedCurriculumsFromInterests(selectedInterests),
    ),
    selectedSubjects: unique(
      nextPrefs.selectedSubjects?.length
        ? nextPrefs.selectedSubjects
        : getRecommendedSubjectsFromInterests(selectedInterests),
    ),
    onboardingVersion: ONBOARDING_VERSION,
  };
}

export function getAllowedTabsFromPrefs(prefs = {}) {
  if (isEverythingMode(prefs)) return null;
  const selected = Array.isArray(prefs.selectedModules) ? prefs.selectedModules : [];
  return unique([...ALWAYS_AVAILABLE_TABS, ...selected]);
}

export function isLikelyExistingUser(progressState) {
  return Boolean(
    progressState?.progress?.sessions?.length ||
    progressState?.progress?.attemptEvents?.length ||
    Object.keys(progressState?.progress?.words || {}).length ||
    Object.keys(progressState?.progress?.builderStats || {}).length ||
    Object.keys(progressState?.progress?.passageStats || {}).length ||
    Object.keys(progressState?.progress?.arcadeStats || {}).length
  );
}

export function getEverythingPrefs() {
  return {
    onboardingCompleted: true,
    learningMode: "everything",
    selectedInterests: ["everything"],
    selectedModules: [],
    selectedCurriculums: [],
    selectedSubjects: [],
    onboardingVersion: ONBOARDING_VERSION,
  };
}

function isUploadedPack(pack) {
  return Boolean(pack?._uploaded || String(pack?.unifiedPath || "").startsWith("uploaded://"));
}

function getSubjectForPack(pack, kind = "dataset") {
  if (kind === "passage") return getPassageGroupSubject(pack);
  if (kind === "builder") return getBuilderPackSubject(pack);
  return getDatasetSubject(pack);
}

export function shouldShowPackForPrefs(pack, prefs = {}, kind = "dataset") {
  if (!pack) return false;
  if (isEverythingMode(prefs)) return true;
  if (isUploadedPack(pack)) return true;

  const selectedCurriculums = Array.isArray(prefs.selectedCurriculums) ? prefs.selectedCurriculums : [];
  const selectedSubjects = Array.isArray(prefs.selectedSubjects) ? prefs.selectedSubjects : [];
  if (!selectedCurriculums.length && !selectedSubjects.length) return true;

  const curriculum = getDatasetCurriculum(pack);
  const subject = getSubjectForPack(pack, kind);
  return selectedCurriculums.includes(curriculum) || selectedSubjects.includes(subject);
}

export function filterPacksForPrefs(packs = [], prefs = {}, kind = "dataset") {
  const filtered = packs.filter((pack) => shouldShowPackForPrefs(pack, prefs, kind));
  return filtered.length ? filtered : packs;
}

export function onboardingSummaryLabels(prefs = {}) {
  if (isEverythingMode(prefs)) {
    return {
      mode: "Everything mode",
      interests: ["Show me everything"],
      modules: ["All tabs and packs"],
    };
  }
  const interests = (prefs.selectedInterests || [])
    .map((id) => INTEREST_BY_ID.get(id)?.title || id)
    .filter(Boolean);
  const moduleLabels = (prefs.selectedModules || []).map((id) => {
    const label = {
      "ai-prompt": "AI Pack Creator",
      "learning-settings": "Manage Learning",
      mypacks: "My Packs",
      vocab: "Vocabulary",
      "smart-test": "Smart Test",
    }[id];
    return label || id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  });
  return {
    mode: "Guided mode",
    interests,
    modules: moduleLabels,
  };
}
